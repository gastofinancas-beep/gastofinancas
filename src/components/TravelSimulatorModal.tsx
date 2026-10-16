import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plane, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Plus, 
  Check, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { AccumulationGoal, ExpenseItem, IncomeItem } from '../types';
import { 
  formatCurrency, 
  formatMonthDisplay, 
  formatMonthShort, 
  addMonths, 
  getMonthDiff 
} from '../utils/financeCalculations';
import { calculateTravelFeasibility } from '../utils/travelFeasibilityCalculator';

interface TravelSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: string;
  incomes: IncomeItem[];
  expenses: ExpenseItem[];
  existingGoals?: AccumulationGoal[];
  onSaveGoal?: (goal: AccumulationGoal) => void;
  isBalanceVisible?: boolean;
  initialTargetAmount?: number;
  initialDesiredMonth?: string;
  initialGoalTitle?: string;
}

export function TravelSimulatorModal({
  isOpen,
  onClose,
  currentMonth,
  incomes = [],
  expenses = [],
  existingGoals = [],
  onSaveGoal,
  isBalanceVisible = true,
  initialTargetAmount = 1500,
  initialDesiredMonth,
  initialGoalTitle = 'Viagem de Férias',
}: TravelSimulatorModalProps) {
  // Inputs
  const [goalTitle, setGoalTitle] = useState(initialGoalTitle);
  const [cost, setCost] = useState<number>(initialTargetAmount);
  const defaultDesired = initialDesiredMonth || addMonths(currentMonth, 2);
  const [desiredMonth, setDesiredMonth] = useState<string>(defaultDesired);
  const [paymentMethod, setPaymentMethod] = useState<'a_vista' | 'parcelado'>('a_vista');
  const [installments, setInstallments] = useState<number>(5);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [showTable, setShowTable] = useState(false);

  // Month offset relative to current
  const rawOffset = getMonthDiff(currentMonth, desiredMonth);
  const selectedMonthOffset = Math.max(0, Math.min(11, rawOffset >= 0 ? rawOffset : 0));

  // Fast Feasibility Analysis
  const analysis = useMemo(() => {
    return calculateTravelFeasibility({
      currentMonth,
      targetCost: Math.max(100, cost),
      goalTitle,
      initialReserve: 0,
      incomes,
      expenses,
      paymentMethod,
      installmentsCount: installments,
      selectedMonthOffset,
      safetyBuffer: 150,
    });
  }, [
    currentMonth,
    cost,
    goalTitle,
    incomes,
    expenses,
    paymentMethod,
    installments,
    selectedMonthOffset,
  ]);

  const { bestMonthKey, bestMonthOffset, bestScenario, selectedScenario } = analysis;
  const isDesiredTheBest = selectedScenario.travelMonthKey === bestMonthKey;

  // Month list for selection
  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const mKey = addMonths(currentMonth, i);
      const isBest = mKey === bestMonthKey;
      return {
        value: mKey,
        offset: i,
        name: formatMonthShort(mKey),
        fullName: formatMonthDisplay(mKey),
        isBest,
      };
    });
  }, [currentMonth, bestMonthKey]);

  // Max absolute balance for proportional bar heights
  const maxAbsBalance = useMemo(() => {
    const vals = selectedScenario.timeline.map((t) => Math.abs(t.cumulativeReserve));
    return Math.max(...vals, 1000);
  }, [selectedScenario]);

  // Save goal handler
  const handleSaveAsGoal = () => {
    if (!onSaveGoal) return;
    const existing = existingGoals.find(
      (g) => g.category === 'viagem' || g.title.toLowerCase().includes('viagem')
    );

    const goalToSave: AccumulationGoal = {
      id: existing ? existing.id : `goal-trip-${Date.now()}`,
      title: goalTitle.trim() || 'Viagem',
      targetAmount: cost,
      currentAmount: 0,
      startMonth: currentMonth,
      targetMonthsCount: Math.max(1, selectedMonthOffset || 1),
      category: 'viagem',
      color: '#3B82F6',
      icon: 'Plane',
      notes: `Viagem: ${formatMonthDisplay(desiredMonth)}. Melhor mês: ${formatMonthDisplay(bestMonthKey)} (${selectedScenario.tightMonthsCount === 0 ? 'Sem aperto' : `${selectedScenario.tightMonthsCount} meses no aperto`}).`,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveGoal(goalToSave);
    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
      onClose();
    }, 1200);
  };

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="relative w-full max-w-xl bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-xl border border-slate-200/80 dark:border-white/[0.08] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* HEADER */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Plane size={18} className="stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Simulador de Viagens
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Previsão de aperto financeiro e melhor mês para viajar
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* CONTENT (SCROLLABLE) */}
          <div className="p-5 overflow-y-auto space-y-4">
            
            {/* 1. INPUTS ROW (VALOR & DATA DESEJADA) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Custo Total */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Custo da Viagem
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    placeholder="1500"
                  />
                </div>
                {/* Fast Chips */}
                <div className="flex gap-1 pt-0.5">
                  {[1000, 1500, 2500, 5000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCost(val)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                        cost === val
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                      }`}
                    >
                      {val >= 1000 ? `${val / 1000}k` : val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Desejada */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Data Desejada
                  </label>
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                    {selectedMonthOffset === 0 ? 'Mês atual' : `em ${selectedMonthOffset}m`}
                  </span>
                </div>
                <select
                  value={desiredMonth}
                  onChange={(e) => setDesiredMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 cursor-pointer"
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {opt.fullName} {opt.offset === 0 ? '(Hoje)' : `(${opt.offset}m)`} {opt.isBest ? '★ Ideal' : ''}
                    </option>
                  ))}
                </select>

                {/* Forma de Pagamento Toggle */}
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  <div className="flex-1 grid grid-cols-2 gap-1 p-0.5 bg-slate-100 dark:bg-white/[0.05] rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('a_vista')}
                      className={`py-1 rounded-md transition-all text-center ${
                        paymentMethod === 'a_vista' ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      À Vista
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('parcelado')}
                      className={`py-1 rounded-md transition-all text-center ${
                        paymentMethod === 'parcelado' ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      Parcelado
                    </button>
                  </div>

                  {paymentMethod === 'parcelado' && (
                    <div className="flex gap-1">
                      {[3, 6, 12].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setInstallments(n)}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                            installments === n ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {n}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. THE CORE ANSWERS: BEST MONTH & APERTO DIAGNOSTIC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* MELHOR MÊS RECOMENDADO */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/60 dark:border-emerald-500/25 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <Sparkles size={12} /> Melhor Mês
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-600 text-white">
                      0 Aperto
                    </span>
                  </div>
                  <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {formatMonthDisplay(bestMonthKey)}
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    {bestMonthOffset === 0
                      ? 'Folga disponível no mês atual!'
                      : `Em ${bestMonthOffset} meses suas contas estarão 100% no azul.`}
                  </p>
                </div>

                {!isDesiredTheBest && (
                  <button
                    type="button"
                    onClick={() => setDesiredMonth(bestMonthKey)}
                    className="mt-2.5 w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <span>Viajar neste mês</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>

              {/* DIAGNÓSTICO DA SUA DATA DESEJADA */}
              <div className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                selectedScenario.tightMonthsCount === 0
                  ? 'bg-blue-50/60 dark:bg-blue-950/25 border-blue-200/60 dark:border-blue-500/25'
                  : 'bg-rose-50/70 dark:bg-rose-950/25 border-rose-200/60 dark:border-rose-500/25'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar size={12} /> Sua Data ({formatMonthShort(selectedScenario.travelMonthKey)})
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                      selectedScenario.tightMonthsCount === 0 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-rose-600 text-white'
                    }`}>
                      {selectedScenario.tightMonthsCount === 0 ? 'Sem Aperto' : 'No Aperto'}
                    </span>
                  </div>

                  <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {selectedScenario.tightMonthsCount === 0
                      ? '0 Meses de Aperto'
                      : `${selectedScenario.tightMonthsCount} ${selectedScenario.tightMonthsCount === 1 ? 'mês' : 'meses'} no aperto`}
                  </p>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    {selectedScenario.tightMonthsCount === 0
                      ? `Você manterá ${formatCurrency(selectedScenario.postTripSavingsAtTravel)} em caixa após a viagem.`
                      : `Déficit de até ${formatCurrency(Math.abs(selectedScenario.maxDeficitAmount))}.`}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/40 dark:border-white/[0.06] flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Saldo pós-viagem:</span>
                  <strong className={`tabular-nums ${selectedScenario.postTripSavingsAtTravel >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatCurrency(selectedScenario.postTripSavingsAtTravel)}
                  </strong>
                </div>
              </div>

            </div>

            {/* 3. LIGHTWEIGHT INTERACTIVE TIMELINE (SUPER FAST) */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Previsão de Caixa Mês a Mês
                </span>
                <span className="text-[10px] text-slate-400">
                  Toque em um mês para testar
                </span>
              </div>

              {/* 12-Month Quick Bars */}
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 pt-1">
                {selectedScenario.timeline.map((item) => {
                  const isSelected = item.monthKey === desiredMonth;
                  const isBest = item.monthKey === bestMonthKey;
                  const isPositive = item.cumulativeReserve >= 0;

                  return (
                    <button
                      key={item.monthKey}
                      type="button"
                      onClick={() => setDesiredMonth(item.monthKey)}
                      className={`p-1.5 rounded-xl flex flex-col items-center justify-between text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs scale-102 ring-2 ring-blue-500/30'
                          : isBest
                          ? 'bg-emerald-100/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50'
                          : 'bg-white dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="text-[10px] font-bold">
                        {formatMonthShort(item.monthKey).slice(0, 3)}
                      </span>

                      {/* Icon or Status Indicator */}
                      <span className="my-1">
                        {isSelected ? (
                          <Plane size={11} className="text-white" />
                        ) : isBest ? (
                          <Sparkles size={11} className="text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <span
                            className={`w-1.5 h-1.5 rounded-full block ${
                              isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                        )}
                      </span>

                      <span className={`text-[9px] font-extrabold tabular-nums ${
                        isSelected ? 'text-white' : isPositive ? 'text-slate-700 dark:text-slate-300' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {item.cumulativeReserve >= 1000
                          ? `${(item.cumulativeReserve / 1000).toFixed(1)}k`
                          : item.cumulativeReserve <= -1000
                          ? `${(item.cumulativeReserve / 1000).toFixed(1)}k`
                          : Math.round(item.cumulativeReserve)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toggle Table Details */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setShowTable(!showTable)}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                {showTable ? '▲ Ocultar tabela detalhada' : '▼ Ver números detalhados mês a mês'}
              </button>

              {showTable && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/[0.06] text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-white/[0.04] text-[10px] uppercase font-bold text-slate-400">
                      <tr>
                        <th className="py-2 px-3">Mês</th>
                        <th className="py-2 px-3">Gastos + Viagem</th>
                        <th className="py-2 px-3">Saldo Final</th>
                        <th className="py-2 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                      {selectedScenario.timeline.map((row) => (
                        <tr
                          key={row.monthKey}
                          onClick={() => setDesiredMonth(row.monthKey)}
                          className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] ${
                            row.monthKey === desiredMonth ? 'bg-blue-50/60 dark:bg-blue-950/20 font-semibold' : ''
                          }`}
                        >
                          <td className="py-1.5 px-3">{formatMonthShort(row.monthKey)}</td>
                          <td className="py-1.5 px-3 tabular-nums">{formatCurrency(row.expenseWithTrip)}</td>
                          <td className={`py-1.5 px-3 tabular-nums font-bold ${row.cumulativeReserve >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(row.cumulativeReserve)}
                          </td>
                          <td className="py-1.5 px-3 text-right">
                            {row.isTight ? (
                              <span className="text-[10px] font-bold text-rose-600">Aperto</span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600">Ok</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* FOOTER */}
          <div className="px-5 py-3.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2 shrink-0 bg-slate-50/50 dark:bg-white/[0.02]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              Fechar
            </button>

            {onSaveGoal && (
              <button
                type="button"
                onClick={handleSaveAsGoal}
                className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  isSavedSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSavedSuccess ? (
                  <>
                    <Check size={14} />
                    <span>Meta Salva!</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    <span>Salvar Meta</span>
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
