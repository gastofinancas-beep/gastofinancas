import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Check } from 'lucide-react';
import { AccumulationGoal, ExpenseItem, GoalCategory, IncomeItem } from '../types';
import { addMonths, formatCurrency, formatMonthDisplay } from '../utils/financeCalculations';
import { planDream } from '../utils/dreamPlanner';

const DREAMS: {
  id: GoalCategory;
  label: string;
  defaultTitle: string;
  amounts: number[];
  color: string;
}[] = [
  { id: 'viagem', label: 'Viagem', defaultTitle: 'Viagem dos sonhos', amounts: [1500, 3000, 5000, 10000], color: '#3B82F6' },
  { id: 'veiculo', label: 'Carro ou moto', defaultTitle: 'Meu carro', amounts: [10000, 30000, 60000, 100000], color: '#F59E0B' },
  { id: 'imovel', label: 'Casa', defaultTitle: 'Minha casa', amounts: [5000, 20000, 50000, 100000], color: '#10B981' },
  { id: 'eletronicos', label: 'Tecnologia', defaultTitle: 'Novo celular', amounts: [1500, 3000, 5000, 8000], color: '#06B6D4' },
  { id: 'estudos', label: 'Estudos', defaultTitle: 'Curso dos sonhos', amounts: [500, 1500, 3000, 6000], color: '#8B5CF6' },
  { id: 'outro', label: 'Outro', defaultTitle: 'Meu sonho', amounts: [1000, 3000, 5000, 10000], color: '#EC4899' },
];

const INSTALLMENT_OPTIONS = [3, 6, 12, 24];
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DEFAULT_MONTHS_AHEAD = 12;

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
  initialCategory?: GoalCategory;
  initialGoalId?: string;
}

function monthsLabel(n: number): string {
  if (n === 0) return 'agora';
  if (n < 12) return `daqui a ${n} ${n === 1 ? 'mês' : 'meses'}`;
  const years = Math.floor(n / 12);
  const rest = n % 12;
  const y = `${years} ${years === 1 ? 'ano' : 'anos'}`;
  return `daqui a ${rest ? `${y} e ${rest} ${rest === 1 ? 'mês' : 'meses'}` : y}`;
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
  initialTargetAmount = 3000,
  initialDesiredMonth,
  initialGoalTitle,
  initialCategory = 'viagem',
  initialGoalId,
}: TravelSimulatorModalProps) {
  const [dreamId, setDreamId] = useState<GoalCategory>(initialCategory);
  const dream = DREAMS.find((d) => d.id === dreamId) || DREAMS[0];
  const [goalTitle, setGoalTitle] = useState(initialGoalTitle || dream.defaultTitle);
  const [cost, setCost] = useState<number>(initialTargetAmount);
  const [paymentMethod, setPaymentMethod] = useState<'a_vista' | 'parcelado'>('a_vista');
  const [installments, setInstallments] = useState<number>(12);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [targetMonth, setTargetMonth] = useState<string>(initialDesiredMonth || addMonths(currentMonth, DEFAULT_MONTHS_AHEAD));

  // Reabre sempre com os dados da meta/sonho escolhido
  useEffect(() => {
    if (!isOpen) return;
    const d = DREAMS.find((x) => x.id === initialCategory) || DREAMS[0];
    setDreamId(d.id);
    setGoalTitle(initialGoalTitle || d.defaultTitle);
    setCost(initialTargetAmount);
    setPaymentMethod('a_vista');
    setTargetMonth(initialDesiredMonth || addMonths(currentMonth, DEFAULT_MONTHS_AHEAD));
    setIsSavedSuccess(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handlePickDream = (id: GoalCategory) => {
    const d = DREAMS.find((x) => x.id === id) || DREAMS[0];
    setDreamId(id);
    setGoalTitle(d.defaultTitle);
    setCost(d.amounts[1]);
  };

  const plan = useMemo(
    () => planDream({ currentMonth, targetCost: cost, incomes, expenses, paymentMethod, installments, targetMonth }),
    [currentMonth, cost, incomes, expenses, paymentMethod, installments, targetMonth]
  );
  const { averages } = plan;
  const hasData = averages.monthsUsed > 0;

  // Menor número de parcelas que cabe na sobra mensal (para sugerir)
  const suggestedInstallments = useMemo(() => {
    if (averages.surplus <= 0 || cost <= 0) return null;
    const n = Math.ceil(cost / averages.surplus);
    return n >= 2 && n <= 60 ? n : null;
  }, [averages.surplus, cost]);

  const [curYear, curMonthNum] = currentMonth.split('-').map(Number);
  const [targetYear, targetMonthNum] = targetMonth.split('-').map(Number);
  const yearOptions = Array.from({ length: 6 }, (_, i) => curYear + i);
  const setTarget = (y: number, m: number) => {
    let key = `${y}-${String(m).padStart(2, '0')}`;
    if (key < currentMonth) key = currentMonth;
    if (key > addMonths(currentMonth, 60)) key = addMonths(currentMonth, 60);
    setTargetMonth(key);
  };

  const money = (v: number) => (isBalanceVisible ? formatCurrency(v) : 'R$ ••••');

  // Veredito
  let tone: 'ok' | 'warn' | 'bad' = 'ok';
  let headline = '';
  let detail = '';

  if (!hasData) {
    tone = 'warn';
    headline = 'Ainda sem dados para calcular';
    detail = 'Cadastre suas receitas e gastos para o app descobrir a sua média.';
  } else if (plan.monthsToAfford === null && averages.surplus <= 0) {
    tone = 'bad';
    headline = 'Hoje não sobra dinheiro no mês';
    detail = `Você gasta em média ${money(Math.abs(averages.surplus))} a mais do que recebe. Reduzir esse valor é o primeiro passo para realizar o sonho.`;
  } else if (paymentMethod === 'a_vista') {
    if (plan.monthsToAfford === null) {
      tone = 'bad';
      headline = 'Vai levar mais de 5 anos';
      detail = `Com a sobra de ${money(averages.surplus)} por mês, o valor é alto demais. Tente um valor menor ou parcelar.`;
    } else if (plan.monthsToAfford === 0) {
      tone = 'ok';
      headline = 'Você já pode realizar';
      detail = 'A sobra de um mês já cobre o valor.';
    } else {
      tone = 'ok';
      headline = `Melhor momento: ${formatMonthDisplay(plan.bestMonthKey!)}`;
      detail = `Guardando o que sobra a cada mês, já descontando as faturas e parcelas que você tem lançadas, você junta ${money(cost)} ${monthsLabel(plan.monthsToAfford)}.`;
    }
  } else if (plan.monthsToAfford === null) {
    tone = 'bad';
    headline = 'A parcela não cabe no orçamento';
    detail = `${installments}x de ${money(plan.installmentValue)} é mais do que sobra por mês, mesmo depois que suas faturas e parcelas atuais terminarem.${suggestedInstallments ? ` Dividindo em ${suggestedInstallments}x ou mais, caberia.` : ''}`;
  } else {
    const share = plan.installmentShareOfSurplus ?? 1;
    const when =
      plan.monthsToAfford === 0
        ? 'Pode começar agora.'
        : `Melhor começar em ${formatMonthDisplay(plan.bestMonthKey!)}, quando suas faturas e parcelas atuais aliviarem.`;
    if (share <= 0.7) {
      tone = 'ok';
      headline = 'Cabe no seu orçamento';
    } else {
      tone = 'warn';
      headline = 'Cabe, mas fica apertado';
    }
    detail = `${installments}x de ${money(plan.installmentValue)} usa ${Math.round(share * 100)}% da sua sobra. ${when}`;
  }

  // Resultado para o mês escolhido
  const target = plan.target;
  let tTone: 'ok' | 'warn' | 'bad' = 'ok';
  let tHead = '';
  let tDetail = '';
  if (target && hasData && cost > 0) {
    const when = formatMonthDisplay(target.monthKey);
    if (paymentMethod === 'a_vista') {
      if (target.feasible) {
        tHead = `Dá certo em ${when}`;
        tDetail = `Guardando a sobra de cada mês, você terá ${money(target.saved)} até lá. Depois da compra, a sua sobra mensal segue em ${money(target.surplusBefore)}.`;
      } else {
        tTone = 'bad';
        tHead = `Não fecha até ${when}`;
        tDetail = `Até lá você junta ${money(target.saved)} e faltam ${money(target.shortfall)}. Para chegar no valor seria preciso guardar ${money(target.requiredPerMonth)} por mês.${
          plan.bestMonthKey ? ` O primeiro mês que fecha é ${formatMonthDisplay(plan.bestMonthKey)}.` : ' Com a média atual, passa de 5 anos.'
        }`;
      }
    } else if (target.surplusAfter <= 0) {
      tTone = 'bad';
      tHead = `Você ficaria no vermelho em ${when}`;
      tDetail = `A sobra mensal cairia de ${money(target.surplusBefore)} para ${money(target.surplusAfter)} durante as parcelas.${
        plan.bestMonthKey && plan.bestMonthKey !== target.monthKey ? ` Começar em ${formatMonthDisplay(plan.bestMonthKey)} cabe no orçamento.` : ''
      }`;
    } else {
      const worse = target.surplusAfter < target.surplusBefore * 0.3;
      tTone = worse ? 'warn' : 'ok';
      tHead = worse ? `Cabe em ${when}, mas fica apertado` : `Cabe em ${when}`;
      tDetail = `A sobra mensal vai de ${money(target.surplusBefore)} para ${money(target.surplusAfter)} enquanto durarem as parcelas.`;
    }
  }
  const tToneText =
    tTone === 'ok'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tTone === 'warn'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-rose-600 dark:text-rose-400';

  const toneText =
    tone === 'ok'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'warn'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-rose-600 dark:text-rose-400';

  const handleSaveAsGoal = () => {
    if (!onSaveGoal) return;
    const existing = initialGoalId ? existingGoals.find((g) => g.id === initialGoalId) : undefined;
    const monthsAhead = target?.monthsAhead ?? plan.monthsToAfford ?? 12;

    const goalToSave: AccumulationGoal = {
      id: existing ? existing.id : `goal-dream-${Date.now()}`,
      title: goalTitle.trim() || dream.defaultTitle,
      targetAmount: cost,
      currentAmount: existing ? existing.currentAmount : 0,
      startMonth: currentMonth,
      targetMonthsCount: Math.max(1, monthsAhead),
      category: dream.id,
      color: dream.color,
      icon: existing?.icon || dream.id,
      notes: target
        ? `Simulação: realizar em ${formatMonthDisplay(target.monthKey)}${target.feasible ? '' : ' (não fecha com a média atual)'}.`
        : 'Simulação: ainda não cabe na média atual.',
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveGoal(goalToSave);
    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
      onClose();
    }, 1000);
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

  const labelCls = 'text-xs font-semibold text-slate-500 dark:text-slate-400';
  const fieldCls =
    'w-full px-3 py-2.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500';

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-xl border border-slate-200/80 dark:border-white/[0.08] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* HEADER */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-start justify-between gap-3 shrink-0">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Simulador de Sonhos</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Calculado pela sua média de ganhos e gastos
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -mr-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* CONTENT */}
          <div className="p-5 overflow-y-auto space-y-5">
            {/* Sonho */}
            <div className="space-y-2">
              <span className={labelCls}>Qual é o sonho?</span>
              <div className="flex flex-wrap gap-1.5">
                {DREAMS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handlePickDream(d.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                      d.id === dreamId
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                maxLength={40}
                className={fieldCls}
                placeholder="Nome do sonho"
              />
            </div>

            {/* Valor e forma de pagamento */}
            <div className="space-y-2">
              <span className={labelCls}>Quanto custa</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">R$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={cost || ''}
                  onChange={(e) => setCost(Math.max(0, Number(e.target.value)))}
                  className={`${fieldCls} pl-10`}
                  placeholder="0"
                />
              </div>
              <div className="flex gap-1.5">
                {dream.amounts.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCost(val)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      cost === val
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {val >= 1000 ? `${val / 1000} mil` : val}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-white/[0.06] rounded-xl text-xs font-semibold mt-1">
                {(['a_vista', 'parcelado'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-1.5 rounded-lg transition-all ${
                      paymentMethod === m
                        ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    {m === 'a_vista' ? 'Juntar e pagar à vista' : 'Parcelar'}
                  </button>
                ))}
              </div>
              {paymentMethod === 'parcelado' && (
                <div className="flex gap-1.5">
                  {INSTALLMENT_OPTIONS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setInstallments(n)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        installments === n
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {n}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quando */}
            <div className="space-y-2">
              <span className={labelCls}>Em que mês quer realizar</span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={targetMonthNum}
                  onChange={(e) => setTarget(targetYear, Number(e.target.value))}
                  className={fieldCls}
                >
                  {MONTH_NAMES.map((name, i) => (
                    <option key={name} value={i + 1}>
                      {name}
                    </option>
                  ))}
                </select>
                <select
                  value={targetYear}
                  onChange={(e) => setTarget(Number(e.target.value), targetMonthNum)}
                  className={fieldCls}
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              {plan.bestMonthKey && plan.bestMonthKey !== targetMonth && hasData && cost > 0 && (
                <button
                  type="button"
                  onClick={() => setTargetMonth(plan.bestMonthKey!)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400"
                >
                  Usar o melhor mês: {formatMonthDisplay(plan.bestMonthKey)}
                </button>
              )}
            </div>

            {/* Média */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className={labelCls}>Sua média por mês</span>
                {hasData && (
                  <span className="text-[11px] text-slate-400">
                    últimos {averages.monthsUsed} {averages.monthsUsed === 1 ? 'mês' : 'meses'}
                  </span>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] divide-y divide-slate-100 dark:divide-white/[0.06] text-sm">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-slate-600 dark:text-slate-300">Você recebe</span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{money(averages.income)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-slate-600 dark:text-slate-300">Você gasta</span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{money(averages.expense)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">Sobra por mês</span>
                  <span
                    className={`font-bold tabular-nums ${
                      averages.surplus >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {money(averages.surplus)}
                  </span>
                </div>
              </div>
            </div>

            {hasData && (
              <p className="text-xs text-slate-400 -mt-2.5">
                Faturas do cartão e parcelas já lançadas entram na conta mês a mês.
              </p>
            )}

            {/* Resultado para o mês escolhido */}
            {target && hasData && cost > 0 && (
              <div className="rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] px-4 py-3.5">
                <p className={`text-base font-bold tracking-tight ${tToneText}`}>{tHead}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{tDetail}</p>
              </div>
            )}

            {/* Melhor mês */}
            <div className="space-y-1 px-1">
              <p className={`text-sm font-semibold ${toneText}`}>{headline}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{detail}</p>
            </div>

            {/* Quando junta (somente à vista) */}
            {paymentMethod === 'a_vista' && hasData && plan.milestones.some((m) => m.monthKey) && cost > 0 && (
              <div className="space-y-2">
                <span className={labelCls}>Quando você junta</span>
                <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] divide-y divide-slate-100 dark:divide-white/[0.06] text-sm">
                  {plan.milestones.map((m) => (
                    <div key={m.percent} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-slate-600 dark:text-slate-300">
                        {m.percent}% <span className="text-slate-400">· {money((cost * m.percent) / 100)}</span>
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {m.monthKey ? formatMonthDisplay(m.monthKey) : 'Mais de 5 anos'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="px-5 py-3.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              Fechar
            </button>

            {onSaveGoal && (
              <button
                type="button"
                onClick={handleSaveAsGoal}
                disabled={cost <= 0}
                className={`px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 ${
                  isSavedSuccess ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSavedSuccess ? (
                  <>
                    <Check size={15} />
                    <span>Meta salva</span>
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    <span>Salvar como meta</span>
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
