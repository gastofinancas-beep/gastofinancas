/**
 * Primeira sincronização com a nuvem (migração segura).
 *
 * Quem usava o app só com os dados salvos no navegador não pode perder nada quando o
 * Firestore passa a sincronizar. Na primeira vez em cada navegador:
 * - listas: se o aparelho tem itens, a lista do aparelho vale (é a que a pessoa estava usando,
 *   então o que ela apagou continua apagado); se a lista do aparelho está vazia ou não existe,
 *   vale a da nuvem. Os dados originais dos dois lados ficam em um backup no navegador.
 * - objetos (metas, perfil): chaves do aparelho sobrescrevem as da nuvem, sem remover chaves.
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
  return localList.length > 0 ? localList : cloudList;
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
