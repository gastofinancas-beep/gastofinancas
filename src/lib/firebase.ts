import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  doc, 
  getDoc,
  setLogLevel
} from 'firebase/firestore';
import type { Analytics } from 'firebase/analytics';
import { DEFAULT_FIREBASE_CONFIG } from './firebaseConfig';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId,
};

const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId;
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Analytics é carregado depois que o app já abriu, para não pesar no início
export let analytics: Analytics | null = null;
let logEventFn: ((a: Analytics, name: string, params?: Record<string, string | number | boolean>) => void) | null = null;
if (typeof window !== 'undefined' && (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId)) {
  const loadAnalytics = () => {
    import('firebase/analytics')
      .then(async (mod) => {
        if (await mod.isSupported()) {
          analytics = mod.getAnalytics(app);
          logEventFn = mod.logEvent;
        }
      })
      .catch(() => {
        // Analytics not supported in this environment
      });
  };
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(loadAnalytics, { timeout: 4000 });
  } else {
    setTimeout(loadAnalytics, 2000);
  }
}

export function trackEvent(eventName: string, eventParams?: Record<string, string | number | boolean>) {
  try {
    if (analytics && logEventFn) {
      logEventFn(analytics, eventName, eventParams);
    }
  } catch {
    // Fail silently in development / restricted iframes
  }
}

// Explicitly configure browserLocalPersistence to guarantee session survival across page reloads & redirects on mobile/Netlify/PWA
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Could not set browserLocalPersistence:', err);
});

// Set Firestore log level to silent to avoid noisy quota/offline retry warnings in console
try {
  setLogLevel('silent');
} catch {}

// Configure Firestore with persistent local cache (IndexedDB) for PWA offline durability,
// and force long polling for resilient connections across sandboxed iframes, proxies, and mobile environments.
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    experimentalForceLongPolling: true,
  }, firestoreDatabaseId);
} catch {
  firestoreInstance = firestoreDatabaseId 
    ? getFirestore(app, firestoreDatabaseId)
    : getFirestore(app);
}
export const db = firestoreInstance;

export async function testConnection() {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }
    await getDoc(doc(db, 'test', 'connection'));
  } catch {
    // Graceful offline/permission handling
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errStr = error instanceof Error ? error.message : String(error);
  const isQuota = (error as any)?.code === 'resource-exhausted' || errStr.includes('resource-exhausted') || errStr.includes('Quota limit exceeded');

  if (isQuota) {
    console.warn('Firestore Quota temporarily exceeded. Falling back to local offline storage.');
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errStr,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
}

export default app;


