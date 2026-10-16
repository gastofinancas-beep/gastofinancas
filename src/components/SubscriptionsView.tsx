import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Pause, 
  Play, 
  Edit3, 
  Trash2, 
  X, 
  Sparkles,
  Repeat
} from 'lucide-react';
import { CreditCard, Person, SubscriptionItem } from '../types';
import { SubscriptionLogo } from './SubscriptionLogo';
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
  const [showPresets, setShowPresets] = useState(false);

  // Metrics
  const activeSubs = useMemo(() => subscriptions.filter(s => s.active), [subscriptions]);
  const pausedSubs = useMemo(() => subscriptions.filter(s => !s.active), [subscriptions]);

  const totalMonthlyActive = useMemo(() => {
    return activeSubs.reduce((acc, curr) => {
      if (curr.billingCycle === 'anual') return acc + curr.amount / 12;
      if (curr.billingCycle === 'semanal') return acc + curr.amount * 4.33;
      return acc + curr.amount;
    }, 0);
  }, [activeSubs]);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      if (statusFilter === 'active' && !sub.active) return false;
      if (statusFilter === 'paused' && sub.active) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          sub.name.toLowerCase().includes(q) ||
          sub.category.toLowerCase().includes(q) ||
          (sub.notes && sub.notes.toLowerCase().includes(q))
        );
      }
      return true;
    }).sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return a.billingDay - b.billingDay;
    });
  }, [subscriptions, statusFilter, searchQuery]);

  // Unadded preset services
  const unaddedPresets = useMemo(() => {
    const existingKeys = new Set(
      subscriptions.map(s => (s.serviceKey || s.name).toLowerCase().replace(/[^a-z0-9]/g, ''))
    );
    return POPULAR_SUBSCRIPTION_PRESETS.filter(
      p => !existingKeys.has(p.serviceKey.toLowerCase().replace(/[^a-z0-9]/g, ''))
    );
  }, [subscriptions]);

  return (
    <div className="space-y-4.5 w-full max-w-full pb-28 sm:pb-16">
      
      {/* 1. Clean Top Header & Metric */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1C1C1E] p-5 sm:p-6 rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-2xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Assinaturas
          </h1>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Total:</span>
            <strong className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(totalMonthlyActive)}
            </strong>
            <span className="text-[11px] text-slate-400">/mês</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span>{activeSubs.length} ativa{activeSubs.length === 1 ? '' : 's'}</span>
            {pausedSubs.length > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  {pausedSubs.length} pausada{pausedSubs.length === 1 ? '' : 's'}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unaddedPresets.length > 0 && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(6);
                setShowPresets(!showPresets);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 transition-colors cursor-pointer select-none flex items-center gap-1.5"
            >
              <Sparkles size={14} className="text-amber-500" />
              <span>{showPresets ? 'Ocultar Sugestões' : 'Sugestões'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAddSubscription}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={15} className="stroke-[2.5]" />
            <span>Nova Assinatura</span>
          </button>
        </div>
      </div>

      {/* 2. Optional Suggested Presets (Collapsed by Default) */}
      {showPresets && unaddedPresets.length > 0 && (
        <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Adicionar serviço popular com 1 toque:
            </span>
            <button
              type="button"
              onClick={() => setShowPresets(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              Fechar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {unaddedPresets.slice(0, 10).map(preset => (
              <button
                key={preset.serviceKey}
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  onQuickAddPreset(preset);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#2C2C2E]/80 hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.10] text-xs font-medium text-slate-800 dark:text-slate-200 transition-all cursor-pointer select-none"
              >
                <SubscriptionLogo serviceKey={preset.serviceKey} name={preset.name} size={18} />
                <span>{preset.name}</span>
                <span className="text-[10px] text-slate-400 tabular-nums">
                  ({formatCurrency(preset.defaultAmount)})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Sleek Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar assinatura..."
            className="w-full pl-9 pr-7 py-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex rounded-xl bg-slate-200/70 dark:bg-[#2C2C2E] p-1 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todas ({subscriptions.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
              statusFilter === 'active'
                ? 'bg-white dark:bg-[#1C1C1E] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Ativas ({activeSubs.length})
          </button>
          {pausedSubs.length > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('paused')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                statusFilter === 'paused'
                  ? 'bg-white dark:bg-[#1C1C1E] text-amber-600 dark:text-amber-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pausadas ({pausedSubs.length})
            </button>
          )}
        </div>
      </div>

      {/* 4. Subscriptions Clean List */}
      {filteredSubscriptions.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/60 dark:border-white/[0.08] p-8 sm:p-10 text-center space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <Repeat size={22} />
          </div>
          <div className="max-w-sm mx-auto">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhuma assinatura cadastrada'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {searchQuery 
                ? `Nenhuma assinatura encontrada para "${searchQuery}". Tente outro termo.`
                : 'Cadastre suas assinaturas (Netflix, Spotify, ChatGPT, etc.) para manter o controle total dos seus gastos mensais.'}
            </p>
          </div>
          
          {!searchQuery && unaddedPresets.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-400 block mb-2.5">
                Ou adicione um serviço popular:
              </span>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {unaddedPresets.slice(0, 6).map(preset => (
                  <button
                    key={preset.serviceKey}
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      onQuickAddPreset(preset);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.10] text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    <SubscriptionLogo serviceKey={preset.serviceKey} name={preset.name} size={16} />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenAddSubscription}
              className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <Plus size={15} className="stroke-[2.5]" />
              <span>Cadastrar Assinatura</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-2xs divide-y divide-slate-100 dark:divide-white/[0.05] overflow-hidden">
          {filteredSubscriptions.map((sub) => {
            const cardObj = cards.find(c => c.id === sub.cardId);
            const personObj = people.find(p => p.id === sub.personId);

            return (
              <div
                key={sub.id}
                className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.02] ${
                  !sub.active ? 'opacity-60 bg-slate-50/40 dark:bg-black/20' : ''
                }`}
              >
                {/* Left: Logo & Info */}
                <div 
                  onClick={() => onEditSubscription(sub)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer select-none"
                >
                  <SubscriptionLogo
                    serviceKey={sub.serviceKey}
                    category={sub.category}
                    name={sub.name}
                    size={40}
                    className={!sub.active ? 'grayscale' : ''}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {sub.name}
                      </h3>
                      {!sub.active && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                          Pausada
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      <span>Renova dia {sub.billingDay}</span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="capitalize">{sub.billingCycle}</span>
                      {cardObj && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="truncate">{cardObj.name}</span>
                        </>
                      )}
                      {personObj && !personObj.isSelf && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="truncate">({personObj.name})</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Quick Actions */}
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                  <div 
                    onClick={() => onEditSubscription(sub)}
                    className="text-right cursor-pointer select-none"
                  >
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(sub.amount)}
                    </div>
                    <span className="text-[10px] text-slate-400 block -mt-0.5">
                      /{sub.billingCycle}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic(8);
                        onToggleSubscriptionActive(sub.id);
                      }}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        sub.active
                          ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-white/[0.04]'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-white/[0.04]'
                      }`}
                      title={sub.active ? 'Pausar assinatura' : 'Ativar assinatura'}
                    >
                      {sub.active ? <Pause size={13} /> : <Play size={13} />}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditSubscription(sub);
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                      title="Editar assinatura"
                    >
                      <Edit3 size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic(10);
                        onDeleteSubscription(sub.id);
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                      title="Excluir assinatura"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
