import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft,
  Target, 
  Check, 
  AlertTriangle, 
  AlertCircle,
  Sparkles, 
  Search,
  X,
  Trash2,
  SlidersHorizontal,
  Plus,
  RefreshCw,
  HelpCircle,
  CheckCircle2,
  TrendingDown,
  Info
} from 'lucide-react';
import { EXPENSE_CATEGORIES, getCategoryInfo } from '../data/categories';
import { formatCurrency } from '../utils/financeCalculations';
import { triggerHaptic } from '../utils/haptics';

interface CategoryBudgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBudgets: Record<string, number>;
  onSaveBudgets: (newBudgets: Record<string, number>) => Promise<void> | void;
  categorySpending?: Record<string, number>;
  currentMonthName?: string;
}

export function CategoryBudgetsModal({
  isOpen,
  onClose,
  currentBudgets,
  onSaveBudgets,
  categorySpending = {},
  currentMonthName,
}: CategoryBudgetsModalProps) {
  // Local state initialized with current budgets
  const [budgets, setBudgets] = useState<Record<string, number>>(() => ({ ...(currentBudgets || {}) }));
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'warning' | 'danger' | 'unset'>('all');
  const [showInfoBanner, setShowInfoBanner] = useState(true);

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setBudgets({ ...(currentBudgets || {}) });
      setSearchTerm('');
      setActiveFilter('all');
    }
  }, [isOpen, currentBudgets]);

  // Calculate totals
  const totalBudget = useMemo(() => {
    return Object.values(budgets).reduce((sum, val) => sum + (typeof val === 'number' && val > 0 ? val : 0), 0);
  }, [budgets]);

  const totalSpentInBudgeted = useMemo(() => {
    return Object.entries(budgets).reduce((sum, [cat, limit]) => {
      if (typeof limit === 'number' && limit > 0) {
        return sum + (categorySpending[cat] || 0);
      }
      return sum;
    }, 0);
  }, [budgets, categorySpending]);

  const overallPercent = totalBudget > 0 ? Math.round((totalSpentInBudgeted / totalBudget) * 100) : 0;
  const isOverallWarning = overallPercent >= 80 && overallPercent < 100;
  const isOverallDanger = overallPercent >= 100;

  const countActive = useMemo(() => {
    return Object.values(budgets).filter(v => typeof v === 'number' && v > 0).length;
  }, [budgets]);

  const countWarning = useMemo(() => {
    return Object.entries(budgets).filter(([catId, limit]) => {
      if (typeof limit !== 'number' || limit <= 0) return false;
      const spent = categorySpending[catId] || 0;
      const p = Math.round((spent / limit) * 100);
      return p >= 80 && p < 100;
    }).length;
  }, [budgets, categorySpending]);

  const countDanger = useMemo(() => {
    return Object.entries(budgets).filter(([catId, limit]) => {
      if (typeof limit !== 'number' || limit <= 0) return false;
      const spent = categorySpending[catId] || 0;
      return spent >= limit;
    }).length;
  }, [budgets, categorySpending]);

  const countUnset = EXPENSE_CATEGORIES.length - countActive;

  const handleValueChange = (catId: string, rawVal: string) => {
    const clean = rawVal.replace(/[^\d]/g, '');
    const num = clean ? parseInt(clean, 10) : 0;
    setBudgets(prev => ({
      ...prev,
      [catId]: num,
    }));
  };

  const handleAddIncrement = (catId: string, increment: number) => {
    triggerHaptic(8);
    setBudgets(prev => {
      const current = prev[catId] || 0;
      return {
        ...prev,
        [catId]: Math.max(0, current + increment),
      };
    });
  };

  const handleClearBudget = (catId: string) => {
    triggerHaptic(12);
    setBudgets(prev => {
      const copy = { ...prev };
      delete copy[catId];
      return copy;
    });
  };

  const handleSetPreset = (catId: string, value: number) => {
    triggerHaptic(8);
    setBudgets(prev => ({
      ...prev,
      [catId]: value,
    }));
  };

  const handleAutoSuggestAll = () => {
    triggerHaptic(15);
    const newMap: Record<string, number> = { ...budgets };
    EXPENSE_CATEGORIES.forEach(cat => {
      const spent = categorySpending[cat.id] || 0;
      if (spent > 0) {
        // Sugere 120% dos gastos reais do mês arredondado para múltiplos de 50
        const suggested = Math.max(100, Math.ceil((spent * 1.2) / 50) * 50);
        newMap[cat.id] = suggested;
      }
    });
    setBudgets(newMap);
  };

  const handleClearAll = () => {
    triggerHaptic(20);
    setBudgets({});
  };

  const handleSave = async () => {
    try {
      triggerHaptic(15);
      setIsSaving(true);
      const cleaned: Record<string, number> = {};
      Object.entries(budgets).forEach(([key, val]) => {
        if (typeof val === 'number' && val > 0) {
          cleaned[key] = val;
        }
      });
      await onSaveBudgets(cleaned);
      onClose();
    } catch (err) {
      console.error('Error saving budgets:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter categories
  const filteredCategories = useMemo(() => {
    return EXPENSE_CATEGORIES.filter(cat => {
      const limit = budgets[cat.id] || 0;
      const spent = categorySpending[cat.id] || 0;
      const hasLimit = limit > 0;
      const percent = hasLimit ? Math.round((spent / limit) * 100) : 0;
      const isWarning = hasLimit && percent >= 80 && percent < 100;
      const isDanger = hasLimit && percent >= 100;

      // Filter tabs
      if (activeFilter === 'active' && !hasLimit) return false;
      if (activeFilter === 'warning' && !isWarning) return false;
      if (activeFilter === 'danger' && !isDanger) return false;
      if (activeFilter === 'unset' && hasLimit) return false;

      // Search term
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        cat.label.toLowerCase().includes(term) ||
        cat.fullLabel.toLowerCase().includes(term) ||
        cat.id.toLowerCase().includes(term)
      );
    });
  }, [searchTerm, activeFilter, budgets, categorySpending]);

  // Trava a rolagem da página de trás enquanto a tela está aberta
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // Renderiza no body (como os outros módulos): dentro do painel, o `fixed` ficava preso ao elemento animado da aba
  // e a tela não abria por cima nem rolava.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="category-budgets-modal-screen"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 z-[200] w-full h-full bg-slate-50 dark:bg-[#121214] text-slate-900 dark:text-white flex flex-col overflow-hidden select-none"
        >
          {/* ========================================================================= */}
          {/* 🌟 STICKY TOP APP HEADER */}
          {/* ========================================================================= */}
          <header className="sticky top-0 z-20 w-full bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.08] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  onClose();
                }}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
                title="Voltar / Fechar"
                aria-label="Voltar / Fechar"
              >
                <ArrowLeft size={20} className="stroke-[2.2]" />
              </button>

              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2 truncate">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Target size={14} className="stroke-[2.5]" />
                  </span>
                  Orçamentos Mensais
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                  {currentMonthName ? `Referência: ${currentMonthName}` : 'Defina limites por categoria com aviso a 80%'}
                </p>
              </div>
            </div>

            {/* Quick Top Save Action */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Check size={14} className="stroke-[2.5]" />
                )}
                <span className="hidden sm:inline">Salvar</span>
              </button>
            </div>
          </header>

          {/* ========================================================================= */}
          {/* 🌟 SCROLLABLE MAIN CONTENT BODY */}
          {/* ========================================================================= */}
          <main className="flex-1 overflow-y-auto overscroll-contain">
            <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-4 space-y-4 pb-28">

              {/* 1. HERO SUMMARY CARD */}
              <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/70 dark:border-white/[0.08]">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Teto Total Orçado
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(totalBudget)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Gasto no Mês
                    </span>
                    <span className={`text-lg sm:text-xl font-extrabold tabular-nums ${
                      isOverallDanger ? 'text-rose-600 dark:text-rose-400' : isOverallWarning ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {formatCurrency(totalSpentInBudgeted)}
                    </span>
                  </div>
                </div>

                {/* Main Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-medium">
                      {countActive} {countActive === 1 ? 'categoria configurada' : 'categorias configuradas'}
                    </span>
                    <span className={`font-bold tabular-nums px-2 py-0.5 rounded-full text-[10px] ${
                      isOverallDanger
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : isOverallWarning
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-500/30'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}>
                      {totalBudget > 0 ? `${overallPercent}% consumido` : 'Sem limites'}
                    </span>
                  </div>

                  <div className="h-2.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
                    <div
                      style={{ width: `${Math.min(100, overallPercent)}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOverallDanger
                          ? 'bg-rose-500'
                          : isOverallWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* 2. 80% RULE INFO BANNER */}
              {showInfoBanner && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-start justify-between gap-3 animate-in fade-in">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <AlertTriangle size={17} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                      <strong>Aviso Inteligente a 80%:</strong> Quando os gastos em qualquer categoria atingirem 80% do teto, você receberá alerta visual e destaque âmbar imediato no painel.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInfoBanner(false)}
                    className="text-amber-700 dark:text-amber-400 hover:opacity-70 p-1 rounded-lg shrink-0 cursor-pointer"
                    title="Dispensar aviso"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* 3. SEARCH & QUICK BATCH ACTIONS */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar categoria..."
                      className="w-full pl-9 pr-8 py-2 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/[0.08] text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-2xs"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Batch button: Suggest from spending */}
                  <button
                    type="button"
                    onClick={handleAutoSuggestAll}
                    title="Preencher com base nos gastos do mês (+20%)"
                    className="px-3 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 shrink-0 hover:bg-emerald-100 transition-colors cursor-pointer active:scale-95"
                  >
                    <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="hidden sm:inline">Sugerir Tetos</span>
                    <span className="sm:hidden">Sugerir</span>
                  </button>

                  {countActive > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      title="Zerar todos os orçamentos"
                      className="p-2 rounded-2xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08] text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer active:scale-95"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => { setActiveFilter('all'); triggerHaptic(6); }}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                      activeFilter === 'all'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                        : 'bg-white dark:bg-[#1C1C1E] text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-white/[0.06]'
                    }`}
                  >
                    Todas ({EXPENSE_CATEGORIES.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveFilter('active'); triggerHaptic(6); }}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                      activeFilter === 'active'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-[#1C1C1E] text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-white/[0.06]'
                    }`}
                  >
                    Com Teto ({countActive})
                  </button>

                  {countWarning > 0 && (
                    <button
                      type="button"
                      onClick={() => { setActiveFilter('warning'); triggerHaptic(6); }}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
                        activeFilter === 'warning'
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      <AlertTriangle size={12} />
                      80% ({countWarning})
                    </button>
                  )}

                  {countDanger > 0 && (
                    <button
                      type="button"
                      onClick={() => { setActiveFilter('danger'); triggerHaptic(6); }}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
                        activeFilter === 'danger'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                      }`}
                    >
                      <AlertCircle size={12} />
                      Estourados ({countDanger})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => { setActiveFilter('unset'); triggerHaptic(6); }}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                      activeFilter === 'unset'
                        ? 'bg-slate-700 text-white shadow-2xs'
                        : 'bg-white dark:bg-[#1C1C1E] text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-white/[0.06]'
                    }`}
                  >
                    Sem Teto ({countUnset})
                  </button>
                </div>
              </div>

              {/* 4. CATEGORIES LIST */}
              <div className="space-y-3">
                {filteredCategories.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-[#1C1C1E] rounded-3xl border border-slate-200/70 dark:border-white/[0.08] p-6">
                    <Target size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Nenhuma categoria encontrada
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Tente alterar a busca ou o filtro selecionado.
                    </p>
                  </div>
                ) : (
                  filteredCategories.map((cat) => {
                    const limit = budgets[cat.id] || 0;
                    const spent = categorySpending[cat.id] || 0;
                    const hasLimit = limit > 0;
                    const percent = hasLimit ? Math.round((spent / limit) * 100) : 0;
                    const isWarning = hasLimit && percent >= 80 && percent < 100;
                    const isDanger = hasLimit && percent >= 100;
                    const remaining = Math.max(0, limit - spent);

                    return (
                      <div
                        key={cat.id}
                        className={`p-3.5 sm:p-4 rounded-3xl border transition-all ${
                          isDanger
                            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/50 shadow-xs'
                            : isWarning
                            ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/50 ring-1 ring-amber-500/20 shadow-xs'
                            : hasLimit
                            ? 'bg-white dark:bg-[#1C1C1E] border-emerald-500/25 dark:border-emerald-500/20 shadow-xs'
                            : 'bg-white dark:bg-[#1C1C1E] border-slate-200/70 dark:border-white/[0.08]'
                        }`}
                      >
                        {/* Category Header Row */}
                        <div className="flex items-center justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div 
                              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border"
                              style={{ backgroundColor: `${cat.color}15`, borderColor: `${cat.color}30` }}
                            >
                              <cat.icon size={20} strokeWidth={1.8} style={{ color: cat.color }} />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                  {cat.label}
                                </h3>
                                {isWarning && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                                    80% atingido
                                  </span>
                                )}
                                {isDanger && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 shrink-0">
                                    Estourado
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Gasto atual: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(spent)}</strong>
                              </p>
                            </div>
                          </div>

                          {/* Quick Clear or Suggest Button */}
                          <div className="shrink-0">
                            {hasLimit ? (
                              <button
                                type="button"
                                onClick={() => handleClearBudget(cat.id)}
                                title="Remover teto desta categoria"
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              >
                                <Trash2 size={15} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetPreset(cat.id, Math.max(200, Math.ceil((spent * 1.2) / 50) * 50 || 500))}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 transition-colors cursor-pointer"
                              >
                                <Plus size={12} className="stroke-[2.5]" />
                                <span>Teto Sugerido</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Limit Input & Steppers */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-white/[0.04]">
                          {/* Numeric Input */}
                          <div className="relative flex-1 min-w-[140px]">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                              R$
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="0,00"
                              value={limit > 0 ? limit : ''}
                              onChange={(e) => handleValueChange(cat.id, e.target.value)}
                              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.12] text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                            />
                          </div>

                          {/* Quick Steppers: +50, +100, +500 */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleAddIncrement(cat.id, 50)}
                              className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer active:scale-95"
                            >
                              +50
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddIncrement(cat.id, 100)}
                              className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer active:scale-95"
                            >
                              +100
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddIncrement(cat.id, 500)}
                              className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer active:scale-95"
                            >
                              +500
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar & Real-time Warning */}
                        {hasLimit && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.04] space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 dark:text-slate-400">
                                {isDanger ? (
                                  <span className="text-rose-600 dark:text-rose-400 font-semibold">
                                    Excedeu {formatCurrency(spent - limit)}
                                  </span>
                                ) : (
                                  <span>
                                    Resta <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(remaining)}</strong>
                                  </span>
                                )}
                              </span>

                              <span className={`font-bold tabular-nums ${
                                isDanger ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
                              }`}>
                                {percent}%
                              </span>
                            </div>

                            <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${Math.min(100, percent)}%` }}
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isDanger
                                    ? 'bg-rose-500'
                                    : isWarning
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </main>

          {/* ========================================================================= */}
          {/* 🌟 STICKY BOTTOM ACTIONS FOOTER (Mobile Safe Area) */}
          {/* ========================================================================= */}
          <footer className="sticky bottom-0 z-20 w-full bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-white/[0.08] p-4 sm:px-6 shadow-lg">
            <div className="max-w-2xl mx-auto w-full flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  onClose();
                }}
                className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/[0.12] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Salvando alterações...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} className="stroke-[2.5]" />
                    <span>Salvar Orçamentos</span>
                  </>
                )}
              </button>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
