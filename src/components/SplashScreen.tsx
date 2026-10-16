import React, { useEffect } from 'react';
import { Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { LabyrinthBackground } from './LabyrinthBackground';

interface SplashScreenProps {
  onFinish?: () => void;
  autoDismissMs?: number; // Optional auto dismiss time (e.g. 2000ms)
  interactive?: boolean; // If true, tapping will dismiss or trigger onFinish
  variant?: 'green' | 'blue';
  showActionButton?: boolean;
  actionButtonText?: string;
  onAction?: () => void;
}

export function SplashScreen({
  onFinish,
  autoDismissMs = 2200,
  interactive = true,
  variant = 'green',
  showActionButton = false,
  actionButtonText = 'Começar',
  onAction,
}: SplashScreenProps) {
  useEffect(() => {
    if (!autoDismissMs || autoDismissMs <= 0 || !onFinish) return;

    const timer = setTimeout(() => {
      onFinish();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [autoDismissMs, onFinish]);

  const handleContainerClick = () => {
    if (interactive && onFinish && !showActionButton) {
      onFinish();
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between select-none cursor-pointer overflow-hidden font-sans h-screen h-[100dvh] max-h-[100dvh]`}
      style={{ touchAction: 'manipulation' }}
    >
      {/* Background Labyrinth in requested Signature Green (or Blue) */}
      <LabyrinthBackground variant={variant} />

      {/* Top Spacer / Safe Area */}
      <div className="w-full pt-[max(1.5rem,env(safe-area-inset-top))]" />

      {/* Center Hero: Beacon Logo & App Name */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 -mt-6 sm:-mt-8">
        {/* Beacon / Radar Pin Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative flex items-center justify-center mb-6 sm:mb-8"
        >
          {/* Subtle soft pulse glow */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -inset-4 rounded-full bg-white/20 blur-xl pointer-events-none"
          />

          <svg
            width="80"
            height="100"
            viewBox="0 0 80 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
          >
            {/* Outer Ring */}
            <circle
              cx="40"
              cy="36"
              r="30"
              stroke="white"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            {/* Inner Ring */}
            <circle
              cx="40"
              cy="36"
              r="18"
              stroke="white"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            {/* Center Core Dot */}
            <circle cx="40" cy="36" r="7" fill="white" />
            {/* Beacon Vertical Pin / Stem */}
            <line
              x1="40"
              y1="66"
              x2="40"
              y2="92"
              stroke="white"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>

        {/* App Title */}
        <motion.h1
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
        >
          Gastô?
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
          className="mt-2.5 sm:mt-3 text-xs sm:text-sm font-medium text-emerald-100/90 tracking-wide uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.15)]"
        >
          Controle Inteligente de Finanças
        </motion.p>

        {/* Optional Action Button for Onboarding flow */}
        {showActionButton && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 sm:mt-10 w-full max-w-xs"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onAction) onAction();
                else if (onFinish) onFinish();
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-white text-emerald-800 font-bold text-sm tracking-wider uppercase shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer"
            >
              {actionButtonText}
            </button>
          </motion.div>
        )}
      </div>

      {/* Bottom Footer: Lock & Secured by Gastô? */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="relative z-10 flex flex-col items-center justify-center gap-2 pb-[max(2rem,env(safe-area-inset-bottom))] text-white/90"
      >
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium tracking-wide">
          <div className="w-4 h-4 flex items-center justify-center">
            <Lock size={15} className="text-white stroke-[2.5]" />
          </div>
          <span>Secured by Gastô?</span>
        </div>

        {!showActionButton && (
          <span className="text-[10px] text-white/60 font-normal">
            Toque para continuar
          </span>
        )}
      </motion.div>
    </div>
  );
}
