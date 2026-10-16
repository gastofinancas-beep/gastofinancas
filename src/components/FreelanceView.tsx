import React, { useState, useMemo } from 'react';
import { 
  Briefcase, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Target, 
  Calendar, 
  Wallet, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  User, 
  ShoppingBag,
  Percent,
  Layers,
  ChevronRight,
  Info,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { 
  FreelanceEntry, 
  FreelanceExpense, 
  FreelanceGoals, 
  WalletAccount,
  FreelanceCategory,
  FreelanceExpenseCategory
} from '../types';
import { 
  FREELANCE_CATEGORY_CONFIG, 
  FREELANCE_EXPENSE_CATEGORY_CONFIG 
} from '../data/initialFreelanceData';
import { SimpleDayClosingModal } from './SimpleDayClosingModal';
import { formatCurrency } from '../utils/financeCalculations';
import { todayLocalISO, currentMonthLocal, toLocalISODate } from '../utils/dateUtils';

interface FreelanceViewProps {
  entries: FreelanceEntry[];
  expenses: FreelanceExpense[];
  goals: FreelanceGoals;
  accounts: WalletAccount[];
  currentMonth: string;
  activityLabel?: string;
  onChangeActivity?: () => void;
  onMonthChange?: (month: string) => void;
  onOpenAddEntry: () => void;
  onOpenEditEntry: (entry: FreelanceEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onOpenAddExpense: () => void;
  onOpenEditExpense: (expense: FreelanceExpense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onOpenGoalsModal?: () => void;
  onOpenGoals?: () => void;
  onSaveShift?: (
    entries: Omit<FreelanceEntry, 'id'>[],
    expenses: Omit<FreelanceExpense, 'id'>[]
  ) => void;
  onNavigateToWallet?: () => void;
}

type PeriodFilter = 'mes' | 'hoje' | 'semana' | 'todos';
type TypeFilter = 'todos' | 'entradas' | 'despesas';

export function FreelanceView({
  entries = [],
  expenses = [],
  goals,
  accounts = [],
  currentMonth,
  activityLabel,
  onChangeActivity,
  onMonthChange,
  onOpenAddEntry,
  onOpenEditEntry,
  onDeleteEntry,
  onOpenAddExpense,
  onOpenEditExpense,
  onDeleteExpense,
  onOpenGoalsModal,
  onOpenGoals,
  onSaveShift,
  onNavigateToWallet
}: FreelanceViewProps) {
  const handleOpenGoals = onOpenGoalsModal || onOpenGoals || (() => {});
  const [isQuickClosingOpen, setIsQuickClosingOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [period, setPeriod] = useState<PeriodFilter>('mes');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');

  const realCurrentMonth = useMemo(() => currentMonthLocal(), []);
  const isCurrentMonth = currentMonth === realCurrentMonth;

  // Today metrics (calculated strictly for today's date)
  const todayStr = useMemo(() => todayLocalISO(), []);

  const todayEntries = useMemo(() => entries.filter(e => e.date === todayStr), [entries, todayStr]);
  const todayExpenses = useMemo(() => expenses.filter(e => e.date === todayStr), [expenses, todayStr]);

  const todayGross = useMemo(() => todayEntries.reduce((sum, e) => sum + e.amount, 0), [todayEntries]);
  const todayExpenseSum = useMemo(() => todayExpenses.reduce((sum, e) => sum + e.amount, 0), [todayExpenses]);
  const todayNet = todayGross - todayExpenseSum;

  // Month navigation
  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    onMonthChange?.(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    if (isCurrentMonth) return;
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    const nextMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (nextMonth <= realCurrentMonth) {
      onMonthChange?.(nextMonth);
    }
  };

  const monthLabel = useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [currentMonth]);

  // Date filters for list
  const sevenDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return toLocalISODate(d);
  }, []);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      // Period filter
      if (period === 'hoje' && e.date !== todayStr) return false;
      if (period === 'semana' && (e.date < sevenDaysAgoStr || e.date > todayStr)) return false;
      if (period === 'mes' && !e.date.startsWith(currentMonth)) return false;

      // Category filter
      if (selectedCategory !== 'todas' && e.category !== selectedCategory) return false;

      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = e.title.toLowerCase().includes(term);
        const matchesClient = e.clientName?.toLowerCase().includes(term);
        const matchesNotes = e.notes?.toLowerCase().includes(term);
        if (!matchesTitle && !matchesClient && !matchesNotes) return false;
      }

      return true;
    });
  }, [entries, period, todayStr, sevenDaysAgoStr, currentMonth, selectedCategory, searchTerm]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      // Period filter
      if (period === 'hoje' && e.date !== todayStr) return false;
      if (period === 'semana' && (e.date < sevenDaysAgoStr || e.date > todayStr)) return false;
      if (period === 'mes' && !e.date.startsWith(currentMonth)) return false;

      // Category filter
      if (selectedCategory !== 'todas' && e.category !== selectedCategory) return false;

      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesDesc = e.description.toLowerCase().includes(term);
        const matchesNotes = e.notes?.toLowerCase().includes(term);
        if (!matchesDesc && !matchesNotes) return false;
      }

      return true;
    });
  }, [expenses, period, todayStr, sevenDaysAgoStr, currentMonth, selectedCategory, searchTerm]);

  // Combined and sorted timeline
  type TimelineItem = 
    | { itemType: 'entry'; data: FreelanceEntry; date: string; time?: string }
    | { itemType: 'expense'; data: FreelanceExpense; date: string; time?: string };

  const combinedTimeline = useMemo(() => {
    const list: TimelineItem[] = [];

    if (typeFilter === 'todos' || typeFilter === 'entradas') {
      filteredEntries.forEach(e => list.push({ itemType: 'entry', data: e, date: e.date, time: e.time }));
    }

    if (typeFilter === 'todos' || typeFilter === 'despesas') {
      filteredExpenses.forEach(e => list.push({ itemType: 'expense', data: e, date: e.date, time: e.time }));
    }

    return list.sort((a, b) => {
      const dateA = `${a.date} ${a.time || '00:00'}`;
      const dateB = `${b.date} ${b.time || '00:00'}`;
      return dateB.localeCompare(dateA);
    });
  }, [filteredEntries, filteredExpenses, typeFilter]);

  // Key Financial KPIs
  const totalGrossIncome = useMemo(() => {
    return filteredEntries.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredEntries]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const netProfit = totalGrossIncome - totalExpenses;
  const profitMargin = totalGrossIncome > 0 ? ((netProfit / totalGrossIncome) * 100) : 0;

  // Monthly Goal Progress
  const goalTarget = goals?.monthlyIncomeGoal || 2000;
  const goalProgressPercent = Math.min(100, Math.max(0, (netProfit / goalTarget) * 100));

  // Chart Data preparation
  const chartData = useMemo(() => {
    const dateMap: Record<string, { date: string; displayDate: string; income: number; expense: number; profit: number }> = {};

    // Group entries
    filteredEntries.forEach(e => {
      if (!dateMap[e.date]) {
        const [y, m, d] = e.date.split('-');
        dateMap[e.date] = { date: e.date, displayDate: `${d}/${m}`, income: 0, expense: 0, profit: 0 };
      }
      dateMap[e.date].income += e.amount;
    });

    // Group expenses
    filteredExpenses.forEach(e => {
      if (!dateMap[e.date]) {
        const [y, m, d] = e.date.split('-');
        dateMap[e.date] = { date: e.date, displayDate: `${d}/${m}`, income: 0, expense: 0, profit: 0 };
      }
      dateMap[e.date].expense += e.amount;
    });

    const sorted = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map(item => ({
      ...item,
      profit: item.income - item.expense,
    }));
  }, [filteredEntries, filteredExpenses]);

  const displayTitle = activityLabel || "Freelancer";

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 max-w-7xl mx-auto">
      
      {/* 1. Simple Header */}
      <div className="flex items-center justify-between gap-3 px-1 pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Briefcase size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {displayTitle}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gestão de faturamento, despesas e lucro líquido
            </p>
          </div>
        </div>

        {onChangeActivity && (
          <button
            type="button"
            onClick={onChangeActivity}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Trocar atividade</span>
          </button>
        )}
      </div>

      {/* 2. Today Card with 3 numbers and 2 big action buttons */}
      <div className="bg-white dark:bg-[#1C1C1E] p-5 sm:p-6 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-sm space-y-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100-400">
            Resumo de Hoje
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
          </span>
        </div>

        {/* 3 Metrics side by side */}
        <div className="grid grid-cols-3 gap-2 text-center py-1">
          <div className="p-2.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 block mb-0.5">
              Ganhos
            </span>
            <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{formatCurrency(todayGross)}
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400 block mb-0.5">
              Gastos
            </span>
            <span className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              -{formatCurrency(todayExpenseSum)}
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex flex-col justify-center">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Líquido
            </span>
            <span className={`text-2xl sm:text-3xl font-bold tabular-nums ${todayNet >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(todayNet)}
            </span>
          </div>
        </div>

        {/* 2 Big Action Buttons (min-h 52px) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onOpenAddEntry}
            className="w-full min-h-[50px] py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
          >
            <ArrowUpRight size={18} className="stroke-[2.5]" />
            <span>Registrar ganho</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddExpense}
            className="w-full min-h-[50px] py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
          >
            <ArrowDownRight size={18} className="stroke-[2.5]" />
            <span>Registrar gasto</span>
          </button>
        </div>

        {/* Quick Fechamento do Dia action */}
        <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsQuickClosingOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-500/20 active:scale-[0.99]"
          >
            <Zap size={15} className="fill-amber-500 text-amber-500" />
            <span>Fechamento Rápido do Dia (Quanto entrou e quanto gastou)</span>
          </button>
        </div>
      </div>

      {/* 3. Discrete Toggle for Monthly Details, KPIs, and Chart */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowDetails(prev => !prev)}
          className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-[#1C1C1E] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200/60 dark:border-white/10 shadow-2xs"
        >
          <span>{showDetails ? '▲ Ocultar detalhes do mês, meta e gráfico' : '▼ Ver detalhes do mês, meta e gráfico'}</span>
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4 overflow-hidden"
            >
              {/* Period & Month Selector Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#1C1C1E] p-3 sm:px-4 rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-2xs">
                
                {/* Period Pills */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/20 p-1 rounded-xl">
                  {(['mes', 'semana', 'hoje', 'todos'] as PeriodFilter[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer capitalize ${
                        period === p
                          ? 'bg-white dark:bg-[#2C2C2E] text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {p === 'mes' ? 'Este Mês' : p === 'semana' ? 'Últimos 7 dias' : p === 'hoje' ? 'Hoje' : 'Histórico Completo'}
                    </button>
                  ))}
                </div>

                {/* Month Navigator */}
                {period === 'mes' && (
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={15} className="text-emerald-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">
                        {monthLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        title="Mês anterior"
                      >
                        ← Anterior
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        disabled={isCurrentMonth}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          isCurrentMonth
                            ? 'text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-white/5 cursor-not-allowed opacity-50'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer'
                        }`}
                        title={isCurrentMonth ? 'Não é possível avançar' : 'Próximo mês'}
                      >
                        Próximo →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                
                {/* Total Gross Income */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                    <span className="text-xs font-semibold">Total Recebido (Bruto)</span>
                    <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <ArrowUpRight size={15} />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                    +{formatCurrency(totalGrossIncome)}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {filteredEntries.length} {filteredEntries.length === 1 ? 'projeto / serviço' : 'projetos / serviços'}
                  </p>
                </div>

                {/* Total Expenses */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                    <span className="text-xs font-semibold">Despesas Operacionais</span>
                    <div className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                      <ArrowDownRight size={15} />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 tracking-tight">
                    -{formatCurrency(totalExpenses)}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {filteredExpenses.length} {filteredExpenses.length === 1 ? 'gasto operacional' : 'gastos operacionais'}
                  </p>
                </div>

                {/* Net Profit */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-2xs relative overflow-hidden">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                    <span className="text-xs font-semibold">Lucro Líquido Real</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {profitMargin.toFixed(0)}% margem
                    </span>
                  </div>
                  <p className={`text-xl sm:text-2xl font-bold tracking-tight ${
                    netProfit >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {formatCurrency(netProfit)}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>Sobra limpa no bolso</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Na Carteira</span>
                  </div>
                </div>

                {/* Monthly Goal Progress */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                      <span className="text-xs font-semibold">Meta de Faturamento</span>
                      <button 
                        type="button" 
                        onClick={handleOpenGoals}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Editar
                      </button>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        {goalProgressPercent.toFixed(0)}%
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        Meta: {formatCurrency(goalTarget)}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-black/40 h-2 rounded-full overflow-hidden mt-2">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${goalProgressPercent}%` }}
                    />
                  </div>
                </div>

              </div>

              {/* Chart Section */}
              {chartData.length > 0 && (
                <div className="p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp size={16} className="text-emerald-500" />
                      Evolução: Entradas, Gastos e Lucro
                    </h2>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Entradas
                      </span>
                      <span className="flex items-center gap-1 text-rose-500 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span> Despesas
                      </span>
                    </div>
                  </div>

                  <div className="h-48 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.15)" />
                        <XAxis dataKey="displayDate" stroke="#888888" fontSize={11} tickLine={false} />
                        <YAxis stroke="#888888" fontSize={11} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                        <Tooltip 
                          formatter={(value: any) => [formatCurrency(Number(value)), '']}
                          contentStyle={{ 
                            backgroundColor: '#1C1C1E', 
                            borderColor: 'rgba(255,255,255,0.1)', 
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px'
                          }}
                        />
                        <Area type="monotone" dataKey="income" name="Entrada" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                        <Area type="monotone" dataKey="expense" name="Despesa" stroke="#F43F5E" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Movements & Projects List */}
      <div className="space-y-4">
        
        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/20 p-1 rounded-2xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setTypeFilter('todos')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === 'todos'
                  ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos ({filteredEntries.length + filteredExpenses.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('entradas')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                typeFilter === 'entradas'
                  ? 'bg-white dark:bg-[#2C2C2E] text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight size={13} />
              <span>Entradas ({filteredEntries.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('despesas')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                typeFilter === 'despesas'
                  ? 'bg-white dark:bg-[#2C2C2E] text-rose-600 dark:text-rose-400 shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownRight size={13} />
              <span>Despesas ({filteredExpenses.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por projeto, cliente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Timeline Items */}
        {combinedTimeline.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] space-y-3">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Briefcase size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Nenhuma movimentação de freelance neste período
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Cadastre suas receitas de projetos ou gastos operacionais. Tudo o que você registrar atualizará automaticamente o saldo da sua carteira.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={onOpenAddEntry}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                + Cadastrar Entrada
              </button>
              <button
                type="button"
                onClick={onOpenAddExpense}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                - Cadastrar Despesa
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {combinedTimeline.map((item, idx) => {
              if (item.itemType === 'entry') {
                const entry = item.data;
                const catConfig = FREELANCE_CATEGORY_CONFIG[entry.category] || FREELANCE_CATEGORY_CONFIG.outros;
                const account = accounts.find(a => a.id === entry.accountId);

                return (
                  <motion.div
                    key={`entry-${entry.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-2xs hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Left details */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold mt-0.5">
                        <ArrowUpRight size={20} />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {entry.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catConfig.bg}`}>
                            {catConfig.label}
                          </span>
                          {entry.clientName && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-normal text-slate-500 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                              <User size={10} />
                              {entry.clientName}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span>{entry.date.split('-').reverse().join('/')} {entry.time && `às ${entry.time}`}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <Wallet size={12} />
                            {account ? account.name : 'Conta vinculada'} (Creditado)
                          </span>
                          {entry.notes && (
                            <>
                              <span>•</span>
                              <span className="truncate italic max-w-xs">{entry.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Value & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/[0.05]">
                      <div className="text-right">
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                          +{formatCurrency(entry.amount)}
                        </span>
                        <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-semibold">
                          Entrada / Receita
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenEditEntry(entry)}
                          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                          title="Editar entrada"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteEntry(entry.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                          title="Excluir entrada"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              }

              // Expense item
              const expense = item.data;
              const expCatConfig = FREELANCE_EXPENSE_CATEGORY_CONFIG[expense.category] || FREELANCE_EXPENSE_CATEGORY_CONFIG.outros;
              const account = accounts.find(a => a.id === expense.accountId);
              const linkedEntry = expense.freelanceEntryId ? entries.find(e => e.id === expense.freelanceEntryId) : null;

              return (
                <motion.div
                  key={`expense-${expense.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-2xs hover:border-rose-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left details */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 font-bold mt-0.5">
                      <ArrowDownRight size={20} />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {expense.description}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          {expCatConfig.label}
                        </span>
                        {linkedEntry && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-normal text-slate-500 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <Briefcase size={10} />
                            Projeto: {linkedEntry.title}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{expense.date.split('-').reverse().join('/')} {expense.time && `às ${expense.time}`}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                          <Wallet size={12} />
                          {account ? account.name : 'Conta vinculada'} (Debitado)
                        </span>
                        {expense.notes && (
                          <>
                            <span>•</span>
                            <span className="truncate italic max-w-xs">{expense.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Value & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/[0.05]">
                    <div className="text-right">
                      <span className="text-base font-bold text-rose-600 dark:text-rose-400 tracking-tight">
                        -{formatCurrency(expense.amount)}
                      </span>
                      <p className="text-[10px] text-rose-600/70 dark:text-rose-400/70 font-semibold">
                        Gasto Operacional
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenEditExpense(expense)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                        title="Editar despesa"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(expense.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                        title="Excluir despesa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Day Closing Modal */}
      <SimpleDayClosingModal
        isOpen={isQuickClosingOpen}
        onClose={() => setIsQuickClosingOpen(false)}
        accounts={accounts}
        title="Fechamento Rápido do Dia"
        subtitle="Informe o que entrou e o que gastou hoje para fechar o dia"
        incomeLabel="Quanto entrou hoje (Trabalhos/Serviços)"
        expenseLabel="Quanto gastou hoje (Despesas/Custos)"
        defaultIncomeCategory="Faturamento do Dia"
        defaultExpenseCategory="Despesas Operacionais do Dia"
        onSave={({ income, expense, incomeDescription, expenseDescription, date, accountId }) => {
          const entriesToSave: Omit<FreelanceEntry, 'id'>[] = [];
          const expensesToSave: Omit<FreelanceExpense, 'id'>[] = [];

          if (income > 0) {
            entriesToSave.push({
              title: incomeDescription,
              category: 'outros',
              amount: income,
              date,
              time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              status: 'recebido',
              accountId,
              notes: 'Fechamento rápido do dia',
              syncToIncome: true,
            });
          }

          if (expense > 0) {
            expensesToSave.push({
              description: expenseDescription,
              category: 'outros',
              amount: expense,
              date,
              time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              accountId,
              notes: 'Despesa lançada no fechamento rápido do dia',
            });
          }

          if (onSaveShift) {
            onSaveShift(entriesToSave, expensesToSave);
          }
        }}
      />

    </div>
  );
}
