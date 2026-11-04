import { PersonDebt } from '../types';
import { addMonths } from './financeCalculations';

// Valor da parcela; a última absorve os centavos que sobram da divisão.
export function debtInstallmentAmount(debt: PersonDebt, index: number): number {
  const n = Math.max(1, debt.installments);
  const base = Math.floor((debt.totalAmount * 100) / n) / 100;
  if (index < n) return base;
  return Math.round((debt.totalAmount - base * (n - 1)) * 100) / 100;
}

export function debtInstallmentMonth(debt: PersonDebt, index: number): string {
  return addMonths(debt.startMonthYear, index - 1);
}

export function summarizeDebt(debt: PersonDebt) {
  const n = Math.max(1, debt.installments);
  let paidAmount = 0;
  let paidCount = 0;
  let nextIndex: number | null = null;
  for (let i = 1; i <= n; i++) {
    if (debt.paid?.[String(i)]) {
      paidAmount += debtInstallmentAmount(debt, i);
      paidCount++;
    } else if (nextIndex === null) {
      nextIndex = i;
    }
  }
  const pendingAmount = Math.round((debt.totalAmount - paidAmount) * 100) / 100;
  return { n, paidAmount, paidCount, pendingAmount, nextIndex, isSettled: nextIndex === null };
}

export function summarizePersonDebts(debts: PersonDebt[] | undefined) {
  let pending = 0;
  let total = 0;
  (debts || []).forEach((d) => {
    const s = summarizeDebt(d);
    total += d.totalAmount;
    pending += s.pendingAmount;
  });
  return { total, pending, paid: total - pending, count: (debts || []).length };
}
