import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Edit3, 
  Trash2, 
  Sparkles, 
  AlertTriangle, 
  PiggyBank, 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  WalletCards,
  Percent,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Scale
} from 'lucide-react';
import { ExpenseItem, IncomeItem, CashFlowSummary } from '../types';
import { 
  formatCurrency, 
  formatMonthDisplay, 
  addMonths, 
  getActiveIncomesForMonth, 
  calculateCashFlowSummary 
} from '../utils/financeCalculations';
import { INCOME_CATEGORIES } from './AddIncomeModal';

interface CashFlowViewProps {
  incomes: IncomeItem[];
  expenses: ExpenseItem[];
  currentMonth: string;
  onSelectMonth: (month: string) => void;
  onOpenAddIncome: () => void;
  onEditIncome: (income: IncomeItem) => void;
  onDeleteIncome: (id: string) => void;
  onToggleIncomeReceived: (id: string) => void;
  onNavigateToTab: (tab: 'dashboard' | 'pessoas' | 'cartoes' | 'investimentos' | 'rendas') => void;
}

export function CashFlowView({
  incomes,
  expenses,
  currentMonth,
  onSelectMonth,
  onOpenAddIncome,
  onEditIncome,
  onDeleteIncome,
  onToggleIncomeReceived,
  onNavigateToTab,
}: CashFlowViewProps) {
  const [filterType, setFilterType] = useState<'all' | 'received' | 'pending'>('all');

  const handlePrevMonth = () => onSelectMonth(addMonths(currentMonth, -1));
  const handleNextMonth = () => onSelectMonth(addMonths(currentMonth, 1));

  // Active Incomes for current month
  const activeIncomes = useMemo(() => {
    return getActiveIncomesForMonth(incomes, currentMonth);
  }, [incomes, currentMonth]);

  // Cash Flow Summary
  const summary: CashFlowSummary = useMemo(() => {
    return calculateCashFlowSummary(incomes, expenses, currentMonth);
  }, [incomes, expenses, currentMonth]);

  // Filtered Incomes
  const filteredIncomes = useMemo(() => {
    if (filterType === 'received') {
      return activeIncomes.filter(i => i.received);
    }
    if (filterType === 'pending') {
      return activeIncomes.filter(i => !i.received);
    }
    return activeIncomes;
  }, [activeIncomes, filterType]);

  // Income by Category
  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    activeIncomes.forEach((inc) => {
      map[inc.category] = (map[inc.category] || 0) + inc.amount;
    });
    return Object.entries(map).map(([catId, amount]) => {
      const catConfig = INCOME_CATEGORIES.find(c => c.id === catId);
      return {
        id: catId,
        name: catConfig?.name || catId,
        amount,
        color: catConfig?.color || 'text-slate-500',
        badgeBg: catConfig?.badgeBg || 'bg-slate-100 text-slate-700',
        percentage: summary.totalIncome > 0 ? (amount / summary.totalIncome) * 100 : 0,
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [activeIncomes, summary.totalIncome]);

  // Expense to Income Ratio
  const expenseRatio = summary.totalIncome > 0 
    ? Math.min(100, (summary.totalExpense / summary.totalIncome) * 100) 
    : summary.totalExpense > 0 ? 100 : 0;

  const savingsRatio = summary.totalIncome > 0 && summary.netBalance > 0
    ? Math.min(100, (summary.netBalance / summary.totalIncome) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header with Month Navigator & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 shadow-2xs">
              <TrendingUp size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Entradas & Balanço Mensal
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Acompanhe o que você ganhou, o que gastou e o saldo final do mês
              </p>
            </div>
          </div>
        </div>

        {/* Month Selector & Add Income Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center bg-white dark:bg-[#1C1C1E] rounded-full border border-slate-200/80 dark:border-white/[0.08] shadow-2xs p-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[110px] text-center">
              {formatMonthDisplay(currentMonth)}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenAddIncome}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>Nova Entrada</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* UNIFIED iOS MASTER PANEL: Ganhos, Gastos e Saldo Líquido JUNTOS            */}
      {/* ========================================================================= */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/[0.08] shadow-[0_2px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] overflow-hidden"
      >
        {/* Subtle top status bar (Apple Widget style) */}
        <div className="px-5 py-2.5 bg-slate-50/70 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.05] flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              summary.status === 'positive' ? 'bg-emerald-500' : summary.status === 'negative' ? 'bg-rose-500' : 'bg-slate-400'
            }`} />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Balanço Geral Consolidado • {formatMonthDisplay(currentMonth)}
            </span>
          </div>
          <span className="text-[11px] font-medium">
            {summary.status === 'positive' ? 'Superávit no mês' : summary.status === 'negative' ? 'Déficit no mês' : 'Equilíbrio'}
          </span>
        </div>

        {/* 3 Unified Connected Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-white/[0.06]">
          
          {/* 1. Total de Entradas */}
          <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-slate-50/40 dark:hover:bg-white/[0.01] transition-colors relative group">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Total de Entradas
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/40 shadow-2xs">
                  <ArrowDownRight size={16} className="stroke-[2.5]" />
                </div>
              </div>

              <div className="text-2xl sm:text-[28px] font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">
                {formatCurrency(summary.totalIncome)}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300 text-[11px]">
                <CheckCircle2 size={13} className="text-emerald-500 stroke-[2.5]" />
                {formatCurrency(summary.totalIncomeReceived)} recebidos
              </span>
              {summary.totalIncomePending > 0 && (
                <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400 text-[11px]">
                  <Clock size={12} />
                  {formatCurrency(summary.totalIncomePending)} previstos
                </span>
              )}
            </div>
          </div>

          {/* 2. Total de Saídas / Gastos */}
          <div className="p-5 sm:p-6 flex flex-col justify-between hover:bg-slate-50/40 dark:hover:bg-white/[0.01] transition-colors relative group">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Total de Saídas / Gastos
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/50 dark:border-rose-800/40 shadow-2xs">
                  <ArrowUpRight size={16} className="stroke-[2.5]" />
                </div>
              </div>

              <div className="text-2xl sm:text-[28px] font-black text-rose-600 dark:text-rose-400 tracking-tight leading-none">
                {formatCurrency(summary.totalExpense)}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Cartões e despesas do mês</span>
              <button
                type="button"
                onClick={() => onNavigateToTab('cartoes')}
                className="text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                Ver faturas <ArrowRight size={11} />
              </button>
            </div>
          </div>

          {/* 3. Saldo Líquido do Mês */}
          <div className={`p-5 sm:p-6 flex flex-col justify-between relative transition-colors ${
            summary.status === 'positive'
              ? 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.07]'
              : summary.status === 'negative'
              ? 'bg-rose-500/[0.04] dark:bg-rose-500/[0.07]'
              : 'bg-slate-50/50 dark:bg-white/[0.02]'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Resultado / Saldo do Mês
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border tracking-tight ${
                  summary.status === 'positive'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : summary.status === 'negative'
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300'
                }`}>
                  {summary.status === 'positive' ? '✓ Ficou Positivo' : summary.status === 'negative' ? '⚠ Ficou Negativo' : 'Equilibrado'}
                </span>
              </div>

              <div className={`text-2xl sm:text-[28px] font-black tracking-tight leading-none ${
                summary.status === 'positive'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : summary.status === 'negative'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-900 dark:text-white'
              }`}>
                {summary.netBalance > 0 ? `+ ${formatCurrency(summary.netBalance)}` : formatCurrency(summary.netBalance)}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.04] text-[11px]">
              {summary.status === 'positive' ? (
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
                  <Sparkles size={13} className="text-emerald-500" />
                  <span>Sobrou {savingsRatio.toFixed(1)}% do que você ganhou!</span>
                </div>
              ) : summary.status === 'negative' ? (
                <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-semibold">
                  <AlertTriangle size={13} className="text-rose-500" />
                  <span>Gastou {formatCurrency(Math.abs(summary.netBalance))} a mais que o recebido.</span>
                </div>
              ) : (
                <div className="text-slate-500 dark:text-slate-400">
                  Ganhos e despesas rigorosamente equilibrados.
                </div>
              )}
            </div>
          </div>

        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* DISTRIBUTION OF INCOME & CASH FLOW PROPORTION (CLEAN APPLE BENTO CARD)     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Visual Cash Flow Distribution & Income Breakdown (2 cols) */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/[0.08] shadow-[0_2px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] flex flex-col justify-between space-y-5">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.05]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                <Scale size={16} className="stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Distribuição & Comprometimento da Renda
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Proporção de gastos com faturas versus sobra financeira no mês
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-xl">
              Renda: {formatCurrency(summary.totalIncome)}
            </span>
          </div>

          {summary.totalIncome > 0 ? (
            <div className="space-y-5">
              
              {/* Dual Metric Cards: Gastos vs Sobra */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Gastos Comprometidos */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Faturas & Gastos
                    </span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {expenseRatio.toFixed(1)}%
                    </span>
                  </div>

                  <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {formatCurrency(summary.totalExpense)}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden">
                    <div 
                      style={{ width: `${Math.min(100, expenseRatio)}%` }} 
                      className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                    />
                  </div>
                </div>

                {/* 2. Sobra Líquida Livre */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Sobra Líquida Livre
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {savingsRatio.toFixed(1)}%
                    </span>
                  </div>

                  <div className={`text-xl font-black tracking-tight ${
                    summary.netBalance > 0 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-slate-900 dark:text-white'
                  }`}>
                    {summary.netBalance > 0 ? `+ ${formatCurrency(summary.netBalance)}` : formatCurrency(summary.netBalance)}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden">
                    <div 
                      style={{ width: `${Math.min(100, savingsRatio)}%` }} 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    />
                  </div>
                </div>
              </div>

              {/* Origem das Rendas (Clean Minimalist Design - No colorful background fills) */}
              {incomeByCategory.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Origem das Rendas Cadastradas
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {incomeByCategory.length} {incomeByCategory.length === 1 ? 'fonte' : 'fontes'}
                    </span>
                  </div>

                  {/* Clean List Items / Bento Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {incomeByCategory.map((cat) => {
                      const catConfig = INCOME_CATEGORIES.find(c => c.id === cat.id);
                      const Icon = catConfig?.icon || DollarSign;
                      return (
                        <div 
                          key={cat.id} 
                          className="p-3 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] transition-all flex flex-col justify-between gap-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-white dark:bg-white/10 border border-slate-200/60 dark:border-white/10 flex items-center justify-center shrink-0 shadow-2xs text-slate-700 dark:text-slate-200">
                                <Icon size={13} />
                              </div>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                                {cat.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-white/10 border border-slate-200/60 dark:border-white/10 px-1.5 py-0.5 rounded-md shrink-0">
                              {cat.percentage.toFixed(0)}%
                            </span>
                          </div>

                          <div className="flex items-baseline justify-between pt-1 border-t border-slate-200/40 dark:border-white/[0.04]">
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              {formatCurrency(cat.amount)}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              da renda
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              <p>Nenhuma entrada cadastrada para este mês ainda.</p>
              <button
                type="button"
                onClick={onOpenAddIncome}
                className="mt-2 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                <Plus size={13} /> Cadastrar salário ou primeira renda
              </button>
            </div>
          )}
        </div>

        {/* Smart Advice / Financial Health Card (Apple Assistant Style) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/[0.08] shadow-[0_2px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-white/[0.05] mb-4">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                <Sparkles size={16} className="text-amber-500 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Assistente Financeiro
                </h2>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Análise inteligente do mês
                </span>
              </div>
            </div>

            {summary.status === 'positive' && summary.netBalance > 0 ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                    ✓ Superávit Financeiro
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                    Você economizou <strong className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(summary.netBalance)}</strong> ({savingsRatio.toFixed(0)}% da renda).
                  </p>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-1">
                  Direcione esta sobra para as suas <strong className="text-slate-700 dark:text-slate-200 font-semibold">Caixinhas de Investimento</strong> para multiplicar seu patrimônio.
                </p>
              </div>
            ) : summary.status === 'negative' ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-rose-200/60 dark:border-rose-900/30">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
                    ⚠ Déficit de Caixa
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                    Gastos excederam a renda em <strong className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(Math.abs(summary.netBalance))}</strong>.
                  </p>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-1">
                  Registre rendas extras ou renegocie compras parceladas para retornar ao positivo.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Cadastre suas rendas fixas e esporádicas para acompanhar a evolução do seu patrimônio em tempo real.
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTab('investimentos')}
            className="mt-5 w-full py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
          >
            <PiggyBank size={15} />
            <span>Alocar em Caixinhas</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DETAILED LIST OF INCOMES / GANHOS DO MÊS (APPLE FINANCIAL STATEMENT STYLE) */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/[0.08] shadow-[0_2px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] overflow-hidden">
        
        {/* Section Header with Segmented Filter Control & Total */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <WalletCards size={17} className="stroke-[2.5]" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Entradas & Rendas Registradas
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                {activeIncomes.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-10.5">
              Extrato detalhado de receitas, fontes de renda e status de recebimento
            </p>
          </div>

          {/* Controls: Segmented Filter & Nova Renda Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* iOS Segmented Filter Control */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-white/[0.06] rounded-2xl border border-slate-200/60 dark:border-white/[0.05]">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Todas ({activeIncomes.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('received')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterType === 'received'
                    ? 'bg-white dark:bg-[#2C2C2E] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Recebidas ({activeIncomes.filter(i => i.received).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterType === 'pending'
                    ? 'bg-white dark:bg-[#2C2C2E] text-amber-600 dark:text-amber-400 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Previstas ({activeIncomes.filter(i => !i.received).length})
              </button>
            </div>

            {/* Quick Add Button */}
            <button
              type="button"
              onClick={onOpenAddIncome}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 cursor-pointer shrink-0"
            >
              <Plus size={14} className="stroke-[2.5]" />
              <span>Nova Renda</span>
            </button>
          </div>
        </div>

        {/* Clean Apple Transaction List */}
        {filteredIncomes.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {filteredIncomes.map((inc) => {
              const catConfig = INCOME_CATEGORIES.find(c => c.id === inc.category) || INCOME_CATEGORIES[0];
              const Icon = catConfig.icon;

              return (
                <motion.div
                  key={inc.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 sm:px-6 sm:py-4.5 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 group"
                >
                  {/* Left: Category Icon + Description + Tags/Meta */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Squircle Icon */}
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/70 dark:border-white/[0.08] flex items-center justify-center shrink-0 shadow-2xs text-slate-700 dark:text-slate-200">
                      <Icon size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate tracking-tight">
                          {inc.description}
                        </h3>
                        
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10 shrink-0">
                          {inc.type === 'fixa' ? 'Recorrente' : 'Pontual'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {catConfig.name}
                        </span>
                        
                        {inc.date && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar size={11} className="text-slate-400" />
                              Dia {inc.date.split('-')[2]}/{inc.date.split('-')[1]}
                            </span>
                          </>
                        )}

                        {inc.notes && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="italic text-slate-400 dark:text-slate-500 truncate max-w-xs">
                              "{inc.notes}"
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Interactive Status Pill + Amount + Quick Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pl-14 sm:pl-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/[0.04]">
                    
                    {/* Status Pill Toggle */}
                    <button
                      type="button"
                      onClick={() => onToggleIncomeReceived(inc.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[11px] transition-all cursor-pointer active:scale-95 border shadow-2xs ${
                        inc.received
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300/70 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300/70 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                      }`}
                      title={inc.received ? 'Clique para marcar como pendente' : 'Clique para marcar como recebido'}
                    >
                      <CheckCircle2 size={12} className={inc.received ? 'text-emerald-600 dark:text-emerald-400 stroke-[2.5]' : 'text-amber-500'} />
                      <span>{inc.received ? 'Recebido' : 'Pendente'}</span>
                    </button>

                    {/* Amount in crisp green */}
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                        + {formatCurrency(inc.amount)}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-0.5 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => onEditIncome(inc)}
                        className="p-2 rounded-xl hover:bg-slate-200/70 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title="Editar entrada"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteIncome(inc.id)}
                        className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="Excluir entrada"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Clean Apple Empty State */
          <div className="p-8 sm:p-12 text-center">
            <div className="w-13 h-13 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3.5 shadow-2xs">
              <DollarSign size={24} className="stroke-[2.2]" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
              Nenhuma entrada encontrada neste filtro
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Cadastre seu salário, benefícios, receitas de freelas ou rendimentos para ter clareza total das suas finanças.
            </p>
            <button
              type="button"
              onClick={onOpenAddIncome}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
            >
              <Plus size={15} className="stroke-[2.5]" />
              <span>Adicionar Primeira Entrada</span>
            </button>
          </div>
        )}

        {/* List Footer Summary */}
        {filteredIncomes.length > 0 && (
          <div className="px-5 sm:px-6 py-3.5 bg-slate-50/70 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>
              Total exibido: {filteredIncomes.length} {filteredIncomes.length === 1 ? 'item' : 'itens'}
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Soma: <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm ml-1">+ {formatCurrency(filteredIncomes.reduce((acc, curr) => acc + curr.amount, 0))}</span>
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
