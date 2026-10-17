import React, { useState, useMemo } from 'react';
import { 
  Car, 
  Plus, 
  Zap, 
  Fuel, 
  Target, 
  Percent, 
  Clock, 
  Calendar, 
  Trash2, 
  Edit2, 
  CircleDollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Sparkles,
  Layers,
  TrendingUp,
  X,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';
import { 
  DriverTrip, 
  DriverExpense, 
  DriverGoals, 
  DriverAppType 
} from '../types';
import { APP_CONFIGS } from '../data/initialDriverData';
import { DriverAppLogo } from './DriverAppLogo';
import { AddDriverTripModal } from './AddDriverTripModal';
import { AddDriverExpenseModal } from './AddDriverExpenseModal';
import { DriverGoalsModal } from './DriverGoalsModal';
import { DriverDaySummaryModal } from './DriverDaySummaryModal';
import { todayLocalISO, toLocalISODate, parseLocalISO } from '../utils/dateUtils';

interface DriverViewProps {
  trips: DriverTrip[];
  expenses: DriverExpense[];
  goals: DriverGoals;
  onAddTrip: (tripData: Omit<DriverTrip, 'id'>, editId?: string) => void;
  onDeleteTrip: (tripId: string) => void;
  onAddExpense: (expenseData: Omit<DriverExpense, 'id'>, editId?: string) => void;
  onDeleteExpense: (expenseId: string) => void;
  onSaveGoals: (newGoals: DriverGoals) => void;
  currentMonth: string;
}

type PeriodFilter = 'hoje' | 'semana' | 'mes' | 'todos';
type TabSection = 'corridas' | 'despesas' | 'comparacao';
type ChartViewMode = 'diario' | 'acumulado';

export function DriverView({
  trips,
  expenses,
  goals,
  onAddTrip,
  onDeleteTrip,
  onAddExpense,
  onDeleteExpense,
  onSaveGoals,
  currentMonth
}: DriverViewProps) {
  const [period, setPeriod] = useState<PeriodFilter>('hoje');
  const [activeTab, setActiveTab] = useState<TabSection>('corridas');
  const [chartMode, setChartMode] = useState<ChartViewMode>('diario');

  // Floating Action Button (FAB) state
  const [isFabOpen, setIsFabOpen] = useState(false);

  // Modals state
  const [isAddTripOpen, setIsAddTripOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<DriverTrip | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<DriverExpense | null>(null);
  const [isGoalsOpen, setIsGoalsOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [lastSavedTripData, setLastSavedTripData] = useState<{ grossAmount: number; netAmount: number } | null>(null);

  const handleSaveTripWrapped = (tripData: Omit<DriverTrip, 'id'>, editId?: string) => {
    onAddTrip(tripData, editId);
    setLastSavedTripData({
      grossAmount: tripData.grossAmount,
      netAmount: tripData.netAmount
    });
    // Auto hide after 8s
    setTimeout(() => {
      setLastSavedTripData(null);
    }, 8000);
  };

  // Helper dates
  const todayStr = todayLocalISO();
  
  // Semana = hoje e os 6 dias anteriores (7 dias no total).
  const sevenDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return toLocalISODate(d);
  }, [todayStr]);

  // Filtered trips by period
  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      if (period === 'hoje') return trip.date === todayStr;
      if (period === 'semana') return trip.date >= sevenDaysAgoStr && trip.date <= todayStr;
      if (period === 'mes') return trip.date.startsWith(currentMonth);
      return true;
    }).sort((a, b) => {
      const dateDiff = parseLocalISO(b.date).getTime() - parseLocalISO(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (b.time || '').localeCompare(a.time || '');
    });
  }, [trips, period, todayStr, sevenDaysAgoStr, currentMonth]);

  // Filtered expenses by period
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (period === 'hoje') return exp.date === todayStr;
      if (period === 'semana') return exp.date >= sevenDaysAgoStr && exp.date <= todayStr;
      if (period === 'mes') return exp.date.startsWith(currentMonth);
      return true;
    }).sort((a, b) => parseLocalISO(b.date).getTime() - parseLocalISO(a.date).getTime());
  }, [expenses, period, todayStr, sevenDaysAgoStr, currentMonth]);

  // Aggregated calculations
  const metrics = useMemo(() => {
    const totalGross = filteredTrips.reduce((acc, t) => acc + (t.grossAmount || 0), 0);
    const totalFees = filteredTrips.reduce((acc, t) => acc + (t.feeAmount || 0), 0);
    const totalNet = filteredTrips.reduce((acc, t) => acc + (t.netAmount || 0), 0);
    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const realProfit = totalNet - totalExpenses;

    const tripsCount = filteredTrips.reduce((acc, t) => acc + (t.tripsCount || 1), 0);
    const totalKm = filteredTrips.reduce((acc, t) => acc + (t.distanceKm || 0), 0);
    const totalMinutes = filteredTrips.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);

    const avgPerTrip = tripsCount > 0 ? totalNet / tripsCount : 0;
    const earnPerKm = totalKm > 0 ? totalNet / totalKm : 0;
    const profitPerKm = totalKm > 0 ? realProfit / totalKm : 0;
    const hoursDriven = totalMinutes / 60;
    const earnPerHour = hoursDriven > 0 ? totalNet / hoursDriven : 0;
    const profitPerHour = hoursDriven > 0 ? realProfit / hoursDriven : 0;
    const feeRateOverall = totalGross > 0 ? (totalFees / totalGross) * 100 : 0;
    const profitMargin = totalNet > 0 ? (realProfit / totalNet) * 100 : 0;

    // Diagnostic indicator
    let diagStatus: 'lucrativo' | 'atencao' | 'meta' | 'inicio' = 'inicio';
    let diagTitle = 'Expediente em Andamento';
    let diagMessage = 'Registre suas corridas e gastos para obter o diagnóstico do dia.';

    if (totalGross > 0) {
      if (totalExpenses > totalNet * 0.45) {
        diagStatus = 'atencao';
        diagTitle = 'Atenção';
        diagMessage = 'Seu faturamento foi bom, mas seus custos reduziram bastante seu lucro.';
      } else if (realProfit > 0) {
        diagStatus = 'lucrativo';
        diagTitle = 'Dia lucrativo';
        diagMessage = 'Você teve um bom resultado hoje.';
      }
    }

    return {
      totalGross,
      totalFees,
      totalNet,
      totalExpenses,
      realProfit,
      tripsCount,
      totalKm,
      totalMinutes,
      avgPerTrip,
      earnPerKm,
      profitPerKm,
      earnPerHour,
      profitPerHour,
      feeRateOverall,
      profitMargin,
      diagStatus,
      diagTitle,
      diagMessage
    };
  }, [filteredTrips, filteredExpenses]);

  // Monthly Evolution Data for Recharts Line Chart
  const monthlyChartData = useMemo(() => {
    const [yearStr, monthStr] = currentMonth.split('-');
    const year = parseInt(yearStr, 10) || new Date().getFullYear();
    const month = parseInt(monthStr, 10) || (new Date().getMonth() + 1);
    
    // Days in selected month
    const totalDays = new Date(year, month, 0).getDate();
    
    const monthTrips = trips.filter(t => t.date.startsWith(currentMonth));
    const monthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));

    let accumulatedNet = 0;
    let accumulatedProfit = 0;

    const data = [];
    for (let day = 1; day <= totalDays; day++) {
      const dayStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
      const dayTrips = monthTrips.filter(t => t.date === dayStr);
      const dayExpenses = monthExpenses.filter(e => e.date === dayStr);

      const netAmount = dayTrips.reduce((acc, t) => acc + (t.netAmount || 0), 0);
      const grossAmount = dayTrips.reduce((acc, t) => acc + (t.grossAmount || 0), 0);
      const expenseAmount = dayExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
      const dayProfit = netAmount - expenseAmount;
      const tripsCount = dayTrips.reduce((acc, t) => acc + (t.tripsCount || 1), 0);
      const km = dayTrips.reduce((acc, t) => acc + (t.distanceKm || 0), 0);

      accumulatedNet += netAmount;
      accumulatedProfit += dayProfit;

      data.push({
        day: String(day).padStart(2, '0'),
        date: dayStr,
        label: `Dia ${day}`,
        net: Number(netAmount.toFixed(2)),
        gross: Number(grossAmount.toFixed(2)),
        expenses: Number(expenseAmount.toFixed(2)),
        profit: Number(dayProfit.toFixed(2)),
        accumulatedNet: Number(accumulatedNet.toFixed(2)),
        accumulatedProfit: Number(accumulatedProfit.toFixed(2)),
        tripsCount,
        km
      });
    }

    return data;
  }, [trips, expenses, currentMonth]);

  // Total month net for chart header
  const totalMonthNet = useMemo(() => {
    return monthlyChartData.reduce((acc, d) => acc + d.net, 0);
  }, [monthlyChartData]);

  // Intelligent Profit Goal Target (Meta de Lucro Líquido Real)
  const currentGoalTarget = useMemo(() => {
    if (period === 'hoje') return goals.daily || 300;
    if (period === 'semana') return goals.weekly || 1800;
    return goals.monthly || 7500;
  }, [period, goals]);

  // Target Gross/Net needed to reach profit goal considering current expenses
  const neededGrossToHitGoal = useMemo(() => {
    return currentGoalTarget + metrics.totalExpenses;
  }, [currentGoalTarget, metrics.totalExpenses]);

  // Goal Progress calculated directly on REAL PROFIT (LUCRO REAL)
  const goalProgress = useMemo(() => {
    if (currentGoalTarget <= 0) return 0;
    const prog = (metrics.realProfit / currentGoalTarget) * 100;
    return Math.max(0, Math.min(100, Math.round(prog * 10) / 10));
  }, [metrics.realProfit, currentGoalTarget]);

  // App breakdown for comparison
  const appsBreakdown = useMemo(() => {
    const appsList: DriverAppType[] = ['uber', '99', 'indrive', 'blablacar', 'outro'];
    return appsList.map(appKey => {
      const appTrips = filteredTrips.filter(t => t.app === appKey);
      const appExpenses = filteredExpenses.filter(e => e.appLinked === appKey);
      
      const appGross = appTrips.reduce((acc, t) => acc + (t.grossAmount || 0), 0);
      const appFees = appTrips.reduce((acc, t) => acc + (t.feeAmount || 0), 0);
      const appNet = appTrips.reduce((acc, t) => acc + (t.netAmount || 0), 0);
      const appExpenseAmt = appExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
      const appProfit = appNet - appExpenseAmt;
      const appCount = appTrips.length;
      const appAvg = appCount > 0 ? appNet / appCount : 0;
      const appKm = appTrips.reduce((acc, t) => acc + (t.distanceKm || 0), 0);

      return {
        app: appKey,
        config: APP_CONFIGS[appKey],
        gross: appGross,
        fees: appFees,
        net: appNet,
        expenses: appExpenseAmt,
        profit: appProfit,
        count: appCount,
        avg: appAvg,
        km: appKm,
        share: metrics.totalNet > 0 ? (appNet / metrics.totalNet) * 100 : 0
      };
    }).filter(a => a.count > 0 || a.expenses > 0 || period === 'todos');
  }, [filteredTrips, filteredExpenses, metrics.totalNet, period]);

  const handleOpenAddTrip = (tripToEdit?: DriverTrip) => {
    setIsFabOpen(false);
    setEditingTrip(tripToEdit || null);
    setIsAddTripOpen(true);
  };

  const handleOpenAddExpense = (expenseToEdit?: DriverExpense) => {
    setIsFabOpen(false);
    setEditingExpense(expenseToEdit || null);
    setIsAddExpenseOpen(true);
  };

  const periodLabels: Record<PeriodFilter, string> = {
    hoje: 'Hoje',
    semana: 'Esta Semana',
    mes: 'Este Mês',
    todos: 'Tudo'
  };

  const formattedMonthLabel = useMemo(() => {
    const [year, month] = currentMonth.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [currentMonth]);

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-36 px-1 sm:px-0 relative">
      
      {/* Clean Minimalist Header with Resumo do Dia & Meta */}
      <div className="flex items-center justify-between gap-2.5 pt-1 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <Car size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Meu<span className="text-emerald-500">Uber</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 uppercase tracking-wider">
                Painel
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Controle de corridas, rendimento e lucro líquido real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Resumo do Dia Button */}
          <button
            type="button"
            onClick={() => setIsSummaryOpen(true)}
            className="px-3 py-1.5 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-600/20 shadow-2xs"
            title="Ver Resumo e Fechamento do Expediente"
          >
            <ClipboardList size={14} />
            <span>Resumo do Dia</span>
          </button>

          {/* Goal Button */}
          <button
            type="button"
            onClick={() => setIsGoalsOpen(true)}
            className="px-3 py-1.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-amber-500/20"
          >
            <Target size={14} />
            <span>Meta de Lucro: R$ {currentGoalTarget.toFixed(0)}</span>
          </button>
        </div>
      </div>

      {/* Prominent Success Faturamento Banner After Registration */}
      <AnimatePresence>
        {lastSavedTripData && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="p-4 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl flex items-center justify-between flex-wrap gap-3 border border-emerald-400/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                <Sparkles size={24} className="stroke-[2.5]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100-100">
                  Corrida Registrada com Sucesso!
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xl sm:text-2xl font-bold">
                    Faturamento Bruto: R$ {lastSavedTripData.grossAmount.toFixed(2)}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-xl bg-white/20 font-bold">
                    Líquido: R$ {lastSavedTripData.netAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLastSavedTripData(null)}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-bold transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. TOP INTERACTIVE LINE CHART (EVOLUÇÃO DOS GANHOS LÍQUIDOS NO MÊS) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                Evolução dos Ganhos Líquidos
              </h3>
              <span className="text-[11px] text-slate-400 font-medium capitalize">
                ({formattedMonthLabel})
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Total recebido no mês: <strong className="text-emerald-600 dark:text-emerald-400">R$ {totalMonthNet.toFixed(2)}</strong>
            </p>
          </div>

          {/* Toggle between Daily & Accumulated */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/[0.06] rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setChartMode('diario')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartMode === 'diario'
                  ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Por Dia
            </button>
            <button
              type="button"
              onClick={() => setChartMode('acumulado')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartMode === 'acumulado'
                  ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Acumulado
            </button>
          </div>
        </div>

        {/* Recharts Line Chart Container */}
        <div className="w-full h-52 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={monthlyChartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="driverEmeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.12)" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#888' }}
                interval={window.innerWidth < 640 ? 4 : 2}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#888' }}
                tickFormatter={(val) => `R$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const valueToShow = chartMode === 'diario' ? data.net : data.accumulatedNet;
                    return (
                      <div className="p-2.5 rounded-2xl bg-slate-900/95 text-white dark:bg-black/95 backdrop-blur-md shadow-xl border border-white/10 text-xs space-y-1">
                        <p className="font-bold text-slate-300 text-[11px]">
                          {data.label} ({data.date.split('-').reverse().join('/')})
                        </p>
                        <p className="font-bold text-emerald-400 text-sm">
                          {chartMode === 'diario' ? 'Líquido no dia:' : 'Acumulado no mês:'} R$ {valueToShow.toFixed(2)}
                        </p>
                        {data.tripsCount > 0 && (
                          <div className="text-[10px] text-slate-400 pt-0.5 space-y-0.5 border-t border-white/10">
                            <p>• {data.tripsCount} {data.tripsCount === 1 ? 'corrida realizada' : 'corridas realizadas'}</p>
                            {data.km > 0 && <p>• {data.km} km rodados</p>}
                            {data.expenses > 0 && <p className="text-rose-400">• Despesas: - R$ {data.expenses.toFixed(2)}</p>}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey={chartMode === 'diario' ? 'net' : 'accumulatedNet'}
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#driverEmeraldGradient)"
                dot={({ cx, cy, payload }) => {
                  if (payload.net > 0 && chartMode === 'diario') {
                    return (
                      <circle
                        key={`dot-${payload.day}`}
                        cx={cx}
                        cy={cy}
                        r={3.5}
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                    );
                  }
                  return <React.Fragment key={`dot-${payload.day}`} />;
                }}
                activeDot={{ r: 5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* 2. Cockpit Card: Lucro Real, Diagnóstico Inteligente & Meta */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-sm space-y-5">
        
        {/* Period Selector Tabs & Diagnostic Banner */}
        <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-100 dark:border-white/[0.06] pb-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/[0.06] rounded-2xl">
            {(['hoje', 'semana', 'mes', 'todos'] as PeriodFilter[]).map((p) => {
              const isSelected = period === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {periodLabels[p]}
                </button>
              );
            })}
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {filteredTrips.length} {filteredTrips.length === 1 ? 'corrida' : 'corridas'} no período
          </span>
        </div>

        {/* Smart Diagnostic Callout Bar (Dia Lucrativo / Atenção aos Custos) */}
        {metrics.totalGross > 0 && (
          <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
            metrics.diagStatus === 'lucrativo'
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-900 dark:text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/25 text-amber-900 dark:text-amber-300'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="shrink-0">
                {metrics.diagStatus === 'lucrativo' ? (
                  <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold block">
                  {metrics.diagTitle}
                </span>
                <p className="text-[11px] opacity-90 truncate">
                  {metrics.diagMessage}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSummaryOpen(true)}
              className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white/80 dark:bg-black/30 hover:bg-white text-slate-800 dark:text-white shrink-0 cursor-pointer transition-colors"
            >
              Ver Resumo
            </button>
          </div>
        )}

        {/* Main Number: Lucro Real & Intelligent Profit Goal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          
          {/* Real Profit Result */}
          <div className="sm:col-span-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100-400">
                Lucro Líquido Real ({periodLabels[period]})
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                metrics.realProfit >= 0 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}>
                {metrics.profitMargin.toFixed(0)}% margem líquida
              </span>
            </div>

            <div className="flex items-baseline gap-2 flex-wrap">
              <span className={`text-3xl sm:text-4xl font-bold tracking-tight ${
                metrics.realProfit >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
              }`}>
                R$ {metrics.realProfit.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                livre no bolso
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap pt-0.5">
              <span>Recebido líquido: <strong>R$ {metrics.totalNet.toFixed(2)}</strong></span>
              <span>−</span>
              <span className="text-rose-600 dark:text-rose-400">Gastos carro: <strong>R$ {metrics.totalExpenses.toFixed(2)}</strong></span>
            </p>
          </div>

          {/* Smart Profit Goal Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Target size={13} className="text-amber-500" />
                Meta de Lucro: R$ {currentGoalTarget.toFixed(0)}
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                {goalProgress}%
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goalProgress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  goalProgress >= 100 
                    ? 'bg-emerald-500' 
                    : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                }`}
              />
            </div>

            {/* Smart Intelligent Goal Note */}
            <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5 pt-0.5">
              {metrics.totalExpenses > 0 && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  Com custos de R$ {metrics.totalExpenses.toFixed(0)}, você precisa faturar aprox.: <strong>R$ {neededGrossToHitGoal.toFixed(0)}</strong>
                </p>
              )}
              <p className="truncate">
                {metrics.realProfit >= currentGoalTarget ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={11} /> Meta de lucro batida!
                  </span>
                ) : (
                  `Faltam R$ ${Math.max(0, currentGoalTarget - metrics.realProfit).toFixed(2)} de lucro real`
                )}
              </p>
            </div>
          </div>

        </div>

        {/* 4 Clean Metric Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
          
          <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Ganhos Brutos</span>
            <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              R$ {metrics.totalGross.toFixed(2)}
            </p>
            <span className="text-[10px] text-slate-400">
              {metrics.tripsCount} corridas
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Taxas dos Apps</span>
            <p className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              - R$ {metrics.totalFees.toFixed(2)}
            </p>
            <span className="text-[10px] text-rose-500/90 font-medium">
              {metrics.feeRateOverall.toFixed(1)}% retido
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Média / Corrida</span>
            <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              R$ {metrics.avgPerTrip.toFixed(2)}
            </p>
            <span className="text-[10px] text-slate-400">
              ticket médio líquido
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Lucro / KM</span>
            <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {metrics.profitPerKm > 0 ? `R$ ${metrics.profitPerKm.toFixed(2)}/km` : '—'}
            </p>
            <span className="text-[10px] text-slate-400">
              {metrics.totalKm.toFixed(0)} km rodados
            </span>
          </div>

        </div>

      </div>

      {/* Main Content Tabs (Corridas / Despesas / Apps) */}
      <div className="space-y-3">
        
        {/* Segmented Tab Navigation */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-white/[0.08] pb-1 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('corridas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'corridas'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Car size={14} />
              <span>Corridas ({filteredTrips.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('despesas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'despesas'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Fuel size={14} />
              <span>Despesas Carro ({filteredExpenses.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('comparacao')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'comparacao'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Layers size={14} />
              <span>Comparativo Apps</span>
            </button>
          </div>
        </div>

        {/* TAB 1: CORRIDAS */}
        {activeTab === 'corridas' && (
          <div className="space-y-3">
            {filteredTrips.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] space-y-3">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Car size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Nenhuma corrida
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Cadastre suas corridas finalizadas para acompanhar seus ganhos reais.
                </p>
                <div className="pt-2 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTrip(null);
                      setIsAddTripOpen(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
                  >
                    + Nova Corrida
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTrips.map((trip) => {
                  const config = APP_CONFIGS[trip.app] || APP_CONFIGS.outro;
                  return (
                    <div
                      key={trip.id}
                      className="p-4 bg-white dark:bg-[#1C1C1E] rounded-3xl flex items-center justify-between gap-3"
                    >
                      {/* Left: App Logo & Trip Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <DriverAppLogo app={trip.app} size="md" />

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {config.name}
                            </span>
                            {trip.distanceKm ? (
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                • {trip.distanceKm} km
                              </span>
                            ) : null}
                            {trip.durationMinutes ? (
                              <span className="text-[11px] text-slate-400">
                                • {trip.durationMinutes} min
                              </span>
                            ) : null}
                          </div>

                          {(trip.origin || trip.destination) ? (
                            <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                              {trip.origin || 'Início'} → {trip.destination || 'Fim'}
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400">
                              Corrida avulsa
                            </p>
                          )}

                          <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap mt-0.5">
                            <span>Trabalho: {trip.date.split('-').reverse().join('/')}</span>
                            {trip.payoutDate && trip.payoutDate !== trip.date ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                                <Clock size={10} strokeWidth={2} />
                                <span>Cai na conta em: {trip.payoutDate.split('-').reverse().join('/')}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                                <CheckCircle2 size={10} strokeWidth={2} />
                                <span>Cai hoje</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Net Value & Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                            + R$ {trip.netAmount.toFixed(2)}
                          </p>
                          {(trip.feeAmount ?? 0) > 0 && (
                            <p className="text-[10px] text-slate-400">
                              Bruto: R$ {trip.grossAmount.toFixed(2)} <span className="text-rose-500">(-{trip.feePercent}%)</span>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenAddTrip(trip)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            title="Editar corrida"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTrip(trip.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            title="Excluir corrida"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DESPESAS */}
        {activeTab === 'despesas' && (
          <div className="space-y-3">
            {filteredExpenses.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] space-y-3">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Fuel size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Nenhum gasto do carro
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Cadastre seus gastos com combustível e manutenção para saber seu lucro líquido.
                </p>
                <div className="pt-2 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingExpense(null);
                      setIsAddExpenseOpen(true);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
                  >
                    - Cadastrar Despesa
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-4 bg-white dark:bg-[#1C1C1E] rounded-3xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        {exp.category === 'combustivel' ? <Fuel size={16} /> :
                         exp.category === 'pedagio' ? <CircleDollarSign size={16} /> :
                         exp.category === 'manutencao' ? <Wrench size={16} /> :
                         exp.category === 'lavagem' ? <Sparkles size={16} /> :
                         <Car size={16} />}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {exp.description}
                          </span>
                          {exp.fuelType && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase">
                              {exp.fuelType} {exp.liters ? `(${exp.liters}L)` : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {exp.date.split('-').reverse().join('/')}
                          {exp.appLinked && exp.appLinked !== 'geral' ? ` • Vinculado ao ${exp.appLinked}` : ' • Custo Operacional'}
                          {exp.notes ? ` • ${exp.notes}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400">
                        - R$ {exp.amount.toFixed(2)}
                      </p>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenAddExpense(exp)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          title="Editar despesa"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteExpense(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          title="Excluir despesa"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMPARATIVO DE APPS */}
        {activeTab === 'comparacao' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {appsBreakdown.map((item) => (
                <div
                  key={item.app}
                  className="p-4 rounded-3xl bg-white dark:bg-[#1C1C1E] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DriverAppLogo app={item.app} size="sm" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.config.name}
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          {item.config.tag}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {item.share.toFixed(0)}% do faturamento
                    </span>
                  </div>

                  <div className="pt-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Ganhos Líquidos</span>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      R$ {item.net.toFixed(2)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Corridas:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{item.count}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Média / Corrida:</span>
                      <strong className="text-slate-800 dark:text-slate-200">R$ {item.avg.toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Taxa média retida:</span>
                    <span className="text-rose-500 font-bold">- R$ {item.fees.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* 3. DEDICATED FLOATING ACTION BUTTON (FAB) IN BOTTOM-RIGHT CORNER */}
      {/* Backdrop overlay when menu is open */}
      <AnimatePresence>
        {isFabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFabOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40"
          />
        )}
      </AnimatePresence>

      {/* Floating Action Button & Menu */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        
        {/* Animated Action Options (Corrida, Despesa & Resumo) */}
        <AnimatePresence>
          {isFabOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex flex-col items-end gap-2.5 mb-1"
            >
              {/* Option 1: Resumo do Dia */}
              <button
                type="button"
                onClick={() => {
                  setIsFabOpen(false);
                  setIsSummaryOpen(true);
                }}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#252528] text-slate-800 dark:text-white shadow-xl border border-slate-200/60 dark:border-white/10 text-xs font-bold hover:bg-slate-50 dark:hover:bg-[#2e2e32] transition-all cursor-pointer group active:scale-95"
              >
                <span>Resumo do Dia</span>
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
                  <ClipboardList size={16} />
                </div>
              </button>

              {/* Option 2: Nova Despesa do Carro */}
              <button
                type="button"
                onClick={() => handleOpenAddExpense()}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#252528] text-slate-800 dark:text-white shadow-xl border border-slate-200/60 dark:border-white/10 text-xs font-bold hover:bg-slate-50 dark:hover:bg-[#2e2e32] transition-all cursor-pointer group active:scale-95"
              >
                <span>+ Lançar Despesa</span>
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/30 group-hover:scale-105 transition-transform">
                  <Fuel size={16} />
                </div>
              </button>

              {/* Option 3: Nova Corrida */}
              <button
                type="button"
                onClick={() => handleOpenAddTrip()}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#252528] text-slate-800 dark:text-white shadow-xl border border-slate-200/60 dark:border-white/10 text-xs font-bold hover:bg-slate-50 dark:hover:bg-[#2e2e32] transition-all cursor-pointer group active:scale-95"
              >
                <span>+ Lançar Corrida</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                  <Zap size={16} className="fill-current" />
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Floating Trigger Button */}
        <button
          type="button"
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all cursor-pointer active:scale-90 ${
            isFabOpen
              ? 'bg-slate-800 dark:bg-slate-700 shadow-slate-900/40 rotate-45'
              : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/40 hover:scale-105'
          }`}
          title={isFabOpen ? 'Fechar opções' : 'Adicionar Corrida ou Despesa'}
        >
          <Plus size={26} className="stroke-[2.5] transition-transform duration-200" />
        </button>

      </div>

      {/* MODALS */}
      <AddDriverTripModal
        isOpen={isAddTripOpen}
        onClose={() => setIsAddTripOpen(false)}
        onSaveTrip={handleSaveTripWrapped}
        editingTrip={editingTrip}
      />

      <AddDriverExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSaveExpense={onAddExpense}
        editingExpense={editingExpense}
      />

      <DriverGoalsModal
        isOpen={isGoalsOpen}
        onClose={() => setIsGoalsOpen(false)}
        goals={goals}
        onSaveGoals={onSaveGoals}
      />

      <DriverDaySummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        trips={trips}
        expenses={expenses}
        goals={goals}
      />

    </div>
  );
}
