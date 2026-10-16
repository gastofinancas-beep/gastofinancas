import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Car, Sparkles, Navigation, DollarSign, TrendingUp, ShieldCheck, ChevronRight, Zap, Award } from 'lucide-react';

interface DriverAnimationIntroProps {
  onClose: () => void;
}

export function DriverAnimationIntro({ onClose }: DriverAnimationIntroProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Allow user to explore or auto-close after 8 seconds if not interacted
    }, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
        className="relative w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 sm:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.4)] border border-slate-200 dark:border-white/10 overflow-hidden text-center"
      >
        {/* Background glow animated */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Top Badge: Novidade */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-black tracking-wider uppercase mb-4"
        >
          <Sparkles size={13} className="text-emerald-500 animate-spin" />
          <span>MeuUber</span>
        </motion.div>

        {/* Dynamic Car Motion Graphics */}
        <div className="relative py-6 flex flex-col items-center justify-center">
          <motion.div
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 14, stiffness: 120, delay: 0.2 }}
            className="w-20 h-20 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shadow-xl relative"
          >
            <Car size={40} className="stroke-[2.2]" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-[10px] font-black text-slate-950 shadow-xs"
            >
              $
            </motion.div>
          </motion.div>

          {/* Animated Speed Dash Lines */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="w-48 h-1.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent rounded-full mt-4"
          />
        </div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight"
        >
          Meu<span className="text-emerald-500">Uber</span> & Motorista
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed"
        >
          Controle completo de corridas, taxas dos apps, gastos com combustível e saiba o seu <strong className="text-slate-800 dark:text-slate-200">Lucro Real</strong> por quilômetro e por hora.
        </motion.p>

        {/* Feature Highlights Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="grid grid-cols-3 gap-2 sm:gap-3 my-6 text-left"
        >
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06]">
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 font-bold">
              <Zap size={14} />
            </div>
            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Registro Rápido</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Lance a corrida em 3s</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06]">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 font-bold">
              <TrendingUp size={14} />
            </div>
            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Lucro Real</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Líquido − Despesas</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06]">
            <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 font-bold">
              <Award size={14} />
            </div>
            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Metas Diárias</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Acompanhe seu foco</p>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.55 }}
          type="button"
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <span>Acessar Painel do Motorista</span>
          <ChevronRight size={16} />
        </motion.button>
      </motion.div>
    </div>
  );
}
