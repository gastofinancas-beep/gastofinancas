import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plane, 
  Sparkles, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Wallet, 
  ArrowRight, 
  Info, 
  ChevronRight, 
  Plus, 
  Check, 
  RotateCcw,
  ShieldCheck,
  Flame,
  HelpCircle,
  Sliders,
  DollarSign
} from 'lucide-react';
import { AccumulationGoal, ExpenseItem, IncomeItem } from '../types';
import { formatCurrency, formatMonthDisplay, formatMonthShort } from '../utils/financeCalculations';
import { calculateTravelFeasibility } from '../utils/travelFeasibilityCalculator';
import { AnimatedCounter } from './AnimatedCounter';

interface TravelGoalSimulatorProps {
  currentMonth: string;
  incomes: IncomeItem[];
  expenses: ExpenseItem[];
  existingGoals?: AccumulationGoal[];
  onSaveGoal?: (goal: AccumulationGoal) => void;
  isBalanceVisible?: boolean;
  initialTargetAmount?: number;
  initialGoalTitle?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export function TravelGoalSimulator({
  currentMonth,
  incomes = [],
  expenses = [],
  existingGoals = [],
  onSaveGoal,
  isBalanceVisible = true,
  initialTargetAmount = 1500,
  initialGoalTitle = 'Viagem de Férias',
  onClose,
  isModal = false,
}: TravelGoalSimulatorProps) {
  // Input parameters
  const [goalTitle, setGoalTitle] = useState(initialGoalTitle);
  const [targetCostInput, setTargetCostInput] = useState(String(initialTargetAmount));
  const [initialReserveInput, setInitialReserveInput] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'a_vista' | 'parcelado'>('a_vista');
  const [installmentsCount, setInstallmentsCount] = useState<number>(5);
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);
  const [customIncomeInput, setCustomIncomeInput] = useState<string>('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  const numericCost = Math.max(100, Number(targetCostInput) || 1500);
  const numericInitialReserve = Math.max(0, Number(initialReserveInput) || 0);
  const numericCustomIncome = customIncomeInput ? Number(customIncomeInput) : undefined;

  // Run the projection calculations
  const analysis = useMemo(() => {
    return calculateTravelFeasibility({
      currentMonth,
      targetCost: numericCost,
      goalTitle,
      initialReserve: numericInitialReserve,
      incomes,
      expenses,
      paymentMethod,
      installmentsCount,
      customMonthlyIncome: numericCustomIncome,
      selectedMonthOffset,
      safetyBuffer: 150,
    });
  }, [
    currentMonth,
    numericCost,
    goalTitle,
    numericInitialReserve,
    incomes,
    expenses,
    paymentMethod,
    installmentsCount,
    numericCustomIncome,
    selectedMonthOffset,
  ]);

  const {
    bestMonthKey,
    bestMonthOffset,
    bestScenario,
    selectedScenario,
    currentMonthScenario,
    allScenarios,
    monthlyAverageIncome,
    monthlyAverageExpense,
    monthlyAverageSurplus,
    recommendationTips,
  } = analysis;

  const isCurrentMonthSelected = selectedScenario.travelMonthOffset === 0;
  const isBestMonthSelected = selectedScenario.travelMonthOffset === bestMonthOffset;

  // Handler to set selected month
  const handleSelectOffset = (offset: number) => {
    setSelectedMonthOffset(offset);
  };

  // Handler to set preset cost (e.g. 1000, 1500, 2500, 5000)
  const handleSetPresetCost = (amount: number) => {
    setTargetCostInput(String(amount));
  };

  // Handler to save as an official Accumulation Goal
  const handleSaveAsGoal = () => {
    if (!onSaveGoal) return;
    
    // Check if an existing trip goal exists to update or create new
    const existing = existingGoals.find(g => 
      g.category === 'viagem' || g.title.toLowerCase().includes('viagem')
    );

    const goalToSave: AccumulationGoal = {
      id: existing ? existing.id : `goal-trip-${Date.now()}`,
      title: goalTitle.trim() || 'Viagem',
      targetAmount: numericCost,
      currentAmount: numericInitialReserve,
      startMonth: currentMonth,
      targetMonthsCount: Math.max(1, bestMonthOffset || 3),
      category: 'viagem',
      color: '#3B82F6', // Blue for travel
      icon: 'Plane',
      notes: `Planejado via Simulador: Melhor mês para viajar é ${formatMonthDisplay(bestMonthKey)} (em ${paymentMethod === 'a_vista' ? '1x à vista' : `${installmentsCount}x no cartão`}).`,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveGoal(goalToSave);
    setIsSavedSuccess(true);
    setTimeout(() => setIsSavedSuccess(false), 3000);
  };

  return (
    <div className={`bg-white dark:bg-[#1C1C1E] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm overflow-hidden ${isModal ? 'p-5 sm:p-7 max-w-4xl mx-auto' : 'p-4 sm:p-6'}`}>
      
      {/* Header with Title and Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Plane size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Simulador de Metas & Viagem
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                Previsão de Aperto
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Descubra em qual mês você estará mais bem preparado para viajar e quantos meses ficaria no aperto caso viaje antes.
            </p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors self-end sm:self-auto cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Main Grid: Controls on Left / Diagnostic on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-5">
        
        {/* ========================================================================= */}
        {/* COLUMN 1: CONFIGURATION OF GOAL & PAYMENT (lg:col-span-5)                  */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Goal Title & Target Amount */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] space-y-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Objetivo / Viagem
              </label>
              <input
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="Ex: Viajar para Praia, Viagem 2026..."
                className="w-full mt-1 px-3 py-2 bg-white dark:bg-black/30 border border-slate-200 dark:border-white/[0.1] rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Custo Estimado da Viagem
                </label>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(numericCost)}
                </span>
              </div>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="number"
                  value={targetCostInput}
                  onChange={(e) => setTargetCostInput(e.target.value)}
                  placeholder="1500"
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-black/30 border border-slate-200 dark:border-white/[0.1] rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[1000, 1500, 2500, 4000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSetPresetCost(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      numericCost === preset
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.06] hover:bg-slate-100'
                    }`}
                  >
                    {formatCurrency(preset)}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Switch */}
            <div className="pt-2 border-t border-slate-200/50 dark:border-white/[0.04]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/60 dark:bg-white/[0.05] rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('a_vista')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'a_vista'
                      ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Wallet size={13} />
                  <span>À Vista ({formatCurrency(numericCost)})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('parcelado')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'parcelado'
                      ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <CreditCard size={13} />
                  <span>Parcelado Cartão</span>
                </button>
              </div>

              {/* Installments selector if parcelado */}
              {paymentMethod === 'parcelado' && (
                <div className="mt-2.5 p-2.5 bg-white dark:bg-black/20 rounded-xl border border-slate-200/60 dark:border-white/[0.06]">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Parcelas sem juros:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {installmentsCount}x de {formatCurrency(numericCost / installmentsCount)}
                    </span>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {[3, 5, 6, 10, 12].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setInstallmentsCount(n)}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          installmentsCount === n
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {n}x
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Toggles (Já guardado / Renda personalizada) */}
          <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.04]">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Sliders size={13} />
                <span>Ajustar Reserva Inicial ou Renda</span>
              </div>
              <span className="text-[11px] text-blue-600 dark:text-blue-400">
                {isAdvancedOpen ? 'Ocultar' : 'Personalizar'}
              </span>
            </button>

            {isAdvancedOpen && (
              <div className="space-y-3 pt-3 mt-2 border-t border-slate-200/40 dark:border-white/[0.04]">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Quanto você já tem guardado hoje para essa meta?
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="number"
                      value={initialReserveInput}
                      onChange={(e) => setInitialReserveInput(e.target.value)}
                      placeholder="0"
                      className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-black/30 border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Renda Mensal de Referência
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Média: {formatCurrency(monthlyAverageIncome)}
                    </span>
                  </div>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="number"
                      value={customIncomeInput}
                      onChange={(e) => setCustomIncomeInput(e.target.value)}
                      placeholder={String(Math.round(monthlyAverageIncome))}
                      className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-black/30 border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action button to save goal */}
          {onSaveGoal && (
            <button
              type="button"
              onClick={handleSaveAsGoal}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98 ${
                isSavedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
              }`}
            >
              {isSavedSuccess ? (
                <>
                  <Check size={16} />
                  <span>Meta de Viagem Salva com Sucesso!</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Fixar como Minha Meta de Viagem</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 2: FINANCIAL DIAGNOSIS & BEST MONTH ANSWER (lg:col-span-7)          */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* THE 2 MAIN ANSWERS: HERO DIAGNOSTIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* QUESTION 1 ANSWER: Em qual mês vou estar mais bem financeiramente? */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                  <Sparkles size={16} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Melhor Mês para Viajar
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formatMonthDisplay(bestMonthKey)}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                  {bestMonthOffset === 0 
                    ? 'Você já possui condições financeiras saudáveis para viajar agora neste mês!'
                    : `Daqui a ${bestMonthOffset} ${bestMonthOffset === 1 ? 'mês' : 'meses'}. Nessa época, você já terá a quantia necessária guardada sem se endividar.`
                  }
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Aperto previsto:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={13} /> 0 meses no aperto!
                </span>
              </div>
            </div>

            {/* QUESTION 2 ANSWER: Quantos meses vou ficar mal se for viajar? */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
              selectedScenario.status === 'excelente'
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : selectedScenario.status === 'viavel'
                ? 'bg-teal-500/10 border-teal-500/20'
                : selectedScenario.status === 'apertado'
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-rose-500/10 border-rose-500/30'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Se você viajar em:
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedScenario.badgeColor}`}>
                    {selectedScenario.statusLabel}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formatMonthShort(selectedScenario.travelMonthKey)}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {selectedScenario.tightMonthsCount === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Zero aperto! Suas contas continuam no azul com folga de{' '}
                      <strong>{formatCurrency(selectedScenario.postTripSavingsAtTravel)}</strong>.
                    </span>
                  ) : (
                    <span>
                      Você ficará <strong>{selectedScenario.tightMonthsCount} {selectedScenario.tightMonthsCount === 1 ? 'mês' : 'meses'} no aperto</strong> financeiro até equilibrar seu fluxo de caixa.
                    </span>
                  )}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-200/40 dark:border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Saldo pós-viagem:</span>
                <span className={`font-bold tabular-nums ${selectedScenario.postTripSavingsAtTravel >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {formatCurrency(selectedScenario.postTripSavingsAtTravel)}
                </span>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* INTERACTIVE MONTH-BY-MONTH SELECTOR / COMPARATOR                          */}
          {/* ========================================================================= */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-500" />
                <span>Simular Data de Embarque (E se eu viajar em...?)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Toque nos meses para ver o impacto
              </span>
            </div>

            {/* Horizontal scroll of 12 prospective travel months */}
            <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x">
              {allScenarios.map((scenario) => {
                const isSelected = scenario.travelMonthOffset === selectedMonthOffset;
                const isBest = scenario.travelMonthOffset === bestMonthOffset;
                
                return (
                  <button
                    key={scenario.travelMonthKey}
                    type="button"
                    onClick={() => handleSelectOffset(scenario.travelMonthOffset)}
                    className={`min-w-[90px] sm:min-w-[100px] p-2.5 rounded-2xl border text-center transition-all cursor-pointer snap-start shrink-0 relative ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-102 ring-2 ring-blue-500/20'
                        : isBest
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400/80 text-emerald-950 dark:text-emerald-200 hover:bg-emerald-100/60'
                        : 'bg-slate-50/80 dark:bg-white/[0.04] border-slate-200/60 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {isBest && (
                      <span className="absolute -top-1.5 right-2 px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-2xs">
                        Ideal ★
                      </span>
                    )}

                    <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {formatMonthShort(scenario.travelMonthKey)}
                    </p>

                    <div className="mt-1.5 flex items-center justify-center gap-1">
                      {scenario.tightMonthsCount === 0 ? (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          0 aperto
                        </span>
                      ) : (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          isSelected 
                            ? 'bg-white/20 text-white' 
                            : scenario.tightMonthsCount <= 2
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        }`}>
                          {scenario.tightMonthsCount}m aperto
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* DETAILED TIMELINE OF CHOSEN MONTH SCENARIO                                */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock size={14} className="text-blue-500" />
                <span>Linha do Tempo: Cenário de {formatMonthDisplay(selectedScenario.travelMonthKey)}</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {paymentMethod === 'a_vista' ? 'Pagamento à Vista' : `${installmentsCount} parcelas`}
              </span>
            </div>

            {/* Explanation box */}
            <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-black/20 p-2.5 rounded-xl border border-slate-200/50 dark:border-white/[0.04]">
              💬 {selectedScenario.summaryMessage}
            </p>

            {/* Month-by-month bars */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {selectedScenario.timeline.slice(0, 8).map((monthItem) => {
                const isTravelM = monthItem.isTravelMonth;
                const isTight = monthItem.isTight;
                
                return (
                  <div
                    key={monthItem.monthKey}
                    className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      isTravelM
                        ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-300 dark:border-blue-900/50'
                        : isTight
                        ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30'
                        : 'bg-white dark:bg-white/[0.02] border-slate-100 dark:border-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-slate-900 dark:text-white min-w-[55px]">
                        {formatMonthShort(monthItem.monthKey)}
                      </span>
                      {isTravelM ? (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-blue-600 text-white flex items-center gap-1">
                          <Plane size={10} /> Mês da Viagem
                        </span>
                      ) : monthItem.isInstallmentMonth ? (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                          Parcela {formatCurrency(analysis.selectedScenario.installmentValue)}
                        </span>
                      ) : null}
                      {monthItem.tightReason && (
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium truncate inline-flex items-center gap-1">
                          <AlertTriangle size={11} strokeWidth={2} className="shrink-0" />
                          <span>{monthItem.tightReason}</span>
                        </span>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`font-semibold tabular-nums ${
                        monthItem.cumulativeReserve >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        Saldo: {formatCurrency(monthItem.cumulativeReserve)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strategic tips */}
          {recommendationTips.length > 0 && (
            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <Flame size={12} /> Dica para Antecipar a Viagem
              </span>
              {recommendationTips.map((tip, idx) => (
                <p key={idx} className="text-xs text-amber-900 dark:text-amber-200">
                  • {tip}
                </p>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
