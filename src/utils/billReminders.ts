import { CardBillPayment, CreditCard, ExpenseItem } from '../types';
import { addMonths, getActiveExpensesForMonth } from './financeCalculations';
import { toLocalMonth } from './dateUtils';

/** Dias de atraso em que uma fatura ainda aparece como "vencida" nos lembretes. */
export const OVERDUE_WINDOW_DAYS = 4;

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export interface NextDue {
  /** Mês (AAAA-MM) da fatura a que o vencimento se refere. */
  billMonth: string;
  /** Dias até o vencimento (negativo = já venceu). */
  daysDiff: number;
}

/**
 * Próximo vencimento relevante de um dia fixo do mês (cartão ou assinatura), usando a data real de hoje.
 * - Dia 31 em mês curto vira o último dia do mês.
 * - Venceu há pouco (até OVERDUE_WINDOW_DAYS): continua no mês atual, como vencida.
 * - Venceu há mais tempo: passa a valer o vencimento do mês seguinte.
 */
export function getNextDue(dueDay: number, today: Date = new Date(), overdueWindow: number = OVERDUE_WINDOW_DAYS): NextDue {
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const thisMonthDue = Math.min(Math.max(1, dueDay || 1), daysInMonth(year, month));
  const diffThisMonth = thisMonthDue - today.getDate();

  if (diffThisMonth >= -overdueWindow) {
    return { billMonth: toLocalMonth(today), daysDiff: diffThisMonth };
  }

  const nextMonthRef = new Date(year, month, 1); // primeiro dia do mês seguinte
  const nextYear = nextMonthRef.getFullYear();
  const nextMonth = nextMonthRef.getMonth() + 1;
  const nextDue = Math.min(Math.max(1, dueDay || 1), daysInMonth(nextYear, nextMonth));
  const remainingThisMonth = daysInMonth(year, month) - today.getDate();
  return { billMonth: addMonths(toLocalMonth(today), 1), daysDiff: remainingThisMonth + nextDue };
}

/** Total da fatura de um cartão em um mês, contando únicas, parceladas e fixas (assinaturas). */
export function getCardBillTotal(card: CreditCard, expenses: ExpenseItem[], monthYear: string): number {
  return getActiveExpensesForMonth(expenses.filter((e) => e.cardId === card.id), monthYear)
    .reduce((sum, item) => sum + item.expense.amount, 0);
}

export function isCardBillPaid(card: CreditCard, paidBills: CardBillPayment[], monthYear: string): boolean {
  return paidBills.some((b) => b.cardId === card.id && b.monthYear === monthYear);
}
