import type { Config } from '@netlify/functions';
import webpush from 'web-push';
import { adminDb, ensureAdmin, PUSH_COLLECTION } from './_push-shared';
import { getCardBillTotal, getNextDue, isCardBillPaid } from '../../src/utils/billReminders';
import { getActiveExpensesForMonth, getActiveIncomesForMonth, getCardLimitUsed, formatMonthDisplay } from '../../src/utils/financeCalculations';
import { getCategoryInfo } from '../../src/data/categories';

const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Reminder { key: string; title: string; body: string; tab: string }

function buildReminders(data: any, now: Date): Reminder[] {
  const profile = data.profile || {};
  if (profile.notificationsEnabled === false || profile.notifyCardBillsDue === false) return [];
  const out: Reminder[] = [];
  const day = now.toISOString().slice(0, 10);

  for (const card of (data.cards || []) as any[]) {
    const dueDay = card.dueDay || 15;
    const { billMonth, daysDiff } = getNextDue(dueDay, now, 0);
    if (daysDiff !== 0 && daysDiff !== 1) continue;
    if (isCardBillPaid(card, data.paidBills || [], billMonth)) continue;
    const total = getCardBillTotal(card, data.expenses || [], billMonth);
    if (total <= 0) continue;

    let title: string; let body: string;
    if (daysDiff === 0) { title = `Fatura ${card.name} vence hoje`; body = `${brl(total)} para pagar hoje e evitar juros.`; }
    else { title = `Fatura ${card.name} vence amanhã`; body = `${brl(total)}, com vencimento no dia ${dueDay}.`; }
    out.push({ key: `card-bill-${card.id}-${day}`, title, body, tab: 'cards' });
  }

  for (const sub of (data.subscriptions || []) as any[]) {
    if (!sub.active) continue;
    const { daysDiff } = getNextDue(sub.billingDay, now, 0);
    if (daysDiff !== 0 && daysDiff !== 1) continue;
    out.push({
      key: `sub-${sub.id}-${day}`,
      title: daysDiff === 0 ? `${sub.name} é cobrada hoje` : `${sub.name} é cobrada amanhã`,
      body: `Assinatura de ${brl(sub.amount || 0)}.`,
      tab: 'subscriptions',
    });
  }

  const month = day.slice(0, 7);
  const active = getActiveExpensesForMonth(data.expenses || [], month);

  // Limite do cartão: avisa uma vez por mês ao passar de 80% e de 100%.
  if (profile.notifyCardLimit !== false) {
    for (const card of (data.cards || []) as any[]) {
      if (!(card.limit > 0)) continue;
      const used = getCardLimitUsed(active, card.id);
      const pct = Math.round((used / card.limit) * 100);
      const left = Math.max(0, card.limit - used);
      if (pct >= 100) out.push({ key: `limit100-${card.id}-${month}`, title: `Limite do ${card.name} esgotado`, body: `Você usou ${brl(used)} de ${brl(card.limit)}.`, tab: 'cards' });
      else if (pct >= 80) out.push({ key: `limit80-${card.id}-${month}`, title: `Limite do ${card.name} em ${pct}%`, body: `Restam ${brl(left)} de ${brl(card.limit)}.`, tab: 'cards' });
    }
    // Última parcela do mês: o limite volta a liberar.
    for (const a of active) {
      if (a.expense.type !== 'parcelada' || !a.totalInstallments || a.currentInstallmentForMonth !== a.totalInstallments || a.totalInstallments < 2) continue;
      const card = ((data.cards || []) as any[]).find(c => c.id === a.expense.cardId);
      out.push({
        key: `last-inst-${a.expense.id}-${month}`,
        title: 'Última parcela este mês',
        body: `${a.expense.description} (${a.totalInstallments}/${a.totalInstallments})${card ? ` no cartão ${card.name}` : ''}. Seu limite volta a liberar.`,
        tab: 'cards',
      });
    }
  }

  // Orçamentos por categoria: avisa uma vez por mês ao passar de 90% e de 100%.
  if (profile.notifyBudgets !== false && profile.budgets && typeof profile.budgets === 'object') {
    const spent: Record<string, number> = {};
    for (const a of active) {
      const id = getCategoryInfo(a.expense.category || 'outros').id;
      spent[id] = (spent[id] || 0) + (a.expense.amount || 0);
    }
    for (const [id, rawLimit] of Object.entries(profile.budgets as Record<string, number>)) {
      const limit = Number(rawLimit);
      if (!(limit > 0)) continue;
      const used = spent[id] || 0;
      const pct = Math.round((used / limit) * 100);
      const label = getCategoryInfo(id).label;
      if (pct >= 100) out.push({ key: `budget100-${id}-${month}`, title: `${label}: orçamento estourado`, body: `Você gastou ${brl(used)} de ${brl(limit)} neste mês.`, tab: 'dashboard' });
      else if (pct >= 90) out.push({ key: `budget90-${id}-${month}`, title: `${label} em ${pct}% do orçamento`, body: `Você usou ${brl(used)} de ${brl(limit)} neste mês.`, tab: 'dashboard' });
    }
  }

  // Resumo do mês: no último dia do mês, quanto sobrou.
  if (profile.notifyMonthSummary !== false) {
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (now.getDate() === last) {
      const income = getActiveIncomesForMonth(data.incomes || [], month).reduce((t: number, i: any) => t + (i.amount || 0), 0);
      const spentTotal = active.reduce((t, a) => t + (a.expense.amount || 0), 0);
      if (income > 0) {
        const diff = income - spentTotal;
        out.push({
          key: `summary-${month}`,
          title: `Resumo de ${formatMonthDisplay(month)}`,
          body: diff >= 0 ? `Sobraram ${brl(diff)}. Que tal guardar numa caixinha?` : `O mês fechou no vermelho em ${brl(-diff)}.`,
          tab: 'dashboard',
        });
      }
    }
  }
  return out;
}

export default async () => {
  const pub = process.env.VITE_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv || !ensureAdmin()) {
    console.error('push-daily: faltam VITE_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY ou FIREBASE_SERVICE_ACCOUNT.');
    return;
  }
  webpush.setVapidDetails(`mailto:${process.env.VITE_SUPPORT_EMAIL || 'gastofinancas@gmail.com'}`, pub, priv);

  // Horário de Brasília (UTC-3): getNextDue usa os getters locais, e o servidor roda em UTC.
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const db = adminDb();
  const subsSnap = await db.collection(PUSH_COLLECTION).get();
  let sent = 0;

  for (const doc of subsSnap.docs) {
    const entry = doc.data();
    const subscriptions = (entry.subscriptions || []) as any[];
    if (!subscriptions.length) continue;
    try {
      const userSnap = await db.collection('users').doc(doc.id).get();
      if (!userSnap.exists) continue;
      const already: string[] = entry.sentKeys || [];
      const reminders = buildReminders(userSnap.data(), now).filter(r => !already.includes(r.key));
      if (!reminders.length) continue;

      const alive = [...subscriptions];
      for (const r of reminders) {
        const payload = JSON.stringify({ title: r.title, body: r.body, tag: r.key, url: `/?tab=${r.tab}`, data: { type: r.tab === 'cards' ? 'card_bill' : r.tab === 'subscriptions' ? 'subscription' : r.tab } });
        for (const s of subscriptions) {
          try {
            await webpush.sendNotification(s, payload);
            sent++;
          } catch (err: any) {
            if ([401, 403, 404, 410].includes(err?.statusCode)) {
              const i = alive.findIndex(a => a.endpoint === s.endpoint);
              if (i >= 0) alive.splice(i, 1);
            } else console.warn('push-daily: falha de envio', err?.statusCode);
          }
        }
      }
      await doc.ref.set({
        subscriptions: alive,
        sentKeys: [...already, ...reminders.map(r => r.key)].slice(-120),
      }, { merge: true });
    } catch (err) {
      console.warn('push-daily: erro em um usuário', err);
    }
  }
  console.log(`push-daily: ${sent} avisos enviados.`);
};

// Todo dia às 11:00 UTC (08:00 em Brasília).
export const config: Config = { schedule: '0 11 * * *' };
