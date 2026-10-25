import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const PUSH_COLLECTION = 'pushSubscriptions';

/**
 * Aceita a chave de serviço do jeito que costuma ser colada na Netlify: JSON puro, entre aspas,
 * em base64, ou com as quebras de linha da chave privada escritas como \\n.
 */
function parseServiceAccount(raw: string): Record<string, any> {
  let text = raw.trim();
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) text = text.slice(1, -1);
  if (!text.startsWith('{')) text = Buffer.from(text, 'base64').toString('utf8');
  const json = JSON.parse(text);
  if (typeof json.private_key === 'string') json.private_key = json.private_key.replace(/\\n/g, '\n');
  return json;
}

export let adminError = '';

export function ensureAdmin(): boolean {
  if (getApps().length) return true;
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) { adminError = 'variável FIREBASE_SERVICE_ACCOUNT ausente neste ambiente'; return false; }
    const account = parseServiceAccount(raw);
    // O token do usuário é conferido contra o projeto do app (o mesmo do login), não o da chave de serviço.
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0076762644';
    initializeApp({ credential: cert(account), projectId });
    if (account.project_id && account.project_id !== projectId) console.warn(`FIREBASE_SERVICE_ACCOUNT é do projeto ${account.project_id}, mas o app usa ${projectId}.`);
    return true;
  } catch (err: any) {
    adminError = `chave inválida (${err?.message || 'erro'})`;
    console.error('Erro ao inicializar o Firebase Admin:', err);
    return false;
  }
}

export function adminDb() {
  return getFirestore(
    getApp(),
    process.env.FIREBASE_DATABASE_ID || 'ai-studio-financegastos220-81373407-56dc-4fe4-8f86-a49bec9a9867'
  );
}

/** Hosts dos serviços de push dos navegadores. Qualquer outro endereço é recusado (evita o servidor chamar sites arbitrários). */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /^web\.push\.apple\.com$/, /(^|\.)push\.apple\.com$/,
  /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)notify\.windows\.com$/];

export function isAllowedPushEndpoint(endpoint: string): boolean {
  try {
    const u = new URL(endpoint);
    return u.protocol === 'https:' && !u.port && PUSH_HOSTS.some(r => r.test(u.hostname));
  } catch {
    return false;
  }
}

/** Limite simples por usuário e ação (janela fixa). Retorna false quando passou do limite. */
export async function allowRequest(uid: string, action: string, max: number, windowMs: number): Promise<boolean> {
  const db = adminDb();
  const ref = db.collection('rateLimits').doc(`${action}_${uid}`);
  const now = Date.now();
  return db.runTransaction(async (tx) => {
    const d = (await tx.get(ref)).data();
    const fresh = !d || typeof d.resetAt !== 'number' || now > d.resetAt;
    const count = fresh ? 0 : (d!.count as number);
    if (count >= max) return false;
    tx.set(ref, { count: count + 1, resetAt: fresh ? now + windowMs : d!.resetAt });
    return true;
  });
}
