import { Handler } from '@netlify/functions';
import { getAuth } from 'firebase-admin/auth';
import { adminDb, ensureAdmin, PUSH_COLLECTION } from './_push-shared';
import { brasiliaNow, processUser, setupWebPush } from './_push-core';

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/**
 * O app chama depois de salvar mudanças: confere na hora os avisos de limite e orçamento do próprio usuário,
 * para o aviso chegar assim que o limite for ultrapassado, sem esperar a verificação da hora seguinte.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método não permitido.' });
  if (!ensureAdmin() || !setupWebPush()) return json(500, { error: 'Servidor não configurado.' });

  const auth = event.headers['authorization'] || event.headers['Authorization'] || '';
  if (!auth.startsWith('Bearer ')) return json(401, { error: 'Não autenticado.' });
  let uid: string;
  try {
    uid = (await getAuth().verifyIdToken(auth.slice(7))).uid;
  } catch {
    return json(401, { error: 'Sessão inválida.' });
  }

  const db = adminDb();
  const snap = await db.collection(PUSH_COLLECTION).doc(uid).get();
  if (!snap.exists) return json(200, { sent: 0 });
  const sent = await processUser(db, snap, brasiliaNow(), { morning: false, evening: false });
  return json(200, { sent });
};
