import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Check, Pencil, Square, X, ArrowDownLeft, ArrowUpRight, CalendarClock } from 'lucide-react';
import { ExpenseItem, IncomeItem, RecurrenceRule, WalletAccount } from '../types';
import { CurrencyInput } from './CurrencyInput';
import { EXPENSE_CATEGORIES } from '../data/categories';
import { formatCurrency } from '../utils/financeCalculations';
import { listRules } from '../utils/recurringSeries';
import { currentMonthLocal } from '../utils/dateUtils';
import { triggerHaptic } from '../utils/haptics';

const INCOME_OPTIONS = [
  { id: 'salario', label: 'Salário' },
  { id: 'beneficios', label: 'Benefício (VR/VA)' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'investimentos', label: 'Rendimentos' },
  { id: 'outros', label: 'Outra renda' },
];

const MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function monthLabel(monthYear: string): string {
  const [y, m] = monthYear.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} de ${y}`;
}

function daysLabel(rule: RecurrenceRule): string {
  return rule.parts.length > 1
    ? `Dias ${rule.parts.map((p) => p.day).join(' e ')}`
    : `Todo dia ${rule.parts[0].day}`;
}

interface FixedViewProps {
  currentMonth: string;
  incomes: IncomeItem[];
  expenses: ExpenseItem[];
  accounts: WalletAccount[];
  onSaveRule: (rule: RecurrenceRule, isEdit: boolean) => void;
  onEndRule: (ruleId: string) => void;
  onToggleIncomeReceived: (id: string) => void;
  onToggleExpensePaid: (id: string) => void;
}

export function FixedView({
  currentMonth,
  incomes,
  expenses,
  accounts,
  onSaveRule,
  onEndRule,
  onToggleIncomeReceived,
  onToggleExpensePaid,
}: FixedViewProps) {
  const [editing, setEditing] = useState<RecurrenceRule | null>(null);
  const [creatingKind, setCreatingKind] = useState<'income' | 'expense' | null>(null);

  const rules = useMemo(() => {
    const today = currentMonthLocal();
    return listRules({ incomes, expenses }).filter((r) => !r.endMonthYear || r.endMonthYear >= today);
  }, [incomes, expenses]);
  const incomeRules = rules.filter((r) => r.kind === 'income');
  const expenseRules = rules.filter((r) => r.kind === 'expense');

  const monthItems = useMemo(() => {
    const inc = incomes
      .filter((i) => i.recurrence && i.monthYear === currentMonth)
      .map((i) => ({ id: i.id, kind: 'income' as const, name: i.description, amount: i.amount, date: i.date, done: i.received }));
    const exp = expenses
      .filter((e) => e.recurrence && e.startMonthYear === currentMonth)
      .map((e) => ({ id: e.id, kind: 'expense' as const, name: e.description, amount: e.amount, date: e.date, done: !!e.paidByPerson }));
    return [...inc, ...exp].sort((a, b) => a.date.localeCompare(b.date));
  }, [incomes, expenses, currentMonth]);

  const toReceive = monthItems.filter((i) => i.kind === 'income' && !i.done).reduce((s, i) => s + i.amount, 0);
  const toPay = monthItems.filter((i) => i.kind === 'expense' && !i.done).reduce((s, i) => s + i.amount, 0);

  const monthTotal = (rule: RecurrenceRule) => rule.parts.reduce((s, p) => s + p.amount, 0);

  const renderRule = (rule: RecurrenceRule) => (
    <button
      key={rule.id}
      type="button"
      onClick={() => { triggerHaptic(8); setEditing(rule); }}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        rule.kind === 'income' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-500/10 text-slate-600 dark:text-slate-300'
      }`}>
        {rule.kind === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{rule.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {daysLabel(rule)}{rule.parts.length > 1 ? ` · ${rule.parts.map((p) => formatCurrency(p.amount)).join(' + ')}` : ''}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(monthTotal(rule))}</p>
        <p className="text-[11px] text-slate-400">/mês</p>
      </div>
      <Pencil size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
    </button>
  );

  const section = (title: string, list: RecurrenceRule[], kind: 'income' | 'expense', emptyText: string) => (
    <section>
      <div className="flex items-center justify-between px-1 mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</h2>
        <button
          type="button"
          onClick={() => { triggerHaptic(8); setCreatingKind(kind); }}
          className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 cursor-pointer"
        >
          <Plus size={14} /> Adicionar
        </button>
      </div>
      <div className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] divide-y divide-black/[0.05] dark:divide-white/[0.06] overflow-hidden">
        {list.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-400 text-center">{emptyText}</p>
        ) : (
          list.map(renderRule)
        )}
      </div>
    </section>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fixos</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Salários e contas que se repetem todo mês. Eles aparecem nos meses seguintes antes da data chegar.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">A receber em {monthLabel(currentMonth).split(' de ')[0]}</p>
          <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(toReceive)}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">A pagar em {monthLabel(currentMonth).split(' de ')[0]}</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(toPay)}</p>
        </div>
      </div>

      {monthItems.length > 0 && (
        <section>
          <h2 className="px-1 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Neste mês
          </h2>
          <div className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] divide-y divide-black/[0.05] dark:divide-white/[0.06] overflow-hidden">
            {monthItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  aria-label={item.kind === 'income' ? 'Marcar como recebido' : 'Marcar como pago'}
                  onClick={() => {
                    triggerHaptic(10);
                    if (item.kind === 'income') onToggleIncomeReceived(item.id);
                    else onToggleExpensePaid(item.id);
                  }}
                  className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                    item.done
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300 dark:border-slate-600 text-transparent'
                  }`}
                >
                  {item.done ? <Check size={14} strokeWidth={3} /> : <Square size={14} className="opacity-0" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${item.done ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dia {Number(item.date.slice(8, 10))} · {item.kind === 'income' ? (item.done ? 'Recebido' : 'Previsto') : (item.done ? 'Pago' : 'A pagar')}
                  </p>
                </div>
                <p className={`text-sm font-bold tabular-nums ${item.kind === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                  {item.kind === 'income' ? '+' : '−'} {formatCurrency(item.amount)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {section('Salários e rendas fixas', incomeRules, 'income', 'Nenhuma renda fixa ainda. Adicione seu salário.')}
      {section('Contas fixas', expenseRules, 'expense', 'Nenhuma conta fixa ainda. Ex.: empréstimo, aluguel, escola.')}

      <p className="flex items-start gap-2 px-1 text-xs text-slate-400">
        <CalendarClock size={14} className="shrink-0 mt-0.5" />
        Mudar valor ou data vale a partir deste mês. Os meses que já passaram e o que já foi recebido ou pago não mudam.
      </p>

      {(creatingKind || editing) && (
        <RuleSheet
          kind={editing?.kind || creatingKind!}
          rule={editing}
          accounts={accounts}
          onClose={() => { setEditing(null); setCreatingKind(null); }}
          onSave={(rule) => { onSaveRule(rule, !!editing); setEditing(null); setCreatingKind(null); }}
          onEnd={editing ? () => { onEndRule(editing.id); setEditing(null); } : undefined}
        />
      )}
    </div>
  );
}

interface RuleSheetProps {
  kind: 'income' | 'expense';
  rule: RecurrenceRule | null;
  accounts: WalletAccount[];
  onClose: () => void;
  onSave: (rule: RecurrenceRule) => void;
  onEnd?: () => void;
}

function RuleSheet({ kind, rule, accounts, onClose, onSave, onEnd }: RuleSheetProps) {
  const [name, setName] = useState(rule?.name || '');
  const [category, setCategory] = useState(rule?.category || (kind === 'income' ? 'salario' : 'moradia'));
  const [accountId, setAccountId] = useState(rule?.accountId || '');
  const [twice, setTwice] = useState((rule?.parts.length || 1) > 1);
  const [days, setDays] = useState<[number, number]>([rule?.parts[0]?.day || 5, rule?.parts[1]?.day || 20]);
  const [amounts, setAmounts] = useState<[number, number]>([rule?.parts[0]?.amount || 0, rule?.parts[1]?.amount || 0]);
  const [error, setError] = useState('');
  const [confirmEnd, setConfirmEnd] = useState(false);

  const count = twice ? 2 : 1;
  const isIncome = kind === 'income';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim();
    if (!finalName) return setError('Dê um nome, por exemplo "Salário" ou "Empréstimo".');
    for (let i = 0; i < count; i++) {
      if (!(amounts[i] > 0)) return setError('Informe o valor.');
      if (!(days[i] >= 1 && days[i] <= 31)) return setError('O dia deve ser entre 1 e 31.');
    }
    if (count === 2 && days[0] === days[1]) return setError('Escolha dois dias diferentes.');
    const parts = Array.from({ length: count }, (_, i) => ({ day: Math.round(days[i]), amount: amounts[i] }))
      .sort((a, b) => a.day - b.day);
    onSave({
      id: rule?.id || `${kind === 'income' ? 'inc' : 'exp'}-${crypto.randomUUID().slice(0, 8)}`,
      kind,
      name: finalName,
      category,
      accountId: accountId || undefined,
      parts,
      startMonthYear: rule?.startMonthYear || currentMonthLocal(),
    });
  };

  const field = 'w-full h-12 px-4 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/40';
  const label = 'block mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400';

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative w-full sm:max-w-md bg-white dark:bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto pb-safe"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {rule ? 'Editar' : 'Nova'} {isIncome ? 'renda fixa' : 'conta fixa'}
          </h3>
          <button type="button" onClick={onClose} aria-label="Fechar" className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 flex items-center justify-center cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={label}>Nome</label>
            <input className={field} value={name} maxLength={60} onChange={(e) => setName(e.target.value)}
              placeholder={isIncome ? 'Ex.: Salário' : 'Ex.: Empréstimo'} />
          </div>

          <div>
            <label className={label}>{isIncome ? 'Quantas vezes você recebe por mês?' : 'Quantas vezes paga por mês?'}</label>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.06]">
              {[false, true].map((v) => (
                <button key={String(v)} type="button" onClick={() => setTwice(v)}
                  className={`h-10 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${
                    twice === v ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                  }`}>
                  {v ? 'Duas vezes' : 'Uma vez'}
                </button>
              ))}
            </div>
          </div>

          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="grid grid-cols-[88px_1fr] gap-3">
              <div>
                <label className={label}>{count === 2 ? `Dia (${i + 1}º)` : 'Dia do mês'}</label>
                <input className={field} inputMode="numeric" type="number" min={1} max={31} value={days[i] || ''}
                  onChange={(e) => setDays((d) => (i === 0 ? [Number(e.target.value), d[1]] : [d[0], Number(e.target.value)]))} />
              </div>
              <div>
                <label className={label}>Valor</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                  <CurrencyInput value={amounts[i]} className={`${field} pl-11`}
                    onChange={(v) => setAmounts((a) => (i === 0 ? [v, a[1]] : [a[0], v]))} />
                </div>
              </div>
            </div>
          ))}

          <div>
            <label className={label}>Categoria</label>
            <select className={field} value={category} onChange={(e) => setCategory(e.target.value)}>
              {(isIncome ? INCOME_OPTIONS : EXPENSE_CATEGORIES.map((c) => ({ id: c.id, label: c.fullLabel }))).map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {accounts.length > 0 && (
            <div>
              <label className={label}>{isIncome ? 'Cai em qual conta?' : 'Sai de qual conta?'}</label>
              <select className={field} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                <option value="">Conta padrão</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button type="submit" className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold cursor-pointer">
            {rule ? 'Salvar a partir deste mês' : 'Salvar'}
          </button>

          {onEnd && (confirmEnd ? (
            <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
              <p>Para de repetir a partir deste mês. O que já foi {isIncome ? 'recebido' : 'pago'} e os meses passados ficam.</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={onEnd} className="flex-1 h-10 rounded-lg bg-red-600 text-white text-sm font-semibold cursor-pointer">Encerrar</button>
                <button type="button" onClick={() => setConfirmEnd(false)} className="flex-1 h-10 rounded-lg bg-white dark:bg-white/10 text-slate-700 dark:text-slate-200 text-sm font-semibold cursor-pointer">Voltar</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmEnd(true)} className="w-full h-11 text-sm font-semibold text-red-600 dark:text-red-400 cursor-pointer">
              Encerrar {isIncome ? 'esta renda' : 'esta conta'}
            </button>
          ))}
        </div>
      </form>
    </div>,
    document.body,
  );
}
