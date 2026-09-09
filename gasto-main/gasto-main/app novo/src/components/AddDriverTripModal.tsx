import React, { useState, useEffect } from 'react';
import { 
  X, 
  Car, 
  Zap, 
  Sparkles, 
  Navigation, 
  MapPin, 
  Clock, 
  Users, 
  FileText, 
  Percent, 
  Check,
  Compass,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DriverTrip, DriverAppType, DriverTripType } from '../types';
import { APP_CONFIGS } from '../data/initialDriverData';
import { DriverAppLogo } from './DriverAppLogo';

interface AddDriverTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTrip: (tripData: Omit<DriverTrip, 'id'>, editId?: string) => void;
  editingTrip?: DriverTrip | null;
  defaultApp?: DriverAppType;
}

export function AddDriverTripModal({
  isOpen,
  onClose,
  onSaveTrip,
  editingTrip,
  defaultApp = 'uber'
}: AddDriverTripModalProps) {
  const [entryMode, setEntryMode] = useState<'quick' | 'detailed'>('quick');

  const [app, setApp] = useState<DriverAppType>(defaultApp);
  const [type, setType] = useState<DriverTripType>('corrida');
  
  // Amounts
  const [quickNetAmount, setQuickNetAmount] = useState<string>('');
  const [grossAmount, setGrossAmount] = useState<string>('');
  const [feePercent, setFeePercent] = useState<number>(25);
  const [manualFeeAmount, setManualFeeAmount] = useState<string>('');
  const [useManualFee, setUseManualFee] = useState<boolean>(false);

  // Details
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [distanceKm, setDistanceKm] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<string>('');
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [passengersCount, setPassengersCount] = useState<string>('1');
  const [notes, setNotes] = useState<string>('');
  const [syncToIncome, setSyncToIncome] = useState<boolean>(true);

  // Initialize or reset form when modal opens or edit changes
  useEffect(() => {
    if (editingTrip) {
      setApp(editingTrip.app);
      setType(editingTrip.type);
      setGrossAmount(editingTrip.grossAmount ? editingTrip.grossAmount.toFixed(2) : '');
      setQuickNetAmount(editingTrip.netAmount ? editingTrip.netAmount.toFixed(2) : '');
      setFeePercent(editingTrip.feePercent || 0);
      setManualFeeAmount(editingTrip.feeAmount ? editingTrip.feeAmount.toFixed(2) : '');
      setDate(editingTrip.date);
      setTime(editingTrip.time || '');
      setDistanceKm(editingTrip.distanceKm ? String(editingTrip.distanceKm) : '');
      setDurationMinutes(editingTrip.durationMinutes ? String(editingTrip.durationMinutes) : '');
      setOrigin(editingTrip.origin || '');
      setDestination(editingTrip.destination || '');
      setPassengersCount(editingTrip.passengersCount ? String(editingTrip.passengersCount) : '1');
      setNotes(editingTrip.notes || '');
      setSyncToIncome(editingTrip.syncToIncome !== false);
      setEntryMode('detailed');
    } else {
      const selectedDefaultApp = defaultApp || 'uber';
      setApp(selectedDefaultApp);
      setType(selectedDefaultApp === 'blablacar' ? 'viagem' : 'corrida');
      setFeePercent(APP_CONFIGS[selectedDefaultApp]?.defaultFee ?? 25);
      setQuickNetAmount('');
      setGrossAmount('');
      setManualFeeAmount('');
      setUseManualFee(false);
      setDate(new Date().toISOString().split('T')[0]);
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      setDistanceKm('');
      setDurationMinutes('');
      setOrigin('');
      setDestination('');
      setPassengersCount('1');
      setNotes('');
      setSyncToIncome(true);
      setEntryMode('quick');
    }
  }, [editingTrip, defaultApp, isOpen]);

  // When app changes, adapt default fee percent
  const handleAppChange = (newApp: DriverAppType) => {
    setApp(newApp);
    if (newApp === 'blablacar') {
      setType('viagem');
      setFeePercent(0);
    } else {
      setFeePercent(APP_CONFIGS[newApp]?.defaultFee ?? 20);
    }
  };

  // Calculations for detailed mode
  const parsedGross = parseFloat(grossAmount.replace(',', '.')) || 0;
  let calculatedFeeAmount = 0;
  let calculatedNetAmount = 0;

  if (useManualFee) {
    calculatedFeeAmount = parseFloat(manualFeeAmount.replace(',', '.')) || 0;
    calculatedNetAmount = Math.max(0, parsedGross - calculatedFeeAmount);
  } else {
    calculatedFeeAmount = (parsedGross * feePercent) / 100;
    calculatedNetAmount = Math.max(0, parsedGross - calculatedFeeAmount);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalGross = 0;
    let finalFeeAmount = 0;
    let finalFeePercent = feePercent;
    let finalNetAmount = 0;

    if (entryMode === 'quick') {
      const netVal = parseFloat(quickNetAmount.replace(',', '.')) || 0;
      if (netVal <= 0) return;
      
      finalNetAmount = netVal;
      // In quick mode, we estimate gross based on default app fee or equal
      if (feePercent > 0 && feePercent < 100) {
        finalGross = finalNetAmount / (1 - feePercent / 100);
        finalFeeAmount = finalGross - finalNetAmount;
      } else {
        finalGross = finalNetAmount;
        finalFeeAmount = 0;
      }
    } else {
      if (parsedGross <= 0 && calculatedNetAmount <= 0) return;
      finalGross = parsedGross;
      finalFeeAmount = calculatedFeeAmount;
      finalNetAmount = calculatedNetAmount;
      if (useManualFee && finalGross > 0) {
        finalFeePercent = (finalFeeAmount / finalGross) * 100;
      }
    }

    onSaveTrip({
      app,
      type,
      grossAmount: finalGross,
      feePercent: Math.round(finalFeePercent * 10) / 10,
      feeAmount: Math.round(finalFeeAmount * 100) / 100,
      netAmount: Math.round(finalNetAmount * 100) / 100,
      date,
      time: time || undefined,
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : undefined,
      distanceKm: distanceKm ? parseFloat(distanceKm.replace(',', '.')) : undefined,
      origin: origin.trim() || undefined,
      destination: destination.trim() || undefined,
      passengersCount: passengersCount ? parseInt(passengersCount, 10) : 1,
      notes: notes.trim() || undefined,
      syncToIncome
    }, editingTrip?.id);

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Car size={19} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                {editingTrip ? 'Editar Corrida / Viagem' : 'Registrar Corrida'}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Ganhos de motorista de aplicativo e carona
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
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5 flex-1">
          
          {/* Mode Switcher: Rápido vs Detalhado */}
          <div className="p-1 bg-slate-100 dark:bg-white/[0.06] rounded-2xl flex items-center border border-slate-200/60 dark:border-white/[0.05]">
            <button
              type="button"
              onClick={() => setEntryMode('quick')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                entryMode === 'quick'
                  ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Zap size={14} className="text-amber-500" />
              <span>Registro Rápido (3s)</span>
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('detailed')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                entryMode === 'detailed'
                  ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText size={14} className="text-blue-500" />
              <span>Registro Detalhado</span>
            </button>
          </div>

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
                    onClick={() => handleAppChange(appKey)}
                    className={`p-2 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-slate-900 dark:text-white ring-2 ring-emerald-500/20'
                        : 'border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-600 dark:text-slate-400'
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

          {/* Trip Type Selector (Corrida vs Viagem/Carona) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('corrida')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'corrida'
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950 shadow-xs'
                  : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
              }`}
            >
              <Car size={14} />
              <span>Corrida Urbana</span>
            </button>
            <button
              type="button"
              onClick={() => setType('viagem')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'viagem'
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950 shadow-xs'
                  : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
              }`}
            >
              <Compass size={14} />
              <span>Carona / Viagem</span>
            </button>
          </div>

          {/* QUICK MODE FIELDS */}
          {entryMode === 'quick' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Valor Líquido Recebido (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    autoFocus
                    placeholder="0,00"
                    value={quickNetAmount}
                    onChange={(e) => setQuickNetAmount(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-black text-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Digite exatamente o valor final que caiu no seu saldo/carteira.
                </p>
              </div>

              {/* Quick Date & Time */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Quick Distance in KM */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Quilômetros Rodados (opcional)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 8.5"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200 pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    km
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* DETAILED MODE FIELDS */
            <div className="space-y-4">
              {/* Gross Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Valor Bruto da Corrida (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="50,00"
                    value={grossAmount}
                    onChange={(e) => setGrossAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-bold text-base text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              {/* App Fee Configuration */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Percent size={13} className="text-indigo-500" />
                    Taxa do Aplicativo
                  </span>
                  <button
                    type="button"
                    onClick={() => setUseManualFee(!useManualFee)}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    {useManualFee ? 'Usar Porcentagem (%)' : 'Informar R$ fixo'}
                  </button>
                </div>

                {!useManualFee ? (
                  <div className="space-y-2">
                    {/* Fee preset buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[0, 10, 15, 20, 25, 30, 35].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setFeePercent(pct)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            feePercent === pct
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-2xs'
                              : 'bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-100'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="1"
                        value={feePercent}
                        onChange={(e) => setFeePercent(Number(e.target.value))}
                        className="flex-1 accent-emerald-600 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 w-10 text-right">
                        {feePercent}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Valor retido pelo app em R$"
                      value={manualFeeAmount}
                      onChange={(e) => setManualFeeAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                )}

                {/* Calculation breakdown pill */}
                {parsedGross > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500 dark:text-slate-400">
                      Taxa retida: <span className="text-rose-500">- R$ {calculatedFeeAmount.toFixed(2)}</span>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                      Líquido: R$ {calculatedNetAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Date, Time & Route */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Distance & Duration */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Distância (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 14.5"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Duração (minutos)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 25"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Origin & Destination */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Origem (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Av. Paulista"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Destino (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Aeroporto"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Observações
                </label>
                <input
                  type="text"
                  placeholder="Ex: Corrida dinâmica, gorjeta de passageiro..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          )}

          {/* Sync to General Financial Incomes */}
          <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Integrar ao Balanço Geral
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Computar no total de ganhos do mês
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

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check size={16} strokeWidth={3} />
            <span>{editingTrip ? 'Atualizar Corrida' : 'Salvar Corrida'}</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
