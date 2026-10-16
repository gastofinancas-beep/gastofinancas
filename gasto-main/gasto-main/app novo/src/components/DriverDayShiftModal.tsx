import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Calendar, 
  Fuel, 
  UtensilsCrossed, 
  Sparkles, 
  Check, 
  TrendingUp, 
  Wallet, 
  Droplets,
  Wrench,
  Car,
  ArrowLeft,
  ChevronRight,
  DollarSign,
  Plus,
  Clock,
  CalendarDays,
  Zap,
  HelpCircle,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DriverAppType, 
  DriverExpenseCategory, 
  WalletAccount, 
  ExtraProfileConfig,
  DriverTrip,
  DriverExpense 
} from '../types';
import { DriverAppLogo } from './DriverAppLogo';
import { APP_CONFIGS } from '../data/initialDriverData';
import { formatCurrency } from '../utils/financeCalculations';
import { triggerHaptic } from '../utils/haptics';
import { DatePickerInput } from './DatePickerInput';
import { todayLocalISO, toLocalISODate, parseLocalISO, addDaysLocal } from '../utils/dateUtils';

function addDaysToDate(dateStr: string, days: number): string {
  try {
    return addDaysLocal(dateStr, days);
  } catch {
    return dateStr;
  }
}

function getNextWednesday(dateStr: string): string {
  try {
    const dt = parseLocalISO(dateStr);
    const dayOfWeek = dt.getDay(); // 0 is Sunday, 3 is Wednesday
    let daysToAdd = (3 - dayOfWeek + 7) % 7;
    if (daysToAdd === 0) daysToAdd = 7; // next Wednesday if today is Wednesday
    dt.setDate(dt.getDate() + daysToAdd);
    return toLocalISODate(dt);
  } catch {
    return dateStr;
  }
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}

interface DriverDayShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExtraProfileConfig;
  accounts: WalletAccount[];
  onSaveShift: (
    trips: Omit<DriverTrip, 'id' | 'createdAt'>[],
    expenses: Omit<DriverExpense, 'id' | 'createdAt'>[]
  ) => void;
}

export function DriverDayShiftModal({
  isOpen,
  onClose,
  config,
  accounts,
  onSaveShift
}: DriverDayShiftModalProps) {
  const [date, setDate] = useState<string>(() => todayLocalISO());
  const [hoursWorked, setHoursWorked] = useState<string>('');
  const [kmDriven, setKmDriven] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Payout date settings (Quando o dinheiro cai na conta)
  const [payoutOption, setPayoutOption] = useState<'today' | 'tomorrow' | 'in_2_days' | 'next_wed' | 'custom'>('today');
  const [customPayoutDate, setCustomPayoutDate] = useState<string>(() => todayLocalISO());
  const [customizePerApp, setCustomizePerApp] = useState(false);
  const [perAppPayoutDates, setPerAppPayoutDates] = useState<Record<string, string>>({});
  
  // Platform earnings { uber: "120.00", 99: "80.00", ... }
  const activeApps = config.selectedApps && config.selectedApps.length > 0 
    ? config.selectedApps 
    : (['uber', '99', 'indrive', 'particular'] as DriverAppType[]);

  const [platformEarnings, setPlatformEarnings] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    activeApps.forEach(app => {
      init[app] = '';
    });
    return init;
  });

  const [platformTripsCount, setPlatformTripsCount] = useState<Record<string, string>>({});

  // Expenses
  const [expenseAmounts, setExpenseAmounts] = useState<{
    combustivel: string;
    alimentacao: string;
    lavagem: string;
    manutencao: string;
    pedagio: string;
    outros: string;
  }>({
    combustivel: '',
    alimentacao: '',
    lavagem: '',
    manutencao: '',
    pedagio: '',
    outros: ''
  });

  const defaultAcc = accounts.find(a => a.id === config.defaultAccountId) || accounts[0];
  const [accountId, setAccountId] = useState<string>(defaultAcc?.id || '');

  if (!isOpen) return null;

  const handlePlatformChange = (app: string, value: string) => {
    setPlatformEarnings(prev => ({ ...prev, [app]: value }));
  };

  const handleExpenseChange = (cat: keyof typeof expenseAmounts, value: string) => {
    setExpenseAmounts(prev => ({ ...prev, [cat]: value }));
  };

  const parseVal = (v?: string | null): number => {
    if (!v) return 0;
    const clean = parseFloat(String(v).replace(',', '.'));
    return isNaN(clean) ? 0 : clean;
  };

  const totalEarnings = Object.values(platformEarnings).reduce((acc, curr) => acc + parseVal(curr), 0);
  const totalExpenses = Object.values(expenseAmounts).reduce((acc, curr) => acc + parseVal(curr), 0);
  const netProfit = totalEarnings - totalExpenses;

  const getEffectivePayoutDate = (option: typeof payoutOption, baseDate: string, customDate: string) => {
    if (option === 'today') return baseDate;
    if (option === 'tomorrow') return addDaysToDate(baseDate, 1);
    if (option === 'in_2_days') return addDaysToDate(baseDate, 2);
    if (option === 'next_wed') return getNextWednesday(baseDate);
    if (option === 'custom') return customDate || baseDate;
    return baseDate;
  };

  const generalPayoutDate = getEffectivePayoutDate(payoutOption, date, customPayoutDate);
  const isFuturePayout = generalPayoutDate > date;

  const handleSave = () => {
    triggerHaptic(15);
    const tripsToSave: Omit<DriverTrip, 'id' | 'createdAt'>[] = [];
    const expensesToSave: Omit<DriverExpense, 'id' | 'createdAt'>[] = [];

    const hours = parseVal(hoursWorked);
    const km = parseVal(kmDriven);

    // Salvar viagens por aplicativo com a data de repasse/compensação
    Object.keys(platformEarnings).forEach(appKey => {
      const amount = parseVal(platformEarnings[appKey]);
      if (amount > 0) {
        const appType = appKey as DriverAppType;
        const appConfig = APP_CONFIGS[appType];
        const tripsCount = parseInt(platformTripsCount[appKey] || '0', 10) || undefined;
        
        const finalPayoutDate = customizePerApp && perAppPayoutDates[appKey]
          ? perAppPayoutDates[appKey]
          : generalPayoutDate;

        tripsToSave.push({
          app: appType,
          type: 'fechamento_dia',
          grossAmount: amount,
          feePercent: 0, 
          feeAmount: 0,
          netAmount: amount,
          date,
          payoutDate: finalPayoutDate,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          durationMinutes: hours > 0 ? Math.round((hours * 60) / Math.max(1, Object.keys(platformEarnings).filter(k => parseVal(platformEarnings[k]) > 0).length)) : undefined,
          distanceKm: km > 0 ? Math.round(km / Math.max(1, Object.keys(platformEarnings).filter(k => parseVal(platformEarnings[k]) > 0).length)) : undefined,
          tripsCount,
          accountId: accountId || undefined,
          notes: `Fechamento do dia (${appConfig?.name || appKey})`,
          syncToIncome: true
        });
      }
    });

    // Despesas do fechamento
    const expenseLabels: Record<keyof typeof expenseAmounts, { name: string; cat: DriverExpenseCategory }> = {
      combustivel: { name: 'Combustível / Abastecimento', cat: 'combustivel' },
      alimentacao: { name: 'Almoço / Alimentação', cat: 'alimentacao' },
      lavagem: { name: 'Lavagem do Carro', cat: 'lavagem' },
      manutencao: { name: 'Manutenção / Troca de Óleo', cat: 'manutencao' },
      pedagio: { name: 'Pedágio / Estacionamento', cat: 'pedagio' },
      outros: { name: 'Outros Gastos Operacionais', cat: 'outros' }
    };

    (Object.keys(expenseAmounts) as Array<keyof typeof expenseAmounts>).forEach(key => {
      const amount = parseVal(expenseAmounts[key]);
      if (amount > 0) {
        const info = expenseLabels[key];
        expensesToSave.push({
          category: info.cat,
          description: info.name,
          amount,
          date,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          accountId,
          fuelType: key === 'combustivel' ? (config.fuelType === 'outro' ? undefined : config.fuelType) || 'gasolina' : undefined,
          notes: `Despesa lançada no fechamento do dia`
        });
      }
    });

    onSaveShift(tripsToSave, expensesToSave);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[999] flex flex-col bg-slate-900/70 backdrop-blur-md sm:p-4 sm:items-center sm:justify-center overflow-hidden animate-in fade-in duration-200">
      
      {/* Background click dismiss for desktop */}
      <div 
        onClick={onClose}
        className="hidden sm:block absolute inset-0 -z-10"
      />

      {/* Main Screen Panel: Full Screen on Mobile, Centered Modal on Desktop */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-xl bg-slate-50 dark:bg-[#121214] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border-0 sm:border border-slate-200/60 dark:border-white/[0.08]"
      >
        
        {/* Top App Bar (Mobile-first Navigation) */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 bg-white dark:bg-[#18181B] border-b border-slate-200/60 dark:border-white/[0.08] flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(6);
                onClose();
              }}
              className="p-2 -ml-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={20} className="stroke-[2.5]" />
              <span className="text-xs font-bold sm:hidden">Voltar</span>
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Fechamento do Dia
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ganhos por app, previsão de repasse e gastos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          
          {/* Card Resumo do Fechamento (Lucro Líquido Real) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white border border-emerald-500/20 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-0 bottom-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 shrink-0">
                  <Sparkles size={14} />
                  Resumo do Fechamento
                </span>
                <div className="w-36">
                  <DatePickerInput
                    value={date}
                    onChange={newDate => setDate(newDate)}
                    inputClassName="!bg-white/10 hover:!bg-white/15 !border-white/20 !rounded-xl !px-2.5 !py-1 !text-xs !font-bold !text-white"
                  />
                </div>
              </div>

              <div className="text-center py-2">
                <p className="text-xs text-slate-300 font-medium">Lucro Líquido Real Estimado</p>
                <p className={`text-3xl sm:text-4xl font-bold tabular-nums tracking-tight mt-0.5 ${
                  netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatCurrency(netProfit)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10 text-xs">
                <div className="bg-white/5 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] text-slate-400 block font-semibold">Total Faturado</span>
                  <span className="font-extrabold text-white tabular-nums text-sm">{formatCurrency(totalEarnings)}</span>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] text-slate-400 block font-semibold">Total Despesas</span>
                  <span className="font-extrabold text-rose-300 tabular-nums text-sm">{formatCurrency(totalExpenses)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 1. SEÇÃO: Quanto faturou em cada App */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Faturamento por Aplicativo
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Total: {formatCurrency(totalEarnings)}
              </span>
            </div>

            <div className="space-y-2.5">
              {activeApps.map(appId => {
                const appConfig = APP_CONFIGS[appId];
                return (
                  <div 
                    key={appId} 
                    className="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200/60 dark:border-white/[0.08] shadow-2xs flex items-center justify-between gap-3 focus-within:border-emerald-500 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <DriverAppLogo app={appId} size="md" />
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-slate-900 dark:text-white block truncate">
                          {appConfig?.name || appId}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {appId === 'particular' ? 'Corridas particulares' : 'App de transporte'}
                        </span>
                      </div>
                    </div>

                    <div className="relative w-36 sm:w-44 shrink-0">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 dark:text-slate-500">
                        R$
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        placeholder="0,00"
                        value={platformEarnings[appId] || ''}
                        onChange={e => handlePlatformChange(appId, e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.10] bg-slate-50 dark:bg-[#1C1C1E] text-sm sm:text-base font-bold text-slate-900 dark:text-white text-right focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-white/[0.04] transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 🌟 2. SEÇÃO: PREVISÃO DE REPASSE / QUANDO O DINHEIRO CAI NA CONTA */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200/70 dark:border-white/[0.08] shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Quando o dinheiro vai cair na conta?
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Defina o prazo de repasse (Uber/99 normalmente pagam em 1-2 dias)
                  </p>
                </div>
              </div>
              
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Repasse: {formatShortDate(generalPayoutDate)}
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {/* Hoje */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(6);
                  setPayoutOption('today');
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  payoutOption === 'today'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-2xs ring-1 ring-emerald-500'
                    : 'bg-slate-50/70 dark:bg-[#1C1C1E] border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Zap size={14} className={payoutOption === 'today' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
                  {payoutOption === 'today' && <Check size={12} className="text-emerald-600 stroke-[3]" />}
                </div>
                <div>
                  <span className="text-xs font-bold block">Hoje</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Imediato</span>
                </div>
              </button>

              {/* Amanhã */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(6);
                  setPayoutOption('tomorrow');
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  payoutOption === 'tomorrow'
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-2xs ring-1 ring-indigo-500'
                    : 'bg-slate-50/70 dark:bg-[#1C1C1E] border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Clock size={14} className={payoutOption === 'tomorrow' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                  {payoutOption === 'tomorrow' && <Check size={12} className="text-indigo-600 stroke-[3]" />}
                </div>
                <div>
                  <span className="text-xs font-bold block">Amanhã</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">+1 dia ({formatShortDate(addDaysToDate(date, 1))})</span>
                </div>
              </button>

              {/* Em 2 dias */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(6);
                  setPayoutOption('in_2_days');
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  payoutOption === 'in_2_days'
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-2xs ring-1 ring-indigo-500'
                    : 'bg-slate-50/70 dark:bg-[#1C1C1E] border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <CalendarDays size={14} className={payoutOption === 'in_2_days' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                  {payoutOption === 'in_2_days' && <Check size={12} className="text-indigo-600 stroke-[3]" />}
                </div>
                <div>
                  <span className="text-xs font-bold block">Em 2 dias</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">+2 dias ({formatShortDate(addDaysToDate(date, 2))})</span>
                </div>
              </button>

              {/* Próx. Quarta (Uber) */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(6);
                  setPayoutOption('next_wed');
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  payoutOption === 'next_wed'
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-2xs ring-1 ring-indigo-500'
                    : 'bg-slate-50/70 dark:bg-[#1C1C1E] border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Calendar size={14} className={payoutOption === 'next_wed' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                  {payoutOption === 'next_wed' && <Check size={12} className="text-indigo-600 stroke-[3]" />}
                </div>
                <div>
                  <span className="text-xs font-bold block">Próx. Quarta</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Repasse semanal ({formatShortDate(getNextWednesday(date))})</span>
                </div>
              </button>
            </div>

            {/* Custom Date Picker Selector */}
            <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(6);
                    setPayoutOption('custom');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    payoutOption === 'custom'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  <Calendar size={13} />
                  <span>Outra data específica</span>
                </button>
              </div>

              {payoutOption === 'custom' && (
                <div className="w-full sm:w-44">
                  <DatePickerInput
                    label="Data de Repasse"
                    value={customPayoutDate}
                    onChange={d => setCustomPayoutDate(d)}
                  />
                </div>
              )}
            </div>

            {/* Explanatory Banner for Future Payout */}
            {isFuturePayout ? (
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-2.5">
                <Clock size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-indigo-900 dark:text-indigo-200 leading-relaxed">
                  <strong>Lançamento Futuro na Carteira:</strong> Este fechamento será registrado com previsão para cair em <strong>{formatShortDate(generalPayoutDate)}</strong>. Ele ficará visível na aba Carteira marcado como <em>"Lançamento Futuro (A receber)"</em>, garantindo que o seu saldo bancário atual reflita apenas o dinheiro já compensado.
                </p>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.04] flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <Check size={13} className="text-emerald-500 shrink-0" />
                <span>O valor será creditado no saldo disponível da carteira na data de hoje.</span>
              </div>
            )}
          </div>

          {/* 3. SEÇÃO: Despesas do Dia (Combustível, Almoço, etc) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Gastos e Despesas do Dia
                </h3>
              </div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                Total: {formatCurrency(totalExpenses)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Combustível */}
              <div className="p-3 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200/60 dark:border-white/[0.08] shadow-2xs flex items-center justify-between gap-3 focus-within:border-rose-500 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                    <Fuel size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block truncate">
                      Combustível
                    </span>
                    <span className="text-[10px] text-slate-400">Gasolina / Álcool</span>
                  </div>
                </div>
                <div className="relative w-32 shrink-0">
                  <span className="absolute left-2.5 top-2 text-[11px] font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="0,00"
                    value={expenseAmounts.combustivel}
                    onChange={e => handleExpenseChange('combustivel', e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.10] bg-slate-50 dark:bg-[#1C1C1E] text-xs sm:text-sm font-bold text-slate-900 dark:text-white text-right focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Alimentação */}
              <div className="p-3 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200/60 dark:border-white/[0.08] shadow-2xs flex items-center justify-between gap-3 focus-within:border-amber-500 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <UtensilsCrossed size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block truncate">
                      Alimentação
                    </span>
                    <span className="text-[10px] text-slate-400">Almoço / Lanche</span>
                  </div>
                </div>
                <div className="relative w-32 shrink-0">
                  <span className="absolute left-2.5 top-2 text-[11px] font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="0,00"
                    value={expenseAmounts.alimentacao}
                    onChange={e => handleExpenseChange('alimentacao', e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.10] bg-slate-50 dark:bg-[#1C1C1E] text-xs sm:text-sm font-bold text-slate-900 dark:text-white text-right focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Lavagem */}
              <div className="p-3 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200/60 dark:border-white/[0.08] shadow-2xs flex items-center justify-between gap-3 focus-within:border-blue-500 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <Droplets size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block truncate">
                      Lavagem
                    </span>
                    <span className="text-[10px] text-slate-400">Ducha / Completa</span>
                  </div>
                </div>
                <div className="relative w-32 shrink-0">
                  <span className="absolute left-2.5 top-2 text-[11px] font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="0,00"
                    value={expenseAmounts.lavagem}
                    onChange={e => handleExpenseChange('lavagem', e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.10] bg-slate-50 dark:bg-[#1C1C1E] text-xs sm:text-sm font-bold text-slate-900 dark:text-white text-right focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Pedágio / Estacionamento / Outros */}
              <div className="p-3 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200/60 dark:border-white/[0.08] shadow-2xs flex items-center justify-between gap-3 focus-within:border-purple-500 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                    <Car size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block truncate">
                      Pedágio / Outros
                    </span>
                    <span className="text-[10px] text-slate-400">Estacionamento</span>
                  </div>
                </div>
                <div className="relative w-32 shrink-0">
                  <span className="absolute left-2.5 top-2 text-[11px] font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="0,00"
                    value={expenseAmounts.pedagio}
                    onChange={e => handleExpenseChange('pedagio', e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.10] bg-slate-50 dark:bg-[#1C1C1E] text-xs sm:text-sm font-bold text-slate-900 dark:text-white text-right focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Opções avançadas (Horas, KM, Conta bancária) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setShowAdvanced(!showAdvanced);
                triggerHaptic(6);
              }}
              className="w-full py-2.5 rounded-2xl border border-dashed border-slate-300 dark:border-white/[0.10] text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{showAdvanced ? 'Ocultar detalhes de Horas e KM' : '+ Informar Horas Trabalhadas, KM e Conta'}</span>
            </button>

            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200/60 dark:border-white/[0.08] space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Horas Rodadas
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 8"
                      value={hoursWorked}
                      onChange={e => setHoursWorked(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.10] bg-slate-50 dark:bg-[#1C1C1E] text-xs font-bold text-slate-900 dark:text-white text-center focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      KM Rodados
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 180"
                      value={kmDriven}
                      onChange={e => setKmDriven(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.10] bg-slate-50 dark:bg-[#1C1C1E] text-xs font-bold text-slate-900 dark:text-white text-center focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Conta da Carteira (onde entra o dinheiro)
                  </label>
                  <select
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.10] bg-slate-50 dark:bg-[#1C1C1E] text-xs font-bold text-slate-900 dark:text-white focus:outline-none truncate"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
          </div>

        </div>

        {/* Fixed Mobile Bottom CTA Bar */}
        <div className="p-4 sm:px-6 sm:py-4 bg-white dark:bg-[#18181B] border-t border-slate-200/60 dark:border-white/[0.08] shrink-0 shadow-lg flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="hidden sm:inline-flex px-5 py-3 rounded-2xl border border-slate-200 dark:border-white/[0.10] text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={totalEarnings === 0 && totalExpenses === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm sm:text-base font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md cursor-pointer"
          >
            <span>Salvar Fechamento</span>
            <Check size={18} className="stroke-[3]" />
          </button>
        </div>

      </motion.div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

export default DriverDayShiftModal;
