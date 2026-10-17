import { ExpenseItem, IncomeItem } from '../types';
import { addMonths, getActiveExpensesForMonth, getActiveIncomesForMonth } from './financeCalculations';

export interface DreamAverages {
  income: number;
  expense: number;
  surplus: number;
  monthsUsed: number;
}

export interface DreamPlan {
  averages: DreamAverages;
  // Parcela do sonho (à vista = valor total)
  installmentValue: number;
  installmentsCount: number;
  // Quantos meses até o sonho caber (0 = já cabe). null = nunca com a média atual.
  monthsToAfford: number | null;
  bestMonthKey: string | null;
  // Parcelado: quanto da sobra do mês de início a parcela consome
  installmentShareOfSurplus: number | null;
  // Maior valor de parcelas/faturas já lançadas nos próximos meses que ainda pesa na sobra
  upcomingInstallmentsNow: number;
  milestones: { percent: number; monthKey: string | null; monthsAhead: number | null }[];
  target: DreamTarget | null;
}

/** Como fica a vida financeira se o sonho for realizado no mês escolhido. */
export interface DreamTarget {
  monthKey: string;
  monthsAhead: number;
  // Sobra mensal prevista no mês escolhido, antes de realizar o sonho
  surplusBefore: number;
  // Sobra mensal prevista depois (parcelado: pior mês durante as parcelas; à vista: igual à anterior)
  surplusAfter: number;
  // À vista: quanto estará guardado até lá e quanto falta (ou sobra) para o valor total
  saved: number;
  shortfall: number;
  requiredPerMonth: number;
  // Cabe no mês escolhido?
  feasible: boolean;
}

const MAX_HORIZON = 60;
const HISTORY_MONTHS = 3;

function sumExpenses(expenses: ExpenseItem[], key: string, onlyInstallments: boolean): number {
  return getActiveExpensesForMonth(expenses, key)
    .filter((e) => (onlyInstallments ? e.expense.type === 'parcelada' : e.expense.type !== 'parcelada'))
    .reduce((a, e) => a + (e.expense.amount || 0), 0);
}

/** Média de quanto entra e quanto sai por mês, olhando os últimos meses com movimento. */
export function calculateAverages(
  currentMonth: string,
  incomes: IncomeItem[],
  expenses: ExpenseItem[]
): DreamAverages & { baseExpense: number } {
  let incomeSum = 0;
  let expenseSum = 0;
  let baseSum = 0;
  let used = 0;

  for (let back = HISTORY_MONTHS; back >= 0; back--) {
    const key = addMonths(currentMonth, -back);
    const inc = getActiveIncomesForMonth(incomes, key).reduce((a, i) => a + (i.amount || 0), 0);
    const base = sumExpenses(expenses, key, false);
    const inst = sumExpenses(expenses, key, true);
    if (inc > 0 || base + inst > 0) {
      incomeSum += inc;
      expenseSum += base + inst;
      baseSum += base;
      used++;
    }
  }

  const income = used ? incomeSum / used : 0;
  const expense = used ? expenseSum / used : 0;
  return { income, expense, surplus: income - expense, monthsUsed: used, baseExpense: used ? baseSum / used : 0 };
}

export function planDream(options: {
  currentMonth: string;
  targetCost: number;
  incomes: IncomeItem[];
  expenses: ExpenseItem[];
  paymentMethod: 'a_vista' | 'parcelado';
  installments: number;
  targetMonth?: string;
}): DreamPlan {
  const { currentMonth, targetCost, incomes, expenses, paymentMethod, installments, targetMonth } = options;
  const averages = calculateAverages(currentMonth, incomes, expenses);
  const cost = Math.max(0, targetCost);
  const installmentsCount = paymentMethod === 'parcelado' ? Math.max(1, installments) : 1;
  const installmentValue = cost / installmentsCount;

  // Sobra projetada de cada mês: média de renda - gastos do dia a dia - parcelas/faturas já lançadas naquele mês.
  // Assim, quando uma fatura ou parcelamento termina, a sobra daquele mês sobe.
  const surplusByMonth: number[] = [];
  for (let j = 0; j < MAX_HORIZON + 24; j++) {
    const key = addMonths(currentMonth, j);
    const inst = sumExpenses(expenses, key, true);
    surplusByMonth.push(averages.income - averages.baseExpense - inst);
  }

  const monthsFor = (amount: number): number | null => {
    if (amount <= 0) return 0;
    let acc = 0;
    for (let k = 1; k <= MAX_HORIZON; k++) {
      acc += Math.max(0, surplusByMonth[k - 1]);
      if (acc >= amount) return k;
    }
    return null;
  };

  const milestones = [25, 50, 75, 100].map((percent) => {
    const m = monthsFor((cost * percent) / 100);
    return { percent, monthsAhead: m, monthKey: m === null ? null : addMonths(currentMonth, m) };
  });

  let monthsToAfford: number | null;
  let installmentShareOfSurplus: number | null = null;

  if (paymentMethod === 'a_vista') {
    monthsToAfford = monthsFor(cost);
  } else {
    // Parcelado: a parcela precisa caber na sobra de todos os meses em que será paga.
    monthsToAfford = null;
    for (let start = 0; start <= MAX_HORIZON; start++) {
      const window = surplusByMonth.slice(start, start + installmentsCount);
      const minSurplus = Math.min(...window);
      if (minSurplus > 0 && installmentValue <= minSurplus) {
        monthsToAfford = start;
        break;
      }
    }
    const startSurplus = surplusByMonth[monthsToAfford ?? 0];
    installmentShareOfSurplus = startSurplus > 0 ? installmentValue / startSurplus : null;
  }

  let target: DreamTarget | null = null;
  if (targetMonth) {
    const [cy, cm] = currentMonth.split('-').map(Number);
    const [ty, tm] = targetMonth.split('-').map(Number);
    const k = Math.min(MAX_HORIZON, Math.max(0, (ty - cy) * 12 + (tm - cm)));
    const surplusBefore = surplusByMonth[k];
    let saved = 0;
    for (let j = 0; j < Math.max(k, 1); j++) saved += Math.max(0, surplusByMonth[j]);
    let surplusAfter = surplusBefore;
    let feasible: boolean;
    if (paymentMethod === 'a_vista') {
      feasible = saved >= cost;
    } else {
      surplusAfter = Math.min(...surplusByMonth.slice(k, k + installmentsCount)) - installmentValue;
      feasible = surplusAfter > 0;
    }
    target = {
      monthKey: addMonths(currentMonth, k),
      monthsAhead: k,
      surplusBefore,
      surplusAfter,
      saved,
      shortfall: Math.max(0, cost - saved),
      requiredPerMonth: cost / Math.max(k, 1),
      feasible,
    };
  }

  return {
    averages,
    target,
    installmentValue,
    installmentsCount,
    monthsToAfford,
    bestMonthKey: monthsToAfford === null ? null : addMonths(currentMonth, monthsToAfford),
    installmentShareOfSurplus,
    upcomingInstallmentsNow: sumExpenses(expenses, currentMonth, true),
    milestones,
  };
}
