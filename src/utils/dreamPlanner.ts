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
  // Primeiro mês (0 = este) em que o sonho cabe na sobra daquele mês. null = nunca com a média atual.
  monthsToAfford: number | null;
  bestMonthKey: string | null;
  // Quando nenhum mês fecha no azul: o mês em que o sonho pesa menos e o saldo que sobra (ou falta) nele
  leastBadMonthKey: string | null;
  leastBadBalance: number;
  // Parcelado: quanto da sobra do mês de início a parcela consome
  installmentShareOfSurplus: number | null;
  // Maior valor de parcelas/faturas já lançadas nos próximos meses que ainda pesa na sobra
  upcomingInstallmentsNow: number;
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
  // À vista: saldo do mês escolhido depois de pagar o sonho (negativo = mês no vermelho)
  // e quantos meses de sobra seriam necessários para cobrir esse buraco
  monthBalance: number;
  monthsToRecover: number | null;
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

  let monthsToAfford: number | null;
  let installmentShareOfSurplus: number | null = null;

  if (paymentMethod === 'a_vista') {
    // À vista: o mês em que a sobra prevista cobre o valor inteiro sem fechar no vermelho
    monthsToAfford = null;
    for (let k = 0; k <= MAX_HORIZON; k++) {
      if (cost <= 0 || surplusByMonth[k] >= cost) {
        monthsToAfford = k;
        break;
      }
    }
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

  // Mês menos pesado: maior folga depois de pagar (à vista) ou depois da parcela (parcelado)
  let leastBadMonth = 0;
  let leastBadBalance = -Infinity;
  for (let k = 0; k <= MAX_HORIZON; k++) {
    const balance =
      paymentMethod === 'a_vista'
        ? surplusByMonth[k] - cost
        : Math.min(...surplusByMonth.slice(k, k + installmentsCount)) - installmentValue;
    if (balance > leastBadBalance) {
      leastBadBalance = balance;
      leastBadMonth = k;
    }
  }

  let target: DreamTarget | null = null;
  if (targetMonth) {
    const [cy, cm] = currentMonth.split('-').map(Number);
    const [ty, tm] = targetMonth.split('-').map(Number);
    const k = Math.min(MAX_HORIZON, Math.max(0, (ty - cy) * 12 + (tm - cm)));
    const surplusBefore = surplusByMonth[k];
    let surplusAfter = surplusBefore;
    let feasible: boolean;
    let monthBalance = surplusBefore;
    let monthsToRecover: number | null = 0;
    if (paymentMethod === 'a_vista') {
      monthBalance = surplusBefore - cost;
      surplusAfter = surplusBefore;
      feasible = monthBalance >= 0;
      if (!feasible) {
        let deficit = -monthBalance;
        monthsToRecover = null;
        for (let j = 1; j <= MAX_HORIZON; j++) {
          deficit -= Math.max(0, surplusByMonth[k + j] ?? surplusByMonth[surplusByMonth.length - 1]);
          if (deficit <= 0) {
            monthsToRecover = j;
            break;
          }
        }
      }
    } else {
      surplusAfter = Math.min(...surplusByMonth.slice(k, k + installmentsCount)) - installmentValue;
      feasible = surplusAfter > 0;
    }
    target = {
      monthKey: addMonths(currentMonth, k),
      monthsAhead: k,
      surplusBefore,
      surplusAfter,
      monthBalance,
      monthsToRecover,
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
    leastBadMonthKey: addMonths(currentMonth, leastBadMonth),
    leastBadBalance,
    installmentShareOfSurplus,
    upcomingInstallmentsNow: sumExpenses(expenses, currentMonth, true),
  };
}
