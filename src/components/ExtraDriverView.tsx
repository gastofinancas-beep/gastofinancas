import React, { useState, useMemo, useEffect } from 'react';
import { 
  Car, 
  Plus, 
  Fuel, 
  Target, 
  CalendarCheck,
  Layers, 
  Clock, 
  Calendar, 
  Trash2, 
  Edit2, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2,
  TrendingUp, 
  SlidersHorizontal,
  Wallet,
  Sparkles,
  ChevronRight,
  Receipt,
  Percent,
  X,
  RefreshCw,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedCurrency } from './AnimatedCounter';
import { 
  DriverTrip, 
  DriverExpense, 
  DriverGoals, 
  DriverAppType, 
  ExtraProfileConfig,
  WalletAccount,
  UberConfig,
  UberSyncResult
} from '../types';
import { APP_CONFIGS } from '../data/initialDriverData';
import { DriverAppLogo } from './DriverAppLogo';
import { CarSunsetIllustration } from './CarSunsetIllustration';
import { AddDriverTripModal } from './AddDriverTripModal';
import { AddDriverExpenseModal } from './AddDriverExpenseModal';
import { DriverGoalsModal } from './DriverGoalsModal';
import { DriverDaySummaryModal } from './DriverDaySummaryModal';
import { DriverDayShiftModal } from './DriverDayShiftModal';
import { formatCurrency } from '../utils/financeCalculations';
import { triggerHaptic } from '../utils/haptics';
import { todayLocalISO, toLocalISODate, parseLocalISO } from '../utils/dateUtils';

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

interface ExtraDriverViewProps {
  trips: DriverTrip[];
  expenses: DriverExpense[];
  goals: DriverGoals;
  config: ExtraProfileConfig;
  accounts: WalletAccount[];
  currentMonth: string;
  onOpenSetup: () => void;
  onAddTrip: (tripData: Omit<DriverTrip, 'id'>, editId?: string) => void;
  onDeleteTrip: (tripId: string) => void;
  onAddExpense: (expenseData: Omit<DriverExpense, 'id'>, editId?: string) => void;
  onDeleteExpense: (expenseId: string) => void;
  onSaveGoals: (newGoals: DriverGoals) => void;
  onSaveShift: (
    trips: Omit<DriverTrip, 'id' | 'createdAt'>[],
    expenses: Omit<DriverExpense, 'id' | 'createdAt'>[]
  ) => void;
  userEmail?: string;
  onNavigateToWallet?: () => void;
}

type PeriodFilter = 'hoje' | 'semana' | 'mes' | 'todos';

export function ExtraDriverView({
  trips,
  expenses,
  goals,
  config,
  accounts,
  currentMonth,
  userEmail,
  onOpenSetup,
  onAddTrip,
  onDeleteTrip,
  onAddExpense,
  onDeleteExpense,
  onSaveGoals,
  onSaveShift,
  onNavigateToWallet
}: ExtraDriverViewProps) {
  const [period, setPeriod] = useState<PeriodFilter>('hoje');
  const [selectedAppFilter, setSelectedAppFilter] = useState<string>('todos');
  const [activeSectionView, setActiveSectionView] = useState<'feed' | 'por_app' | 'fechamento_dia'>('feed');

  // Modals state
  const [isDayShiftOpen, setIsDayShiftOpen] = useState(false);
  const [isAddTripOpen, setIsAddTripOpen] = useState(false);
  const [selectedDefaultApp, setSelectedDefaultApp] = useState<DriverAppType>('uber');
  const [editingTrip, setEditingTrip] = useState<DriverTrip | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<DriverExpense | null>(null);
  const [isGoalsOpen, setIsGoalsOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Helper dates
  const todayStr = useMemo(() => todayLocalISO(), []);
  
  const sevenDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return toLocalISODate(d);
  }, []);

  // Filtered trips by period and app
  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      let matchesPeriod = true;
      if (period === 'hoje') matchesPeriod = t.date === todayStr;
      else if (period === 'semana') matchesPeriod = t.date >= sevenDaysAgoStr;
      else if (period === 'mes') matchesPeriod = t.date.startsWith(currentMonth);

      let matchesApp = true;
      if (selectedAppFilter !== 'todos') {
        matchesApp = t.app === selectedAppFilter;
      }

      return matchesPeriod && matchesApp;
    }).sort((a, b) => {
      const dateDiff = parseLocalISO(b.date).getTime() - parseLocalISO(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (b.time || '').localeCompare(a.time || '');
    });
  }, [trips, period, selectedAppFilter, todayStr, sevenDaysAgoStr, currentMonth]);

  // Filtered expenses by period
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (period === 'hoje') return e.date === todayStr;
      if (period === 'semana') return e.date >= sevenDaysAgoStr;
      if (period === 'mes') return e.date.startsWith(currentMonth);
      return true;
    }).sort((a, b) => parseLocalISO(b.date).getTime() - parseLocalISO(a.date).getTime());
  }, [expenses, period, todayStr, sevenDaysAgoStr, currentMonth]);

  // Total Gross / Net
  const totalGrossEarnings = useMemo(() => {
    return filteredTrips.reduce((acc, t) => acc + (t.netAmount || t.grossAmount || 0), 0);
  }, [filteredTrips]);

  const totalExpensesAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  }, [filteredExpenses]);

  const netRealProfit = totalGrossEarnings - totalExpensesAmount;

  const totalKm = useMemo(() => {
    return filteredTrips.reduce((acc, t) => acc + (t.distanceKm || 0), 0);
  }, [filteredTrips]);

  // Platform Breakdown (Uber, 99, inDrive, etc.)
  const platformBreakdown = useMemo(() => {
    const map: Record<string, { total: number; count: number; name: string; color: string }> = {
      uber: { total: 0, count: 0, name: 'Uber', color: '#000000' },
      '99': { total: 0, count: 0, name: '99 App', color: '#F59E0B' },
      indrive: { total: 0, count: 0, name: 'inDrive', color: '#10B981' },
      particular: { total: 0, count: 0, name: 'Particular', color: '#2563EB' },
      outro: { total: 0, count: 0, name: 'Entregas / Outros', color: '#8B5CF6' }
    };

    // Calculate from current period trips
    trips.filter(t => {
      if (period === 'hoje') return t.date === todayStr;
      if (period === 'semana') return t.date >= sevenDaysAgoStr;
      if (period === 'mes') return t.date.startsWith(currentMonth);
      return true;
    }).forEach(t => {
      const appKey = t.app || 'outro';
      if (!map[appKey]) {
        map[appKey] = { total: 0, count: 0, name: appKey.toUpperCase(), color: '#64748B' };
      }
      map[appKey].total += (t.netAmount || t.grossAmount || 0);
      map[appKey].count += 1;
    });

    const totalAll = Object.values(map).reduce((acc, curr) => acc + curr.total, 0);

    return Object.entries(map).map(([key, val]) => ({
      app: key as DriverAppType,
      name: val.name,
      total: val.total,
      count: val.count,
      color: val.color,
      percentage: totalAll > 0 ? Math.round((val.total / totalAll) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  }, [trips, period, todayStr, sevenDaysAgoStr, currentMonth]);

  // Today shift summary calculation
  const todayTrips = useMemo(() => trips.filter(t => t.date === todayStr), [trips, todayStr]);
  const todayExpenses = useMemo(() => expenses.filter(e => e.date === todayStr), [expenses, todayStr]);
  const todayGross = todayTrips.reduce((acc, t) => acc + (t.netAmount || t.grossAmount || 0), 0);
  const todayExp = todayExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const todayNet = todayGross - todayExp;
  const todayKm = todayTrips.reduce((acc, t) => acc + (t.distanceKm || 0), 0);
  const todayDailyGoal = goals?.daily || 300;
  const todayGoalProgress = Math.min(100, Math.round((todayGross / (todayDailyGoal || 1)) * 100));

  // Combined timeline items for the clean feed (like the mockup)
  const feedItems = useMemo(() => {
    const items: Array<{
      id: string;
      type: 'trip' | 'expense';
      title: string;
      subtitle: string;
      amount: number;
      date: string;
      time?: string;
      app?: string;
      rawTrip?: DriverTrip;
      rawExpense?: DriverExpense;
    }> = [];

    filteredTrips.forEach(t => {
      const appName = APP_CONFIGS[t.app]?.name || t.app || 'Motorista';
      items.push({
        id: t.id,
        type: 'trip',
        title: `${appName} • ${t.notes || 'Corrida'}`,
        subtitle: t.distanceKm ? `${t.distanceKm} km • ${t.durationMinutes || 0} min` : 'Faturamento de Corrida',
        amount: t.netAmount || t.grossAmount || 0,
        date: t.date,
        time: t.time || '12:00',
        app: t.app,
        rawTrip: t
      });
    });

    filteredExpenses.forEach(e => {
      items.push({
        id: e.id,
        type: 'expense',
        title: e.description || 'Gasto do Carro',
        subtitle: e.category ? `Despesa: ${e.category}` : 'Despesa Automotiva',
        amount: -e.amount,
        date: e.date,
        time: '09:00',
        rawExpense: e
      });
    });

    return items.sort((a, b) => {
      const dateDiff = parseLocalISO(b.date).getTime() - parseLocalISO(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (b.time || '').localeCompare(a.time || '');
    });
  }, [filteredTrips, filteredExpenses]);

  return (
    <div className="w-full max-w-lg mx-auto pb-24 px-3 sm:px-4 select-none">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION MINIMALISTA & ELEGANTE (ESTILO MOCKUP) */}
      {/* ========================================================================= */}
      <div className="pt-2 pb-5 flex flex-col items-center text-center">
        
        {/* Ilustração Frontal do Carro com Pôr do Sol */}
        <CarSunsetIllustration className="my-1" />

        {/* Título Principal em Tipografia Display Forte */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
          Motorista App
        </h1>

        {/* Badge / Pílula de Faturamento Principal (Estilo $2,300 do Mockup) */}
        <motion.div 
          whileTap={{ scale: 0.96 }}
          onClick={() => triggerHaptic(6)}
          className="mt-3 inline-flex items-center justify-center px-6 py-2 rounded-2xl bg-[#FDEAE6] dark:bg-[#2C1D1A] border border-[#FAD2C9] dark:border-[#422924] shadow-xs cursor-pointer"
        >
          <span className="text-xl sm:text-2xl font-bold text-[#1C1917] dark:text-[#FFF] tracking-tight">
            <AnimatedCurrency value={totalGrossEarnings} />
          </span>
        </motion.div>

        {/* Seletor de Período Limpo (Hoje, Semana, Mês) */}
        <div className="flex items-center gap-1.5 mt-3 bg-slate-100 dark:bg-[#2C2C2E]/80 p-1 rounded-full border border-slate-200/60 dark:border-white/[0.10]/60 shadow-2xs">
          {(['hoje', 'semana', 'mes', 'todos'] as PeriodFilter[]).map((p) => {
            const isSelected = period === p;
            const labels: Record<PeriodFilter, string> = {
              hoje: 'Hoje',
              semana: 'Semana',
              mes: 'Mês',
              todos: 'Todos'
            };
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPeriod(p);
                  triggerHaptic(6);
                }}
                className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BARRA DE 5 AÇÕES RÁPIDAS (BOTOES ARREDONDADOS COM ÍCONE E LEGENDA) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3 my-3">
        
        {/* 1. Fechamento do Dia */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            setIsDayShiftOpen(true);
            triggerHaptic(8);
          }}
          className="flex flex-col items-center justify-center gap-1.5 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200/60 dark:border-white/[0.08] shadow-xs hover:border-emerald-500/30 dark:hover:border-white/[0.14] transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <CalendarCheck size={18} className="stroke-[2.3]" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">
            Fechamento
          </span>
        </motion.button>

        {/* 2. Quanto Faturou Por App */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            setActiveSectionView(activeSectionView === 'por_app' ? 'feed' : 'por_app');
            triggerHaptic(8);
          }}
          className={`flex flex-col items-center justify-center gap-1.5 p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer group ${
            activeSectionView === 'por_app'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-700 dark:text-amber-300'
              : 'bg-white dark:bg-[#18181B] border-slate-200/60 dark:border-white/[0.08] shadow-xs text-slate-700 dark:text-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Layers size={18} className="stroke-[2.3]" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold truncate w-full text-center">
            Por App
          </span>
        </motion.button>

        {/* 3. Nova Corrida Avulsa */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            setSelectedDefaultApp('uber');
            setEditingTrip(null);
            setIsAddTripOpen(true);
            triggerHaptic(8);
          }}
          className="flex flex-col items-center justify-center gap-1.5 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200/60 dark:border-white/[0.08] shadow-xs hover:border-emerald-500/30 dark:hover:border-white/[0.14] transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Plus size={18} className="stroke-[2.3]" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">
            Corrida
          </span>
        </motion.button>

        {/* 4. Despesa / Combustível */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            setEditingExpense(null);
            setIsAddExpenseOpen(true);
            triggerHaptic(8);
          }}
          className="flex flex-col items-center justify-center gap-1.5 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200/60 dark:border-white/[0.08] shadow-xs hover:border-emerald-500/30 dark:hover:border-white/[0.14] transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Fuel size={18} className="stroke-[2.3]" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">
            Gasto
          </span>
        </motion.button>

        {/* 5. Metas de Faturamento */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            setIsGoalsOpen(true);
            triggerHaptic(8);
          }}
          className="flex flex-col items-center justify-center gap-1.5 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200/60 dark:border-white/[0.08] shadow-xs hover:border-emerald-500/30 dark:hover:border-white/[0.14] transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Target size={18} className="stroke-[2.3]" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">
            Metas
          </span>
        </motion.button>

      </div>

      {/* ========================================================================= */}
      {/* 3. CARD DE FECHAMENTO DO DIA & QUANTO FATUROU EM CADA APP */}
      {/* ========================================================================= */}
      <div className="space-y-3.5 mt-4">
        
        {/* CARD PRINCIPAL: QUANTO FATUROU EM CADA APLICATIVO */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#151518] border border-slate-200/60 dark:border-white/[0.08]/90 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 flex items-center justify-center">
                <Layers size={15} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  Faturamento por Aplicativo
                </h3>
                <p className="text-[10px] text-slate-400">
                  Total de {platformBreakdown.filter(p => p.total > 0).length} apps ativos no período
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(totalGrossEarnings)}
            </span>
          </div>

          {/* Grid de Apps com Valores e Barras de Progresso */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {platformBreakdown.map((item) => {
              const isSelected = selectedAppFilter === item.app;
              return (
                <motion.div
                  key={item.app}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedAppFilter(selectedAppFilter === item.app ? 'todos' : item.app);
                    triggerHaptic(6);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 ring-1 ring-amber-500'
                      : 'border-slate-100 dark:border-white/[0.08]/80 bg-slate-50/60 dark:bg-[#1C1C1E]/50 hover:bg-slate-100/80 dark:hover:bg-white/[0.04]/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DriverAppLogo app={item.app} size="sm" className="rounded-md" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {item.count} {item.count === 1 ? 'corrida' : 'corridas'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(item.total)}
                      </p>
                      <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        {item.percentage}%
                      </p>
                    </div>
                  </div>

                  {/* Mini Barra de Progresso do App */}
                  <div className="w-full bg-slate-200/80 dark:bg-[#2C2C2E] h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: item.color || '#F59E0B'
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {selectedAppFilter !== 'todos' && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/[0.08]">
              <span className="text-[11px] text-slate-500">
                Filtrando apenas por: <strong>{selectedAppFilter.toUpperCase()}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedAppFilter('todos')}
                className="text-[11px] text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
              >
                Limpar filtro
              </button>
            </div>
          )}
        </div>

        {/* CARD RESUMO: FECHAMENTO DE HOJE & DESEMPENHO REAL */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#151518] border border-slate-200/60 dark:border-white/[0.08]/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                <CalendarCheck size={15} />
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                Resumo do Fechamento de Hoje
              </h3>
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsDayShiftOpen(true);
                triggerHaptic(8);
              }}
              className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Novo Fechamento</span>
              <ChevronRight size={13} />
            </motion.button>
          </div>

          {/* 3 Métricas Rápidas */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#1C1C1E]/60 border border-slate-100 dark:border-white/[0.08]/80">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Faturamento</p>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {formatCurrency(todayGross)}
              </p>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#1C1C1E]/60 border border-slate-100 dark:border-white/[0.08]/80">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Gastos/Gas</p>
              <p className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
                {formatCurrency(todayExp)}
              </p>
            </div>

            <div className="p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Líquido Real</p>
              <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-300 tabular-nums mt-0.5">
                {formatCurrency(todayNet)}
              </p>
            </div>
          </div>

          {/* Barra de Progresso da Meta Diária */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Meta Diária: <strong>{formatCurrency(todayDailyGoal)}</strong>
              </span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                {todayGoalProgress}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-[#2C2C2E] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${todayGoalProgress}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. FEED DE LANÇAMENTOS RECENTES (ESTILO EXATO DO MOCKUP ENVIADO) */}
      {/* ========================================================================= */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100-500 dark:text-slate-400">
            Histórico de Lançamentos
          </h2>
          <span className="text-[11px] font-bold text-slate-400">
            {feedItems.length} registros
          </span>
        </div>

        {feedItems.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-[#151518] border border-slate-200/60 dark:border-white/[0.08] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center mx-auto">
              <Car size={24} />
            </div>
            <p className="text-xs text-slate-500">Nenhum lançamento no período selecionado.</p>
            <button
              type="button"
              onClick={() => setIsDayShiftOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold shadow-xs hover:bg-orange-700 cursor-pointer"
            >
              <CalendarCheck size={14} />
              <span>Fazer Fechamento de Hoje</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {feedItems.map((item) => {
                const isTrip = item.type === 'trip';
                const formattedDate = formatDisplayDate(item.date);

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#151518] border border-slate-200/60 dark:border-white/[0.08]/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3 group"
                  >
                    {/* Lado Esquerdo: Ícone Redondo Pêssego + Informações */}
                    <div className="flex items-center gap-3 min-w-0">
                      
                      {/* Quadrado Pêssego / Coral Arredondado (Exato ao Mockup) */}
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#FDEAE6] dark:bg-[#2C1D1A] border border-[#FAD2C9] dark:border-[#422924] flex items-center justify-center shrink-0">
                        {isTrip ? (
                          item.app ? (
                            <DriverAppLogo app={item.app as DriverAppType} size="sm" className="rounded-xs" />
                          ) : (
                            <Car size={20} className="text-[#EA580C] dark:text-[#FB923C]" />
                          )
                        ) : (
                          <Fuel size={20} className="text-[#E11D48] dark:text-[#FB7185]" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </p>
                        <p className={`text-sm sm:text-base font-bold tabular-nums ${
                          item.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                        }`}>
                          {item.amount >= 0 ? `+${formatCurrency(item.amount)}` : `-${formatCurrency(Math.abs(item.amount))}`}
                        </p>
                        {isTrip && item.rawTrip?.grossAmount && item.rawTrip.feeAmount ? (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium pt-0.5">
                            Bruto: {formatCurrency(item.rawTrip.grossAmount)} • Taxa: -{formatCurrency(item.rawTrip.feeAmount)} ({item.rawTrip.feePercent || 25}%) {item.rawTrip.distanceKm ? `• ${item.rawTrip.distanceKm} km` : ''}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* Lado Direito: Data & Hora formatadas */}
                    <div className="flex flex-col items-end shrink-0">
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {formattedDate}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        às {item.time || '12:00'}
                      </p>

                      {/* Ações de exclusão no hover / toque */}
                      <div className="flex items-center gap-1.5 mt-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            if (isTrip && item.rawTrip) {
                              onDeleteTrip(item.rawTrip.id);
                            } else if (item.rawExpense) {
                              onDeleteExpense(item.rawExpense.id);
                            }
                            triggerHaptic(8);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAIS COMPLETOS DE FECHAMENTO, CORRIDA, DESPESAS E METAS */}
      {/* ========================================================================= */}
      
      {/* Modal de Fechamento do Dia por App */}
      <DriverDayShiftModal
        isOpen={isDayShiftOpen}
        onClose={() => setIsDayShiftOpen(false)}
        config={config}
        accounts={accounts}
        onSaveShift={(newTrips, newExpenses) => {
          onSaveShift(newTrips, newExpenses);
          setIsDayShiftOpen(false);
        }}
      />

      {/* Modal de Adicionar Corrida Avulsa */}
      <AddDriverTripModal
        isOpen={isAddTripOpen}
        onClose={() => {
          setIsAddTripOpen(false);
          setEditingTrip(null);
        }}
        defaultApp={selectedDefaultApp}
        editingTrip={editingTrip}
        accounts={accounts}
        onSaveTrip={(tripData: Omit<DriverTrip, 'id'>, editId?: string) => {
          onAddTrip(tripData, editId);
          setIsAddTripOpen(false);
          setEditingTrip(null);
        }}
      />

      {/* Modal de Despesa do Carro (Combustível, etc) */}
      <AddDriverExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
        }}
        editingExpense={editingExpense}
        accounts={accounts}
        onSaveExpense={(expData: Omit<DriverExpense, 'id'>, editId?: string) => {
          onAddExpense(expData, editId);
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
        }}
      />

      {/* Modal de Metas do Motorista */}
      <DriverGoalsModal
        isOpen={isGoalsOpen}
        onClose={() => setIsGoalsOpen(false)}
        goals={goals}
        onSaveGoals={(newG) => {
          onSaveGoals(newG);
          setIsGoalsOpen(false);
        }}
      />

    </div>
  );
}

export default ExtraDriverView;
