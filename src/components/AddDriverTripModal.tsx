import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Car, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Check,
  Clock,
  Wallet
} from 'lucide-react';
import { motion } from 'motion/react';
import { DriverTrip, DriverAppType, WalletAccount } from '../types';
import { APP_CONFIGS } from '../data/initialDriverData';
import { DriverAppLogo } from './DriverAppLogo';
import { MiniCalendar } from './MiniCalendar';
import { CurrencyInput } from './CurrencyInput';
import { triggerHaptic } from '../utils/haptics';
import { todayLocalISO, addDaysLocal, parseLocalISO } from '../utils/dateUtils';

interface AddDriverTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTrip: (tripData: Omit<DriverTrip, 'id'>, editId?: string) => void;
  editingTrip?: DriverTrip | null;
  defaultApp?: DriverAppType;
  accounts?: WalletAccount[];
}

export function AddDriverTripModal({
  isOpen,
  onClose,
  onSaveTrip,
  editingTrip,
  defaultApp = 'uber',
  accounts = []
}: AddDriverTripModalProps) {
  const defaultAccount = accounts.find(a => a.isDefault) || accounts[0];

  const [app, setApp] = useState<DriverAppType>(defaultApp);
  const [netAmount, setNetAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(() => todayLocalISO());
  const [payoutDate, setPayoutDate] = useState<string>(() => todayLocalISO());
  const [accountId, setAccountId] = useState<string>(defaultAccount?.id || '');
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [isPayoutCalendarOpen, setIsPayoutCalendarOpen] = useState<boolean>(false);
  const [syncToIncome, setSyncToIncome] = useState<boolean>(true);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  useEffect(() => {
    if (editingTrip) {
      setApp(editingTrip.app);
      setNetAmount(editingTrip.netAmount || 0);
      setDate(editingTrip.date || todayLocalISO());
      setPayoutDate(editingTrip.payoutDate || editingTrip.date || todayLocalISO());
      setAccountId(editingTrip.accountId || defaultAccount?.id || '');
      setSyncToIncome(editingTrip.syncToIncome !== false);
    } else {
      const selectedDefaultApp = defaultApp || 'uber';
      setApp(selectedDefaultApp);
      setNetAmount(0);
      const today = todayLocalISO();
      setDate(today);
      setPayoutDate(today);
      setAccountId(defaultAccount?.id || accounts[0]?.id || '');
      setSyncToIncome(true);
    }
  }, [editingTrip, defaultApp, isOpen, defaultAccount, accounts]);

  const getNextDay = (dateStr: string) => {
    try {
      return addDaysLocal(dateStr, 1);
    } catch {
      return dateStr;
    }
  };

  const handleSetSameDay = () => {
    setPayoutDate(date);
  };

  const handleSetNextDay = () => {
    setPayoutDate(getNextDay(date));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = netAmount || 0;
    if (val <= 0) return;

    triggerHaptic(12);
    // Ao editar sem mexer no valor, preserva bruto e taxa originais (ex.: fechamento do dia sem taxa).
    const keepOriginalFee = Boolean(editingTrip) && Math.abs(val - (editingTrip?.netAmount || 0)) < 0.005;
    const defaultFee = APP_CONFIGS[app]?.defaultFee ?? 20;
    const gross = keepOriginalFee && editingTrip
      ? editingTrip.grossAmount
      : defaultFee > 0 && defaultFee < 100 ? val / (1 - defaultFee / 100) : val;
    const feePercent = keepOriginalFee && editingTrip ? editingTrip.feePercent : defaultFee;
    const feeAmount = (keepOriginalFee && editingTrip ? editingTrip.feeAmount : undefined) ?? gross - val;

    onSaveTrip({
      app,
      type: editingTrip?.type ?? 'corrida',
      grossAmount: Math.round(gross * 100) / 100,
      feePercent,
      feeAmount: Math.round(feeAmount * 100) / 100,
      netAmount: Math.round(val * 100) / 100,
      date,
      payoutDate,
      accountId: accountId || undefined,
      syncToIncome
    }, editingTrip?.id);

    onClose();
  };

  if (!isOpen) return null;

  const formattedDisplayDate = (() => {
    if (!date) return 'Selecionar Data';
    const dateObj = parseLocalISO(date);
    return dateObj.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  })();

  const formattedPayoutDisplayDate = (() => {
    if (!payoutDate) return 'Selecionar Data';
    const dateObj = parseLocalISO(payoutDate);
    return dateObj.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  })();

  const isSameDayPayout = payoutDate === date;
  const isNextDayPayout = payoutDate === getNextDay(date);

  const modalContent = (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between sticky top-0 bg-white dark:bg-[#1C1C1E] z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Car size={19} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                {editingTrip ? 'Editar Faturamento do App' : 'Registrar Ganho do App'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                O valor vai direto para a conta selecionada na Carteira
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          
          {/* Amount Received (Main Focus) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Valor Total Recebido *
            </label>
            <div className="text-3xl font-bold">
              <CurrencyInput
                value={netAmount}
                onChange={setNetAmount}
                required
              />
            </div>
          </div>

          {/* Advanced Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            {showAdvanced ? 'Ocultar opções avançadas' : 'Mostrar mais opções'}
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/[0.08]">
              {/* App Selector Pills */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                  Selecione o Aplicativo
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {(['uber', '99', 'indrive', 'blablacar', 'outro'] as DriverAppType[]).map((appKey) => {
                    const isSelected = app === appKey;
                    return (
                      <button
                        key={appKey}
                        type="button"
                        onClick={() => setApp(appKey)}
                        className={`p-2 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-slate-900 dark:text-white ring-2 ring-emerald-500/20'
                            : 'border-slate-200/60 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <DriverAppLogo app={appKey} size="sm" />
                        <span className="text-[10px] font-bold truncate max-w-full">
                          {APP_CONFIGS[appKey].shortName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Wallet Account Selector */}
              {accounts.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Wallet size={14} className="text-emerald-500" />
                    <span>Conta Bancária / Carteira de Destino</span>
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id} className="bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white">
                        {acc.name} (Saldo: R$ {acc.currentBalance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date of work */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Data da Corrida / Trabalho
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCalendarOpen(!isCalendarOpen);
                    setIsPayoutCalendarOpen(false);
                  }}
                  className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-emerald-500" />
                    <span className="capitalize text-sm">{formattedDisplayDate}</span>
                  </div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Alterar Data</span>
                </button>

                {isCalendarOpen && (
                  <MiniCalendar
                    selectedDate={date}
                    onSelectDate={(newDate) => {
                      setDate(newDate);
                      setIsCalendarOpen(false);
                      if (isSameDayPayout) {
                        setPayoutDate(newDate);
                      }
                    }}
                    onClose={() => setIsCalendarOpen(false)}
                  />
                )}
              </div>

              {/* Payout Date (When money drops in account) */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock size={14} className="text-emerald-500" />
                    <span>Previsão de Depósito</span>
                  </label>
                </div>

                {/* Quick Payout Preset Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSetSameDay}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSameDayPayout
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                        : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    Mesmo dia ({date.split('-').reverse().join('/')})
                  </button>
                  <button
                    type="button"
                    onClick={handleSetNextDay}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isNextDayPayout
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                        : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    Dia seguinte (Amanhã)
                  </button>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPayoutCalendarOpen(!isPayoutCalendarOpen);
                      setIsCalendarOpen(false);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Data exata do depósito:</span>
                      <span className="capitalize font-bold text-emerald-600 dark:text-emerald-400">{formattedPayoutDisplayDate}</span>
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold underline">Selecionar no Calendário</span>
                  </button>

                  {isPayoutCalendarOpen && (
                    <MiniCalendar
                      selectedDate={payoutDate}
                      onSelectDate={(newDate) => {
                        setPayoutDate(newDate);
                        setIsPayoutCalendarOpen(false);
                      }}
                      onClose={() => setIsPayoutCalendarOpen(false)}
                    />
                  )}
                </div>
              </div>

              {/* Sync to General Financial Incomes */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Integrar ao Balanço Geral
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Computar no total de rendas do mês
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={syncToIncome}
                  onChange={(e) => setSyncToIncome(e.target.checked)}
                  className="w-4 h-4 rounded-md accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/[0.08]">
            <button
              type="submit"
              className="w-full py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check size={18} strokeWidth={3} />
              <span>{editingTrip ? 'Atualizar Ganho' : 'Confirmar Ganho'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
