import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addMonths, getMonthDiff, getActiveExpensesForMonth, getActiveIncomesForMonth,
  calculateMonthSummary, calculateCashFlowSummary, calculateNetWorth,
} from './financeCalculations';
import type { ExpenseItem, IncomeItem } from '../types';

const exp = (o: Partial<ExpenseItem>): ExpenseItem => ({
  id: 'e', description: 'x', category: 'outros', amount: 100, type: 'unica',
  personId: 'person-me', startMonthYear: '2026-08', date: '2026-08-10', ...o,
});
const inc = (o: Partial<IncomeItem>): IncomeItem => ({
  id: 'i', description: 'x', amount: 1000, category: 'salario', type: 'unica',
  monthYear: '2026-08', date: '2026-08-05', received: true, ...o,
});

test('addMonths atravessa a virada de ano nos dois sentidos', () => {
  assert.equal(addMonths('2026-11', 3), '2027-02');
  assert.equal(addMonths('2026-02', -3), '2025-11');
  assert.equal(addMonths('2026-08', 0), '2026-08');
});

test('getMonthDiff conta meses entre anos', () => {
  assert.equal(getMonthDiff('2025-11', '2026-02'), 3);
  assert.equal(getMonthDiff('2026-08', '2026-05'), -3);
});

test('gasto único só aparece no mês dele', () => {
  const e = exp({ type: 'unica' });
  assert.equal(getActiveExpensesForMonth([e], '2026-08').length, 1);
  assert.equal(getActiveExpensesForMonth([e], '2026-07').length, 0);
  assert.equal(getActiveExpensesForMonth([e], '2026-09').length, 0);
});

test('gasto fixo repete todo mês a partir do início, e não antes', () => {
  const e = exp({ type: 'fixa' });
  assert.equal(getActiveExpensesForMonth([e], '2026-07').length, 0);
  assert.equal(getActiveExpensesForMonth([e], '2026-08').length, 1);
  assert.equal(getActiveExpensesForMonth([e], '2028-01').length, 1);
});

test('parcelada: número da parcela avança por mês e some depois da última', () => {
  const e = exp({ type: 'parcelada', totalInstallments: 3, currentInstallment: 1 });
  const m1 = getActiveExpensesForMonth([e], '2026-08')[0];
  const m3 = getActiveExpensesForMonth([e], '2026-10')[0];
  assert.equal(m1.currentInstallmentForMonth, 1);
  assert.equal(m3.currentInstallmentForMonth, 3);
  assert.equal(getActiveExpensesForMonth([e], '2026-11').length, 0);
  assert.equal(getActiveExpensesForMonth([e], '2026-07').length, 0);
});

test('parcelada que já começa na parcela 2 de 3 termina um mês depois', () => {
  const e = exp({ type: 'parcelada', totalInstallments: 3, currentInstallment: 2 });
  assert.equal(getActiveExpensesForMonth([e], '2026-09')[0].currentInstallmentForMonth, 3);
  assert.equal(getActiveExpensesForMonth([e], '2026-10').length, 0);
});

test('receita fixa repete, única fica no mês', () => {
  const fixa = inc({ type: 'fixa' });
  const unica = inc({ type: 'unica', id: 'u' });
  assert.equal(getActiveIncomesForMonth([fixa, unica], '2026-09').length, 1);
  assert.equal(getActiveIncomesForMonth([fixa, unica], '2026-08').length, 2);
  assert.equal(getActiveIncomesForMonth([fixa, unica], '2026-07').length, 0);
});

test('resumo do mês separa fixo, parcelado e único, pago e pendente, meu e dos outros', () => {
  const list = [
    exp({ id: '1', type: 'fixa', amount: 50 }),
    exp({ id: '2', type: 'parcelada', amount: 200, totalInstallments: 2 }),
    exp({ id: '3', type: 'unica', amount: 30, personId: 'person-ana', paidByPerson: true }),
  ];
  const s = calculateMonthSummary(list, '2026-08');
  assert.equal(s.totalMonth, 280);
  assert.equal(s.totalFixed, 50);
  assert.equal(s.totalInstallments, 200);
  assert.equal(s.totalSingle, 30);
  assert.equal(s.totalPaid, 30);
  assert.equal(s.totalPending, 250);
  assert.equal(s.totalSelf, 250);
  assert.equal(s.totalOthers, 30);
});

test('mês sem gastos dá tudo zero', () => {
  const s = calculateMonthSummary([], '2026-08');
  assert.equal(s.totalMonth, 0);
  assert.equal(s.totalPending, 0);
});

test('fluxo de caixa: saldo, taxa de poupança e status', () => {
  const positive = calculateCashFlowSummary([inc({ amount: 1000 })], [exp({ amount: 250 })], '2026-08');
  assert.equal(positive.netBalance, 750);
  assert.equal(positive.savingsRate, 75);
  assert.equal(positive.status, 'positive');

  const negative = calculateCashFlowSummary([inc({ amount: 100 })], [exp({ amount: 250 })], '2026-08');
  assert.equal(negative.status, 'negative');
  assert.equal(negative.savingsRate, 0);

  const neutral = calculateCashFlowSummary([], [], '2026-08');
  assert.equal(neutral.status, 'neutral');
  assert.equal(neutral.savingsRate, 0);
});

test('receita não recebida entra como pendente', () => {
  const r = calculateCashFlowSummary(
    [inc({ amount: 800, received: true }), inc({ id: 'b', amount: 200, received: false })], [], '2026-08');
  assert.equal(r.totalIncome, 1000);
  assert.equal(r.totalIncomeReceived, 800);
  assert.equal(r.totalIncomePending, 200);
});

test('patrimônio: ignora contas fora do total e desconta faturas', () => {
  const r = calculateNetWorth(
    [{ currentBalance: 1000 }, { currentBalance: 500, includeInTotal: false }],
    [{ currentBalance: 300 }], 200);
  assert.equal(r.totalInAccounts, 1000);
  assert.equal(r.totalInvested, 300);
  assert.equal(r.netWorth, 1100);
  assert.equal(calculateNetWorth([{ currentBalance: 1000 }], [{ currentBalance: 300 }], 0, false).netWorth, 1000);
});
