import type { Config } from '@netlify/functions';
import webpush from 'web-push';
import { adminDb, ensureAdmin, PUSH_COLLECTION } from './_push-shared';
import { getCardBillTotal, getNextDue, isCardBillPaid } from '../../src/utils/billReminders';
import { getActiveExpensesForMonth } from '../../src/utils/financeCalculations';

const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Reminder { key: string; title: string; body: string; tab: string }

function buildReminders(data: any, now: Date): Reminder[] {
  const profile = data.profile || {};
  if (profile.notificationsEnabled === false || profile.notifyCardBillsDue === false) return [];
  const out: Reminder[] = [];
  const day = now.toISOString().slice(0, 10);

  for (const card of (data.cards || []) as any[]) {
    const dueDay = card.dueDay || 15;
    const { billMonth, daysDiff } = getNextDue(dueDay, now, 3);
    if (daysDiff > 3) continue;
    if (isCardBillPaid(card, data.paidBills || [], billMonth)) continue;
    const total = getCardBillTotal(card, data.expenses || [], billMonth);
    if (total <= 0) continue;

    let title: string; let body: string;
    if (daysDiff < 0) { title = `Fatura ${card.name} em atraso`; body = `${brl(total)} em aberto desde o dia ${dueDay}. Vale regularizar para evitar encargos.`; }
    else if (daysDiff === 0) { title = `Fatura ${card.name} vence hoje`; body = `${brl(total)} para pagar hoje e evitar juros.`; }
    else if (daysDiff === 1) { title = `Fatura ${card.name} vence amanhã`; body = `${brl(total)}, com vencimento no dia ${dueDay}.`; }
    else { title = `Fatura ${card.name} vence em ${daysDiff} dias`; body = `${brl(total)}, com vencimento no dia ${dueDay}.`; }
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
        const payload = JSON.stringify({ title: r.title, body: r.body, tag: r.key, url: `/?tab=${r.tab}`, data: { type: r.tab === 'cards' ? 'card_bill' : 'subscription' } });
        for (const s of subscriptions) {
          try {
            await webpush.sendNotification(s, payload);
            sent++;
          } catch (err: any) {
            if (err?.statusCode === 404 || err?.statusCode === 410) {
              const i = alive.findIndex(a => a.endpoint === s.endpoint);
              if (i >= 0) alive.splice(i, 1);
            } else console.warn('push-daily: falha de envio', err?.statusCode);
          }
        }
      }
      await doc.ref.set({
        subscriptions: alive,
        sentKeys: [...already, ...reminders.map(r => r.key)].slice(-40),
      }, { merge: true });
    } catch (err) {
      console.warn('push-daily: erro em um usuário', err);
    }
  }
  console.log(`push-daily: ${sent} avisos enviados.`);
};

// Todo dia às 11:00 UTC (08:00 em Brasília).
export const config: Config = { schedule: '0 11 * * *' };
