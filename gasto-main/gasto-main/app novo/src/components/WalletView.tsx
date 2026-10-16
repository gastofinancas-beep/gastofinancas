import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedCurrency, AnimatedCounter, CountUpCurrency } from './AnimatedCounter';
import type { LucideIcon } from 'lucide-react';
import { 
  Wallet, 
  Plus, 
  ArrowDownRight, 
  ArrowUpRight, 
  ArrowLeftRight, 
  Sliders, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Search, 
  Trash2, 
  Edit2, 
  Copy, 
  Check, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ChevronRight, 
  Filter,
  Calendar,
  Building2,
  AlertCircle,
  Clock,
  BarChart2,
  BarChart3,
  Table as TableIcon,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  X,
  Eye,
  EyeOff,
  Utensils,
  ShoppingCart,
  Car,
  Fuel,
  Home,
  HeartPulse,
  Plane,
  GraduationCap,
  ShoppingBag,
  Tv,
  BriefcaseBusiness,
  SlidersHorizontal,
  Tag
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell
} from 'recharts';
import { 
  WalletAccount, 
  WalletTransaction, 
  WalletTransactionType, 
  WalletCategory,
  CreditCard as CreditCardType,
  MonthSummary
} from '../types';
import { formatCurrency } from '../utils/financeCalculations';
import { BankLogo } from './BankLogo';

interface WalletViewProps {
  accounts: WalletAccount[];
  transactions: WalletTransaction[];
  currentMonth: string;
  onMonthChange: (month: string) => void;
  onOpenAddAccount: () => void;
  onOpenEditAccount: (account: WalletAccount) => void;
  onDeleteAccount?: (id: string) => void;
  onOpenAddTransaction: (initialMode?: 'expense' | 'income' | 'transfer' | 'adjust', accountId?: string) => void;
  onDeleteTransaction: (id: string) => void;
  creditCards?: CreditCardType[];
  monthSummary?: MonthSummary;
  isBalanceVisible: boolean;
  onToggleBalance?: () => void;
  onConfirmFutureTransaction?: (id: string) => void;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: LucideIcon }> = {
  alimentacao: { label: 'Alimentação', icon: Utensils },
  mercado: { label: 'Mercado', icon: ShoppingCart },
  transporte: { label: 'Transporte', icon: Car },
  combustivel: { label: 'Combustível', icon: Fuel },
  moradia: { label: 'Moradia & Contas', icon: Home },
  saude: { label: 'Saúde & Farmácia', icon: HeartPulse },
  lazer: { label: 'Lazer & Cinema', icon: Plane },
  educacao: { label: 'Educação', icon: GraduationCap },
  compras: { label: 'Compras', icon: ShoppingBag },
  servicos: { label: 'Serviços', icon: Tv },
  salario: { label: 'Salário', icon: Wallet },
  renda_extra: { label: 'Renda Extra', icon: BriefcaseBusiness },
  vendas: { label: 'Vendas', icon: ShoppingBag },
  transferencia: { label: 'Transferência', icon: ArrowLeftRight },
  ajuste: { label: 'Ajuste de Saldo', icon: SlidersHorizontal },
  outros: { label: 'Outros', icon: Tag },
};

export function WalletView({
  accounts,
  transactions,
  currentMonth,
  onMonthChange,
  onOpenAddAccount,
  onOpenEditAccount,
  onDeleteAccount,
  onOpenAddTransaction,
  onDeleteTransaction,
  creditCards = [],
  monthSummary,
  isBalanceVisible = true,
  onToggleBalance,
  onConfirmFutureTransaction,
}: WalletViewProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [extratoPeriodFilter, setExtratoPeriodFilter] = useState<'month' | '6m' | '12m' | 'all'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExtratoExpanded, setIsExtratoExpanded] = useState(true);
  const [copiedPixKey, setCopiedPixKey] = useState<string | null>(null);
  const [overviewMode, setOverviewMode] = useState<'chart' | 'values'>('chart');
  const [periodFilter, setPeriodFilter] = useState<'month' | '3m' | '6m' | '12m' | 'all'>('month');
  const [isOverviewOpen, setIsOverviewOpen] = useState(false); // Inicia fechado por padrão conforme solicitado
  const [accountToDelete, setAccountToDelete] = useState<WalletAccount | null>(null);

  const triggerHaptic = (duration = 10) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch {
        // Ignore haptic errors on unsupported devices
      }
    }
  };

  const realCurrentMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const isCurrentMonth = currentMonth === realCurrentMonth;
  const isFutureMonth = currentMonth > realCurrentMonth;

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const isFutureTx = (t: WalletTransaction) => {
    return t.status === 'futuro' || t.date > todayStr || !!(t.payoutDate && t.payoutDate > todayStr);
  };

  const futureTransactions = useMemo(() => {
    return transactions.filter(t => isFutureTx(t) && ['pix_in', 'deposito', 'transferencia_entrada'].includes(t.type));
  }, [transactions, todayStr]);

  const totalFutureAmount = useMemo(() => {
    return futureTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [futureTransactions]);

  // Ensure wallet never opens on a future month
  React.useEffect(() => {
    if (isFutureMonth) {
      onMonthChange(realCurrentMonth);
    }
  }, [isFutureMonth, realCurrentMonth, onMonthChange]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const prevMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(prevMonth);
  };

  const handleNextMonth = () => {
    if (isCurrentMonth || isFutureMonth) return; // Prevent advancing into the future
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    const nextMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (nextMonth <= realCurrentMonth) {
      onMonthChange(nextMonth);
    }
  };

  const monthLabel = useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [currentMonth]);

  const monthShortLabel = useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const raw = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [currentMonth]);

  // Overall Balances Calculation
  const totalBalance = useMemo(() => {
    const accountsBalance = accounts
      .filter(a => a.includeInTotal)
      .reduce((sum, a) => sum + a.currentBalance, 0);

    // Also include transactions without accounts or not in accounts list
    const unlinkedBalance = transactions
      .filter(t => !t.accountId || !accounts.some(a => a.id === t.accountId))
      .reduce((sum, t) => {
        if (isFutureTx(t)) return sum; // Don't include future in cleared balance
        if (['pix_in', 'deposito', 'transferencia_entrada'].includes(t.type)) return sum + t.amount;
        if (['pix_out', 'debito', 'dinheiro_gasto', 'transferencia_saida'].includes(t.type)) return sum - t.amount;
        return sum;
      }, 0);

    return accountsBalance + unlinkedBalance;
  }, [accounts, transactions, todayStr]);

  // Monthly stats for transactions
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(currentMonth) || (t.payoutDate && t.payoutDate.startsWith(currentMonth)));
  }, [transactions, currentMonth]);

  const monthlyDebitsPix = useMemo(() => {
    return monthTransactions
      .filter(t => ['pix_out', 'debito', 'dinheiro_gasto', 'transferencia_saida'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const monthlyIncomes = useMemo(() => {
    return monthTransactions
      .filter(t => ['pix_in', 'deposito', 'transferencia_entrada'].includes(t.type) && !isFutureTx(t))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions, todayStr]);

  const monthlyFutureIncomes = useMemo(() => {
    return monthTransactions
      .filter(t => ['pix_in', 'deposito', 'transferencia_entrada'].includes(t.type) && isFutureTx(t))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions, todayStr]);

  // Breakdown by transaction types in the current month for the values view
  const monthlyTypeBreakdown = useMemo(() => {
    const pixIn = monthTransactions.filter(t => t.type === 'pix_in' && !isFutureTx(t)).reduce((s, t) => s + t.amount, 0);
    const deposits = monthTransactions.filter(t => t.type === 'deposito' && !isFutureTx(t)).reduce((s, t) => s + t.amount, 0);
    const transfersIn = monthTransactions.filter(t => t.type === 'transferencia_entrada' && !isFutureTx(t)).reduce((s, t) => s + t.amount, 0);

    const pixOut = monthTransactions.filter(t => t.type === 'pix_out').reduce((s, t) => s + t.amount, 0);
    const debits = monthTransactions.filter(t => t.type === 'debito').reduce((s, t) => s + t.amount, 0);
    const cash = monthTransactions.filter(t => t.type === 'dinheiro_gasto').reduce((s, t) => s + t.amount, 0);
    const transfersOut = monthTransactions.filter(t => t.type === 'transferencia_saida').reduce((s, t) => s + t.amount, 0);

    return {
      pixIn,
      deposits,
      transfersIn,
      totalIncome: pixIn + deposits + transfersIn,
      pixOut,
      debits,
      cash,
      transfersOut,
      totalExpense: pixOut + debits + cash + transfersOut,
    };
  }, [monthTransactions, todayStr]);

  // Pending credit card bills this month to compare liquidity
  const pendingCardBills = useMemo(() => {
    return monthSummary?.totalPending || 0;
  }, [monthSummary]);

  const projectedRemainingAfterCards = useMemo(() => {
    return totalBalance - pendingCardBills;
  }, [totalBalance, pendingCardBills]);

  // Chart Data calculation - Purely Month by Month comparison (no weeks)
  const chartData: { label: string; fullLabel: string; key: string; income: number; expense: number; isSelected?: boolean; count?: number }[] = useMemo(() => {
    const monthCount = periodFilter === 'month' ? 1 : periodFilter === '3m' ? 3 : periodFilter === '12m' ? 12 : periodFilter === 'all' ? 24 : 6;
    const result: { label: string; fullLabel: string; key: string; income: number; expense: number; isSelected?: boolean; count?: number }[] = [];
    const [cy, cm] = currentMonth.split('-').map(Number);
    const baseDate = new Date(cy, cm - 1, 1);

    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const rawMonthName = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const label = rawMonthName.charAt(0).toUpperCase() + rawMonthName.slice(1);
      const fullLabel = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

      const mTrans = transactions.filter(t => t.date.startsWith(mKey) || (t.payoutDate && t.payoutDate.startsWith(mKey)));
      const income = mTrans
        .filter(t => ['pix_in', 'deposito', 'transferencia_entrada'].includes(t.type) && !isFutureTx(t))
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = mTrans
        .filter(t => ['pix_out', 'debito', 'dinheiro_gasto', 'transferencia_saida'].includes(t.type))
        .reduce((sum, t) => sum + t.amount, 0);

      result.push({
        label,
        fullLabel,
        key: mKey,
        income,
        expense,
        isSelected: mKey === currentMonth,
        count: mTrans.length
      });
    }
    return result;
  }, [periodFilter, currentMonth, transactions, todayStr]);

  const selectedPeriodTotals = useMemo(() => {
    const totalInc = chartData.reduce((sum, item) => sum + item.income, 0);
    const totalExp = chartData.reduce((sum, item) => sum + item.expense, 0);
    return {
      income: totalInc,
      expense: totalExp,
      monthIncome: monthlyIncomes,
      monthExpense: monthlyDebitsPix
    };
  }, [chartData, monthlyIncomes, monthlyDebitsPix]);

  // Filtered transactions for the list
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Month filter: only show current month or if searching allow all or if futuros filter is on
      const matchesMonth = searchTerm.trim() || selectedTypeFilter === 'futuros' ? true : (t.date.startsWith(currentMonth) || (t.payoutDate && t.payoutDate.startsWith(currentMonth)));
      if (!matchesMonth) return false;

      // Account filter
      if (selectedAccountId !== 'all') {
        if (t.accountId !== selectedAccountId && t.toAccountId !== selectedAccountId) {
          return false;
        }
      }

      // Type filter
      if (selectedTypeFilter === 'futuros') {
        if (!isFutureTx(t)) return false;
      } else if (selectedTypeFilter === 'pix') {
        if (!['pix_out', 'pix_in'].includes(t.type)) return false;
      } else if (selectedTypeFilter === 'debito') {
        if (t.type !== 'debito') return false;
      } else if (selectedTypeFilter === 'dinheiro') {
        if (t.type !== 'dinheiro_gasto') return false;
      } else if (selectedTypeFilter === 'saidas') {
        if (!['pix_out', 'debito', 'dinheiro_gasto', 'transferencia_saida'].includes(t.type)) return false;
      } else if (selectedTypeFilter === 'entradas') {
        if (!['pix_in', 'deposito', 'transferencia_entrada'].includes(t.type)) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const descMatch = t.description.toLowerCase().includes(query);
        const recipientMatch = t.recipientOrPayer?.toLowerCase().includes(query);
        const catMatch = t.category.toLowerCase().includes(query);
        const notesMatch = t.notes?.toLowerCase().includes(query);
        if (!descMatch && !recipientMatch && !catMatch && !notesMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort newest first
      const dateA = a.payoutDate || a.date;
      const dateB = b.payoutDate || b.date;
      return new Date(`${dateB}T${b.time || '00:00'}`).getTime() - new Date(`${dateA}T${a.time || '00:00'}`).getTime();
    });
  }, [transactions, currentMonth, selectedAccountId, selectedTypeFilter, searchTerm, todayStr]);

  const handleCopyPix = (pixKey?: string) => {
    if (!pixKey) return;
    navigator.clipboard.writeText(pixKey);
    setCopiedPixKey(pixKey);
    setTimeout(() => setCopiedPixKey(null), 2000);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 🌟 SALDO TOTAL & AÇÕES DA CARTEIRA */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden bg-white dark:bg-[#1C1C1E] rounded-[28px] p-5 sm:p-7 border border-slate-200/60 dark:border-white/[0.08] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.25)] space-y-5">
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-52 h-52 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Top title, Total Balance & Action Buttons */}
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Wallet size={18} className="stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Saldo Total da Carteira
              </span>
            </div>
          </div>

          {onToggleBalance && (
            <button
              type="button"
              id="wallet-toggle-balance-visibility"
              onClick={() => {
                triggerHaptic(15);
                onToggleBalance();
              }}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.10] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
              title={isBalanceVisible ? "Ocultar saldo" : "Mostrar saldo"}
              aria-label={isBalanceVisible ? "Ocultar saldo" : "Mostrar saldo"}
            >
              {isBalanceVisible ? (
                <Eye size={17} className="stroke-[2.2]" />
              ) : (
                <EyeOff size={17} className="stroke-[2.2]" />
              )}
            </button>
          )}
        </div>

        {/* Main Balance Value & Cash Flow Pulse */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-baseline gap-1">
            <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              {isBalanceVisible ? (
                <AnimatedCurrency value={totalBalance} />
              ) : (
                '••••••'
              )}
            </h2>
          </div>

          {/* Clean Monthly Flow Row (Flat, Uncluttered, Anti-Slop Compliant) */}
          <div className="pt-3 pb-1 border-t border-slate-100 dark:border-white/[0.06] flex flex-col gap-2.5">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center">
              {/* Entradas do Mês */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <ArrowUpRight size={13} className="text-emerald-500 shrink-0 stroke-[2.4]" />
                  <span className="truncate">Entradas</span>
                </div>
                <div className={`text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums ${!isBalanceVisible ? 'filter blur-[5px] select-none pointer-events-none opacity-50' : ''}`}>
                  <AnimatedCurrency value={monthlyIncomes} prefix="+R$ " />
                </div>
              </div>

              {/* Saídas do Mês */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <ArrowDownRight size={13} className="text-rose-500 shrink-0 stroke-[2.4]" />
                  <span className="truncate">Saídas</span>
                </div>
                <div className={`text-xs sm:text-sm font-bold ${monthlyDebitsPix > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'} tabular-nums ${!isBalanceVisible ? 'filter blur-[5px] select-none pointer-events-none opacity-50' : ''}`}>
                  <AnimatedCurrency value={monthlyDebitsPix} prefix={monthlyDebitsPix > 0 ? "-R$ " : "R$ "} />
                </div>
              </div>

              {/* Balanço Líquido do Mês */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <TrendingUp size={13} className={monthlyIncomes - monthlyDebitsPix >= 0 ? "text-emerald-500 shrink-0 stroke-[2.4]" : "text-rose-500 shrink-0 stroke-[2.4]"} />
                  <span className="truncate">Resultado</span>
                </div>
                <div className={`text-xs sm:text-sm font-bold tabular-nums ${
                  monthlyIncomes - monthlyDebitsPix >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                } ${!isBalanceVisible ? 'filter blur-[5px] select-none pointer-events-none opacity-50' : ''}`}>
                  <AnimatedCurrency value={Math.abs(monthlyIncomes - monthlyDebitsPix)} prefix={monthlyIncomes - monthlyDebitsPix >= 0 ? "+R$ " : "-R$ "} />
                </div>
              </div>
            </div>

            {/* Micro visual progress bar */}
            {(monthlyIncomes > 0 || monthlyDebitsPix > 0) && (
              <div className="w-full pt-1">
                <div className="w-full h-1.5 bg-slate-100 dark:bg-white/[0.08] rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((monthlyIncomes / (monthlyIncomes + monthlyDebitsPix || 1)) * 100)}%` }}
                  />
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((monthlyDebitsPix / (monthlyIncomes + monthlyDebitsPix || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Future Payouts Alert Banner (Uber/99 or scheduled earnings) */}
          {totalFutureAmount > 0 && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Clock size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                      Lançamentos Futuros a Receber
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200/80 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300">
                      {futureTransactions.length} {futureTransactions.length === 1 ? 'repasse' : 'repasses'}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                    Ganhos de motorista / entregas que cairão nos próximos dias
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className={`text-xs sm:text-sm font-extrabold text-amber-800 dark:text-amber-300 tabular-nums ${!isBalanceVisible ? 'filter blur-[5px] select-none' : ''}`}>
                  <AnimatedCurrency value={totalFutureAmount} prefix="+R$ " />
                </span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    setSelectedTypeFilter('futuros');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  Ver Lista
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Action Tiles - 4 Columns */}
        <div className="relative z-10 grid grid-cols-4 gap-1.5 sm:gap-4 pt-1">
          {/* 1. Entrada */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              onOpenAddTransaction('income');
            }}
            className="group flex flex-col items-center justify-start p-1 sm:p-2 rounded-2xl transition-all cursor-pointer active:scale-95 text-center focus:outline-none"
          >
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:bg-emerald-600 group-hover:scale-105 transition-all">
              <ArrowUpRight size={20} className="stroke-[2.5]" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2 whitespace-nowrap tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Entrada
            </span>
          </button>

          {/* 2. Saída */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              onOpenAddTransaction('expense');
            }}
            className="group flex flex-col items-center justify-start p-1 sm:p-2 rounded-2xl transition-all cursor-pointer active:scale-95 text-center focus:outline-none"
          >
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25 group-hover:bg-rose-600 group-hover:scale-105 transition-all">
              <ArrowDownRight size={20} className="stroke-[2.5]" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2 whitespace-nowrap tracking-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              Saída
            </span>
          </button>

          {/* 3. Transferir */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              onOpenAddTransaction('transfer');
            }}
            className="group flex flex-col items-center justify-start p-1 sm:p-2 rounded-2xl transition-all cursor-pointer active:scale-95 text-center focus:outline-none"
            title="Transferência entre contas próprias"
          >
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/25 group-hover:bg-blue-700 group-hover:scale-105 transition-all">
              <ArrowLeftRight size={19} className="stroke-[2.3]" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2 whitespace-nowrap tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Transferir
            </span>
          </button>

          {/* 4. Nova Conta */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              onOpenAddAccount();
            }}
            className="group flex flex-col items-center justify-start p-1 sm:p-2 rounded-2xl transition-all cursor-pointer active:scale-95 text-center focus:outline-none"
          >
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-md shadow-slate-900/15 group-hover:bg-slate-800 dark:group-hover:bg-slate-100 group-hover:scale-105 transition-all">
              <Plus size={20} className="stroke-[2.5]" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2 whitespace-nowrap tracking-tight group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              Nova Conta
            </span>
          </button>
        </div>

        {/* Visão Geral Header with Expand/Collapse Menu (Closed by default) */}
        <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] relative z-10">
          <button
            type="button"
            onClick={() => {
              setIsOverviewOpen(!isOverviewOpen);
              triggerHaptic(8);
            }}
            className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 hover:bg-slate-100/80 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] border border-slate-200/50 dark:border-white/[0.06] transition-all cursor-pointer group select-none text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                <BarChart3 size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                    Gráficos e Demonstrativo do Fluxo
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    {periodFilter === 'month' ? 'Mês Atual' : periodFilter === '3m' ? 'Últimos 3 Meses' : periodFilter === '12m' ? 'Últimos 12 Meses' : periodFilter === 'all' ? 'Histórico Completo' : 'Últimos 6 Meses'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isOverviewOpen 
                    ? 'Toque para recolher os gráficos' 
                    : 'Acompanhe comparativo de entradas e saídas no tempo'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-block text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                {isOverviewOpen ? 'Recolher' : 'Abrir Análise'}
              </span>
              <div className={`w-7 h-7 rounded-lg bg-white dark:bg-[#2C2C2E] flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-2xs transition-transform duration-200 ${isOverviewOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''}`}>
                <ChevronDown size={15} />
              </div>
            </div>
          </button>

          {/* Collapsible Content */}
          <AnimatePresence initial={false}>
            {isOverviewOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="pt-5 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                          Detalhamento Mensal
                        </h4>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          {periodFilter === 'month' ? 'Mês Atual' : periodFilter === '3m' ? 'Últimos 3 Meses' : periodFilter === '12m' ? 'Últimos 12 Meses' : periodFilter === 'all' ? 'Histórico Completo' : 'Últimos 6 Meses'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {overviewMode === 'chart' 
                          ? 'Acompanhe quanto entrou e quanto saiu a cada mês' 
                          : 'Demonstrativo e análise detalhada dos valores por mês'}
                      </p>
                    </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Month Navigation for Quick browsing past months */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-[#2C2C2E] rounded-xl border border-slate-200/60 dark:border-white/[0.10]/60">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  title="Mês Anterior"
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08] transition-all cursor-pointer"
                >
                  <ChevronLeft size={15} />
                </button>

                <span className="px-2 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 select-none capitalize">
                  <Calendar size={13} className="text-emerald-600 dark:text-emerald-400" />
                  {monthLabel}
                </span>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={isCurrentMonth || isFutureMonth}
                  title={isCurrentMonth ? 'Você já está no mês atual' : 'Próximo Mês'}
                  className={`p-1.5 rounded-lg transition-all ${
                    isCurrentMonth || isFutureMonth
                      ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-40'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08] cursor-pointer'
                  }`}
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* Quick Jump back to current month if viewing history */}
              {!isCurrentMonth && (
                <button
                  type="button"
                  onClick={() => onMonthChange(realCurrentMonth)}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200/80 dark:border-emerald-800/60 transition-all cursor-pointer"
                >
                  Voltar ao Mês Atual
                </button>
              )}

              {/* Toggle Gráfico / Valores */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-[#2C2C2E] rounded-xl border border-slate-200/60 dark:border-white/[0.10]/60">
                <button
                  type="button"
                  onClick={() => setOverviewMode('chart')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    overviewMode === 'chart'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BarChart3 size={14} />
                  <span>Gráfico</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOverviewMode('values')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    overviewMode === 'values'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <TableIcon size={14} />
                  <span>Valores</span>
                </button>
              </div>

              {/* Period Dropdown */}
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as any)}
                aria-label="Filtrar período do overview"
                className="px-3 py-1.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200/60 dark:border-white/[0.10] rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="month">Mês Atual</option>
                <option value="3m">Últimos 3 meses</option>
                <option value="6m">Últimos 6 meses</option>
                <option value="12m">Últimos 12 meses (1 ano)</option>
                <option value="all">Todo o Histórico</option>
              </select>
            </div>
          </div>

          {/* MAIN OVERVIEW CONTENT: CHART OR VALUES */}
          <AnimatePresence mode="wait">
            {overviewMode === 'chart' ? (
              <motion.div
                key="chart"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Bar Chart Container */}
                <div className="w-full h-64 sm:h-72 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      barGap={6}
                    >
                      <CartesianGrid 
                        strokeDasharray="4 4" 
                        vertical={false} 
                        stroke="#E2E8F0" 
                        className="dark:opacity-15"
                      />
                      <XAxis 
                        dataKey="label" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                        dy={8}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94A3B8', fontSize: 11 }}
                        tickFormatter={(val) => {
                          if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                          if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                          return `${val}`;
                        }}
                      />
                      <RechartsTooltip 
                        cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const inc = Number(payload.find((p: any) => p.dataKey === 'income')?.value || 0);
                            const exp = Number(payload.find((p: any) => p.dataKey === 'expense')?.value || 0);
                            const itemData = chartData.find(d => d.label === label);
                            return (
                              <div className="bg-slate-900 dark:bg-[#09090B] text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-2 min-w-[190px]">
                                <p className="font-bold text-slate-300 border-b border-slate-800 pb-1.5 capitalize">
                                  {itemData?.fullLabel || label}
                                </p>
                                <div className="flex items-center justify-between gap-3 text-emerald-300">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    <span>Entrada (Quanto entrou):</span>
                                  </div>
                                  <span className="font-bold tabular-nums text-emerald-400">+{formatCurrency(inc)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 text-rose-300">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                    <span>Saída (Quanto saiu):</span>
                                  </div>
                                  <span className="font-bold tabular-nums text-rose-400">-{formatCurrency(exp)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-slate-800 text-slate-400">
                                  <span className="font-semibold">Saldo Líquido:</span>
                                  <span className={`font-bold tabular-nums ${inc - exp >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {formatCurrency(inc - exp)}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {/* Entrada Bar: Emerald Green */}
                      <Bar 
                        dataKey="income" 
                        name="Entrada (Quanto entrou)" 
                        fill="#10B981" 
                        radius={[8, 8, 8, 8]} 
                        maxBarSize={22}
                      />
                      {/* Saída Bar: Rose Red */}
                      <Bar 
                        dataKey="expense" 
                        name="Saída (Quanto saiu)" 
                        fill="#F43F5E" 
                        radius={[8, 8, 8, 8]} 
                        maxBarSize={22} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 pt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>Entrada (Quanto entrou)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span>Saída (Quanto saiu)</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* VALUES VIEW (Detailed and Fixed Breakdown) */
              <motion.div
                key="values"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Consolidated Summary Banner */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-slate-50 to-slate-100 dark:from-emerald-950/30 dark:via-slate-900/60 dark:to-[#1C1C1E] border border-emerald-200/60 dark:border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100-700 dark:text-emerald-400">
                        Resumo do Período ({periodFilter === 'month' ? 'Mês Atual' : periodFilter === '3m' ? 'Últimos 3 Meses' : periodFilter === '12m' ? 'Últimos 12 Meses' : periodFilter === 'all' ? 'Histórico Completo' : 'Últimos 6 Meses'})
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                      {chartData.reduce((s, d) => s + (d.count || 0), 0)} movimentações no período selecionado
                    </p>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
                    <div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Total Entradas (Quanto entrou)</span>
                      <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        <CountUpCurrency value={selectedPeriodTotals.income} prefix="+R$ " isVisible={isBalanceVisible} />
                      </span>
                    </div>

                    <div className="w-px h-8 bg-slate-200 dark:bg-[#3A3A3C] hidden sm:block" />

                    <div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Total Saídas (Quanto saiu)</span>
                      <span className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        <CountUpCurrency value={selectedPeriodTotals.expense} prefix="-R$ " isVisible={isBalanceVisible} />
                      </span>
                    </div>

                    <div className="w-px h-8 bg-slate-200 dark:bg-[#3A3A3C] hidden sm:block" />

                    <div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Saldo Líquido</span>
                      <span className={`text-base sm:text-lg font-bold tabular-nums ${
                        (selectedPeriodTotals.income - selectedPeriodTotals.expense) >= 0 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        <CountUpCurrency 
                          value={selectedPeriodTotals.income - selectedPeriodTotals.expense} 
                          prefix={(selectedPeriodTotals.income - selectedPeriodTotals.expense) >= 0 ? "+R$ " : "-R$ "} 
                          isVisible={isBalanceVisible} 
                        />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Breakdown by Payment/Transaction Method for Month View */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-200/70 dark:border-white/[0.10]/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Pix Recebido</span>
                    <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                      <CountUpCurrency value={monthlyTypeBreakdown.pixIn} prefix="+R$ " isVisible={isBalanceVisible} />
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-200/70 dark:border-white/[0.10]/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Depósitos</span>
                    <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                      <CountUpCurrency value={monthlyTypeBreakdown.deposits} prefix="+R$ " isVisible={isBalanceVisible} />
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-200/70 dark:border-white/[0.10]/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Pix Enviado</span>
                    <p className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
                      <CountUpCurrency value={monthlyTypeBreakdown.pixOut} prefix="-R$ " isVisible={isBalanceVisible} />
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-200/70 dark:border-white/[0.10]/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Débito em Conta</span>
                    <p className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
                      <CountUpCurrency value={monthlyTypeBreakdown.debits} prefix="-R$ " isVisible={isBalanceVisible} />
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-200/70 dark:border-white/[0.10]/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Dinheiro Gasto</span>
                    <p className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">
                      <CountUpCurrency value={monthlyTypeBreakdown.cash} prefix="-R$ " isVisible={isBalanceVisible} />
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#2C2C2E]/50 border border-slate-200/70 dark:border-white/[0.10]/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Transf. Internas</span>
                    <p className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums mt-0.5">
                      <CountUpCurrency value={monthlyTypeBreakdown.transfersIn} prefix="R$ " isVisible={isBalanceVisible} />
                    </p>
                  </div>
                </div>

                {/* Monthly Cards Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  {chartData.map((item, idx) => {
                    const net = item.income - item.expense;
                    const hasActivity = item.income > 0 || item.expense > 0;
                    return (
                      <div 
                        key={idx}
                        className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
                          item.isSelected 
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 shadow-xs' 
                            : 'bg-slate-50 dark:bg-[#2C2C2E]/60 border-slate-200/70 dark:border-white/[0.10]/60 hover:border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">
                              {item.fullLabel || item.label}
                            </span>
                            {item.isSelected && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white">
                                Selecionado
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            !hasActivity
                              ? 'bg-slate-100 text-slate-500 dark:bg-[#3A3A3C]/50 dark:text-slate-400'
                              : net >= 0 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}>
                            {!hasActivity ? 'Sem Movimento' : net >= 0 ? 'Superávit' : 'Déficit'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              Entrada (Quanto entrou):
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                              +{formatCurrency(item.income)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              Saída (Quanto saiu):
                            </span>
                            <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                              -{formatCurrency(item.expense)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-white/[0.10]">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Resultado Líquido:</span>
                            <span className={`font-bold tabular-nums ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {formatCurrency(net)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        {/* TWO SIGNATURE CARDS: ENTRADA (GREEN) & SAÍDA (RED) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          {/* ENTRADA CARD (Emerald Green Gradient with Down Arrow) */}
          <div className="relative overflow-hidden rounded-[26px] p-5 sm:p-6 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-md shadow-emerald-900/15">
            {/* Concentric circles and arrow watermark */}
            <div className="absolute right-3 bottom-0 w-36 h-36 border border-white/10 rounded-full pointer-events-none" />
            <div className="absolute right-8 bottom-0 w-24 h-24 border border-white/10 rounded-full pointer-events-none" />
            <div className="absolute right-4 bottom-2 text-white/10 pointer-events-none select-none">
              <ArrowDown size={110} strokeWidth={2.5} />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full min-h-[120px]">
              {/* White badge with down arrow */}
              <div className="w-9 h-9 rounded-full bg-white text-emerald-700 flex items-center justify-center shadow-md">
                <ArrowDown size={18} className="stroke-[2.8]" />
              </div>

              <div className="mt-6 space-y-0.5">
                <span className="text-xs font-bold text-emerald-100">
                  Entrada (Quanto entrou)
                </span>
                <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  <span className={`inline-block transition-all duration-300 ${!isBalanceVisible ? 'filter blur-[7px] select-none pointer-events-none opacity-50' : 'filter blur-0 opacity-100'}`}>
                    <AnimatedCurrency value={monthlyIncomes} prefix="+R$ " />
                  </span>
                </p>
                <p className="text-[11px] text-emerald-200/90">
                  {monthTransactions.filter(t => ['pix_in', 'deposito', 'transferencia_entrada'].includes(t.type)).length} entradas em {monthLabel}
                </p>
              </div>
            </div>
          </div>

          {/* SAÍDA CARD (Rose / Red Gradient with Up Arrow) */}
          <div className="relative overflow-hidden rounded-[26px] p-5 sm:p-6 bg-gradient-to-br from-rose-600 via-rose-700 to-red-800 text-white shadow-md shadow-rose-900/15">
            {/* Concentric circles and arrow watermark */}
            <div className="absolute right-3 bottom-0 w-36 h-36 border border-white/10 rounded-full pointer-events-none" />
            <div className="absolute right-8 bottom-0 w-24 h-24 border border-white/10 rounded-full pointer-events-none" />
            <div className="absolute right-4 bottom-2 text-white/10 pointer-events-none select-none">
              <ArrowUp size={110} strokeWidth={2.5} />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full min-h-[120px]">
              {/* White badge with up arrow */}
              <div className="w-9 h-9 rounded-full bg-white text-rose-700 flex items-center justify-center shadow-md">
                <ArrowUp size={18} className="stroke-[2.8]" />
              </div>

              <div className="mt-6 space-y-0.5">
                <span className="text-xs font-bold text-rose-100">
                  Saída (Quanto saiu)
                </span>
                <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  <span className={`inline-block transition-all duration-300 ${!isBalanceVisible ? 'filter blur-[7px] select-none pointer-events-none opacity-50' : 'filter blur-0 opacity-100'}`}>
                    <AnimatedCurrency value={monthlyDebitsPix} prefix="-R$ " />
                  </span>
                </p>
                <p className="text-[11px] text-rose-200/90">
                  {monthTransactions.filter(t => ['pix_out', 'debito', 'dinheiro_gasto', 'transferencia_saida'].includes(t.type)).length} saídas em {monthLabel}
                </p>
              </div>
            </div>
          </div>

        </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

      {/* Month Navigator Header (History & Current Month only) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white dark:bg-[#1C1C1E] p-3 sm:px-4 rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-xs">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Calendar size={16} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white capitalize">
                Extrato: {monthLabel}
              </span>
            </div>
          </div>

          <div>
            {isCurrentMonth ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Mês Atual
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-normal text-slate-500 bg-slate-100 dark:bg-[#2C2C2E] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.10]/50">
                Histórico Passado
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 self-end sm:self-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="flex-1 sm:flex-none px-3 py-1.5 text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-[#2C2C2E]/80 dark:hover:bg-white/[0.04] rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1 border border-slate-200/60 dark:border-white/[0.10]/50"
            title="Ver extrato do mês anterior"
          >
            ← Anterior
          </button>
          
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={() => onMonthChange(realCurrentMonth)}
              className="flex-1 sm:flex-none px-3 py-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer text-center"
            >
              Mês Atual
            </button>
          )}

          <button
            type="button"
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 border ${
              isCurrentMonth
                ? 'text-slate-300 dark:text-slate-600 bg-slate-50/50 dark:bg-[#2C2C2E]/30 border-transparent cursor-not-allowed opacity-40'
                : 'text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-[#2C2C2E]/80 dark:hover:bg-white/[0.04] border-slate-200/60 dark:border-white/[0.10]/50 cursor-pointer'
            }`}
            title={isCurrentMonth ? 'Não é possível avançar: o saldo bancário reflete apenas o momento atual e histórico.' : 'Próximo mês'}
          >
            Próximo →
          </button>
        </div>
      </div>

      {/* KPI Top Cards - 2 Per Row (2 Columns) on Mobile, 4 on Large Screens */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* 1. Monthly Net Balance (Resultado do Mês) */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-xs hover:border-emerald-500/30 dark:hover:border-white/[0.14] transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold ${
                monthlyIncomes - monthlyDebitsPix >= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}>
                {monthlyIncomes - monthlyDebitsPix >= 0 ? (
                  <TrendingUp size={18} />
                ) : (
                  <TrendingDown size={18} />
                )}
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                monthlyIncomes - monthlyDebitsPix >= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}>
                {monthlyIncomes - monthlyDebitsPix >= 0 ? 'Superávit' : 'Déficit'}
              </span>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 line-clamp-1">
              Resultado do Mês
            </span>
            <p className={`text-base sm:text-xl font-bold tracking-tight mt-1 tabular-nums ${
              monthlyIncomes - monthlyDebitsPix >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              <CountUpCurrency 
                value={monthlyIncomes - monthlyDebitsPix} 
                prefix={monthlyIncomes - monthlyDebitsPix >= 0 ? "+R$ " : "-R$ "} 
                isVisible={isBalanceVisible} 
              />
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.08]/60 flex items-center justify-between text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
            <span>{monthTransactions.length} transações</span>
            <span className="font-medium">Líquido</span>
          </div>
        </div>

        {/* 2. Monthly Debits & Pix Out */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-xs hover:border-rose-500/30 dark:hover:border-white/[0.14] transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <ArrowDownRight size={18} />
              </div>
              <ArrowDownRight size={14} className="text-slate-300 dark:text-slate-600" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 line-clamp-1">
              Gastos Pix / Débito
            </span>
            <p className="text-base sm:text-xl font-bold text-rose-600 dark:text-rose-400 tracking-tight mt-1 tabular-nums">
              <CountUpCurrency value={monthlyDebitsPix} prefix="R$ " isVisible={isBalanceVisible} />
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.08]/60 flex items-center justify-between text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
            <span>{monthTransactions.filter(t => ['pix_out', 'debito', 'dinheiro_gasto'].includes(t.type)).length} saídas</span>
            <span className="text-rose-500 font-medium">No mês</span>
          </div>
        </div>

        {/* 3. Monthly Incomes / Pix In */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-xs hover:border-emerald-500/30 dark:hover:border-white/[0.14] transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <ArrowUpRight size={18} />
              </div>
              <ArrowUpRight size={14} className="text-slate-300 dark:text-slate-600" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 line-clamp-1">
              Entradas / Depósitos
            </span>
            <p className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight mt-1 tabular-nums">
              <CountUpCurrency value={monthlyIncomes} prefix="R$ " isVisible={isBalanceVisible} />
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.08]/60 flex items-center justify-between text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
            <span>{monthlyFutureIncomes > 0 ? `+ ${formatCurrency(monthlyFutureIncomes)} a cair` : 'Depósitos / Pix'}</span>
            <span className="text-emerald-500 font-medium">No mês</span>
          </div>
        </div>

        {/* 4. Liquidity Post-Cards */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-xs hover:border-blue-500/30 dark:hover:border-white/[0.14] transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold ${
                projectedRemainingAfterCards >= 0 
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}>
                <DollarSign size={18} />
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                projectedRemainingAfterCards >= 0
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}>
                {projectedRemainingAfterCards >= 0 ? 'Positivo' : 'Alerta'}
              </span>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 line-clamp-1">
              Saldo pós-faturas
            </span>
            <p className={`text-base sm:text-xl font-bold tracking-tight mt-1 tabular-nums ${
              projectedRemainingAfterCards >= 0 
                ? 'text-slate-900 dark:text-white' 
                : 'text-amber-600 dark:text-amber-400'
            }`}>
              <CountUpCurrency value={projectedRemainingAfterCards} prefix="R$ " isVisible={isBalanceVisible} />
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.08]/60 flex items-center justify-between text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
            <span>Faturas: <CountUpCurrency value={pendingCardBills} prefix="R$ " isVisible={isBalanceVisible} /></span>
            <span className="font-medium">Líquido</span>
          </div>
        </div>

      </div>

      {/* Bank Accounts Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-emerald-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Minhas Contas Bancárias & Carteiras ({accounts.length})
            </h2>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
              Total: <CountUpCurrency value={totalBalance} isVisible={isBalanceVisible} />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAddAccount}
              className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1 py-1 px-1.5"
            >
              <Plus size={14} />
              <span>Nova Conta</span>
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {accounts.map((account) => {
            return (
              <motion.div
                key={account.id}
                whileHover={{ y: -2 }}
                className="relative rounded-3xl p-5 bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Decorative top accent glow */}
                <div 
                  className="absolute top-0 inset-x-0 h-1.5" 
                  style={{ backgroundColor: account.color }}
                />

                {/* Account Top Row */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BankLogo bankName={account.institution || account.name} size={36} className="shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {account.name}
                          </h3>
                          {account.isDefault && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                              Padrão
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                          {account.accountType === 'corrente' && 'Conta Corrente'}
                          {account.accountType === 'pagamentos' && 'Conta Pagamentos / Digital'}
                          {account.accountType === 'poupanca' && 'Poupança'}
                          {account.accountType === 'dinheiro' && 'Dinheiro Físico'}
                          {account.accountType === 'investimento' && 'Investimentos'}
                          {account.accountType === 'outros' && 'Outro'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenEditAccount(account)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        title="Editar conta"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(12);
                          setAccountToDelete(account);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Excluir conta"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Current Balance */}
                  <div className="mt-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                      Saldo Disponível
                    </span>
                    <p className={`text-2xl font-bold tracking-tight mt-0.5 ${
                      account.currentBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {isBalanceVisible ? (
                        <CountUpCurrency value={account.currentBalance} />
                      ) : (
                        '••••••'
                      )}
                    </p>
                  </div>
                </div>

                {/* Pix Key & Bottom Quick Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-2.5">
                  {account.pixKey && (
                    <div className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-black/20 p-2 rounded-xl border border-slate-200/60 dark:border-white/[0.04]">
                      <span className="text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                        <QrCode size={12} className="text-emerald-500" />
                        Pix: <strong className="text-slate-800 dark:text-slate-200 font-mono">{account.pixKey}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyPix(account.pixKey)}
                        className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer p-0.5"
                        title="Copiar Chave Pix"
                      >
                        {copiedPixKey === account.pixKey ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenAddTransaction('expense', account.id)}
                      className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <ArrowDownRight size={13} className="text-rose-500" />
                      <span>- Gasto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenAddTransaction('income', account.id)}
                      className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <ArrowUpRight size={13} className="text-emerald-500" />
                      <span>+ Entrada</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenAddTransaction('adjust', account.id)}
                      className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center justify-center"
                      title="Ajustar saldo desta conta"
                    >
                      <Sliders size={13} />
                    </button>
                  </div>
                </div>

              </motion.div>
            );
          })}

          {/* Quick Add Account Card */}
          {accounts.length === 0 ? (
            <div className="col-span-full">
              <button
                type="button"
                onClick={onOpenAddAccount}
                className="w-full rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 p-8 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer group select-none"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all shadow-2xs group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-slate-950">
                  <Plus size={24} className="stroke-[2.5]" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    Cadastrar Primeira Conta
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Crie uma conta corrente, poupança, investimento ou controle de dinheiro físico.
                  </p>
                </div>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAddAccount}
              className="min-h-[200px] rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 p-5 flex flex-col items-center justify-center text-center gap-2.5 transition-all cursor-pointer group select-none"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                <Plus size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Cadastrar Outra Conta
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Nubank, Inter, Itaú, Mercado Pago, PicPay ou Carteira Física
                </p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Transactions History (Extrato) com animação de arrastar / expandir / recolher */}
      <motion.div 
        layout
        className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-slate-200/60 dark:border-white/[0.08] shadow-sm overflow-hidden transition-all duration-300"
      >
        {/* iOS-Style Drag Handle & Gesture Zone */}
        <motion.div
          onPanEnd={(_e, info) => {
            if (info.offset.y > 25 || info.velocity.y > 120) {
              if (isExtratoExpanded) {
                setIsExtratoExpanded(false);
                triggerHaptic(12);
              }
            } else if (info.offset.y < -25 || info.velocity.y < -120) {
              if (!isExtratoExpanded) {
                setIsExtratoExpanded(true);
                triggerHaptic(12);
              }
            }
          }}
          onClick={() => {
            setIsExtratoExpanded(!isExtratoExpanded);
            triggerHaptic(12);
          }}
          className="pt-3 pb-1.5 px-4 flex flex-col items-center justify-center cursor-pointer select-none group touch-none hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors border-b border-transparent hover:border-slate-100 dark:hover:border-white/[0.04]"
          title={isExtratoExpanded ? "Toque ou arraste para recolher o extrato" : "Toque ou arraste para expandir o extrato"}
        >
          <motion.div 
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-white/20 group-hover:bg-emerald-500/70 transition-colors" 
          />
          <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {isExtratoExpanded ? (
              <>
                <span>Arraste ou toque para recolher</span>
                <ChevronDown size={12} className="group-hover:translate-y-0.5 transition-transform" />
              </>
            ) : (
              <>
                <span>Arraste ou toque para ver extrato completo</span>
                <ChevronUp size={12} className="group-hover:-translate-y-0.5 transition-transform" />
              </>
            )}
          </div>
        </motion.div>

        {/* Collapsed Peek Header */}
        {!isExtratoExpanded ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsExtratoExpanded(true);
              triggerHaptic(12);
            }}
            className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Wallet size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Extrato da Carteira & Movimentações
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {filteredTransactions.length} movimentação(ões) no período
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Ver Extrato
              </span>
              <ChevronUp size={16} className="text-slate-400 animate-bounce" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Extrato Header & Filters */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.08]/80 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Extrato da Carteira & Movimentações
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Histórico detalhado de Pix, compras no débito, dinheiro e depósitos
                  </p>
                </div>

                {/* Account Selector Dropdown */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-emerald-500 font-semibold cursor-pointer"
                  >
                    <option value="all">Todas as Contas</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => onOpenAddTransaction('expense')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Plus size={14} />
                    <span>Novo</span>
                  </button>
                </div>
              </div>

              {/* Search and Type Filter Pills */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                {/* Search Input */}
                <div className="relative w-full sm:w-72">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por descrição, lugar, valor..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Type Filters */}
                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'entradas', label: 'Entradas' },
                    { id: 'saidas', label: 'Saídas' },
                    ...(futureTransactions.length > 0 ? [{ id: 'futuros', label: `A Receber (${futureTransactions.length})`, hasClock: true }] : []),
                    { id: 'pix', label: 'Pix' },
                    { id: 'debito', label: 'Débito' },
                    { id: 'dinheiro', label: 'Dinheiro' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setSelectedTypeFilter(filter.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 inline-flex items-center gap-1 ${
                        selectedTypeFilter === filter.id
                          ? filter.id === 'futuros'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs font-bold'
                          : filter.id === 'futuros'
                            ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                      }`}
                    >
                      {'hasClock' in filter && filter.hasClock && <Clock size={12} className="stroke-[2]" />}
                      <span>{filter.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Transactions List */}
            {filteredTransactions.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-slate-400 mx-auto flex items-center justify-center mb-3">
                  <Wallet size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Nenhuma movimentação encontrada
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchTerm 
                    ? 'Nenhum lançamento corresponde ao termo buscado.'
                    : 'Registre seus gastos no Pix, Débito ou entradas para atualizar seu saldo.'}
                </p>
                <button
                  type="button"
                  onClick={() => onOpenAddTransaction('expense')}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Registrar Primeiro Gasto</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {filteredTransactions.map((tx) => {
                  const account = accounts.find(a => a.id === tx.accountId);
                  const isExit = ['pix_out', 'debito', 'dinheiro_gasto', 'transferencia_saida'].includes(tx.type);
                  const categoryInfo = CATEGORY_LABELS[tx.category] || { label: tx.category, icon: Tag };
                  const CategoryIconComp = categoryInfo.icon;
                  const isFuture = isFutureTx(tx);
                  const displayDate = tx.payoutDate || tx.date;

                  return (
                    <div
                      key={tx.id}
                      className={`p-3.5 sm:p-4 transition-colors flex items-center justify-between gap-3 group ${
                        isFuture
                          ? 'bg-amber-500/[0.04] dark:bg-amber-500/[0.03] hover:bg-amber-500/[0.08] dark:hover:bg-amber-500/[0.06]'
                          : 'hover:bg-slate-50/80 dark:hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Left: Type Icon & Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                          isFuture ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                          tx.type === 'pix_out' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' :
                          tx.type === 'debito' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' :
                          tx.type === 'dinheiro_gasto' ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400' :
                          tx.type === 'transferencia_saida' || tx.type === 'transferencia_entrada' ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400' :
                          tx.type === 'ajuste' ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' :
                          'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {isFuture ? <Clock size={18} /> : (
                            <>
                              {tx.type === 'pix_out' && <QrCode size={18} />}
                              {tx.type === 'pix_in' && <QrCode size={18} />}
                              {tx.type === 'debito' && <CreditCard size={18} />}
                              {tx.type === 'dinheiro_gasto' && <Banknote size={18} />}
                              {tx.type === 'deposito' && <ArrowUpRight size={18} />}
                              {tx.type === 'transferencia_saida' && <ArrowLeftRight size={18} />}
                              {tx.type === 'transferencia_entrada' && <ArrowLeftRight size={18} />}
                              {tx.type === 'ajuste' && <Sliders size={18} />}
                            </>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {tx.description}
                            </h4>
                            
                            {/* Type & Status Badges */}
                            {isFuture ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1">
                                <Clock size={10} />
                                <span>Previsto: {new Date(displayDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                              </span>
                            ) : (
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                tx.type === 'pix_out' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                tx.type === 'debito' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                tx.type === 'dinheiro_gasto' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' :
                                tx.type === 'pix_in' || tx.type === 'deposito' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400'
                              }`}>
                                {tx.type === 'pix_out' && 'Pix Pago'}
                                {tx.type === 'pix_in' && 'Pix Recebido'}
                                {tx.type === 'debito' && 'Débito'}
                                {tx.type === 'dinheiro_gasto' && 'Dinheiro'}
                                {tx.type === 'deposito' && 'Depósito'}
                                {tx.type === 'transferencia_saida' && 'Transferência (Saída)'}
                                {tx.type === 'transferencia_entrada' && 'Transferência (Entrada)'}
                                {tx.type === 'ajuste' && 'Ajuste'}
                              </span>
                            )}
                          </div>

                          {/* Details row */}
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                            <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
                              <BankLogo bankName={account?.institution || account?.name} size={16} className="shrink-0" />
                              <span>{account?.name || 'Conta'}</span>
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <CategoryIconComp size={12} strokeWidth={1.8} className="text-slate-400 shrink-0" />
                              <span>{categoryInfo.label}</span>
                            </span>
                            {tx.recipientOrPayer && (
                              <>
                                <span>•</span>
                                <span className="truncate">{tx.recipientOrPayer}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')} {tx.time && `às ${tx.time}`}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {onConfirmFutureTransaction && isFuture && (
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic(15);
                              onConfirmFutureTransaction(tx.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer border border-emerald-500/30 shadow-2xs"
                            title="Marcar como já recebido / caiu na conta"
                          >
                            <Check size={12} className="stroke-[2.8]" />
                            <span className="hidden sm:inline">Caiu na Conta</span>
                            <span className="sm:hidden">Caiu</span>
                          </button>
                        )}

                        <div className="text-right">
                          <p className={`text-sm font-bold tracking-tight ${
                            isFuture ? 'text-amber-600 dark:text-amber-400' :
                            isExit ? 'text-slate-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {isExit ? `- ${formatCurrency(tx.amount)}` : `+ ${formatCurrency(tx.amount)}`}
                          </p>
                          {tx.type === 'ajuste' && (
                            <span className="text-[10px] text-amber-500 font-medium">Conciliação</span>
                          )}
                          {isFuture && (
                            <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-semibold block">Lançamento Futuro</span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 dark:text-slate-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Excluir movimentação"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

      </motion.div>

      {/* Delete Account Confirmation Modal (Rendered in Portal to sit above all navigation bars and layers) */}
      {typeof document !== 'undefined' && accountToDelete && createPortal(
        <AnimatePresence>
          <div 
            onClick={() => setAccountToDelete(null)}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 dark:bg-black/80 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] rounded-[28px] p-5 sm:p-6 shadow-2xl space-y-4"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3.5 pr-6">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 size={22} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    Excluir Conta Bancária
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E]/60 border border-slate-200/60 dark:border-white/[0.10]/50 space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: accountToDelete.color }}
                  />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {accountToDelete.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-white/[0.10]/50">
                  <span>Saldo cadastrado:</span>
                  <strong className="text-slate-900 dark:text-white font-bold text-sm">
                    {isBalanceVisible ? formatCurrency(accountToDelete.currentBalance) : '••••••'}
                  </strong>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Tem certeza de que deseja excluir a conta <strong>"{accountToDelete.name}"</strong>? O saldo dela deixará de somar no total geral e as movimentações associadas a ela permanecerão salvas no histórico do extrato.
              </p>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setAccountToDelete(null)}
                  className="flex-1 py-3 px-4 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-[#2C2C2E] dark:hover:bg-white/[0.08] transition-colors cursor-pointer text-center"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteAccount && accountToDelete) {
                      onDeleteAccount(accountToDelete.id);
                    }
                    setAccountToDelete(null);
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} />
                  <span>Sim, Excluir</span>
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
