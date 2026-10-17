import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Pause,
  Play,
  Edit3,
  Trash2,
  X,
  MoreHorizontal,
  Repeat,
  CalendarClock,
} from 'lucide-react';
import { CreditCard, Person, SubscriptionItem, SubscriptionBillingCycle } from '../types';
import { SubscriptionLogo } from './SubscriptionLogo';
import { BankLogo } from './BankLogo';
import { formatCurrency } from '../utils/financeCalculations';
import { POPULAR_SUBSCRIPTION_PRESETS, ServicePreset } from '../data/subscriptionPresets';
import { triggerHaptic } from '../utils/haptics';

interface SubscriptionsViewProps {
  subscriptions: SubscriptionItem[];
  cards: CreditCard[];
  people: Person[];
  onOpenAddSubscription: () => void;
  onEditSubscription: (sub: SubscriptionItem) => void;
  onDeleteSubscription: (id: string) => void;
  onToggleSubscriptionActive: (id: string) => void;
  onQuickAddPreset: (preset: ServicePreset) => void;
}

const CYCLE_SUFFIX: Record<SubscriptionBillingCycle, string> = {
  mensal: '/mês',
  anual: '/ano',
  semanal: '/sem',
};

function monthlyEquivalent(sub: SubscriptionItem): number {
  if (sub.billingCycle === 'anual') return sub.amount / 12;
  if (sub.billingCycle === 'semanal') return sub.amount * 4.33;
  return sub.amount;
}

/** Dias até a próxima cobrança mensal (0 = hoje). */
function daysUntilBilling(billingDay: number, from = new Date()): number {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const clamp = (y: number, m: number) => Math.min(Math.max(billingDay || 1, 1), new Date(y, m + 1, 0).getDate());
  let next = new Date(today.getFullYear(), today.getMonth(), clamp(today.getFullYear(), today.getMonth()));
  if (next < today) {
    const y = today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear();
    const m = (today.getMonth() + 1) % 12;
    next = new Date(y, m, clamp(y, m));
  }
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}

function dueLabel(days: number): string {
  if (days === 0) return 'hoje';
  if (days === 1) return 'amanhã';
  return `em ${days} dias`;
}

export function SubscriptionsView({
  subscriptions,
  cards,
  people,
  onOpenAddSubscription,
  onEditSubscription,
  onDeleteSubscription,
  onToggleSubscriptionActive,
  onQuickAddPreset,
}: SubscriptionsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpenId) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenId(null);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [menuOpenId]);

  const activeSubs = useMemo(() => subscriptions.filter((s) => s.active), [subscriptions]);
  const pausedSubs = useMemo(() => subscriptions.filter((s) => !s.active), [subscriptions]);

  const totalMonthlyActive = useMemo(
    () => activeSubs.reduce((acc, curr) => acc + monthlyEquivalent(curr), 0),
    [activeSubs]
  );

  const nextCharge = useMemo(() => {
    const monthly = activeSubs.filter((s) => s.billingCycle === 'mensal');
    if (monthly.length === 0) return null;
    return monthly
      .map((s) => ({ sub: s, days: daysUntilBilling(s.billingDay) }))
      .sort((a, b) => a.days - b.days)[0];
  }, [activeSubs]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return subscriptions
      .filter((sub) => {
        if (statusFilter === 'active' && !sub.active) return false;
        if (statusFilter === 'paused' && sub.active) return false;
        if (!q) return true;
        return (
          sub.name.toLowerCase().includes(q) ||
          sub.category.toLowerCase().includes(q) ||
          (sub.notes && sub.notes.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.billingDay - b.billingDay);
  }, [subscriptions, statusFilter, searchQuery]);

  const filteredActive = filtered.filter((s) => s.active);
  const filteredPaused = filtered.filter((s) => !s.active);

  const unaddedPresets = useMemo(() => {
    const existingKeys = new Set(
      subscriptions.map((s) => (s.serviceKey || s.name).toLowerCase().replace(/[^a-z0-9]/g, ''))
    );
    return POPULAR_SUBSCRIPTION_PRESETS.filter(
      (p) => !existingKeys.has(p.serviceKey.toLowerCase().replace(/[^a-z0-9]/g, ''))
    );
  }, [subscriptions]);

  const renderRow = (sub: SubscriptionItem) => {
    const cardObj = cards.find((c) => c.id === sub.cardId);
    const personObj = people.find((p) => p.id === sub.personId);
    const isMenuOpen = menuOpenId === sub.id;
    const dueDays = sub.active && sub.billingCycle === 'mensal' ? daysUntilBilling(sub.billingDay) : null;
    const dueSoon = dueDays !== null && dueDays <= 3;

    return (
      <div
        key={sub.id}
        className={`relative flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.03] ${
          !sub.active ? 'opacity-60' : ''
        }`}
      >
        <button
          type="button"
          onClick={() => onEditSubscription(sub)}
          className="flex items-center gap-3.5 min-w-0 flex-1 text-left cursor-pointer"
        >
          <SubscriptionLogo
            serviceKey={sub.serviceKey}
            category={sub.category}
            name={sub.name}
            size={44}
            className={!sub.active ? 'grayscale' : ''}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{sub.name}</h3>
              {!sub.active && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  Pausada
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400 min-w-0">
              {dueSoon ? (
                <span className="font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                  Cobra {dueLabel(dueDays!)}
                </span>
              ) : (
                <span className="shrink-0">Dia {sub.billingDay}</span>
              )}
              {cardObj && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <BankLogo bankName={cardObj.name} size={14} className="rounded-[4px]" />
                  <span className="truncate">{cardObj.name}</span>
                </>
              )}
              {personObj && !personObj.isSelf && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="truncate">{personObj.name}</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(sub.amount)}
            </div>
            <div className="text-[11px] text-slate-400">{CYCLE_SUFFIX[sub.billingCycle] || ''}</div>
          </div>
        </button>

        <div className="relative shrink-0" ref={isMenuOpen ? menuRef : undefined}>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(6);
              setMenuOpenId(isMenuOpen ? null : sub.id);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label={`Opções de ${sub.name}`}
          >
            <MoreHorizontal size={17} />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-9 z-20 w-44 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-slate-200/70 dark:border-white/[0.10] shadow-lg py-1.5 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setMenuOpenId(null);
                  onEditSubscription(sub);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.06] cursor-pointer"
              >
                <Edit3 size={14} /> Editar
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  setMenuOpenId(null);
                  onToggleSubscriptionActive(sub.id);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.06] cursor-pointer"
              >
                {sub.active ? <Pause size={14} /> : <Play size={14} />}
                {sub.active ? 'Pausar' : 'Reativar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  setMenuOpenId(null);
                  onDeleteSubscription(sub.id);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
              >
                <Trash2 size={14} /> Excluir
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGroup = (title: string, items: SubscriptionItem[]) =>
    items.length === 0 ? null : (
      <section>
        <h2 className="px-1 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</h2>
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-2xs divide-y divide-slate-100 dark:divide-white/[0.05] overflow-visible">
          {items.map(renderRow)}
        </div>
      </section>
    );

  return (
    <div className="space-y-5 w-full max-w-full pb-28 sm:pb-16">
      {/* Resumo */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-slate-200/60 dark:border-white/[0.08] shadow-2xs p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Assinaturas</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(totalMonthlyActive)}
              </span>
              <span className="text-sm text-slate-400">/mês</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formatCurrency(totalMonthlyActive * 12)} por ano · {activeSubs.length} ativa
              {activeSubs.length === 1 ? '' : 's'}
              {pausedSubs.length > 0 && ` · ${pausedSubs.length} pausada${pausedSubs.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <button
            type="button"
            data-tour="add-subscription"
            onClick={onOpenAddSubscription}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#00C48C] hover:bg-[#00B07D] active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus size={15} className="stroke-[2.5]" />
            <span>Nova</span>
          </button>
        </div>

        {nextCharge && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] px-3.5 py-3">
            <SubscriptionLogo
              serviceKey={nextCharge.sub.serviceKey}
              category={nextCharge.sub.category}
              name={nextCharge.sub.name}
              size={32}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <CalendarClock size={12} /> Próxima cobrança
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {nextCharge.sub.name} · {dueLabel(nextCharge.days)}
              </p>
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums shrink-0">
              {formatCurrency(nextCharge.sub.amount)}
            </span>
          </div>
        )}
      </div>

      {subscriptions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar assinatura"
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-slate-200/70 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C48C]/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Limpar busca"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {pausedSubs.length > 0 && (
            <div className="flex rounded-xl bg-slate-200/60 dark:bg-[#2C2C2E] p-1 self-start sm:self-auto shrink-0">
              {([
                ['all', `Todas ${subscriptions.length}`],
                ['active', `Ativas ${activeSubs.length}`],
                ['paused', `Pausadas ${pausedSubs.length}`],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                    statusFilter === key
                      ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-slate-200/60 dark:border-white/[0.08] p-8 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-[#00C48C]/10 text-[#00C48C] mx-auto flex items-center justify-center">
            <Repeat size={22} />
          </div>
          <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
            {searchQuery ? 'Nenhum resultado' : 'Nenhuma assinatura ainda'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {searchQuery
              ? `Não encontramos "${searchQuery}". Tente outro nome.`
              : 'Cadastre Netflix, Spotify, ChatGPT e outras para ver quanto você gasta por mês.'}
          </p>
        </div>
      ) : statusFilter === 'all' ? (
        <div className="space-y-5">
          {renderGroup('Ativas', filteredActive)}
          {renderGroup('Pausadas', filteredPaused)}
        </div>
      ) : (
        renderGroup(statusFilter === 'active' ? 'Ativas' : 'Pausadas', filtered)
      )}

      {/* Sugestões com 1 toque */}
      {!searchQuery && unaddedPresets.length > 0 && (
        <section>
          <h2 className="px-1 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Adicionar com 1 toque
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {unaddedPresets.slice(0, 16).map((preset) => (
              <button
                key={preset.serviceKey}
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  onQuickAddPreset(preset);
                }}
                className="snap-start shrink-0 w-[88px] flex flex-col items-center gap-2 py-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] hover:border-[#00C48C]/40 active:scale-95 transition-all cursor-pointer"
              >
                <SubscriptionLogo serviceKey={preset.serviceKey} category={preset.category} name={preset.name} size={40} />
                <span className="w-full px-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate text-center">
                  {preset.name}
                </span>
                <span className="text-[10px] text-slate-400 tabular-nums -mt-1.5">
                  {formatCurrency(preset.defaultAmount)}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
