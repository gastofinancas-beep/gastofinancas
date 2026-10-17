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
  // Parcelado: quanto da sobra mensal a parcela consome (0 a N)
  installmentShareOfSurplus: number | null;
  milestones: { percent: number; monthKey: string | null; monthsAhead: number | null }[];
}

const MAX_HORIZON = 60;
const HISTORY_MONTHS = 3;

/** Média de quanto entra e quanto sai por mês, olhando os últimos meses com movimento. */
export function calculateAverages(
  currentMonth: string,
  incomes: IncomeItem[],
  expenses: ExpenseItem[]
): DreamAverages {
  let incomeSum = 0;
  let expenseSum = 0;
  let used = 0;

  for (let back = HISTORY_MONTHS; back >= 0; back--) {
    const key = addMonths(currentMonth, -back);
    const inc = getActiveIncomesForMonth(incomes, key).reduce((a, i) => a + (i.amount || 0), 0);
    const exp = getActiveExpensesForMonth(expenses, key).reduce((a, e) => a + (e.expense.amount || 0), 0);
    if (inc > 0 || exp > 0) {
      incomeSum += inc;
      expenseSum += exp;
      used++;
    }
  }

  const income = used ? incomeSum / used : 0;
  const expense = used ? expenseSum / used : 0;
  return { income, expense, surplus: income - expense, monthsUsed: used };
}

export function planDream(options: {
  currentMonth: string;
  targetCost: number;
  incomes: IncomeItem[];
  expenses: ExpenseItem[];
  paymentMethod: 'a_vista' | 'parcelado';
  installments: number;
}): DreamPlan {
  const { currentMonth, targetCost, incomes, expenses, paymentMethod, installments } = options;
  const averages = calculateAverages(currentMonth, incomes, expenses);
  const cost = Math.max(0, targetCost);
  const installmentsCount = paymentMethod === 'parcelado' ? Math.max(1, installments) : 1;
  const installmentValue = cost / installmentsCount;
  const surplus = averages.surplus;

  const monthsFor = (amount: number): number | null => {
    if (amount <= 0) return 0;
    if (surplus <= 0) return null;
    const m = Math.ceil(amount / surplus);
    return m > MAX_HORIZON ? null : m;
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
    // Parcelado: a parcela precisa caber na sobra mensal.
    installmentShareOfSurplus = surplus > 0 ? installmentValue / surplus : null;
    monthsToAfford = surplus > 0 && installmentValue <= surplus ? 0 : null;
  }

  return {
    averages,
    installmentValue,
    installmentsCount,
    monthsToAfford,
    bestMonthKey: monthsToAfford === null ? null : addMonths(currentMonth, monthsToAfford),
    installmentShareOfSurplus,
    milestones,
  };
}
