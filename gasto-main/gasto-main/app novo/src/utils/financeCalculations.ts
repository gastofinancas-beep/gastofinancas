import { ExpenseItem, IncomeItem, MonthSummary, CashFlowSummary } from '../types';

export function parseMonthYear(monthYear: string): { year: number; month: number } {
  const [yearStr, monthStr] = monthYear.split('-');
  return {
    year: parseInt(yearStr, 10),
    month: parseInt(monthStr, 10),
  };
}

export function formatMonthYear(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function addMonths(monthYear: string, count: number): string {
  const { year, month } = parseMonthYear(monthYear);
  const date = new Date(year, month - 1 + count, 1);
  return formatMonthYear(date.getFullYear(), date.getMonth() + 1);
}

export function getMonthDiff(startMonthYear: string, targetMonthYear: string): number {
  const start = parseMonthYear(startMonthYear);
  const target = parseMonthYear(targetMonthYear);
  return (target.year - start.year) * 12 + (target.month - start.month);
}

export function formatMonthDisplay(monthYear: string): string {
  const { year, month } = parseMonthYear(monthYear);
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${monthNames[month - 1]} de ${year}`;
}

export function formatMonthShort(monthYear: string): string {
  const { year, month } = parseMonthYear(monthYear);
  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  return `${monthNames[month - 1]}/${String(year).slice(-2)}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount || 0);
}

export interface ActiveExpenseResult {
  expense: ExpenseItem;
  currentInstallmentForMonth?: number;
  totalInstallments?: number;
}

export function getActiveExpensesForMonth(expenses: ExpenseItem[], monthYear: string): ActiveExpenseResult[] {
  const results: ActiveExpenseResult[] = [];

  for (const exp of expenses) {
    if (exp.type === 'fixa') {
      const diff = getMonthDiff(exp.startMonthYear, monthYear);
      if (diff >= 0) {
        results.push({ expense: exp });
      }
    } else if (exp.type === 'unica') {
      if (exp.startMonthYear === monthYear) {
        results.push({ expense: exp });
      }
    } else if (exp.type === 'parcelada') {
      const total = exp.totalInstallments || 1;
      const startInst = exp.currentInstallment || 1;
      const diff = getMonthDiff(exp.startMonthYear, monthYear);
      const targetInst = startInst + diff;

      if (targetInst >= 1 && targetInst <= total) {
        results.push({
          expense: exp,
          currentInstallmentForMonth: targetInst,
          totalInstallments: total,
        });
      }
    }
  }

  return results;
}

export function getActiveIncomesForMonth(incomes: IncomeItem[], monthYear: string): IncomeItem[] {
  return incomes.filter((inc) => {
    if (inc.type === 'fixa') {
      const diff = getMonthDiff(inc.monthYear, monthYear);
      return diff >= 0;
    }
    return inc.monthYear === monthYear;
  });
}

export function calculateMonthSummary(expenses: ExpenseItem[], monthYear: string): MonthSummary {
  const active = getActiveExpensesForMonth(expenses, monthYear);

  let totalMonth = 0;
  let totalFixed = 0;
  let totalInstallments = 0;
  let totalSingle = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let totalSelf = 0;
  let totalOthers = 0;

  for (const item of active) {
    const amt = item.expense.amount;
    totalMonth += amt;

    if (item.expense.type === 'fixa') totalFixed += amt;
    else if (item.expense.type === 'parcelada') totalInstallments += amt;
    else totalSingle += amt;

    if (item.expense.paidByPerson) {
      totalPaid += amt;
    } else {
      totalPending += amt;
    }

    if (item.expense.personId === 'person-me') {
      totalSelf += amt;
    } else {
      totalOthers += amt;
    }
  }

  return {
    totalMonth,
    totalFixed,
    totalInstallments,
    totalSingle,
    totalPaid,
    totalPending,
    totalSelf,
    totalOthers,
  };
}

export function calculateCashFlowSummary(
  incomes: IncomeItem[],
  expenses: ExpenseItem[],
  monthYear: string
): CashFlowSummary {
  const activeIncomes = getActiveIncomesForMonth(incomes, monthYear);
  const monthSummary = calculateMonthSummary(expenses, monthYear);

  let totalIncome = 0;
  let totalIncomeReceived = 0;
  let totalIncomePending = 0;

  for (const inc of activeIncomes) {
    totalIncome += inc.amount;
    if (inc.received) {
      totalIncomeReceived += inc.amount;
    } else {
      totalIncomePending += inc.amount;
    }
  }

  const totalExpense = monthSummary.totalMonth;
  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, (netBalance / totalIncome) * 100) : 0;

  let status: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (netBalance > 0.01) status = 'positive';
  else if (netBalance < -0.01) status = 'negative';

  return {
    totalIncome,
    totalIncomeReceived,
    totalIncomePending,
    totalExpense,
    netBalance,
    savingsRate,
    status,
  };
}

