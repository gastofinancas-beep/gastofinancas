import React, { useMemo } from 'react';
import { 
  CreditCard as CardIcon, 
  Users, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Receipt, 
  PieChart as PieIcon, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Scale
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CardBillPayment, CreditCard, ExpenseItem, MonthSummary, Person, MainTabType } from '../types';
import { formatCurrency, formatMonthDisplay, addMonths, getActiveExpensesForMonth } from '../utils/financeCalculations';
import { BankLogo } from './BankLogo';

interface ChartsDashboardProps {
  currentMonth: string;
  summary: MonthSummary;
  expenses: ExpenseItem[];
  cards: CreditCard[];
  people: Person[];
  paidBills: CardBillPayment[];
  onNavigateToTab: (tab: MainTabType) => void;
  onSelectMonth: (month: string) => void;
  isDarkMode: boolean;
  onOpenTutorial: () => void;
  onOpenAddExpense: () => void;
  onPayBill: (card: CreditCard, amount: number, monthYear: string) => void;
  onNextMonth: () => void;
}

// Sophisticated, clean iOS-inspired palette
const PIE_COLORS = ['#10B981', '#64748B', '#6366F1', '#8B5CF6', '#06B6D4', '#F43F5E', '#F59E0B', '#3B82F6'];

export function ChartsDashboard({
  currentMonth,
  summary,
  expenses,
  cards,
  people,
  paidBills,
  onNavigateToTab,
  onSelectMonth,
  onOpenAddExpense,
}: ChartsDashboardProps) {
  const activeExpenses = useMemo(() => {
    return getActiveExpensesForMonth(expenses, currentMonth);
  }, [expenses, currentMonth]);

  const handlePrevMonth = () => onSelectMonth(addMonths(currentMonth, -1));
  const handleNextMonth = () => onSelectMonth(addMonths(currentMonth, 1));

  // Expenses by Category for Chart
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    activeExpenses.forEach((item) => {
      const cat = item.expense.category || 'outros';
      map[cat] = (map[cat] || 0) + item.expense.amount;
    });

    return Object.entries(map).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    })).sort((a, b) => b.value - a.value);
  }, [activeExpenses]);

  // Card Bill Status Breakdown
  const cardSummary = useMemo(() => {
    return cards.map((card) => {
      const cardExpenses = activeExpenses.filter((e) => e.expense.cardId === card.id);
      const total = cardExpenses.reduce((acc, curr) => acc + curr.expense.amount, 0);
      const isPaid = paidBills.some((p) => p.cardId === card.id && p.monthYear === currentMonth);
      return {
        card,
        total,
        count: cardExpenses.length,
        isPaid,
      };
    });
  }, [cards, activeExpenses, paidBills, currentMonth]);

  // People Split Breakdown
  const peopleSummary = useMemo(() => {
    return people.map((person) => {
      const personExpenses = activeExpenses.filter((e) => e.expense.personId === person.id);
      const total = personExpenses.reduce((acc, curr) => acc + curr.expense.amount, 0);
      const paid = personExpenses
        .filter((e) => e.expense.paidByPerson)
        .reduce((acc, curr) => acc + curr.expense.amount, 0);
      const pending = total - paid;

      return {
        person,
        total,
        paid,
        pending,
        count: personExpenses.length,
        isSettled: total > 0 && pending === 0,
      };
    });
  }, [people, activeExpenses]);

  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Unified Master Overview Panel */}
      <div className="ios-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 overflow-hidden">
        {/* Header of the unified panel with Integrated Month Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 sm:pb-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center justify-between sm:justify-start gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-100 flex items-center justify-center">
                <Receipt size={15} className="stroke-[2.2]" />
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Visão Geral do Mês
              </h2>
            </div>

            {/* Month Carousel inside the Overview Header */}
            <div className="flex items-center bg-slate-100/90 dark:bg-[#1C1C1E] rounded-full p-0.5 border border-slate-200/60 dark:border-white/[0.08] shadow-2xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Mês anterior"
                className="p-1 sm:p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/15 active:scale-90 transition-all cursor-pointer shrink-0"
              >
                <ChevronLeft size={13} className="stroke-[2.5]" />
              </button>

              <span className="text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 text-slate-800 dark:text-slate-100 whitespace-nowrap text-center capitalize tracking-tight select-none">
                {formatMonthDisplay(currentMonth)}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                title="Próximo mês"
                className="p-1 sm:p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/15 active:scale-90 transition-all cursor-pointer shrink-0"
              >
                <ChevronRight size={13} className="stroke-[2.5]" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px]">
            {summary.totalMonth > 0 && (
              <div className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{((summary.totalPaid / summary.totalMonth) * 100).toFixed(0)}% quitado</span>
              </div>
            )}
          </div>
        </div>

        {/* 4 Unified Metrics Grid with Hairline Dividers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y divide-x-0 sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-white/[0.06] pt-3 sm:pt-4">
          
          {/* Item 1: Total Faturas */}
          <div className="p-2 sm:p-3 sm:first:pl-0 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Faturas
              </span>
            </div>
            <div className="mt-2">
              <p className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(summary.totalMonth)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                {activeExpenses.length} lançamentos
              </p>
            </div>
          </div>

          {/* Item 2: Meus Gastos */}
          <div className="p-2 sm:p-3 sm:pl-4 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                Meus Gastos
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Sua parte
              </span>
            </div>
            <div className="mt-2">
              <p className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(summary.totalSelf)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                Outros: {formatCurrency(summary.totalOthers)}
              </p>
            </div>
          </div>

          {/* Item 3: Já Quitado */}
          <div className="p-2 sm:p-3 sm:pl-4 flex flex-col justify-between pt-3 sm:pt-3">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                Já Quitado
              </span>
              <CheckCircle2 size={13} className="text-emerald-500 stroke-[2.5]" />
            </div>
            <div className="mt-2">
              <p className="text-lg sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(summary.totalPaid)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                Pagos ou acertados
              </p>
            </div>
          </div>

          {/* Item 4: A Receber / Pendente */}
          <div className="p-2 sm:p-3 sm:pl-4 flex flex-col justify-between pt-3 sm:pt-3">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                A Receber
              </span>
              <Clock size={13} className="text-slate-400 stroke-[2]" />
            </div>
            <div className="mt-2">
              <p className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(summary.totalPending)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                Aguardando retorno
              </p>
            </div>
          </div>

        </div>

        {/* Minimalist Multi-Segment Progress Line */}
        {summary.totalMonth > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden flex">
              <div 
                style={{ width: `${Math.min(100, (summary.totalPaid / summary.totalMonth) * 100)}%` }} 
                className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                title={`Quitado: ${formatCurrency(summary.totalPaid)}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Card Breakdown & People Division */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 w-full">
        
        {/* Left 2 Cols: Cards Invoices & Category Breakdown */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          
          {/* Card Invoices Overview */}
          <div className="ios-card p-4 sm:p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                  <CardIcon size={15} />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                  Faturas por Cartão
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab('cartoes')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Ver todos</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {cardSummary.map(({ card, total, count, isPaid }) => (
                <div
                  key={card.id}
                  onClick={() => onNavigateToTab('cartoes')}
                  className="group p-3.5 rounded-2xl border border-slate-200/70 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col justify-between cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BankLogo bankName={card.bank || card.name} size={30} className="shadow-xs group-hover:scale-105 transition-transform" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block truncate">
                          {card.bank}
                        </span>
                        <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {card.name}
                        </h4>
                      </div>
                    </div>
                    {isPaid ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        Paga
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10 shrink-0">
                        Aberta
                      </span>
                    )}
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-white/[0.06]">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Fatura</span>
                      <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                        {formatCurrency(total)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      <span>Vence dia {card.dueDay}</span>
                      <span>{count} {count === 1 ? 'compra' : 'compras'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="ios-card p-4 sm:p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                  <PieIcon size={15} />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                  Gastos por Categoria
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {categoryData.length} categorias
              </span>
            </div>

            {categoryData.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-medium">
                Nenhum lançamento registrado neste mês.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4 sm:gap-6">
                <div className="h-44 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={68}
                        innerRadius={46}
                        paddingAngle={2}
                      >
                        {categoryData.map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={PIE_COLORS[index % PIE_COLORS.length]} 
                            stroke="transparent"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [formatCurrency(Number(val)), 'Valor']}
                        contentStyle={{
                          backgroundColor: '#1C1C1E',
                          borderRadius: '12px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          fontSize: '12px',
                          color: '#fff',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {categoryData.map((cat, idx) => {
                    const percent = summary.totalMonth > 0 ? (cat.value / summary.totalMonth) * 100 : 0;
                    return (
                      <div key={cat.name} className="flex items-center justify-between text-xs py-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                          />
                          <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                            {cat.name}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                            ({percent.toFixed(0)}%)
                          </span>
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white tabular-nums shrink-0 ml-2">
                          {formatCurrency(cat.value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: People Summary */}
        <div className="space-y-5 sm:space-y-6">
          <div className="ios-card p-4 sm:p-6 rounded-2xl flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                    <Users size={15} />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                    Divisão de Contas
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('pessoas')}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Ver todos</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              <div className="space-y-2.5">
                {peopleSummary.map(({ person, total, pending, isSettled, count }) => (
                  <div
                    key={person.id}
                    className="p-3 rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.03] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full ${person.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0`}
                      >
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {person.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate">
                          {count} {count === 1 ? 'despesa' : 'despesas'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-xs text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(total)}
                      </p>
                      {person.isSelf ? (
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                          Sua parte
                        </span>
                      ) : isSettled ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                          <CheckCircle2 size={11} />
                          Quitado
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          Pendente {formatCurrency(pending)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenAddExpense}
              className="w-full mt-4 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
            >
              <Plus size={14} className="stroke-[2.5]" />
              <span>Novo Gasto Compartilhado</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

