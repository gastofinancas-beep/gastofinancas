import { ExpenseItem, IncomeItem, RecurrenceRule } from '../types';
import { addMonths } from './financeCalculations';

/**
 * Rendas e contas fixas viram lançamentos comuns, um por mês e por data, com id previsível
 * (rec-<série>-<mês>-<parte>). Assim o histórico nunca é reescrito: mudar a regra só mexe
 * em meses ainda não recebidos/pagos, e todo o resto do app continua lendo as mesmas listas.
 */

export interface SeriesState {
  incomes: IncomeItem[];
  expenses: ExpenseItem[];
}

const monthOf = (item: IncomeItem | ExpenseItem): string =>
  'monthYear' in item ? item.monthYear : item.startMonthYear;

export function clampDay(monthYear: string, day: number): number {
  const [y, m] = monthYear.split('-').map(Number);
  return Math.min(Math.max(Math.round(day) || 1, 1), new Date(y, m, 0).getDate());
}

export function isSettled(item: IncomeItem | ExpenseItem): boolean {
  return 'received' in item ? item.received : !!item.paidByPerson;
}

function occurrenceId(rule: RecurrenceRule, month: string, part: number): string {
  return `rec-${rule.id}-${month}-${part}`;
}

function makeIncome(rule: RecurrenceRule, month: string, part: number): IncomeItem {
  const { day, amount } = rule.parts[part];
  return {
    id: occurrenceId(rule, month, part),
    description: rule.parts.length > 1 ? `${rule.name} (${part + 1}/${rule.parts.length})` : rule.name,
    amount,
    category: (rule.category as IncomeItem['category']) || 'salario',
    type: 'unica',
    monthYear: month,
    date: `${month}-${String(clampDay(month, day)).padStart(2, '0')}`,
    received: false,
    accountId: rule.accountId,
    recurrence: rule,
    recurrencePart: part,
  };
}

function makeExpense(rule: RecurrenceRule, month: string, part: number, personId: string): ExpenseItem {
  const { day, amount } = rule.parts[part];
  return {
    id: occurrenceId(rule, month, part),
    description: rule.parts.length > 1 ? `${rule.name} (${part + 1}/${rule.parts.length})` : rule.name,
    category: rule.category || 'outros',
    amount,
    type: 'unica',
    personId,
    startMonthYear: month,
    date: `${month}-${String(clampDay(month, day)).padStart(2, '0')}`,
    paidByPerson: false,
    accountId: rule.accountId,
    recurrence: rule,
    recurrencePart: part,
  };
}

/** Regra mais recente de cada série (a do lançamento do último mês). */
function latestRules(state: SeriesState): Map<string, { rule: RecurrenceRule; lastMonth: string }> {
  const map = new Map<string, { rule: RecurrenceRule; lastMonth: string }>();
  for (const item of [...state.incomes, ...state.expenses]) {
    const rule = item.recurrence;
    if (!rule) continue;
    const month = monthOf(item);
    const cur = map.get(rule.id);
    if (!cur || month > cur.lastMonth) map.set(rule.id, { rule, lastMonth: month });
  }
  return map;
}

export function listRules(state: SeriesState): RecurrenceRule[] {
  return Array.from(latestRules(state).values()).map((v) => v.rule);
}

/** Cria os meses que faltam de cada série, do último mês existente até `horizon`. */
export function extendSeries(state: SeriesState, horizon: string, personId: string): SeriesState | null {
  const rules = latestRules(state);
  if (rules.size === 0) return null;

  const newIncomes: IncomeItem[] = [];
  const newExpenses: ExpenseItem[] = [];

  rules.forEach(({ rule, lastMonth }) => {
    const limit = rule.endMonthYear && rule.endMonthYear < horizon ? rule.endMonthYear : horizon;
    for (let m = addMonths(lastMonth, 1); m <= limit; m = addMonths(m, 1)) {
      rule.parts.forEach((_, part) => {
        if (rule.kind === 'income') newIncomes.push(makeIncome(rule, m, part));
        else newExpenses.push(makeExpense(rule, m, part, personId));
      });
    }
  });

  if (newIncomes.length === 0 && newExpenses.length === 0) return null;
  return {
    incomes: newIncomes.length ? [...newIncomes, ...state.incomes] : state.incomes,
    expenses: newExpenses.length ? [...newExpenses, ...state.expenses] : state.expenses,
  };
}

/**
 * Aplica uma regra nova a partir de `fromMonth`: meses anteriores e lançamentos já
 * recebidos/pagos ficam como estão; os demais são refeitos.
 */
export function rewriteSeries(
  state: SeriesState,
  rule: RecurrenceRule,
  fromMonth: string,
  horizon: string,
  personId: string,
): SeriesState {
  const drop = (item: IncomeItem | ExpenseItem) =>
    item.recurrence?.id === rule.id && monthOf(item) >= fromMonth && !isSettled(item);
  const incomes = state.incomes.filter((i) => !drop(i));
  const expenses = state.expenses.filter((e) => !drop(e));

  const limit = rule.endMonthYear && rule.endMonthYear < horizon ? rule.endMonthYear : horizon;
  const newIncomes: IncomeItem[] = [];
  const newExpenses: ExpenseItem[] = [];
  const existing = new Set([...incomes, ...expenses].map((i) => i.id));

  for (let m = fromMonth; m <= limit; m = addMonths(m, 1)) {
    rule.parts.forEach((_, part) => {
      const id = occurrenceId(rule, m, part);
      if (existing.has(id)) return;
      if (rule.kind === 'income') newIncomes.push(makeIncome(rule, m, part));
      else newExpenses.push(makeExpense(rule, m, part, personId));
    });
  }

  // Os meses antigos também passam a carregar a regra atual (só a regra do último mês vale).
  const retag = <T extends IncomeItem | ExpenseItem>(item: T): T =>
    item.recurrence?.id === rule.id && monthOf(item) >= fromMonth ? { ...item, recurrence: rule } : item;

  return {
    incomes: [...newIncomes, ...incomes.map(retag)],
    expenses: [...newExpenses, ...expenses.map(retag)],
  };
}

/** Encerra a série: apaga o que ainda não foi recebido/pago de `fromMonth` em diante. */
export function endSeries(state: SeriesState, ruleId: string, fromMonth: string): SeriesState {
  const last = addMonths(fromMonth, -1);
  const drop = (item: IncomeItem | ExpenseItem) =>
    item.recurrence?.id === ruleId && monthOf(item) >= fromMonth && !isSettled(item);
  const mark = <T extends IncomeItem | ExpenseItem>(item: T): T =>
    item.recurrence?.id === ruleId ? { ...item, recurrence: { ...item.recurrence, endMonthYear: last } } : item;
  return {
    incomes: state.incomes.filter((i) => !drop(i)).map(mark),
    expenses: state.expenses.filter((e) => !drop(e)).map(mark),
  };
}
