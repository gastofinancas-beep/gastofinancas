import React, { useState, useMemo } from 'react';
import { 
  Target, 
  AlertTriangle, 
  AlertCircle,
  Sparkles, 
  Plus, 
  ChevronRight, 
  Settings2, 
  CheckCircle2, 
  ShieldAlert,
  ArrowUpRight,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { getCategoryInfo, EXPENSE_CATEGORIES } from '../data/categories';
import { formatCurrency } from '../utils/financeCalculations';
import { CategoryBudgetsModal } from './CategoryBudgetsModal';
import { UserProfile } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface MonthlyBudgetsSectionProps {
  budgets?: Record<string, number>;
  categorySpending: Record<string, number>;
  currentMonthName: string;
  onSaveBudgets: (newBudgets: Record<string, number>) => Promise<void> | void;
  isBalanceVisible?: boolean;
  onNavigateToTab?: (tab: any) => void;
  onOpenBudgetsModal?: () => void;
}

export function MonthlyBudgetsSection({
  budgets = {},
  categorySpending = {},
  currentMonthName,
  onSaveBudgets,
  isBalanceVisible = true,
  onNavigateToTab,
  onOpenBudgetsModal,
}: MonthlyBudgetsSectionProps) {
  const [internalModalOpen, setInternalModalOpen] = useState(false);

  const handleOpenModal = () => {
    triggerHaptic(8);
    if (onOpenBudgetsModal) {
      onOpenBudgetsModal();
    } else {
      setInternalModalOpen(true);
    }
  };

  // Active budgets with limits > 0
  const activeBudgetEntries = useMemo(() => {
    return Object.entries(budgets)
      .filter(([_, limit]) => typeof limit === 'number' && limit > 0)
      .map(([catId, limit]) => {
        const spent = categorySpending[catId] || 0;
        const percent = Math.round((spent / limit) * 100);
        const info = getCategoryInfo(catId);
        const remaining = limit - spent;
        const isWarning = percent >= 80 && percent < 100;
        const isDanger = percent >= 100;

        return {
          catId,
          limit,
          spent,
          percent,
          remaining,
          info,
          isWarning,
          isDanger,
        };
      })
      .sort((a, b) => b.percent - a.percent); // Highest percentage first
  }, [budgets, categorySpending]);

  // Overall totals
  const totalBudgeted = activeBudgetEntries.reduce((acc, curr) => acc + curr.limit, 0);
  const totalSpentInBudgeted = activeBudgetEntries.reduce((acc, curr) => acc + curr.spent, 0);
  const overallPercent = totalBudgeted > 0 ? Math.round((totalSpentInBudgeted / totalBudgeted) * 100) : 0;
  const overallWarning = overallPercent >= 80 && overallPercent < 100;
  const overallDanger = overallPercent >= 100;

  // Categories in alert status (>= 80%)
  const alertCategories = activeBudgetEntries.filter(b => b.isWarning || b.isDanger);

  const displayAmount = (val: number) => {
    if (!isBalanceVisible) return '••••••';
    return formatCurrency(val);
  };

  return (
    <div className="space-y-3 pt-1">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Target size={16} className="stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Orçamentos Mensais
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer bg-emerald-50/80 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-500/20 active:scale-95"
        >
          <SlidersHorizontal size={13} />
          {activeBudgetEntries.length > 0 ? 'Ajustar Limites' : '+ Definir Orçamentos'}
        </button>
      </div>

      {/* Case 1: ZERO DATA / NO BUDGETS SET (Strictly zeroed as requested) */}
      {activeBudgetEntries.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/60 dark:border-white/[0.08] text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Target size={24} />
          </div>
          <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white mb-1">
            Nenhum orçamento configurado
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4 leading-relaxed">
            Defina limites de gastos por categoria para acompanhar sua evolução no mês e receber alertas visuais automáticos ao atingir 80% do teto.
          </p>

          <div className="inline-flex items-center gap-4 bg-slate-50 dark:bg-black/20 px-4 py-2.5 rounded-2xl border border-slate-200/50 dark:border-white/[0.06] mb-4">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Teto Definido</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">R$ 0,00</span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Progresso</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">0%</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleOpenModal}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={15} className="stroke-[2.5]" />
              Definir Limites por Categoria
            </button>
          </div>
        </div>
      ) : (
        /* Case 2: ACTIVE BUDGETS CONFIGURED */
        <div className="space-y-3">
          {/* Alert Banner if any category reached >= 80% */}
          {alertCategories.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle size={16} />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-amber-900 dark:text-amber-200 leading-tight">
                    {alertCategories.some(c => c.isDanger)
                      ? 'Limite excedido em categoria!'
                      : 'Atenção: 80% do limite atingido!'}
                  </h5>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 truncate">
                    {alertCategories.map(c => `${c.info.label} (${c.percent}%)`).join(', ')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenModal}
                className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shrink-0 transition-colors shadow-2xs cursor-pointer active:scale-95"
              >
                Ver tetos
              </button>
            </div>
          )}

          {/* Global Budget Overview Card */}
          <div 
            onClick={handleOpenModal}
            className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/60 dark:border-white/[0.08] cursor-pointer hover:border-emerald-500/30 transition-all"
          >
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                  Total Orçado ({activeBudgetEntries.length} {activeBudgetEntries.length === 1 ? 'categoria' : 'categorias'})
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {displayAmount(totalSpentInBudgeted)}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                    de {displayAmount(totalBudgeted)}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold tabular-nums ${
                  overallDanger
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    : overallWarning
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-500/30'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}>
                  {overallWarning && <AlertTriangle size={12} />}
                  {overallPercent}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                  {overallDanger 
                    ? `Estourado em ${displayAmount(totalSpentInBudgeted - totalBudgeted)}`
                    : `Restam ${displayAmount(Math.max(0, totalBudgeted - totalSpentInBudgeted))}`
                  }
                </span>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="h-2.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
              <div
                style={{ width: `${Math.min(100, overallPercent)}%` }}
                className={`h-full rounded-full transition-all duration-500 ${
                  overallDanger
                    ? 'bg-rose-500'
                    : overallWarning
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
              />
            </div>
          </div>

          {/* Grid of Category Budgets with Progress Bars & 80% Warnings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeBudgetEntries.map((item) => {
              return (
                <div
                  key={item.catId}
                  onClick={handleOpenModal}
                  className={`bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 shadow-xs border transition-all cursor-pointer ${
                    item.isDanger
                      ? 'border-rose-400/80 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
                      : item.isWarning
                      ? 'border-amber-400/80 dark:border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/15 ring-1 ring-amber-500/20'
                      : 'border-slate-200/60 dark:border-white/[0.08] hover:border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{ backgroundColor: `${item.info.color}15`, borderColor: `${item.info.color}30` }}
                      >
                        <item.info.icon size={18} strokeWidth={1.8} style={{ color: item.info.color }} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate">
                          {item.info.label}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          Teto: <span className="font-semibold text-slate-600 dark:text-slate-300">{displayAmount(item.limit)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Warning / Status Badge */}
                    <div className="shrink-0 text-right">
                      {item.isDanger ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          <AlertTriangle size={10} />
                          Estourado
                        </span>
                      ) : item.isWarning ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs animate-pulse">
                          <AlertTriangle size={10} className="text-amber-600 dark:text-amber-400" />
                          80% atingido
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
                          {item.percent}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount Spent vs Remaining */}
                  <div className="flex items-center justify-between text-xs mb-1.5 pt-1">
                    <span className="font-bold text-slate-800 dark:text-white tabular-nums">
                      {displayAmount(item.spent)}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.isDanger ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          +{displayAmount(item.spent - item.limit)}
                        </span>
                      ) : (
                        <span>
                          Resta <strong className="text-slate-700 dark:text-slate-200">{displayAmount(Math.max(0, item.remaining))}</strong>
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Visual Progress Bar (Aviso visual quando atingir 80%) */}
                  <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, item.percent)}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.isDanger
                          ? 'bg-rose-500'
                          : item.isWarning
                          ? 'bg-amber-500 shadow-sm shadow-amber-500/50'
                          : 'bg-emerald-500'
                      }`}
                    />
                  </div>

                  {/* Subtext warning message when at 80% */}
                  {item.isWarning && (
                    <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 mt-1.5 flex items-center gap-1.5">
                      <AlertTriangle size={12} strokeWidth={2} className="shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>Restam apenas {displayAmount(item.remaining)} para fechar o mês</span>
                    </p>
                  )}
                  {item.isDanger && (
                    <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1.5">
                      <AlertCircle size={12} strokeWidth={2} className="shrink-0 text-rose-600 dark:text-rose-400" />
                      <span>Teto estourado em {displayAmount(item.spent - item.limit)}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal to configure / adjust category budgets (rendered if no external modal handler) */}
      {!onOpenBudgetsModal && (
        <CategoryBudgetsModal
          isOpen={internalModalOpen}
          onClose={() => setInternalModalOpen(false)}
          currentBudgets={budgets}
          onSaveBudgets={onSaveBudgets}
          categorySpending={categorySpending}
          currentMonthName={currentMonthName}
        />
      )}
    </div>
  );
}
