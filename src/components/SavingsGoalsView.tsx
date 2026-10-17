import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  PiggyBank, 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Star, 
  Plus, 
  Pencil, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  X, 
  DollarSign, 
  ShieldCheck, 
  HelpCircle,
  Car,
  Plane,
  Home,
  Laptop,
  GraduationCap,
  Heart,
  ArrowRight
} from 'lucide-react';
import { 
  MonthlySavingsTarget, 
  AccumulationGoal, 
  GoalCategory,
  MonthSummary, 
  IncomeItem, 
  ExpenseItem 
} from '../types';
import { currentMonthLocal } from '../utils/dateUtils';
import { 
  formatCurrency, 
  formatMonthDisplay, 
  formatMonthShort, 
  addMonths,
  getMonthDiff,
  getActiveIncomesForMonth
} from '../utils/financeCalculations';
import { AnimatedCounter } from './AnimatedCounter';
import { TravelSimulatorModal } from './TravelSimulatorModal';
import { AddGoalModal } from './AddGoalModal';

interface SavingsGoalsViewProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  summary: MonthSummary;
  incomes?: IncomeItem[];
  expenses?: ExpenseItem[];
  monthlyTargets: Record<string, MonthlySavingsTarget>;
  onSaveMonthlyTarget: (target: MonthlySavingsTarget) => void;
  onDeleteMonthlyTarget: (month: string) => void;
  accumulationGoals: AccumulationGoal[];
  onSaveAccumulationGoal: (goal: AccumulationGoal) => void;
  onDeleteAccumulationGoal: (id: string) => void;
  isBalanceVisible?: boolean;
}

const GOAL_CATEGORY_ICONS: Record<string, { icon: React.ElementType; label: string }> = {
  reserva: { icon: ShieldCheck, label: 'Reserva de Emergência' },
  viagem: { icon: Plane, label: 'Viagem & Férias' },
  veiculo: { icon: Car, label: 'Carro / Moto' },
  imovel: { icon: Home, label: 'Casa / Apartamento' },
  eletronicos: { icon: Laptop, label: 'Tecnologia & Equipamentos' },
  estudos: { icon: GraduationCap, label: 'Estudos & Cursos' },
  outro: { icon: PiggyBank, label: 'Objetivo Geral' },
};

const COLOR_OPTIONS = [
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#F59E0B', // amber
  '#EC4899', // pink
  '#06B6D4', // cyan
];

export function SavingsGoalsView({
  currentMonth,
  onMonthChange,
  summary,
  incomes = [],
  expenses = [],
  monthlyTargets,
  onSaveMonthlyTarget,
  onDeleteMonthlyTarget,
  accumulationGoals,
  onSaveAccumulationGoal,
  onDeleteAccumulationGoal,
  isBalanceVisible = true,
}: SavingsGoalsViewProps) {
  // Modal states
  const [isMonthlyTargetModalOpen, setIsMonthlyTargetModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<AccumulationGoal | null>(null);
  
  // Deposit Quick Modal state
  const [depositGoal, setDepositGoal] = useState<AccumulationGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');

  // Form states for Monthly Target Modal
  const currentTarget = monthlyTargets[currentMonth];
  const [targetInputVal, setTargetInputVal] = useState<string>('');
  const [targetNotesInput, setTargetNotesInput] = useState<string>('');

  // Travel Simulator config state
  const [isTravelSimulatorModalOpen, setIsTravelSimulatorModalOpen] = useState(false);
  const [simulatorConfig, setSimulatorConfig] = useState<{
    title?: string;
    targetAmount: number;
    category?: GoalCategory;
    goalId?: string;
  }>({
    targetAmount: 3000,
  });

  const handleOpenFreshSimulator = () => {
    setSimulatorConfig({ targetAmount: 3000 });
    setIsTravelSimulatorModalOpen(true);
  };

  const handleOpenSimulatorWithGoal = (goal: AccumulationGoal) => {
    setSimulatorConfig({
      title: goal.title,
      targetAmount: goal.targetAmount,
      category: goal.category,
      goalId: goal.id,
    });
    setIsTravelSimulatorModalOpen(true);
  };

  // Calculate total incomes for the current month
  const totalIncomeForMonth = useMemo(() => {
    return getActiveIncomesForMonth(incomes, currentMonth)
      .reduce((acc, inc) => acc + (inc.amount || 0), 0);
  }, [incomes, currentMonth]);

  // Current month expense progress calculations
  const totalExpense = summary.totalMonth || 0;
  const hasTarget = Boolean(currentTarget && currentTarget.targetExpenseLimit > 0);
  const targetLimit = currentTarget?.targetExpenseLimit || 0;
  const expensePercentage = hasTarget ? Math.min(200, Math.round((totalExpense / targetLimit) * 100)) : 0;
  const remainingBudget = hasTarget ? targetLimit - totalExpense : 0;
  const isOverBudget = hasTarget && totalExpense > targetLimit;

  // Days in month calculation for daily allowance
  const daysInMonthInfo = useMemo(() => {
    const [y, m] = currentMonth.split('-').map(Number);
    const now = new Date();
    const isCurrentCalendarMonth = now.getFullYear() === y && (now.getMonth() + 1) === m;
    const totalDays = new Date(y, m, 0).getDate();
    const currentDay = isCurrentCalendarMonth ? now.getDate() : (now > new Date(y, m - 1, totalDays) ? totalDays : 1);
    const remainingDays = Math.max(1, totalDays - currentDay + 1);
    
    return {
      totalDays,
      currentDay,
      remainingDays,
      isCurrentCalendarMonth,
    };
  }, [currentMonth]);

  // Safe daily burn rate
  const safeDailyAllowance = remainingBudget > 0 && daysInMonthInfo.remainingDays > 0 
    ? remainingBudget / daysInMonthInfo.remainingDays 
    : 0;

  // Potential monthly savings if expenses stay within target limit
  const estimatedSavings = Math.max(0, totalIncomeForMonth - (hasTarget ? targetLimit : totalExpense));

  // Navigation between months
  const handlePrevMonth = () => onMonthChange(addMonths(currentMonth, -1));
  const handleNextMonth = () => onMonthChange(addMonths(currentMonth, 1));

  // Open Edit/Create Monthly Target Modal
  const handleOpenMonthlyTargetModal = () => {
    // Formato brasileiro (1500,50): o parse abaixo trata o ponto como separador de milhar.
    setTargetInputVal(currentTarget ? String(currentTarget.targetExpenseLimit).replace('.', ',') : '');
    setTargetNotesInput(currentTarget?.notes || '');
    setIsMonthlyTargetModalOpen(true);
  };

  const handleSaveMonthlyTargetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(targetInputVal.replace(/\./g, '').replace(',', '.'));
    if (isNaN(limit) || limit <= 0) return;

    onSaveMonthlyTarget({
      month: currentMonth,
      targetExpenseLimit: limit,
      notes: targetNotesInput.trim() || undefined,
    });
    setIsMonthlyTargetModalOpen(false);
  };

  // Open Create/Edit Accumulation Goal (Opens dedicated AddGoalModal screen)
  const handleOpenCreateGoalModal = (goal?: AccumulationGoal) => {
    setEditingGoal(goal || null);
    setIsGoalModalOpen(true);
  };

  // Handle Quick Deposit / Contribution
  const handleOpenDepositModal = (goal: AccumulationGoal) => {
    setDepositGoal(goal);
    setDepositAmount('');
  };

  const handleConfirmDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal) return;
    // O campo é numérico (ponto decimal): não remover o ponto, senão 250.50 vira 25050.
    const addVal = Number(depositAmount.replace(',', '.'));
    if (isNaN(addVal) || addVal <= 0) return;

    const updated: AccumulationGoal = {
      ...depositGoal,
      currentAmount: (depositGoal.currentAmount || 0) + addVal,
      updatedAt: new Date().toISOString(),
    };

    onSaveAccumulationGoal(updated);
    setDepositGoal(null);
    setDepositAmount('');
  };

  // Summary of all accumulation goals
  const goalsSummary = useMemo(() => {
    const totalTarget = accumulationGoals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = accumulationGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalMonthlyCommitment = accumulationGoals.reduce((sum, g) => {
      const remaining = Math.max(0, g.targetAmount - g.currentAmount);
      const elapsed = g.startMonth ? Math.max(0, getMonthDiff(g.startMonth, currentMonthLocal())) : 0;
      const left = Math.max(1, g.targetMonthsCount - elapsed);
      return sum + (g.targetMonthsCount > 0 ? remaining / left : 0);
    }, 0);

    return {
      totalTarget,
      totalSaved,
      totalMonthlyCommitment,
      overallProgress: totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0,
    };
  }, [accumulationGoals]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      
      {/* Top Banner & Month Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 rounded-3xl border border-slate-200/60 dark:border-white/[0.08] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Target size={26} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Metas de Economia
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                Planejador
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Defina seu teto de gastos mensal e calcule parcelas automáticas para juntar dinheiro.
            </p>
          </div>
        </div>

        {/* Month Navigation Control */}
        <div className="flex items-center self-start sm:self-auto gap-1 bg-slate-100 dark:bg-white/[0.06] p-1 rounded-2xl border border-slate-200/60 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 hover:text-slate-900 transition-colors cursor-pointer"
            title="Mês anterior"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-800 dark:text-white min-w-[130px] justify-center select-none">
            <Calendar size={14} className="text-emerald-500" />
            <span>{formatMonthDisplay(currentMonth)}</span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 hover:text-slate-900 transition-colors cursor-pointer"
            title="Próximo mês"
            aria-label="Próximo mês"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: TETO DE GASTOS DO MÊS (BARRA DE PROGRESSO GASTOS ATUAIS VS LIMITE) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 sm:p-6 border border-slate-200/60 dark:border-white/[0.08] shadow-xs space-y-5">
        
        {/* Section Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <TrendingDown size={18} className="text-emerald-500" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Teto de Gastos do Mês — {formatMonthShort(currentMonth)}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Acompanhe suas despesas acumuladas em relação ao limite estipulado para este mês.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasTarget ? (
              <>
                <button
                  type="button"
                  onClick={handleOpenMonthlyTargetModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.10] text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <Pencil size={13} />
                  <span>Editar Limite</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteMonthlyTarget(currentMonth)}
                  className="flex items-center justify-center w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  title="Remover teto deste mês"
                  aria-label="Remover teto deste mês"
                >
                  <Trash2 size={14} />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleOpenMonthlyTargetModal}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <Plus size={15} />
                <span>Definir Limite de {formatMonthShort(currentMonth)}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content when target IS defined */}
        {hasTarget ? (
          <div className="space-y-5">
            {/* Status Headline Banner */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isOverBudget
                ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
                : expensePercentage >= 80
                ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
                : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
            }`}>
              <div className="flex items-center gap-3">
                {isOverBudget ? (
                  <AlertTriangle size={24} className="text-rose-600 shrink-0" />
                ) : expensePercentage >= 80 ? (
                  <Flame size={24} className="text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                )}
                <div>
                  <h3 className="text-sm font-bold">
                    {isOverBudget 
                      ? `Atenção: Teto mensal ultrapassado em ${formatCurrency(Math.abs(remainingBudget))}`
                      : expensePercentage >= 80
                      ? `Você já utilizou ${expensePercentage}% do seu orçamento mensal`
                      : `Parabéns! Gastos sob controle (${expensePercentage}% do teto utilizado)`
                    }
                  </h3>
                  <p className="text-xs opacity-80 mt-0.5">
                    {isOverBudget 
                      ? 'Revise seus lançamentos e tente conter novos gastos até o próximo fechamento.'
                      : expensePercentage >= 80
                      ? `Restam ${formatCurrency(remainingBudget)} para os próximos ${daysInMonthInfo.remainingDays} dias.`
                      : `Você ainda pode gastar até ${formatCurrency(remainingBudget)} sem estourar o limite.`
                    }
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className={`inline-block px-2.5 py-1 rounded-full text-sm font-semibold text-slate-800 dark:text-slate-100 ${
                  isOverBudget
                    ? 'bg-rose-600 text-white'
                    : expensePercentage >= 80
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-600 text-white'
                }`}>
                  {expensePercentage}% Utilizado
                </span>
              </div>
            </div>

            {/* Main Interactive Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500 dark:text-slate-400">
                  Gastos Atuais: <strong className="text-slate-900 dark:text-white tabular-nums"><AnimatedCounter value={totalExpense} isVisible={isBalanceVisible} /></strong>
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Limite Alvo: <strong className="text-slate-900 dark:text-white tabular-nums"><AnimatedCounter value={targetLimit} isVisible={isBalanceVisible} /></strong>
                </span>
              </div>

              <div className="w-full h-4 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden p-0.5 relative shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, expensePercentage)}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full rounded-full transition-colors ${
                    isOverBudget
                      ? 'bg-gradient-to-r from-rose-500 to-rose-600'
                      : expensePercentage >= 80
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                      : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>0%</span>
                <span>50%</span>
                <span className="font-bold text-slate-600 dark:text-slate-300">100% (Teto)</span>
              </div>
            </div>

            {/* 3 Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06]">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Saldo Restante no Teto
                </span>
                <p className={`text-lg font-bold tracking-tight tabular-nums mt-1 ${
                  isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                }`}>
                  <AnimatedCounter value={remainingBudget} isVisible={isBalanceVisible} />
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isOverBudget ? 'Valor excedido' : 'Disponível para gastar'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06]">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Ritmo Diário Seguro
                </span>
                <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white tabular-nums mt-1">
                  <AnimatedCounter value={safeDailyAllowance} isVisible={isBalanceVisible} />
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Média por dia nos {daysInMonthInfo.remainingDays} dias restantes
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06]">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Poupança Projetada
                </span>
                <p className="text-lg font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                  <AnimatedCounter value={estimatedSavings} isVisible={isBalanceVisible} />
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Receita total vs. teto estipulado
                </p>
              </div>
            </div>

            {currentTarget?.notes && (
              <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-white/[0.02] p-2.5 rounded-xl border border-slate-100 dark:border-white/[0.04]">
                💬 Observação: &ldquo;{currentTarget.notes}&rdquo;
              </p>
            )}
          </div>
        ) : (
          /* Empty state when no target is set for currentMonth */
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Target size={24} />
            </div>
            <div className="max-w-md">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Nenhum teto de gastos definido para {formatMonthDisplay(currentMonth)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Definir um valor máximo para suas despesas do mês ajuda você a poupar dinheiro com disciplina e sem surpresas.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <button
                type="button"
                onClick={handleOpenMonthlyTargetModal}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                + Definir Teto Personalizado
              </button>
              {totalIncomeForMonth > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const suggestedLimit = Math.round(totalIncomeForMonth * 0.8);
                    onSaveMonthlyTarget({
                      month: currentMonth,
                      targetExpenseLimit: suggestedLimit,
                      notes: 'Teto sugerido: 80% das receitas previstas',
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Sugerir 80% da renda ({formatCurrency(totalIncomeForMonth * 0.8)})
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1.5: SIMULADOR DE METAS & VIAGEM (BANNER CLEAN E RÁPIDO)          */}
      {/* ========================================================================= */}
      <div id="travel-simulator-section" className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-4 sm:p-5 border border-slate-200/60 dark:border-white/[0.08] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Simulador de Sonhos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pela sua média de ganhos e gastos, descubra o melhor momento para viajar, comprar o carro, a casa ou o que você sonha.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenFreshSimulator}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>Simular meu sonho</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: METAS DE JUNTAR DINHEIRO COM CÁLCULO AUTOMÁTICO DE PARCELAS */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 sm:p-6 border border-slate-200/60 dark:border-white/[0.08] shadow-xs space-y-5">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <PiggyBank size={20} className="text-emerald-500" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Planejador de Metas — Juntar Dinheiro
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Defina quanto quer juntar e o prazo desejado. O sistema calcula automaticamente o valor exato a poupar por mês.
            </p>
          </div>

          <button
            type="button"
            data-tour="add-goal"
            onClick={() => handleOpenCreateGoalModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer self-start sm:self-auto active:scale-95"
          >
            <Plus size={15} />
            <span>Criar Nova Meta</span>
          </button>
        </div>

        {/* Global Summary Bar for Accumulation Goals */}
        {accumulationGoals.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#1C1C1E] border border-white/[0.08] text-white shadow-md">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Total Alvo em Metas
              </span>
              <p className="text-xl font-bold tabular-nums tracking-tight mt-0.5">
                <AnimatedCounter value={goalsSummary.totalTarget} isVisible={isBalanceVisible} />
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Já acumulado: <strong className="text-emerald-400">{formatCurrency(goalsSummary.totalSaved)}</strong> ({goalsSummary.overallProgress}%)
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                Aporte Total Necessário
              </span>
              <p className="text-xl font-bold tabular-nums tracking-tight text-emerald-400 mt-0.5">
                <AnimatedCounter value={goalsSummary.totalMonthlyCommitment} isVisible={isBalanceVisible} />
                <span className="text-xs font-normal text-slate-300"> / mês</span>
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Soma para cumprir todas as metas nos prazos
              </p>
            </div>

            <div className="flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Metas Cadastradas
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold">{accumulationGoals.length}</span>
                <span className="text-xs text-slate-300">em andamento</span>
              </div>
              <div className="w-full bg-slate-700/60 rounded-full h-2 mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${goalsSummary.overallProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Goals List Grid */}
        {accumulationGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accumulationGoals.map((goal) => {
              const CategoryInfo = GOAL_CATEGORY_ICONS[goal.category || 'outro'] || GOAL_CATEGORY_ICONS.outro;
              const IconComp = CategoryInfo.icon;
              const progressPct = goal.targetAmount > 0 
                ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) 
                : 0;
              const remainingVal = Math.max(0, goal.targetAmount - goal.currentAmount);
              
              // Automatic Monthly Calculation
              // Considera só os meses que ainda faltam (a meta pode ter começado há meses).
              const monthsElapsed = goal.startMonth ? Math.max(0, getMonthDiff(goal.startMonth, currentMonthLocal())) : 0;
              const monthsLeft = Math.max(1, goal.targetMonthsCount - monthsElapsed);
              const monthlyRequired = goal.targetMonthsCount > 0 ? remainingVal / monthsLeft : 0;
              const targetEndMonth = addMonths(goal.startMonth || currentMonth, goal.targetMonthsCount);
              const isCompleted = goal.currentAmount >= goal.targetAmount;

              return (
                <div
                  key={goal.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.08] hover:border-emerald-500/30 dark:hover:border-white/15 transition-all flex flex-col justify-between gap-4"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: goal.color || '#10B981' }}
                      >
                        <IconComp size={22} className="stroke-[2.2]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {goal.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate">
                          {CategoryInfo.label} • Início: {formatMonthShort(goal.startMonth || currentMonth)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenCreateGoalModal(goal)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        title="Editar meta"
                        aria-label="Editar meta"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteAccumulationGoal(goal.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Excluir meta"
                        aria-label="Excluir meta"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* AUTOMATIC CALCULATION HERO BOX */}
                  <div className="p-3 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Cálculo Automático
                      </span>
                      <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {isCompleted ? (
                          <span className="text-emerald-500 flex items-center gap-1">
                            <CheckCircle2 size={16} /> Meta Atingida!
                          </span>
                        ) : (
                          <>
                            <AnimatedCounter value={monthlyRequired} isVisible={isBalanceVisible} />
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400"> / mês</span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-normal text-slate-500 text-slate-400">
                        Prazo estipulado
                      </span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 justify-end">
                        <Clock size={12} className="text-slate-400" />
                        <span>{goal.targetMonthsCount} meses</span>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Até {formatMonthShort(targetEndMonth)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar & Amounts */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Guardado: <strong className="tabular-nums"><AnimatedCounter value={goal.currentAmount} isVisible={isBalanceVisible} /></strong>
                      </span>
                      <span className="font-semibold text-slate-500 dark:text-slate-400">
                        Alvo: <strong className="tabular-nums"><AnimatedCounter value={goal.targetAmount} isVisible={isBalanceVisible} /></strong>
                      </span>
                    </div>

                    <div className="w-full h-3 bg-slate-200/80 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: goal.color || '#10B981' }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{progressPct}% concluído</span>
                      <span>Faltam {formatCurrency(remainingVal)}</span>
                    </div>
                  </div>

                  {/* Actions & Deposit Button */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDepositModal(goal)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-98"
                    >
                      <Plus size={14} />
                      <span>Adicionar Valor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenSimulatorWithGoal(goal)}
                      className="py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-98 shrink-0"
                      title="Simular o melhor mês para realizar"
                    >
                      <Star size={14} />
                      <span>Simular Mês Ideal</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state for accumulation goals */
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/[0.08] flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.04] text-slate-400 flex items-center justify-center">
              <PiggyBank size={24} />
            </div>
            <div className="max-w-md">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Nenhuma meta de juntar dinheiro cadastrada
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Sonha em fazer uma viagem, trocar de carro ou montar sua reserva de emergência? Crie sua meta e descubra quanto guardar por mês.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenCreateGoalModal()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer mt-1"
            >
              + Criar Primeira Meta de Juntar Dinheiro
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: DEFINIR TETO DE GASTOS DO MÊS */}
      {/* ========================================================================= */}
      {typeof document !== 'undefined' && isMonthlyTargetModalOpen && createPortal(
        <AnimatePresence>
          <div 
            onClick={() => setIsMonthlyTargetModalOpen(false)}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/[0.08] z-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Target size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Teto de Gastos — {formatMonthShort(currentMonth)}
                    </h3>
                    <p className="text-xs text-slate-400">Defina o limite máximo de despesas para o mês</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMonthlyTargetModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveMonthlyTargetSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Valor Limite do Mês (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      value={targetInputVal}
                      onChange={(e) => setTargetInputVal(e.target.value)}
                      placeholder="Ex: 3500.00"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Quick Presets based on current situation */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-slate-400">Sugestões rápidas:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[2000, 3000, 4000, 5000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTargetInputVal(String(preset))}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                      >
                        {formatCurrency(preset)}
                      </button>
                    ))}
                    {totalIncomeForMonth > 0 && (
                      <button
                        type="button"
                        onClick={() => setTargetInputVal(String(Math.round(totalIncomeForMonth * 0.8)))}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100"
                      >
                        80% da renda ({formatCurrency(totalIncomeForMonth * 0.8)})
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Observação ou Motivo (opcional)
                  </label>
                  <input
                    type="text"
                    value={targetNotesInput}
                    onChange={(e) => setTargetNotesInput(e.target.value)}
                    placeholder="Ex: Controlar faturas e economizar para viagem"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMonthlyTargetModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                  >
                    Salvar Teto do Mês
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CRIAR / EDITAR META DE JUNTAR DINHEIRO (NOVA TELA DEDICADA) */}
      {/* ========================================================================= */}
      <AddGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSaveGoal={(savedGoal) => {
          onSaveAccumulationGoal(savedGoal);
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        goalToEdit={editingGoal}
        currentMonth={currentMonth}
      />

      {/* ========================================================================= */}
      {/* MODAL 3: APORTE RÁPIDO (+ GUARDAR DINHEIRO NA META) */}
      {/* ========================================================================= */}
      {typeof document !== 'undefined' && depositGoal && createPortal(
        <AnimatePresence>
          <div 
            onClick={() => setDepositGoal(null)}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/[0.08] z-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Guardar Dinheiro
                  </h3>
                  <p className="text-xs text-slate-400">
                    Adicionar valor à meta &ldquo;{depositGoal.title}&rdquo;
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDepositGoal(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleConfirmDeposit} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valor a Guardar (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">R$</span>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      autoFocus
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Ex: 250.00"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[50, 100, 250, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDepositAmount(String(preset))}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                    >
                      +{formatCurrency(preset)}
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDepositGoal(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    Confirmar Aporte
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      <TravelSimulatorModal
        isOpen={isTravelSimulatorModalOpen}
        onClose={() => setIsTravelSimulatorModalOpen(false)}
        currentMonth={currentMonth}
        incomes={incomes}
        expenses={expenses}
        existingGoals={accumulationGoals}
        onSaveGoal={onSaveAccumulationGoal}
        isBalanceVisible={isBalanceVisible}
        initialTargetAmount={simulatorConfig.targetAmount}
        initialGoalTitle={simulatorConfig.title}
        initialCategory={simulatorConfig.category}
        initialGoalId={simulatorConfig.goalId}
      />

    </div>
  );
}
