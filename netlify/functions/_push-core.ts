import webpush from 'web-push';
import { adminDb, ensureAdmin } from './_push-shared';
import { getCardBillTotal, getNextDue, isCardBillPaid } from '../../src/utils/billReminders';
import { getActiveExpensesForMonth, getActiveIncomesForMonth, getCardLimitUsed, formatMonthDisplay } from '../../src/utils/financeCalculations';
import { getCategoryInfo } from '../../src/data/categories';

const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export interface Reminder { key: string; title: string; body: string; tab: string }

const MAX_PUSHES_PER_DAY = 3;

export interface Moment { morning: boolean; evening: boolean }

/**
 * Avisos que valem agora. Os de data (fatura, assinatura) saem de manhã e o resumo do mês à noite;
 * os de limite e orçamento saem em qualquer verificação, assim que a situação acontece.
 */
export function buildReminders(data: any, now: Date, moment: Moment): Reminder[] {
  const profile = data.profile || {};
  if (profile.notificationsEnabled === false || profile.notifyCardBillsDue === false) return [];
  const out: Reminder[] = [];
  const day = now.toISOString().slice(0, 10);

  for (const card of (moment.morning ? (data.cards || []) : []) as any[]) {
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

  for (const sub of (moment.morning ? (data.subscriptions || []) : []) as any[]) {
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
  if (moment.evening && profile.notifyMonthSummary !== false) {
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


/** Envia os avisos pendentes de um usuário e guarda o que já foi enviado. Devolve quantos pushes saíram. */
export async function processUser(db: ReturnType<typeof adminDb>, docSnap: FirebaseFirestore.DocumentSnapshot, now: Date, moment: Moment): Promise<number> {
  const entry = docSnap.data() || {};
  const subscriptions = (entry.subscriptions || []) as any[];
  if (!subscriptions.length) return 0;
  const userSnap = await db.collection('users').doc(docSnap.id).get();
  if (!userSnap.exists) return 0;
  const already: string[] = entry.sentKeys || [];
  let reminders = buildReminders(userSnap.data(), now, moment).filter(r => !already.includes(r.key));

  // Primeira verificação da pessoa: situações que já eram verdade (limite, orçamento, última parcela)
  // são só registradas, sem avisar, para não chegar uma rajada de avisos de uma vez.
  if (!entry.alertsSeeded) {
    const situational = reminders.filter(r => /^(limit|budget|last-inst)/.test(r.key));
    reminders = reminders.filter(r => !situational.includes(r));
    await docSnap.ref.set({
      alertsSeeded: true,
      sentKeys: [...already, ...situational.map(r => r.key)].slice(-120),
    }, { merge: true });
    already.push(...situational.map(r => r.key));
  }
  if (!reminders.length) return 0;

  // No máximo 3 pushes por dia por pessoa; o que ficar de fora tenta de novo na próxima verificação.
  const today = now.toISOString().slice(0, 10);
  const countToday: number = entry.pushDay === today ? (entry.pushCount || 0) : 0;
  if (countToday >= MAX_PUSHES_PER_DAY) return 0;

  // Vários avisos de uma vez viram uma única notificação, para não assustar.
  const payloadData = reminders.length === 1
    ? { title: reminders[0].title, body: reminders[0].body, tag: reminders[0].key, tab: reminders[0].tab }
    : {
        title: `Gastô: ${reminders.length} avisos`,
        body: reminders.slice(0, 4).map(r => `• ${r.title}`).join('\n') + (reminders.length > 4 ? `\ne mais ${reminders.length - 4}` : ''),
        tag: `digest-${today}-${countToday}`,
        tab: reminders.every(r => r.tab === reminders[0].tab) ? reminders[0].tab : 'dashboard',
      };
  const payload = JSON.stringify({
    title: payloadData.title,
    body: payloadData.body,
    tag: payloadData.tag,
    url: `/?tab=${payloadData.tab}`,
    data: { type: payloadData.tab === 'cards' ? 'card_bill' : payloadData.tab === 'subscriptions' ? 'subscription' : payloadData.tab },
  });

  let sent = 0;
  const alive = [...subscriptions];
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, payload);
      sent++;
    } catch (err: any) {
      if ([401, 403, 404, 410].includes(err?.statusCode)) {
        const i = alive.findIndex(a => a.endpoint === sub.endpoint);
        if (i >= 0) alive.splice(i, 1);
      } else console.warn('push: falha de envio', err?.statusCode);
    }
  }
  // Só marca como enviado se ao menos um aparelho recebeu; senão tenta de novo depois.
  if (sent > 0) {
    await docSnap.ref.set({
      subscriptions: alive,
      sentKeys: [...already, ...reminders.map(r => r.key)].slice(-120),
      pushDay: today,
      pushCount: countToday + 1,
    }, { merge: true });
  } else if (alive.length !== subscriptions.length) {
    await docSnap.ref.set({ subscriptions: alive }, { merge: true });
  }
  return sent;
}

/** Horário de Brasília (UTC-3): getNextDue usa os getters locais, e o servidor roda em UTC. */
export function brasiliaNow(): Date {
  return new Date(Date.now() - 3 * 60 * 60 * 1000);
}

export function setupWebPush(): boolean {
  const pub = process.env.VITE_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv || !ensureAdmin()) return false;
  webpush.setVapidDetails(`mailto:${process.env.VITE_SUPPORT_EMAIL || 'gastofinancas@gmail.com'}`, pub, priv);
  return true;
}
