/**
 * Primeira sincronização com a nuvem (migração segura).
 *
 * Quem usava o app só com os dados salvos no navegador não pode perder nada quando o
 * Firestore passa a sincronizar. Na primeira vez em cada navegador, os dados locais e os da
 * nuvem são JUNTADOS (nunca apagados): itens com o mesmo `id` ficam com a versão local,
 * porque é a que a pessoa estava usando.
 */

export const LIST_FIELDS = [
  'expenses', 'incomes', 'cards', 'people', 'folders', 'boxes', 'paidBills', 'subscriptions',
  'driverTrips', 'driverExpenses', 'freelanceEntries', 'freelanceExpenses',
  'walletAccounts', 'walletTransactions', 'accumulationGoals',
] as const;

export const OBJECT_FIELDS = [
  'driverGoals', 'extraProfile', 'freelanceGoals', 'monthlyTargets', 'profile',
] as const;

// Campos de assinatura só podem ser gravados pelo servidor.
const SERVER_ONLY_PROFILE_KEYS = [
  'subscriptionStatus', 'planId', 'trialStartDate', 'trialEndsAt', 'subscriptionEndsAt', 'customerId',
];

type AnyRecord = Record<string, any>;

function mergeLists(cloud: unknown, local: unknown): unknown[] {
  const cloudList = Array.isArray(cloud) ? cloud : [];
  const localList = Array.isArray(local) ? local : [];
  const result: unknown[] = [];
  const indexById = new Map<string, number>();
  const seenJson = new Set<string>();

  const add = (item: unknown, overwrite: boolean) => {
    const id = item && typeof item === 'object' ? (item as AnyRecord).id : undefined;
    if (typeof id === 'string' || typeof id === 'number') {
      const key = String(id);
      const at = indexById.get(key);
      if (at === undefined) {
        indexById.set(key, result.length);
        result.push(item);
      } else if (overwrite) {
        result[at] = item;
      }
      return;
    }
    const json = JSON.stringify(item);
    if (!seenJson.has(json)) {
      seenJson.add(json);
      result.push(item);
    }
  };

  cloudList.forEach((item) => add(item, false));
  localList.forEach((item) => add(item, true));
  return result;
}

function mergeObjects(cloud: unknown, local: unknown): AnyRecord | undefined {
  const c = cloud && typeof cloud === 'object' && !Array.isArray(cloud) ? (cloud as AnyRecord) : undefined;
  const l = local && typeof local === 'object' && !Array.isArray(local) ? (local as AnyRecord) : undefined;
  if (!c && !l) return undefined;
  return { ...(c || {}), ...(l || {}) };
}

/** Junta os dados da nuvem com os locais. Não altera os objetos recebidos. */
export function mergeFirstSync(cloud: AnyRecord, local: AnyRecord): AnyRecord {
  const merged: AnyRecord = { ...cloud };

  for (const field of LIST_FIELDS) {
    if (cloud[field] !== undefined || local[field] !== undefined) {
      merged[field] = mergeLists(cloud[field], local[field]);
    }
  }
  for (const field of OBJECT_FIELDS) {
    const value = mergeObjects(cloud[field], local[field]);
    if (value !== undefined) merged[field] = value;
  }

  // O plano de assinatura vem sempre da nuvem (nunca do aparelho).
  if (merged.profile) {
    const profile: AnyRecord = { ...merged.profile };
    for (const key of SERVER_ONLY_PROFILE_KEYS) {
      if (cloud.profile && key in cloud.profile) profile[key] = cloud.profile[key];
      else delete profile[key];
    }
    merged.profile = profile;
  }
  return merged;
}
