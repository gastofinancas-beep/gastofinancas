import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const PUSH_COLLECTION = 'pushSubscriptions';

export function ensureAdmin(): boolean {
  if (getApps().length) return true;
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) return false;
    initializeApp({ credential: cert(JSON.parse(raw)) });
    return true;
  } catch (err) {
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
