import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Plus, 
  Search, 
  Calendar, 
  TrendingUp, 
  Pause, 
  Play, 
  Edit3, 
  Trash2, 
  CreditCard as CardIcon, 
  Users, 
  CheckCircle2, 
  Layers, 
  LayoutGrid, 
  List as ListIcon, 
  ChevronRight, 
  Clock, 
  ShieldCheck,
  Zap,
  ArrowUpRight,
  X
} from 'lucide-react';
import { CreditCard, Person, SubscriptionCategory, SubscriptionItem } from '../types';
import { SubscriptionLogo } from './SubscriptionLogo';
import { formatCurrency } from '../utils/financeCalculations';
import { BankLogo } from './BankLogo';
import { POPULAR_SUBSCRIPTION_PRESETS, ServicePreset } from '../data/subscriptionPresets';

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

const CATEGORY_TABS: { id: SubscriptionCategory | 'todas'; label: string; icon?: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'streaming', label: 'Streaming' },
  { id: 'musica', label: 'Música' },
  { id: 'ia', label: 'IA & Tech' },
  { id: 'produtividade', label: 'Produtividade' },
  { id: 'jogos', label: 'Jogos' },
  { id: 'nuvem', label: 'Nuvem' },
  { id: 'educacao', label: 'Educação' },
  { id: 'saude', label: 'Saúde' },
];

const CATEGORY_COLORS: Record<SubscriptionCategory, string> = {
  streaming: '#F43F5E',
  musica: '#10B981',
  ia: '#6366F1',
  jogos: '#A855F7',
  nuvem: '#0EA5E9',
  produtividade: '#2563EB',
  educacao: '#F59E0B',
  saude: '#EC4899',
  outros: '#64748B',
};

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
  const [selectedCategory, setSelectedCategory] = useState<SubscriptionCategory | 'todas'>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Computed metrics
  const activeSubs = useMemo(() => subscriptions.filter(s => s.active), [subscriptions]);
  const pausedSubs = useMemo(() => subscriptions.filter(s => !s.active), [subscriptions]);

  const totalMonthlyActive = useMemo(() => {
    return activeSubs.reduce((acc, curr) => {
      if (curr.billingCycle === 'anual') return acc + curr.amount / 12;
      if (curr.billingCycle === 'semanal') return acc + curr.amount * 4.33;
      return acc + curr.amount;
    }, 0);
  }, [activeSubs]);

  const totalYearlyActive = useMemo(() => totalMonthlyActive * 12, [totalMonthlyActive]);

  // Category distribution for Apple-style progress bar
  const categoryBreakdown = useMemo(() => {
    if (totalMonthlyActive === 0) return [];
    const map = new Map<SubscriptionCategory, number>();
    activeSubs.forEach(sub => {
      const monthlyAmount = sub.billingCycle === 'anual' ? sub.amount / 12 : sub.billingCycle === 'semanal' ? sub.amount * 4.33 : sub.amount;
      map.set(sub.category, (map.get(sub.category) || 0) + monthlyAmount);
    });

    return Array.from(map.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / totalMonthlyActive) * 100,
      color: CATEGORY_COLORS[category] || '#64748B',
    })).sort((a, b) => b.amount - a.amount);
  }, [activeSubs, totalMonthlyActive]);

  // Next upcoming renewals
  const upcomingRenewals = useMemo(() => {
    const today = new Date().getDate();
    return [...activeSubs]
      .map(sub => {
        let daysUntil = sub.billingDay - today;
        if (daysUntil < 0) daysUntil += 30;
        return { ...sub, daysUntil };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [activeSubs]);

  // Filtered subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      if (selectedCategory !== 'todas' && sub.category !== selectedCategory) {
        return false;
      }
      if (filterStatus === 'active' && !sub.active) return false;
      if (filterStatus === 'paused' && sub.active) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = sub.name.toLowerCase().includes(q);
        const matchCategory = sub.category.toLowerCase().includes(q);
        const matchNotes = sub.notes?.toLowerCase().includes(q) || false;
        return matchName || matchCategory || matchNotes;
      }
      return true;
    }).sort((a, b) => a.billingDay - b.billingDay);
  }, [subscriptions, selectedCategory, filterStatus, searchQuery]);

  // Preset services not yet added
  const unaddedPresets = useMemo(() => {
    const existingKeys = new Set(subscriptions.map(s => (s.serviceKey || s.name).toLowerCase().replace(/[^a-z0-9]/g, '')));
    return POPULAR_SUBSCRIPTION_PRESETS.filter(p => !existingKeys.has(p.serviceKey.toLowerCase().replace(/[^a-z0-9]/g, '')));
  }, [subscriptions]);

  return (
    <div className="space-y-6 sm:space-y-7 w-full max-w-full pb-8">
      
      {/* 1. Apple-Grade Hero Master Dashboard */}
      <div className="relative overflow-hidden rounded-3xl sm:rounded-[32px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-all">
        
        {/* Subtle Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-400/[0.03] rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative p-5 sm:p-8 space-y-6">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
                  Gestão & Recorrências
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {activeSubs.length} ativas
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Assinaturas
              </h1>
            </div>

            {/* Apple Style Action Pill Button */}
            <button
              type="button"
              onClick={onOpenAddSubscription}
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-sm hover:shadow transition-all cursor-pointer select-none self-start sm:self-auto"
            >
              <Plus size={16} className="stroke-[2.5]" />
              <span>Nova Assinatura</span>
            </button>
          </div>

          {/* Core Balance & Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
            
            {/* Left Column: Big Amount Metrics */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Custo Mensal Ativo
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
                    {formatCurrency(totalMonthlyActive)}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    /mês
                  </span>
                </div>
              </div>

              {/* Annual projection pill */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 font-medium tabular-nums">
                  {formatCurrency(totalYearlyActive)} ao ano
                </span>
                {pausedSubs.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium tabular-nums">
                    {pausedSubs.length} pausada(s)
                  </span>
                )}
              </div>
            </div>

            {/* Right Column: Next Renewal & Category Distribution Bar */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4 bg-slate-50/70 dark:bg-white/[0.03] p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-white/[0.04]">
              
              {/* Next Renewal Banner */}
              {upcomingRenewals.length > 0 ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <SubscriptionLogo
                      serviceKey={upcomingRenewals[0].serviceKey}
                      name={upcomingRenewals[0].name}
                      category={upcomingRenewals[0].category}
                      size={36}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                          Próxima renovação
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {upcomingRenewals[0].name}
                      </h4>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums block">
                      {formatCurrency(upcomingRenewals[0].amount)}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {upcomingRenewals[0].daysUntil === 0 
                        ? 'Vence hoje' 
                        : `Em ${upcomingRenewals[0].daysUntil} dias (Dia ${upcomingRenewals[0].billingDay})`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-1">
                  Nenhuma assinatura ativa com renovação pendente.
                </div>
              )}

              {/* Apple-style Multi-Segment Distribution Bar */}
              {categoryBreakdown.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
                  <div className="h-2 w-full bg-slate-200/80 dark:bg-white/10 rounded-full overflow-hidden flex">
                    {categoryBreakdown.map(item => (
                      <div
                        key={item.category}
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                        className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                        title={`${item.category}: ${formatCurrency(item.amount)}/mês (${item.percentage.toFixed(0)}%)`}
                      />
                    ))}
                  </div>

                  {/* Legend Chips */}
                  <div className="flex items-center gap-3 overflow-x-auto scrollbar-none text-[11px] text-slate-500 dark:text-slate-400">
                    {categoryBreakdown.slice(0, 4).map(item => (
                      <div key={item.category} className="flex items-center gap-1.5 shrink-0">
                        <span 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: item.color }} 
                        />
                        <span className="capitalize font-medium">{item.category}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                          {item.percentage.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Apple App Store Quick Presets Carousel (if unadded) */}
          {unaddedPresets.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-emerald-500" />
                  Serviços sugeridos para adicionar com 1 toque:
                </span>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                {unaddedPresets.slice(0, 9).map(preset => (
                  <button
                    key={preset.serviceKey}
                    type="button"
                    onClick={() => onQuickAddPreset(preset)}
                    className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-50/90 hover:bg-slate-100/90 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200/70 dark:border-white/[0.07] text-left shrink-0 transition-all cursor-pointer active:scale-95 group select-none"
                    title={`Adicionar ${preset.name} por ${formatCurrency(preset.defaultAmount)}/mês`}
                  >
                    <SubscriptionLogo serviceKey={preset.serviceKey} name={preset.name} size={28} />
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {preset.name}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                        {formatCurrency(preset.defaultAmount)}/mês
                      </span>
                    </div>
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 ml-1">
                      +
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 2. Apple Controls Bar: Search, Status Segments & View Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Search Bar with clean Apple glass styling */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar assinaturas, categorias..."
            className="w-full pl-9 pr-8 py-2 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Right side controls: Status segmented pills & Grid/List switch */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          
          {/* iOS Segmented Control */}
          <div className="flex rounded-full bg-slate-200/70 dark:bg-white/[0.08] p-1 shrink-0">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                filterStatus === 'all'
                  ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todas ({subscriptions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                filterStatus === 'active'
                  ? 'bg-white dark:bg-[#1C1C1E] text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Ativas ({activeSubs.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('paused')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                filterStatus === 'paused'
                  ? 'bg-white dark:bg-[#1C1C1E] text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pausadas ({pausedSubs.length})
            </button>
          </div>

          {/* View Mode Toggle (Grid vs List) */}
          <div className="flex rounded-full bg-slate-200/70 dark:bg-white/[0.08] p-1 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-full text-xs transition-all cursor-pointer select-none ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#1C1C1E] text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              title="Visualização em Cartões"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-full text-xs transition-all cursor-pointer select-none ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#1C1C1E] text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              title="Visualização em Lista iOS"
            >
              <ListIcon size={15} />
            </button>
          </div>

        </div>
      </div>

      {/* 3. Category Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_TABS.map(tab => {
          const isSelected = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none ${
                isSelected
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-[#1C1C1E] text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-white/10 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. Main Subscriptions Content (Grid or List View) */}
      {filteredSubscriptions.length === 0 ? (
        <div className="rounded-3xl p-10 sm:p-14 text-center bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Search size={22} className="stroke-[2]" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Nenhuma assinatura encontrada
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `Nenhum resultado para "${searchQuery}". Tente outro termo ou ajuste os filtros.`
              : 'Nenhuma assinatura cadastrada para esta categoria ou status.'}
          </p>
          <button
            type="button"
            onClick={onOpenAddSubscription}
            className="mt-4 px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm hover:bg-emerald-700 transition-all cursor-pointer"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>Cadastrar Assinatura</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        
        /* Grid Mode: Apple Wallet Style Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubscriptions.map((sub) => {
            const cardObj = cards.find(c => c.id === sub.cardId);
            const personObj = people.find(p => p.id === sub.personId);

            return (
              <div
                key={sub.id}
                className={`relative rounded-3xl p-5 bg-white dark:bg-[#1C1C1E] border transition-all duration-200 flex flex-col justify-between ${
                  sub.active
                    ? 'border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_15px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.3)] hover:shadow-md hover:border-slate-300 dark:hover:border-white/20'
                    : 'border-black/[0.04] dark:border-white/[0.04] opacity-70 bg-slate-50/50 dark:bg-white/[0.01]'
                }`}
              >
                <div>
                  {/* Top: Squircle Logo, Title, Category and Apple Status Switch */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <SubscriptionLogo
                        serviceKey={sub.serviceKey}
                        category={sub.category}
                        name={sub.name}
                        size={46}
                        className={!sub.active ? 'grayscale opacity-75' : ''}
                      />
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {sub.name}
                        </h3>
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider capitalize block">
                          {sub.category}
                        </span>
                      </div>
                    </div>

                    {/* Apple Status Capsule */}
                    <button
                      type="button"
                      onClick={() => onToggleSubscriptionActive(sub.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 select-none ${
                        sub.active
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                      }`}
                      title={sub.active ? 'Pausar assinatura' : 'Reativar assinatura'}
                    >
                      {sub.active ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Ativa</span>
                        </>
                      ) : (
                        <>
                          <Pause size={10} />
                          <span>Pausada</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Clean Price & Renewal Pill */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.04] flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                        Valor
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                          {formatCurrency(sub.amount)}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          /{sub.billingCycle}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                        Cobrança
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5 block">
                        Todo dia {sub.billingDay}
                      </span>
                    </div>
                  </div>

                  {/* Card & Member Tags */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {cardObj && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <BankLogo bankName={cardObj.bank || cardObj.name} size={18} />
                        <span className="truncate">Cartão: <strong>{cardObj.name}</strong></span>
                      </div>
                    )}
                    {personObj && !personObj.isSelf && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <div className={`w-4 h-4 rounded-full ${personObj.avatarBg} text-white font-bold text-[9px] flex items-center justify-center`}>
                          {personObj.name.charAt(0)}
                        </div>
                        <span className="truncate">Responsável: <strong>{personObj.name}</strong></span>
                      </div>
                    )}
                    {sub.notes && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 italic truncate mt-1">
                        "{sub.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Controls: Clean Apple Style */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {sub.autoRenew !== false ? 'Renovação automática' : 'Cobrança manual'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditSubscription(sub)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Editar assinatura"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSubscription(sub.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Excluir assinatura"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (

        /* List Mode: iOS Settings Grouped Inset List */
        <div className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_15px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.3)] divide-y divide-slate-100 dark:divide-white/[0.06] overflow-hidden">
          {filteredSubscriptions.map((sub) => {
            const cardObj = cards.find(c => c.id === sub.cardId);
            const personObj = people.find(p => p.id === sub.personId);

            return (
              <div
                key={sub.id}
                className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
              >
                {/* Left: Logo & Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <SubscriptionLogo
                    serviceKey={sub.serviceKey}
                    category={sub.category}
                    name={sub.name}
                    size={40}
                    className={!sub.active ? 'grayscale opacity-70' : ''}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {sub.name}
                      </h4>
                      {!sub.active && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600">
                          Pausada
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="capitalize">{sub.category}</span>
                      <span>•</span>
                      <span>Dia {sub.billingDay}</span>
                      {cardObj && (
                        <>
                          <span>•</span>
                          <span className="truncate">{cardObj.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Price & Quick Action Buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-12 sm:pl-0">
                  <div className="text-left sm:text-right">
                    <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums block">
                      {formatCurrency(sub.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      /{sub.billingCycle}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onToggleSubscriptionActive(sub.id)}
                      className={`p-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                        sub.active
                          ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                      }`}
                      title={sub.active ? 'Pausar' : 'Reativar'}
                    >
                      {sub.active ? <Pause size={14} /> : <Play size={14} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditSubscription(sub)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteSubscription(sub.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
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
