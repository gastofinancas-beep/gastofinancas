import { BankCardFilterOptions, BankCardPreset, CardCategory, CardNetwork } from './types';
import { NUBANK_CARDS } from './nubank';
import { ITAU_CARDS } from './itau';
import { INTER_CARDS } from './inter';
import { C6_CARDS, C6_COLOR_VARIANTS } from './c6';
import { SANTANDER_CARDS } from './santander';
import { BRADESCO_CARDS } from './bradesco';
import { BB_CARDS } from './bb';
import { CAIXA_CARDS } from './caixa';
import { XP_CARDS } from './xp';
import { BTG_CARDS } from './btg';
import { SAFRA_CARDS } from './safra';
import { PORTO_CARDS } from './porto';
import { BV_CARDS } from './bv';
import { NEON_CARDS } from './neon';
import { PICPAY_CARDS } from './picpay';
import { MERCADOPAGO_CARDS } from './mercadopago';
import { PAN_CARDS } from './pan';
import { DIGIO_CARDS } from './digio';
import { WILL_CARDS } from './will';
import { ORIGINAL_CARDS } from './original';
import { LEGACY_CARDS } from './legacy';

export * from './types';
export { C6_COLOR_VARIANTS } from './c6';

export const ALL_BANK_CARDS: BankCardPreset[] = [
  ...NUBANK_CARDS,
  ...ITAU_CARDS,
  ...INTER_CARDS,
  ...C6_CARDS,
  ...SANTANDER_CARDS,
  ...BRADESCO_CARDS,
  ...BB_CARDS,
  ...CAIXA_CARDS,
  ...XP_CARDS,
  ...BTG_CARDS,
  ...SAFRA_CARDS,
  ...PORTO_CARDS,
  ...BV_CARDS,
  ...NEON_CARDS,
  ...PICPAY_CARDS,
  ...MERCADOPAGO_CARDS,
  ...PAN_CARDS,
  ...DIGIO_CARDS,
  ...WILL_CARDS,
  ...ORIGINAL_CARDS,
  ...LEGACY_CARDS,
];

export interface BankMetadata {
  id: string;
  name: string;
  count: number;
  featuredColor: string;
}

/**
 * Retorna lista única de instituições bancárias com contagem de cartões
 */
export function getBanksCatalog(): BankMetadata[] {
  const map = new Map<string, { id: string; name: string; count: number; featuredColor: string }>();

  for (const card of ALL_BANK_CARDS) {
    if (card.availability.status !== 'current') continue;
    const existing = map.get(card.bankId);
    if (!existing) {
      map.set(card.bankId, {
        id: card.bankId,
        name: card.bankName,
        count: 1,
        featuredColor: card.colors.primary,
      });
    } else {
      existing.count += 1;
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    // Prioridade para os bancos mais populares
    const popularOrder = ['nubank', 'itau', 'inter', 'c6', 'santander', 'bradesco', 'bb', 'caixa', 'xp', 'btg'];
    const idxA = popularOrder.indexOf(a.id);
    const idxB = popularOrder.indexOf(b.id);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Categorias suportadas com títulos em português
 */
export const CATEGORY_LABELS: Record<CardCategory, { label: string; badge: string }> = {
  traditional: { label: 'Tradicional', badge: 'bg-slate-500/10 text-slate-700 dark:text-slate-300' },
  gold: { label: 'Gold', badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  platinum: { label: 'Platinum', badge: 'bg-slate-300/30 text-slate-700 dark:text-slate-200' },
  black: { label: 'Black / Carbon', badge: 'bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900' },
  infinite: { label: 'Infinite', badge: 'bg-blue-600/15 text-blue-700 dark:text-blue-400' },
  signature: { label: 'Signature', badge: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400' },
  premium: { label: 'Alta Renda', badge: 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-300' },
  'co-branded': { label: 'Co-Branded', badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  business: { label: 'Empresarial (PJ)', badge: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400' },
};

/**
 * Busca de cartões com múltiplos filtros combinados
 */
export function filterBankCards(options: BankCardFilterOptions = {}): BankCardPreset[] {
  const {
    bankId,
    category = 'all',
    network = 'all',
    status = 'current',
    searchQuery = '',
  } = options;

  const normalizedQuery = searchQuery.trim().toLowerCase();

  return ALL_BANK_CARDS.filter(card => {
    // Filtro de status (default 'current')
    if (status !== 'all' && card.availability.status !== status) {
      return false;
    }

    // Filtro de banco
    if (bankId && bankId !== 'all' && card.bankId !== bankId) {
      return false;
    }

    // Filtro de categoria
    if (category !== 'all' && card.category !== category) {
      return false;
    }

    // Filtro de bandeira
    if (network !== 'all' && card.network !== network) {
      return false;
    }

    // Busca textual inteligente (nome, banco, categoria, descrição)
    if (normalizedQuery) {
      const matchName = card.name.toLowerCase().includes(normalizedQuery);
      const matchBank = card.bankName.toLowerCase().includes(normalizedQuery);
      const matchCategory = card.category.toLowerCase().includes(normalizedQuery);
      const matchDesc = card.description?.toLowerCase().includes(normalizedQuery) || false;
      const matchNetwork = card.network.toLowerCase().includes(normalizedQuery);

      if (!matchName && !matchBank && !matchCategory && !matchDesc && !matchNetwork) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Busca preset por ID
 */
export function getCardPresetById(id?: string): BankCardPreset | undefined {
  if (!id) return undefined;
  return ALL_BANK_CARDS.find(card => card.id === id);
}

/**
 * Busca o melhor preset baseado no nome do banco e texto do cartão
 */
export function matchBestCardPreset(bankName?: string, cardName?: string): BankCardPreset | undefined {
  if (!bankName && !cardName) return undefined;
  const combined = `${bankName || ''} ${cardName || ''}`.toLowerCase();

  // Procurar correspondência exata ou aproximada
  return ALL_BANK_CARDS.find(card => {
    if (card.availability.status !== 'current') return false;
    const targetName = card.name.toLowerCase();
    return combined.includes(targetName) || targetName.includes(cardName?.toLowerCase() || '___');
  }) || ALL_BANK_CARDS.find(card => {
    if (card.availability.status !== 'current') return false;
    return card.bankName.toLowerCase() === bankName?.toLowerCase();
  });
}
