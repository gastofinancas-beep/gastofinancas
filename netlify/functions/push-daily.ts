import type { Config } from '@netlify/functions';
import { adminDb, PUSH_COLLECTION } from './_push-shared';
import { brasiliaNow, processUser, setupWebPush } from './_push-core';

/** Roda a cada hora: faturas e assinaturas às 8h, resumo do mês às 20h, limites e orçamentos a qualquer hora. */
export default async () => {
  if (!setupWebPush()) {
    console.error('push-daily: faltam VITE_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY ou FIREBASE_SERVICE_ACCOUNT.');
    return;
  }
  const now = brasiliaNow();
  const moment = { morning: now.getHours() === 8, evening: now.getHours() === 20 };
  const db = adminDb();
  const subsSnap = await db.collection(PUSH_COLLECTION).get();
  let sent = 0;
  for (const doc of subsSnap.docs) {
    try {
      sent += await processUser(db, doc, now, moment);
    } catch (err) {
      console.warn('push-daily: erro em um usuário', err);
    }
  }
  console.log(`push-daily: ${sent} avisos enviados.`);
};

// A cada hora, em ponto.
export const config: Config = { schedule: '0 * * * *' };
