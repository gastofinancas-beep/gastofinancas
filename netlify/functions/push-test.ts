import { Handler } from '@netlify/functions';
import { getAuth } from 'firebase-admin/auth';
import webpush from 'web-push';
import { adminDb, ensureAdmin, PUSH_COLLECTION } from './_push-shared';

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/** Envia na hora um aviso de teste aos aparelhos inscritos do usuário logado. */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método não permitido.' });
  const pub = process.env.VITE_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv || !ensureAdmin()) return json(500, { error: 'Servidor sem as chaves de aviso configuradas (VAPID_PRIVATE_KEY / FIREBASE_SERVICE_ACCOUNT).' });

  const auth = event.headers['authorization'] || event.headers['Authorization'] || '';
  if (!auth.startsWith('Bearer ')) return json(401, { error: 'Não autenticado.' });
  let uid: string;
  try {
    uid = (await getAuth().verifyIdToken(auth.slice(7))).uid;
  } catch (err: any) {
    console.warn(`push-test: token recusado`, err?.code, err?.message);
    return json(401, { error: `Sessão inválida (${err?.code || 'erro'}). Saia e entre de novo na conta.` });
  }

  const ref = adminDb().collection(PUSH_COLLECTION).doc(uid);
  const snap = await ref.get();
  const subs = ((snap.data()?.subscriptions as any[]) || []);
  if (!subs.length) return json(404, { error: 'Nenhum aparelho inscrito para a sua conta.' });

  webpush.setVapidDetails(`mailto:${process.env.VITE_SUPPORT_EMAIL || 'gastofinancas@gmail.com'}`, pub, priv);
  const payload = JSON.stringify({ title: 'Gastô', body: 'Teste ok! Os avisos chegam mesmo com o app fechado.', tag: 'gasto-test', url: '/' });

  let sent = 0;
  let lastStatus: number | undefined;
  const alive = [...subs];
  for (const s of subs) {
    try {
      await webpush.sendNotification(s, payload);
      sent++;
    } catch (err: any) {
      lastStatus = err?.statusCode;
      console.warn('push-test: falha de envio', err?.statusCode, err?.body);
      if ([404, 410].includes(err?.statusCode)) alive.splice(alive.findIndex(a => a.endpoint === s.endpoint), 1);
    }
  }
  if (alive.length !== subs.length) await ref.set({ subscriptions: alive }, { merge: true });
  if (!sent) return json(502, { error: `O serviço de push da Apple/Google recusou o envio (código ${lastStatus ?? 'sem resposta'}). Desligue e ligue os avisos e teste de novo.`, sent });
  return json(200, { ok: true, sent });
};
