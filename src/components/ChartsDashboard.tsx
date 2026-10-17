import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedCurrency, AnimatedCounter, CountUpCurrency, CountUpHeroBalance } from './AnimatedCounter';
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
  TrendingDown,
  Wallet,
  Car,
  Briefcase,
  Sparkles,
  AlertCircle,
  Building2,
  Banknote,
  Target,
  DollarSign,
  ChevronUp,
  Layers,
  ArrowLeftRight,
  User as UserIcon,
  PiggyBank,
  FileText,
  Grid,
  Send,
  Download,
  RotateCcw,
  Zap,
  Tag,
  ShieldCheck,
  Smartphone,
  Eye,
  EyeOff,
  Settings,
  Bell,
  ArrowDownLeft,
  Calendar,
  Plane
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { 
  CardBillPayment, 
  CreditCard, 
  ExpenseItem, 
  MonthSummary, 
  Person, 
  MainTabType, 
  UserProfile,
  WalletAccount,
  WalletTransaction,
  InvestmentBox,
  SubscriptionItem,
  DriverTrip,
  DriverExpense,
  DriverGoals,
  ExtraProfileConfig,
  FreelanceEntry,
  FreelanceExpense,
  FreelanceGoals,
  IncomeItem,
  AccumulationGoal
} from '../types';
import { 
  formatCurrency, 
  formatMonthDisplay, 
  addMonths, 
  getActiveExpensesForMonth, 
  getActiveIncomesForMonth,
  calculateCashFlowSummary,
  calculateNetWorth, 
  formatMonthShort,
  formatMonthCompact
} from '../utils/financeCalculations';
import { BankLogo } from './BankLogo';
import { GastoLogo } from './GastoLogo';
import { todayLocalISO } from '../utils/dateUtils';
import { MonthlyBudgetsSection } from './MonthlyBudgetsSection';
import { CategoryBudgetsModal } from './CategoryBudgetsModal';
import { CustomDatePickerModal } from './CustomDatePickerModal';
import { TravelSimulatorModal } from './TravelSimulatorModal';
import { NotificationsModal } from './NotificationsModal';

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
  onOpenAddIncome?: () => void;
  onPayBill: (card: CreditCard, amount: number, monthYear: string) => void;
  onNextMonth: () => void;
  isBalanceVisible?: boolean;
  onToggleBalance?: () => void;
  walletAccounts?: WalletAccount[];
  walletTransactions?: WalletTransaction[];
  investmentBoxes?: InvestmentBox[];
  subscriptions?: SubscriptionItem[];
  driverTrips?: DriverTrip[];
  driverExpenses?: DriverExpense[];
  driverGoals?: DriverGoals;
  extraProfile?: ExtraProfileConfig;
  freelanceEntries?: FreelanceEntry[];
  freelanceExpenses?: FreelanceExpense[];
  freelanceGoals?: FreelanceGoals;
  allMonthsHistory?: { monthYear: string; income: number; expense: number; net: number }[];
  totalIncome?: number;
  totalExpense?: number;
  netBalance?: number;
  userProfile?: UserProfile;
  incomes?: IncomeItem[];
  accumulationGoals?: AccumulationGoal[];
  onSaveAccumulationGoal?: (goal: AccumulationGoal) => void;
  onOpenProfile?: () => void;
  onOpenAddWalletTransaction?: (initialMode?: 'expense' | 'income' | 'transfer' | 'adjust', accountId?: string) => void;
  onSaveProfile?: (profile: UserProfile, syncWithPersonMe: boolean) => Promise<void> | void;
}

const PIE_COLORS = ['#10B981', '#059669', '#34D399', '#6366F1', '#8B5CF6', '#06B6D4', '#F43F5E', '#F59E0B'];

function SpendingGoalCard({
  title,
  amount,
  goal,
  percent,
  onClick,
  isVisible = true,
  statusLabel,
  badgeText,
}: {
  title: string;
  amount: number;
  goal?: number;
  percent: number;
  onClick?: () => void;
  isVisible?: boolean;
  statusLabel?: string;
  badgeText?: string;
}) {
  const safePercent = Math.min(100, Math.max(0, percent));
  // SVG circumference for r=18 is 2 * PI * 18 = 113.1
  const strokeDashoffset = 113.1 - (113.1 * safePercent) / 100;
  const isWarning = percent >= 80 && percent < 100;
  const isDanger = percent >= 100;
  const strokeColor = isDanger
    ? 'text-rose-500 dark:text-rose-400'
    : isWarning
    ? 'text-amber-500 dark:text-amber-400'
    : 'text-emerald-500 dark:text-emerald-400';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[240px] sm:min-w-[260px] bg-white dark:bg-[#1C1C1E] rounded-3xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border flex items-center gap-4 shrink-0 transition-all cursor-pointer text-left snap-start active:scale-[0.99] ${
        isDanger
          ? 'border-rose-400/80 dark:border-rose-900/60 hover:border-rose-500'
          : isWarning
          ? 'border-amber-400/80 dark:border-amber-500/40 hover:border-amber-500 ring-1 ring-amber-500/20'
          : 'border-slate-100/90 dark:border-white/[0.06] hover:border-emerald-500/30'
      }`}
    >
      {/* Circular Progress Gauge */}
      <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
          <circle
            cx="22"
            cy="22"
            r="18"
            className="text-slate-100 dark:text-slate-800 stroke-current"
            strokeWidth="4"
            fill="transparent"
          />
          <circle
            cx="22"
            cy="22"
            r="18"
            className={`${strokeColor} stroke-current transition-all duration-700`}
            strokeWidth="4"
            strokeDasharray={113.1}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <span className={`absolute text-xs font-bold tabular-nums ${
          isDanger
            ? 'text-rose-600 dark:text-rose-400'
            : isWarning
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-slate-800 dark:text-slate-100'
        }`}>
          {safePercent}%
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
            {title}
          </p>
          {badgeText && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
              isDanger
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                : isWarning
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}>
              {badgeText}
            </span>
          )}
        </div>
        <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight tabular-nums mt-0.5">
          <CountUpCurrency value={amount} isVisible={isVisible} />
        </p>
        {goal !== undefined && goal > 0 ? (
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
            Meta: <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(goal)}</span>
          </p>
        ) : (
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate mt-0.5">
            {statusLabel || 'Sem limite fixado'}
          </p>
        )}
      </div>
    </button>
  );
}

export function ChartsDashboard({
  currentMonth,
  summary,
  expenses,
  cards,
  people,
  paidBills,
  onNavigateToTab,
  onSelectMonth,
  onOpenTutorial,
  onOpenAddExpense,
  onOpenAddIncome,
  isBalanceVisible = true,
  onToggleBalance,
  walletAccounts = [],
  walletTransactions = [],
  investmentBoxes = [],
  subscriptions = [],
  driverTrips = [],
  driverExpenses = [],
  driverGoals,
  extraProfile,
  freelanceEntries = [],
  freelanceExpenses = [],
  freelanceGoals,
  userProfile,
  incomes = [],
  accumulationGoals = [],
  onSaveAccumulationGoal,
  onOpenProfile,
  onOpenAddWalletTransaction,
  onSaveProfile,
  totalIncome = 0,
  ...props
}: ChartsDashboardProps) {
  const [balanceMode, setBalanceMode] = useState<'saldoCarteira' | 'totalGastos' | 'patrimonio'>('saldoCarteira');
  const [heroViewType, setHeroViewType] = useState<'value' | 'chart'>('value');
  const [expenseChartType, setExpenseChartType] = useState<'diario' | 'evolucao'>('diario');
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isBudgetsModalOpen, setIsBudgetsModalOpen] = useState(false);
  const [isTravelSimulatorOpen, setIsTravelSimulatorOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Lembretes e alertas de faturas/assinaturas para a central de notificações
  const upcomingAlertsCount = useMemo(() => {
    let count = 0;
    const today = new Date();
    const currentDay = today.getDate();
    cards.forEach((card) => {
      if (card.dueDay >= currentDay && card.dueDay <= currentDay + 5) count++;
      else if (currentDay > card.dueDay && currentDay <= card.dueDay + 3) count++;
    });
    subscriptions.forEach((sub) => {
      if (!sub.active) return;
      if (sub.billingDay >= currentDay && sub.billingDay <= currentDay + 5) count++;
    });
    return count;
  }, [cards, subscriptions]);

  const displayVal = (val: number, extraClasses = '') => (
    <span
      className={`inline-block transition-all duration-500 ease-out ${
        !isBalanceVisible
          ? 'filter blur-[8px] select-none pointer-events-none opacity-40 scale-[0.98]'
          : 'filter blur-0 opacity-100 scale-100'
      } ${extraClasses}`}
    >
      <AnimatedCurrency value={val} />
    </span>
  );

  const activeExpenses = useMemo(() => {
    return getActiveExpensesForMonth(expenses, currentMonth);
  }, [expenses, currentMonth]);

  const activeIncomes = useMemo(() => {
    return getActiveIncomesForMonth(incomes, currentMonth);
  }, [incomes, currentMonth]);

  const cashFlowSummary = useMemo(() => {
    return calculateCashFlowSummary(incomes, expenses, currentMonth);
  }, [incomes, expenses, currentMonth]);

  const netWorthData = useMemo(() => {
    return calculateNetWorth(
      walletAccounts,
      investmentBoxes,
      summary.totalPending
    );
  }, [walletAccounts, investmentBoxes, summary.totalPending]);

  // Total in Wallet Accounts
  const totalWalletBalance = useMemo(() => {
    return walletAccounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
  }, [walletAccounts]);

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

  const totalInvoicesAmount = useMemo(() => {
    return cardSummary.reduce((acc, curr) => acc + curr.total, 0);
  }, [cardSummary]);

  // Driver summary
  const driverStats = useMemo(() => {
    const monthTrips = driverTrips.filter(t => t.date.startsWith(currentMonth));
    const monthExpenses = driverExpenses.filter(e => e.date.startsWith(currentMonth));
    
    const gross = monthTrips.reduce((sum, t) => sum + (t.grossAmount || 0), 0);
    const exp = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const net = monthTrips.reduce((sum, t) => sum + (t.netAmount || t.grossAmount || 0), 0) - exp;
    
    const todayStr = todayLocalISO();
    const todayTrips = driverTrips.filter(t => t.date === todayStr);
    const todayExpenses = driverExpenses.filter(e => e.date === todayStr);
    const todayNet = todayTrips.reduce((sum, t) => sum + (t.netAmount || t.grossAmount || 0), 0) - 
                     todayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return {
      gross,
      expenses: exp,
      net,
      count: monthTrips.length,
      todayNet,
      todayCount: todayTrips.length,
      todayGross: todayTrips.reduce((sum, t) => sum + (t.grossAmount || 0), 0),
    };
  }, [driverTrips, driverExpenses, currentMonth]);

  // Freelance summary
  const freelanceStats = useMemo(() => {
    const monthEntries = freelanceEntries.filter(e => e.date.startsWith(currentMonth));
    const monthExpenses = freelanceExpenses.filter(e => e.date.startsWith(currentMonth));
    
    const totalEarnings = monthEntries.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalExpenses = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const net = totalEarnings - totalExpenses;
    
    return {
      totalEarnings,
      totalExpenses,
      net,
      count: monthEntries.length,
    };
  }, [freelanceEntries, freelanceExpenses, currentMonth]);

  const handlePrevMonth = () => onSelectMonth(addMonths(currentMonth, -1));
  const handleNextMonth = () => onSelectMonth(addMonths(currentMonth, 1));

  // Expenses by Category
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

  // Category spending calculation for current month
  const categorySpendingMap = useMemo(() => {
    const map: Record<string, number> = {};
    activeExpenses.forEach((item) => {
      const cat = (item.expense.category || 'outros').toLowerCase().trim();
      map[cat] = (map[cat] || 0) + item.expense.amount;
    });
    return map;
  }, [activeExpenses]);

  // Total budgeted sum across all categories
  const totalBudgeted = useMemo(() => {
    const b = userProfile?.budgets || {};
    return Object.values(b).reduce((sum, val) => sum + (val || 0), 0);
  }, [userProfile?.budgets]);

  // Overall budget progress percent
  const budgetPercent = totalBudgeted > 0 
    ? Math.round((summary.totalMonth / totalBudgeted) * 100) 
    : 0;

  // Handle saving budgets to userProfile
  const handleSaveBudgets = async (newBudgets: Record<string, number>) => {
    if (onSaveProfile && userProfile) {
      await onSaveProfile({
        ...userProfile,
        budgets: newBudgets,
      }, false);
    }
  };

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

  const isFreelanceMode = extraProfile?.workType === 'freelancer';

  // Dynamic days in the currently viewed month
  const daysInCurrentMonth = useMemo(() => {
    const [y, m] = currentMonth.split('-').map(Number);
    return y && m ? new Date(y, m, 0).getDate() : 31;
  }, [currentMonth]);

  // Today reference in relation to the current viewing month
  const todayInfo = useMemo(() => {
    const now = new Date();
    const nowYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const isCurrentMonth = currentMonth === nowYM;
    const currentDay = isCurrentMonth ? now.getDate() : daysInCurrentMonth;
    return { isCurrentMonth, currentDay };
  }, [currentMonth, daysInCurrentMonth]);

  // Helper to extract day of month from an expense item
  const getExpenseDay = (item: (typeof activeExpenses)[0], maxDays: number): number => {
    const pDate = item.expense.date;
    if (pDate) {
      const parts = pDate.split('-');
      if (parts.length >= 3) {
        const d = parseInt(parts[2], 10);
        if (!isNaN(d) && d >= 1 && d <= maxDays) {
          return d;
        }
      }
    }
    if (item.expense.cardId) {
      const card = cards.find((c) => c.id === item.expense.cardId);
      if (card?.dueDay && card.dueDay >= 1 && card.dueDay <= maxDays) {
        return card.dueDay;
      }
    }
    return 1;
  };

  // Spending analytics for the hero insights bar
  const spendingInsights = useMemo(() => {
    const totalMonth = summary.totalMonth;
    const daysElapsed = todayInfo.isCurrentMonth ? Math.max(1, todayInfo.currentDay) : daysInCurrentMonth;
    const dailyAverage = totalMonth / daysElapsed;

    // Daily totals map
    const dailyTotals: Record<number, number> = {};
    activeExpenses.forEach((item) => {
      const day = getExpenseDay(item, daysInCurrentMonth);
      dailyTotals[day] = (dailyTotals[day] || 0) + item.expense.amount;
    });

    let peakDay = 0;
    let peakAmount = 0;
    Object.entries(dailyTotals).forEach(([dStr, amt]) => {
      if (amt > peakAmount) {
        peakAmount = amt;
        peakDay = parseInt(dStr, 10);
      }
    });

    return {
      dailyAverage,
      peakDay,
      peakDayLabel: peakDay > 0 ? `Dia ${String(peakDay).padStart(2, '0')}` : '—',
      peakAmount,
      totalExpensesCount: activeExpenses.length,
      daysElapsed,
    };
  }, [summary.totalMonth, todayInfo, daysInCurrentMonth, activeExpenses, cards]);

  // Chart point interface for strict Recharts typing
  interface HeroChartPoint {
    name: string;
    fullName: string;
    day: number;
    value: number;
    dailyValue: number;
    accumulated: number;
    items: Array<{ desc: string; amount: number; category: string }>;
    isLast: boolean;
    isToday: boolean;
    hasSpending?: boolean;
  }

  // Wave/Bar Chart Data for the Hero Section
  const heroChartData = useMemo<HeroChartPoint[]>(() => {
    const lastDay = daysInCurrentMonth;
    const intervals = [
      { label: '01', day: 1, rangeStart: 1, rangeEnd: 3, fullName: 'Dia 01 a 03' },
      { label: '05', day: 5, rangeStart: 4, rangeEnd: 7, fullName: 'Dia 04 a 07' },
      { label: '10', day: 10, rangeStart: 8, rangeEnd: 12, fullName: 'Dia 08 a 12' },
      { label: '15', day: 15, rangeStart: 13, rangeEnd: 17, fullName: 'Dia 13 a 17' },
      { label: '20', day: 20, rangeStart: 18, rangeEnd: 22, fullName: 'Dia 18 a 22' },
      { label: '25', day: 25, rangeStart: 23, rangeEnd: 27, fullName: 'Dia 23 a 27' },
      { label: String(lastDay).padStart(2, '0'), day: lastDay, rangeStart: 28, rangeEnd: lastDay, fullName: `Dia 28 a ${lastDay}` },
    ];

    const emptyItems: Array<{ desc: string; amount: number; category: string }> = [];

    if (balanceMode === 'saldoCarteira') {
      return intervals.map((int, i) => {
        const factor = 0.7 + 0.3 * (i / (intervals.length - 1));
        const variation = Math.sin((i / 2) * Math.PI) * (totalWalletBalance * 0.08);
        return {
          name: `Dia ${int.label}`,
          fullName: int.fullName,
          day: int.day,
          value: Math.max(0, Math.round(totalWalletBalance * factor + (i === intervals.length - 1 ? 0 : variation))),
          dailyValue: 0,
          accumulated: 0,
          items: emptyItems,
          isLast: i === intervals.length - 1,
          isToday: todayInfo.isCurrentMonth && todayInfo.currentDay >= int.rangeStart && todayInfo.currentDay <= int.rangeEnd,
        };
      });
    }

    if (balanceMode === 'patrimonio') {
      return intervals.map((int, i) => {
        const factor = 0.88 + 0.12 * (i / (intervals.length - 1));
        return {
          name: `Dia ${int.label}`,
          fullName: int.fullName,
          day: int.day,
          value: Math.round(netWorthData.netWorth * factor),
          dailyValue: 0,
          accumulated: 0,
          items: emptyItems,
          isLast: i === intervals.length - 1,
          isToday: todayInfo.isCurrentMonth && todayInfo.currentDay >= int.rangeStart && todayInfo.currentDay <= int.rangeEnd,
        };
      });
    }

    // Default: Total de Gastos no Mês
    const totalMonth = summary.totalMonth;
    if (activeExpenses.length === 0 && totalMonth === 0) {
      return intervals.map((int, i) => ({
        name: `Dia ${int.label}`,
        fullName: int.fullName,
        day: int.day,
        value: 0,
        dailyValue: 0,
        accumulated: 0,
        items: emptyItems,
        isLast: i === intervals.length - 1,
        isToday: todayInfo.isCurrentMonth && todayInfo.currentDay >= int.rangeStart && todayInfo.currentDay <= int.rangeEnd,
        hasSpending: false,
      }));
    }

    return intervals.map((int, i) => {
      // Expenses strictly within this interval window
      const periodExpenses = activeExpenses.filter((item) => {
        const day = getExpenseDay(item, daysInCurrentMonth);
        return day >= int.rangeStart && day <= int.rangeEnd;
      });
      const periodTotal = periodExpenses.reduce((sum, item) => sum + (item.expense.amount || 0), 0);

      // Cumulative expenses up to this interval
      const upToExpenses = activeExpenses.filter((item) => {
        const day = getExpenseDay(item, daysInCurrentMonth);
        return day <= int.rangeEnd;
      });
      const accumulatedTotal = upToExpenses.reduce((sum, item) => sum + (item.expense.amount || 0), 0);

      const displayValue = expenseChartType === 'diario' ? periodTotal : accumulatedTotal;
      const isToday = todayInfo.isCurrentMonth && todayInfo.currentDay >= int.rangeStart && todayInfo.currentDay <= int.rangeEnd;

      return {
        name: `Dia ${int.label}`,
        fullName: int.fullName,
        day: int.day,
        value: displayValue,
        dailyValue: periodTotal,
        accumulated: accumulatedTotal,
        items: periodExpenses.map((e) => ({
          desc: e.expense.description,
          amount: e.expense.amount,
          category: e.expense.category,
        })),
        isLast: i === intervals.length - 1,
        isToday,
        hasSpending: periodTotal > 0,
      };
    });
  }, [balanceMode, expenseChartType, totalWalletBalance, netWorthData.netWorth, activeExpenses, summary.totalMonth, currentMonth, daysInCurrentMonth, todayInfo, cards]);

  // Value displayed in the big hero text according to selected mode
  const currentHeroDisplay = useMemo(() => {
    if (balanceMode === 'saldoCarteira') {
      return {
        label: 'Saldo Disponível',
        amount: totalWalletBalance,
        sub: `${walletAccounts.length} ${walletAccounts.length === 1 ? 'conta ativa' : 'contas ativas'}`
      };
    }
    if (balanceMode === 'patrimonio') {
      return {
        label: 'Patrimônio Líquido',
        amount: netWorthData.netWorth,
        sub: `Contas bancárias + Investimentos`
      };
    }
    return {
      label: 'Total de Gastos no Mês',
      amount: summary.totalMonth,
      sub: `${activeExpenses.length} ${activeExpenses.length === 1 ? 'lançamento' : 'lançamentos'}`
    };
  }, [balanceMode, totalWalletBalance, walletAccounts.length, netWorthData, summary.totalMonth, activeExpenses.length]);

  const renderFormattedBalance = (amount: number, isDarkGreenCard = false) => {
    return (
      <CountUpHeroBalance
        value={amount}
        isVisible={isBalanceVisible}
        isDarkGreenCard={isDarkGreenCard}
      />
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full pb-8">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Clean White / Dark Fintech Card matching Reference)       */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/[0.08] shadow-xs relative text-slate-900 dark:text-white">
        {/* Top Controls Row: [$|📈] (Left) | [< Mês de Ano >] (Center) | [👁] (Right) */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          {/* Chart View Toggle: [$ | 📈] on the left */}
          <div className="flex items-center bg-slate-100/90 dark:bg-white/10 rounded-full p-0.5 border border-slate-200/60 dark:border-white/10 shadow-2xs transition-colors relative">
            <button
              type="button"
              onClick={() => setHeroViewType('value')}
              className={`relative z-10 w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                heroViewType === 'value'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Ver valor numérico"
            >
              {heroViewType === 'value' && (
                <motion.div
                  layoutId="heroToggleIndicator"
                  className="absolute inset-0 bg-white dark:bg-[#2C2C2E] rounded-full shadow-2xs"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <DollarSign size={15} className="stroke-[2.5] relative z-10" />
            </button>
            <button
              type="button"
              onClick={() => setHeroViewType('chart')}
              className={`relative z-10 w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                heroViewType === 'chart'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Ver gráfico"
            >
              {heroViewType === 'chart' && (
                <motion.div
                  layoutId="heroToggleIndicator"
                  className="absolute inset-0 bg-white dark:bg-[#2C2C2E] rounded-full shadow-2xs"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}
              <TrendingUp size={15} className="stroke-[2.5] relative z-10" />
            </button>
          </div>

          {/* Month Selector in Center: < 📅 Set 2026 > */}
          <div className="inline-flex items-center gap-0.5 bg-slate-100/90 dark:bg-white/[0.08] px-1.5 py-0.5 rounded-full border border-slate-200/60 dark:border-white/10 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Mês anterior"
              className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
            >
              <ChevronLeft size={14} className="stroke-[2.2]" />
            </button>

            <button
              type="button"
              onClick={() => setIsMonthPickerOpen(true)}
              title="Selecionar Mês"
              className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-slate-800 dark:text-slate-100 hover:bg-white/60 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer group"
            >
              <Calendar size={13} className="text-emerald-600 dark:text-emerald-400 stroke-[2.2] shrink-0" />
              <span className="text-xs font-bold tracking-tight whitespace-nowrap capitalize">
                {formatMonthCompact(currentMonth)}
              </span>
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              title="Próximo mês"
              className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
            >
              <ChevronRight size={14} className="stroke-[2.2]" />
            </button>
          </div>

          {/* Right Action: Eye Privacy Toggle */}
          <button
            type="button"
            onClick={onToggleBalance}
            className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-slate-100/90 hover:bg-slate-200/80 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs"
            title={isBalanceVisible ? 'Ocultar valores' : 'Mostrar valores'}
          >
            {isBalanceVisible ? <Eye size={16} className="stroke-[2.2]" /> : <EyeOff size={16} className="stroke-[2.2]" />}
          </button>
        </div>

        {/* Segmented Mode Selector: [Saldo] [Gastos] [Patrimônio] */}
        <div className="relative z-10 max-w-[310px] sm:max-w-[340px] mx-auto grid grid-cols-3 p-1 rounded-full bg-slate-100/90 dark:bg-white/[0.08] border border-slate-200/70 dark:border-white/10 mt-3 sm:mt-4 text-center">
          <button
            type="button"
            onClick={() => setBalanceMode('saldoCarteira')}
            className={`relative py-1.5 px-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer active:scale-95 ${
              balanceMode === 'saldoCarteira'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {balanceMode === 'saldoCarteira' && (
              <motion.div
                layoutId="heroModeIndicator"
                className="absolute inset-0 bg-white dark:bg-[#2C2C2E] rounded-full shadow-xs border border-black/[0.04] dark:border-white/[0.08]"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}
            <span className="relative z-10">Saldo</span>
          </button>
          <button
            type="button"
            onClick={() => setBalanceMode('totalGastos')}
            className={`relative py-1.5 px-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer active:scale-95 ${
              balanceMode === 'totalGastos'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {balanceMode === 'totalGastos' && (
              <motion.div
                layoutId="heroModeIndicator"
                className="absolute inset-0 bg-white dark:bg-[#2C2C2E] rounded-full shadow-xs border border-black/[0.04] dark:border-white/[0.08]"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}
            <span className="relative z-10">Gastos</span>
          </button>
          <button
            type="button"
            onClick={() => setBalanceMode('patrimonio')}
            className={`relative py-1.5 px-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer active:scale-95 ${
              balanceMode === 'patrimonio'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {balanceMode === 'patrimonio' && (
              <motion.div
                layoutId="heroModeIndicator"
                className="absolute inset-0 bg-white dark:bg-[#2C2C2E] rounded-full shadow-xs border border-black/[0.04] dark:border-white/[0.08]"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}
            <span className="relative z-10">Patrimônio</span>
          </button>
        </div>

        {/* Hero Balance Center Display (Value <-> Chart Animated Transition) */}
        <AnimatePresence mode="wait" initial={false}>
          {heroViewType === 'value' ? (
            <motion.div
              key={`hero-value-view-${balanceMode}`}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 text-center pt-4 sm:pt-5 pb-1"
            >
              {/* Subtitle / Available Balance label */}
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 tracking-normal mb-1">
                {balanceMode === 'totalGastos'
                  ? 'Total de Gastos no Mês'
                  : balanceMode === 'saldoCarteira'
                  ? 'Saldo Disponível'
                  : 'Patrimônio Líquido'}
              </p>

              {/* Giant Balance Amount */}
              <div className="flex items-center justify-center py-1 sm:py-2 my-0.5">
                {renderFormattedBalance(currentHeroDisplay.amount, false)}
              </div>

              {/* Sub-label info */}
              <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-normal">
                {balanceMode === 'totalGastos'
                  ? `${activeExpenses.length} ${activeExpenses.length === 1 ? 'lançamento no mês' : 'lançamentos'}`
                  : balanceMode === 'saldoCarteira'
                  ? `${walletAccounts.length} ${walletAccounts.length === 1 ? 'conta ativa' : 'contas ativas'}`
                  : 'Contas bancárias + Investimentos'}
              </p>

              {/* Quitado progress bar if totalGastos */}
              {balanceMode === 'totalGastos' && summary.totalMonth > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                  className="max-w-xs sm:max-w-sm mx-auto mt-3 bg-slate-50 dark:bg-white/[0.05] rounded-2xl p-2.5 border border-slate-200/70 dark:border-white/10 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium mb-1.5 px-0.5">
                    <span>Quitado: <strong className="text-slate-900 dark:text-slate-100 font-bold">{displayVal(summary.totalPaid)}</strong></span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{((summary.totalPaid / summary.totalMonth) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200/80 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, (summary.totalPaid / summary.totalMonth) * 100)}%` }}
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            /* Chart inside Hero Card */
            <motion.div
              key="hero-chart-view"
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 pt-4 pb-2"
            >
              <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400 mb-2 gap-2 flex-wrap sm:flex-nowrap">
                {balanceMode === 'totalGastos' ? (
                  <div className="flex items-center bg-white dark:bg-[#1C1C1E] p-0.5 rounded-full border border-slate-200/70 dark:border-white/10 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setExpenseChartType('diario')}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                        expenseChartType === 'diario'
                          ? 'bg-slate-100 dark:bg-white/15 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      Por Dia
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpenseChartType('evolucao')}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                        expenseChartType === 'evolucao'
                          ? 'bg-slate-100 dark:bg-white/15 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      Evolução
                    </button>
                  </div>
                ) : (
                  <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs">
                    {currentHeroDisplay.label}
                  </span>
                )}

                <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums bg-white dark:bg-[#1C1C1E] border border-slate-200/70 dark:border-white/10 px-2.5 py-0.5 rounded-full text-xs shrink-0 ml-auto shadow-2xs">
                  Total: <AnimatedCounter value={currentHeroDisplay.amount} isVisible={isBalanceVisible} />
                </span>
              </div>

              <div className="h-44 sm:h-48 w-full -mb-1">
                <ResponsiveContainer width="100%" height="100%">
                  {balanceMode === 'totalGastos' && expenseChartType === 'diario' ? (
                    <BarChart data={heroChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                      <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 dark:bg-[#141416] text-white p-2.5 rounded-xl text-xs shadow-xl border border-white/10 backdrop-blur-md">
                                <p className="font-semibold text-slate-300">{data.fullName || data.name}</p>
                                <p className="font-extrabold text-sm text-white">{formatCurrency(data.value)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        radius={[5, 5, 0, 0]} 
                        fill="#10B981" 
                        isAnimationActive={true}
                        animationDuration={750}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  ) : (
                    <AreaChart data={heroChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cleanHeroWaveGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                      <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 dark:bg-[#141416] text-white p-2.5 rounded-xl text-xs shadow-xl border border-white/10 backdrop-blur-md">
                                <p className="font-semibold text-slate-300">{data.fullName || data.name}</p>
                                <p className="font-extrabold text-sm text-white">{formatCurrency(data.value)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10B981" 
                        strokeWidth={2.5} 
                        fill="url(#cleanHeroWaveGradient)" 
                        isAnimationActive={true}
                        animationDuration={850}
                        animationEasing="ease-out"
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========================================================================= */}
      {/* 2. FLOATING QUICK ACTION CARD (Image 1 & User's Image 2)                  */}
      {/* ========================================================================= */}
      <div className="relative z-20 bg-white dark:bg-[#1C1C1E] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm border border-slate-200/80 dark:border-white/[0.08]">
        <div data-tour="dash-actions" className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
          {/* Receita */}
          <button
            type="button"
            onClick={() => onOpenAddIncome ? onOpenAddIncome() : onOpenAddExpense()}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 group-active:scale-95 transition-all shadow-2xs mb-1.5">
              <Plus size={24} className="stroke-[2.5]" />
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Receita
            </span>
          </button>

          {/* Despesa */}
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100/90 dark:bg-white/10 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:bg-rose-50 dark:group-hover:bg-rose-950/40 group-hover:text-rose-600 group-active:scale-95 transition-all shadow-2xs mb-1.5">
              <Send size={22} className="stroke-[2.2] -rotate-12" />
            </div>
            <span className="text-xs font-bold text-rose-500 dark:text-rose-400">
              Despesa
            </span>
          </button>

          {/* Divisão */}
          <button
            type="button"
            onClick={() => onNavigateToTab('pessoas')}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100/90 dark:bg-white/10 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 group-hover:text-indigo-600 group-active:scale-95 transition-all shadow-2xs mb-1.5">
              <Users size={22} className="stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Divisão
            </span>
          </button>

          {/* Faturas */}
          <button
            type="button"
            onClick={() => onNavigateToTab('cartoes')}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100/90 dark:bg-white/10 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:bg-amber-50 dark:group-hover:bg-amber-950/40 group-hover:text-amber-600 group-active:scale-95 transition-all shadow-2xs mb-1.5">
              <Clock size={22} className="stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Faturas
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. GASTOS DO MÊS - CARDS COM CIRCULAR PROGRESS (Image 1 reference)         */}
      {/* ========================================================================= */}
      <div data-tour="dash-month" className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Gastos do Mês
          </h3>
          <button
            type="button"
            onClick={() => onNavigateToTab('carteira')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
          >
            Ver detalhes
          </button>
        </div>

        {/* Horizontal Carousel without visible scrollbar track */}
        <div className="flex gap-3 overflow-x-auto scrollbar-none no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 pt-0.5 -mx-1 px-1 snap-x">
          {/* Card 1: Total Gasto do Mês / Orçamento */}
          <SpendingGoalCard
            title={totalBudgeted > 0 ? "Orçamento do Mês" : "Total do Mês"}
            amount={summary.totalMonth || 0}
            goal={totalBudgeted > 0 ? totalBudgeted : undefined}
            percent={budgetPercent}
            badgeText={
              totalBudgeted > 0
                ? budgetPercent >= 100
                  ? 'Estourado'
                  : budgetPercent >= 80
                  ? '80% atingido'
                  : 'Dentro do teto'
                : undefined
            }
            statusLabel={summary.totalMonth === 0 ? "R$ 0,00 gastos" : totalBudgeted > 0 ? undefined : "Toque p/ definir limites"}
            onClick={() => setIsBudgetsModalOpen(true)}
            isVisible={isBalanceVisible}
          />

          {/* Card 2: Cartões de Crédito */}
          {(() => {
            const totalCardsLimit = cards.reduce((acc, c) => acc + (c.limit || 0), 0);
            const cardPercent = totalCardsLimit > 0 
              ? Math.min(100, Math.round((totalInvoicesAmount / totalCardsLimit) * 100)) 
              : 0;
            return (
              <SpendingGoalCard
                title="Cartões & Faturas"
                amount={totalInvoicesAmount || 0}
                goal={totalCardsLimit > 0 ? totalCardsLimit : undefined}
                percent={cardPercent}
                badgeText={cardPercent >= 80 ? `${cardPercent}% do limite` : undefined}
                statusLabel={cards.length === 0 ? "Nenhum cartão" : totalInvoicesAmount === 0 ? "Faturas zeradas" : "Ver faturas"}
                onClick={() => onNavigateToTab('cartoes')}
                isVisible={isBalanceVisible}
              />
            );
          })()}

          {/* Card 3: Top Categoria com Orçamento */}
          {(() => {
            const topCategory = categoryData[0];
            const topCatLimit = topCategory 
              ? (userProfile?.budgets?.[topCategory.name.toLowerCase()] || 0) 
              : 0;
            const topPercent = topCatLimit > 0 && topCategory
              ? Math.round((topCategory.value / topCatLimit) * 100)
              : 0;
            return (
              <SpendingGoalCard
                title={topCategory?.name ? `Top: ${topCategory.name}` : 'Categorias'}
                amount={topCategory?.value || 0}
                goal={topCatLimit > 0 ? topCatLimit : undefined}
                percent={topPercent}
                badgeText={topPercent >= 80 ? (topPercent >= 100 ? 'Estourado' : '80% atingido') : undefined}
                statusLabel={!topCategory || topCategory.value === 0 ? "Sem gastos no mês" : topCatLimit === 0 ? "Toque p/ definir teto" : undefined}
                onClick={() => setIsBudgetsModalOpen(true)}
                isVisible={isBalanceVisible}
              />
            );
          })()}

          {/* Card 4: Caixinhas & Poupança */}
          {(() => {
            const invested = netWorthData.totalInvested || 0;
            return (
              <SpendingGoalCard
                title="Caixinhas & Poupança"
                amount={invested}
                goal={undefined}
                percent={0}
                statusLabel={invested === 0 ? "R$ 0,00 guardados" : "Total poupado"}
                onClick={() => onNavigateToTab('investimentos')}
                isVisible={isBalanceVisible}
              />
            );
          })()}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. ANÁLISE DE CATEGORIAS E RATEIO DE PESSOAS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
        
        {/* Category Breakdown (Donut Chart) */}
        <div className="ios-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <PieIcon size={15} />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                Gastos por Categoria
              </h3>
            </div>
            <span className="text-xs font-medium text-slate-400">
              {categoryData.length} categorias
            </span>
          </div>

          {categoryData.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-medium">
              Nenhum lançamento registrado neste mês.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={65}
                      innerRadius={44}
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
                      formatter={(val: any) => [isBalanceVisible ? formatCurrency(Number(val)) : 'R$ ••••••', 'Valor']}
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

              <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                {categoryData.map((cat, idx) => {
                  const percent = summary.totalMonth > 0 ? (cat.value / summary.totalMonth) * 100 : 0;
                  return (
                    <div key={cat.name} className="flex items-center justify-between text-xs py-0.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                        />
                        <span className="text-slate-800 dark:text-slate-200 font-semibold truncate">
                          {cat.name}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          ({percent.toFixed(0)}%)
                        </span>
                      </div>
                      <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white tabular-nums tracking-tight shrink-0 ml-2">
                        {displayVal(cat.value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Divisão com Pessoas */}
        <div className="ios-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <Users size={15} />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                  Divisão de Faturas
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

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {peopleSummary.map(({ person, total, pending, isSettled, count }) => (
                <div
                  key={person.id}
                  className="p-2.5 rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.03] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full ${person.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0`}
                    >
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {person.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal truncate">
                        {count} {count === 1 ? 'despesa' : 'despesas'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-semibold text-xs text-slate-900 dark:text-white tabular-nums tracking-tight">
                      {displayVal(total)}
                    </p>
                    {person.isSelf ? (
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Sua parte
                      </span>
                    ) : isSettled ? (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                        <CheckCircle2 size={11} />
                        Quitado
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Pendente {displayVal(pending)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTab('pessoas')}
            className="w-full mt-4 py-2 px-3 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-white/15 transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            <span>Gerenciar Divisão & Cobranças</span>
            <ArrowRight size={13} />
          </button>
        </div>

      </div>

    {/* ========================================================================= */}
    {/* 4. ACESSO RÁPIDO (Clean 2-Column Minimalist Fintech Grid from Reference)    */}
    {/* ========================================================================= */}
    <div className="space-y-3">
      
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Acesso Rápido
        </h2>
        <span className="text-xs font-normal text-slate-500">
          Toque para abrir
        </span>
      </div>

        {/* Clean 2-Column Minimalist Grid (Inspired by Reference Image with White Cards) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          
          {/* 1. CARTEIRA & BANCOS */}
          <div 
            onClick={() => onNavigateToTab('carteira')}
            className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-xs hover:shadow-md hover:border-emerald-500/30 dark:hover:border-white/[0.14] transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between min-h-[140px] sm:min-h-[160px] group"
          >
            <div className="flex items-center justify-between mb-auto">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-100 dark:border-white/[0.10]/60 text-slate-800 dark:text-slate-100 flex items-center justify-center shadow-2xs group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                <Wallet size={20} className="stroke-[2]" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-emerald-500 transition-colors">
                <ArrowRight size={14} />
              </span>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Carteira & Bancos
              </h3>
              <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tabular-nums tracking-tight mt-0.5">
                <AnimatedCounter value={totalWalletBalance} isVisible={isBalanceVisible} />
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                {walletAccounts.length} {walletAccounts.length === 1 ? 'conta ativa' : 'contas ativas'}
              </p>
            </div>
          </div>

          {/* 2. CARTÕES DE CRÉDITO */}
          <div 
            onClick={() => onNavigateToTab('cartoes')}
            className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-xs hover:shadow-md hover:border-emerald-500/30 dark:hover:border-white/[0.14] transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between min-h-[140px] sm:min-h-[160px] group"
          >
            <div className="flex items-center justify-between mb-auto">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-100 dark:border-white/[0.10]/60 text-slate-800 dark:text-slate-100 flex items-center justify-center shadow-2xs group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                <CardIcon size={20} className="stroke-[2]" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-emerald-500 transition-colors">
                <ArrowRight size={14} />
              </span>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Cartões de Crédito
              </h3>
              <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tabular-nums tracking-tight mt-0.5">
                {displayVal(totalInvoicesAmount)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                {cards.length} {cards.length === 1 ? 'cartão' : 'cartões'} cadastrados
              </p>
            </div>
          </div>

          {/* 3. RENDA EXTRA / FREELA */}
          <div 
            onClick={() => onNavigateToTab('extra')}
            className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-xs hover:shadow-md hover:border-emerald-500/30 dark:hover:border-white/[0.14] transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between min-h-[140px] sm:min-h-[160px] group"
          >
            <div className="flex items-center justify-between mb-auto">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-100 dark:border-white/[0.10]/60 text-slate-800 dark:text-slate-100 flex items-center justify-center shadow-2xs group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                {isFreelanceMode ? <Briefcase size={20} className="stroke-[2]" /> : <Car size={20} className="stroke-[2]" />}
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-emerald-500 transition-colors">
                <ArrowRight size={14} />
              </span>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {isFreelanceMode ? 'Projetos Freela' : 'Motorista & Apps'}
              </h3>
              <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tabular-nums tracking-tight mt-0.5">
                {displayVal(isFreelanceMode ? freelanceStats.net : driverStats.net)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                {isFreelanceMode ? `${freelanceStats.count} projetos este mês` : `${driverStats.count} corridas este mês`}
              </p>
            </div>
          </div>

          {/* 4. INVESTIMENTOS & CAIXINHAS */}
          <div 
            onClick={() => onNavigateToTab('investimentos')}
            className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-xs hover:shadow-md hover:border-emerald-500/30 dark:hover:border-white/[0.14] transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between min-h-[140px] sm:min-h-[160px] group"
          >
            <div className="flex items-center justify-between mb-auto">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-100 dark:border-white/[0.10]/60 text-slate-800 dark:text-slate-100 flex items-center justify-center shadow-2xs group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                <PiggyBank size={20} className="stroke-[2]" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-emerald-500 transition-colors">
                <ArrowRight size={14} />
              </span>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Investimentos & Caixinhas
              </h3>
              <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tabular-nums tracking-tight mt-0.5">
                {displayVal(netWorthData.totalInvested)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                {investmentBoxes.length} {investmentBoxes.length === 1 ? 'caixinha guardada' : 'caixinhas guardadas'}
              </p>
            </div>
          </div>

          {/* 5. DIVISÃO DE FATURAS & PESSOAS */}
          <div 
            onClick={() => onNavigateToTab('pessoas')}
            className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-xs hover:shadow-md hover:border-emerald-500/30 dark:hover:border-white/[0.14] transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between min-h-[140px] sm:min-h-[160px] group"
          >
            <div className="flex items-center justify-between mb-auto">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-100 dark:border-white/[0.10]/60 text-slate-800 dark:text-slate-100 flex items-center justify-center shadow-2xs group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                <Users size={20} className="stroke-[2]" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-emerald-500 transition-colors">
                <ArrowRight size={14} />
              </span>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Divisão & Pessoas
              </h3>
              <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tabular-nums tracking-tight mt-0.5">
                {displayVal(summary.totalOthers)}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                {people.length} {people.length === 1 ? 'pessoa' : 'pessoas'} no rateio
              </p>
            </div>
          </div>

          {/* 6. ASSINATURAS FIXAS */}
          <div 
            onClick={() => onNavigateToTab('assinaturas')}
            className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-xs hover:shadow-md hover:border-emerald-500/30 dark:hover:border-white/[0.14] transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between min-h-[140px] sm:min-h-[160px] group"
          >
            <div className="flex items-center justify-between mb-auto">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-100 dark:border-white/[0.10]/60 text-slate-800 dark:text-slate-100 flex items-center justify-center shadow-2xs group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                <Sparkles size={20} className="stroke-[2]" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-emerald-500 transition-colors">
                <ArrowRight size={14} />
              </span>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Assinaturas Fixas
              </h3>
              <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tabular-nums tracking-tight mt-0.5">
                {displayVal(subscriptions.filter(s => s.active).reduce((sum, s) => sum + s.amount, 0))}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                {subscriptions.filter(s => s.active).length} ativas este mês
              </p>
            </div>
          </div>

          {/* 7. METAS DE ECONOMIA */}
          <div 
            onClick={() => onNavigateToTab('metas')}
            className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-xs hover:shadow-md hover:border-emerald-500/30 dark:hover:border-white/[0.14] transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between min-h-[140px] sm:min-h-[160px] group"
          >
            <div className="flex items-center justify-between mb-auto">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-100 dark:border-white/[0.10]/60 text-slate-800 dark:text-slate-100 flex items-center justify-center shadow-2xs group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                <Target size={20} className="stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-emerald-500 transition-colors">
                <ArrowRight size={14} />
              </span>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Metas de Economia
              </h3>
              <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tabular-nums tracking-tight mt-0.5">
                Teto & Poupança
              </p>
              <p className="text-xs font-normal text-slate-500 truncate mt-0.5">
                Planejador automático de metas
              </p>
            </div>
          </div>

          {/* 8. SIMULADOR DE VIAGEM & APERTO */}
          <div 
            onClick={() => setIsTravelSimulatorOpen(true)}
            className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-xs hover:shadow-md hover:border-blue-500/40 dark:hover:border-blue-500/30 transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between min-h-[140px] sm:min-h-[160px] group"
          >
            <div className="flex items-center justify-between mb-auto">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                <Plane size={20} className="stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors">
                <ArrowRight size={14} />
              </span>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Simulador de Viagem
              </h3>
              <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tabular-nums tracking-tight mt-0.5">
                Quando Viajar?
              </p>
              <p className="text-xs font-normal text-slate-500 truncate mt-0.5">
                Previsão de aperto e melhor mês
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 6. ORÇAMENTOS MENSAIS POR CATEGORIA (Embaixo do Acesso Rápido)           */}
      {/* ========================================================================= */}
      <MonthlyBudgetsSection
        budgets={userProfile?.budgets || {}}
        categorySpending={categorySpendingMap}
        currentMonthName={formatMonthDisplay(currentMonth)}
        onSaveBudgets={handleSaveBudgets}
        isBalanceVisible={isBalanceVisible}
        onNavigateToTab={onNavigateToTab}
        onOpenBudgetsModal={() => setIsBudgetsModalOpen(true)}
      />

      <CustomDatePickerModal
        isOpen={isMonthPickerOpen}
        onClose={() => setIsMonthPickerOpen(false)}
        value={currentMonth}
        onChange={(newMonth) => onSelectMonth(newMonth.slice(0, 7))}
        mode="month"
        title="Selecionar Mês de Referência"
      />

      <CategoryBudgetsModal
        isOpen={isBudgetsModalOpen}
        onClose={() => setIsBudgetsModalOpen(false)}
        currentBudgets={userProfile?.budgets || {}}
        onSaveBudgets={handleSaveBudgets}
        categorySpending={categorySpendingMap}
        currentMonthName={formatMonthDisplay(currentMonth)}
      />

      <TravelSimulatorModal
        isOpen={isTravelSimulatorOpen}
        onClose={() => setIsTravelSimulatorOpen(false)}
        currentMonth={currentMonth}
        incomes={incomes}
        expenses={expenses}
        existingGoals={accumulationGoals}
        onSaveGoal={onSaveAccumulationGoal}
        isBalanceVisible={isBalanceVisible}
      />

      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        cards={cards}
        subscriptions={subscriptions}
        expenses={expenses}
        paidBills={paidBills}
        onTabChange={onNavigateToTab}
        onOpenProfile={onOpenProfile}
      />
    </div>
  );
}
