import React, { useState } from 'react';
import { X, Target, Trophy, Award, Check, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { DriverGoals } from '../types';

interface DriverGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: DriverGoals;
  onSaveGoals: (newGoals: DriverGoals) => void;
}

export function DriverGoalsModal({
  isOpen,
  onClose,
  goals,
  onSaveGoals
}: DriverGoalsModalProps) {
  const [daily, setDaily] = useState<string>(String(goals.daily || 300));
  const [weekly, setWeekly] = useState<string>(String(goals.weekly || 1800));
  const [monthly, setMonthly] = useState<string>(String(goals.monthly || 7500));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGoals({
      daily: parseFloat(daily) || 0,
      weekly: parseFloat(weekly) || 0,
      monthly: parseFloat(monthly) || 0
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Target size={19} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                Meta de Lucro Líquido Real
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Quanto você quer que sobre livre no bolso
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

        {/* Smart Explainer Banner */}
        <div className="mx-5 mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
          <p className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            Como funciona a Meta de Lucro Inteligente:
          </p>
          <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
            Em vez de focar apenas no faturamento bruto, você define quanto quer <strong>lucrar livre</strong>. O sistema desconta seus custos de combustível e manutenção automaticamente.
          </p>
          <div className="pt-1 text-[11px] text-slate-700 dark:text-slate-300 font-medium bg-white/60 dark:bg-black/20 p-2 rounded-xl border border-amber-500/10">
            💡 <em>Exemplo:</em> Se você quer lucrar <strong>R$ 300</strong> e gastou <strong>R$ 90</strong> de combustível, você precisará faturar <strong>R$ 390</strong>.
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Trophy size={14} className="text-amber-500" />
              Quero lucrar por dia (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                R$
              </span>
              <input
                type="number"
                step="10"
                required
                value={daily}
                onChange={(e) => setDaily(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-bold text-base text-slate-900 dark:text-white"
              />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Meta de lucro diário livre no bolso
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Award size={14} className="text-blue-500" />
              Quero lucrar na semana (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                R$
              </span>
              <input
                type="number"
                step="50"
                required
                value={weekly}
                onChange={(e) => setWeekly(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-bold text-base text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-500" />
              Quero lucrar no mês (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                R$
              </span>
              <input
                type="number"
                step="100"
                required
                value={monthly}
                onChange={(e) => setMonthly(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-bold text-base text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <Check size={16} strokeWidth={3} />
            <span>Salvar Metas de Lucro</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
