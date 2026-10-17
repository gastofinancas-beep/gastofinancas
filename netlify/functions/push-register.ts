import { Handler } from '@netlify/functions';
import { getAuth } from 'firebase-admin/auth';
import { adminDb, ensureAdmin, PUSH_COLLECTION } from './_push-shared';

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/**
 * POST   -> guarda a inscrição de push do aparelho do usuário logado.
 * DELETE -> remove a inscrição (usuário desligou os avisos).
 * Só o próprio usuário (token do Firebase) consegue alterar a sua inscrição.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'DELETE') return json(405, { error: 'Método não permitido.' });
  if (!ensureAdmin()) return json(500, { error: 'Servidor não configurado.' });

  const auth = event.headers['authorization'] || event.headers['Authorization'] || '';
  if (!auth.startsWith('Bearer ')) return json(401, { error: 'Não autenticado.' });

  let uid: string;
  try {
    uid = (await getAuth().verifyIdToken(auth.slice(7))).uid;
  } catch {
    return json(401, { error: 'Sessão inválida.' });
  }

  let body: any = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Pedido inválido.' }); }

  const ref = adminDb().collection(PUSH_COLLECTION).doc(uid);
  const endpoint = typeof body.subscription?.endpoint === 'string' ? body.subscription.endpoint : body.endpoint;

  if (event.httpMethod === 'DELETE') {
    const snap = await ref.get();
    if (snap.exists) {
      const subs = ((snap.data()?.subscriptions as any[]) || []).filter(s => !endpoint || s.endpoint !== endpoint);
      if (subs.length) await ref.set({ subscriptions: subs }, { merge: true });
      else await ref.delete();
    }
    return json(200, { ok: true });
  }

  const sub = body.subscription;
  if (!sub || typeof sub.endpoint !== 'string' || !sub.endpoint.startsWith('https://')
      || typeof sub.keys?.p256dh !== 'string' || typeof sub.keys?.auth !== 'string') {
    return json(400, { error: 'Inscrição inválida.' });
  }

  const snap = await ref.get();
  const current = ((snap.data()?.subscriptions as any[]) || []).filter(s => s.endpoint !== sub.endpoint);
  current.push({ endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth }, addedAt: new Date().toISOString() });
  await ref.set({ subscriptions: current.slice(-5), updatedAt: new Date().toISOString() }, { merge: true });
  return json(200, { ok: true });
};
