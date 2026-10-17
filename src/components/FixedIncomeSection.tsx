import React, { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { IncomeItem, IncomeCategory } from '../types';
import { formatCurrency, getActiveIncomesForMonth } from '../utils/financeCalculations';

interface FixedIncomeSectionProps {
  incomes: IncomeItem[];
  currentMonth: string;
  isBalanceVisible?: boolean;
  onAdd: () => void;
  onEdit: (income: IncomeItem) => void;
  onDelete: (id: string) => void;
}

const CATEGORY_LABELS: Record<IncomeCategory, string> = {
  salario: 'Salário',
  freelance: 'Freelance',
  investimentos: 'Rendimentos',
  beneficios: 'Benefícios',
  vendas: 'Vendas',
  outros: 'Outras entradas',
};

export function FixedIncomeSection({
  incomes,
  currentMonth,
  isBalanceVisible = true,
  onAdd,
  onEdit,
  onDelete,
}: FixedIncomeSectionProps) {
  const { fixed, fixedTotal, oneOffTotal } = useMemo(() => {
    const active = getActiveIncomesForMonth(incomes, currentMonth);
    const fixedList = active.filter((i) => i.type === 'fixa').sort((a, b) => b.amount - a.amount);
    return {
      fixed: fixedList,
      fixedTotal: fixedList.reduce((sum, i) => sum + (i.amount || 0), 0),
      oneOffTotal: active.filter((i) => i.type !== 'fixa').reduce((sum, i) => sum + (i.amount || 0), 0),
    };
  }, [incomes, currentMonth]);

  const money = (v: number) => (isBalanceVisible ? formatCurrency(v) : 'R$ ••••');

  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/80 dark:border-white/[0.08] overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">Renda fixa</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              O que você tem garantido de receber todo mês.
            </p>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/[0.1] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Plus size={14} />
            Adicionar
          </button>
        </div>

        <div className="mt-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Garantido por mês</p>
          <p className="text-3xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white mt-0.5">
            {money(fixedTotal)}
          </p>
          {oneOffTotal > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              + {money(oneOffTotal)} em ganhos avulsos neste mês
            </p>
          )}
        </div>
      </div>

      {fixed.length > 0 ? (
        <ul className="border-t border-slate-100 dark:border-white/[0.06] divide-y divide-slate-100 dark:divide-white/[0.06]">
          {fixed.map((inc) => {
            const day = inc.date ? Number(inc.date.slice(8, 10)) : 0;
            return (
              <li key={inc.id} className="flex items-center gap-2 pr-2">
                <button
                  type="button"
                  onClick={() => onEdit(inc)}
                  className="flex-1 min-w-0 flex items-center justify-between gap-3 pl-4 sm:pl-5 py-3 text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{inc.description}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {CATEGORY_LABELS[inc.category] || 'Entrada'}
                      {day > 0 ? ` · todo dia ${day}` : ''}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white shrink-0">
                    {money(inc.amount)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(inc.id)}
                  className="p-2 rounded-full text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          className="w-full border-t border-slate-100 dark:border-white/[0.06] px-4 sm:px-5 py-4 text-left text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
        >
          Nenhuma renda fixa ainda. Adicione seu salário para o app saber quanto você tem garantido por mês.
        </button>
      )}
    </div>
  );
}
