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
