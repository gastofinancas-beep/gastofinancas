import React, { useState, useEffect } from 'react';
import { Car, Play, Square, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { DriverAppType } from '../types';
import { formatCurrency } from '../utils/financeCalculations';
import { APP_CONFIGS } from '../data/initialDriverData';

export interface ActiveShift {
  startTime: string; // ISO datetime
  startedAt: Date;
  totalGross: number;
  tripsCount: number;
  appInUse: DriverAppType | null;
}

interface DriverShiftModeProps {
  activeShift: ActiveShift | null;
  onStartShift: (app: DriverAppType) => void;
  onEndShift: () => void;
  onQuickAddTrip: () => void;
}

export function DriverShiftMode({
  activeShift,
  onStartShift,
  onEndShift,
  onQuickAddTrip,
}: DriverShiftModeProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedAppForStart, setSelectedAppForStart] = useState<DriverAppType>('uber');
  const [isStartingModalOpen, setIsStartingModalOpen] = useState(false);

  useEffect(() => {
    if (!activeShift) {
      setElapsedSeconds(0);
      return;
    }

    const start = new Date(activeShift.startTime).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeShift]);

  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!activeShift) {
    return (
      <div className="bg-slate-900 dark:bg-[#1C1C1E] p-4 sm:p-5 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Car size={26} className="stroke-[2]" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base">Turno de Trabalho</h3>
            <p className="text-xs text-slate-400">Inicie para rastrear ganhos em tempo real.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedAppForStart}
            onChange={(e) => setSelectedAppForStart(e.target.value as DriverAppType)}
            aria-label="Selecionar aplicativo de transporte"
            className="w-full sm:w-auto bg-white/5 border border-white/10 text-white text-sm font-bold rounded-xl px-4 py-3 sm:py-2.5 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
          >
            {Object.entries(APP_CONFIGS).map(([key, cfg]) => (
              <option key={key} value={key} className="bg-slate-900 text-white">
                {cfg.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onStartShift(selectedAppForStart)}
            className="w-full sm:w-auto flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 sm:py-2.5 rounded-xl text-sm transition-all cursor-pointer active:scale-95"
          >
            <Play size={16} className="fill-current" />
            <span>Iniciar Turno</span>
          </button>
        </div>
      </div>
    );
  }

  const appCfg = activeShift.appInUse ? APP_CONFIGS[activeShift.appInUse] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-emerald-900 to-slate-900 border border-emerald-500/20 p-4 sm:p-5 rounded-3xl text-white shadow-xl relative overflow-hidden"
    >
      <div className="absolute right-0 top-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
            <Car size={26} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400/80">
                Turno Ativo {appCfg ? `• ${appCfg.name}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xl sm:text-2xl font-bold tabular-nums tracking-tight">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-initial text-center sm:text-right bg-black/20 border border-white/5 px-4 py-2 rounded-2xl">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">Faturamento</span>
            <span className="text-base sm:text-lg font-bold text-emerald-400 tabular-nums">
              {formatCurrency(activeShift.totalGross)}
            </span>
          </div>

          <div className="flex-1 sm:flex-initial text-center sm:text-right bg-black/20 border border-white/5 px-4 py-2 rounded-2xl">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">Corridas</span>
            <span className="text-base sm:text-lg font-bold text-white tabular-nums">
              {activeShift.tripsCount}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
          <button
            type="button"
            onClick={onQuickAddTrip}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>+ Corrida</span>
          </button>

          <button
            type="button"
            onClick={onEndShift}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Square size={14} className="fill-current" />
            <span>Encerrar</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
