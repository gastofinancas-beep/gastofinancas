import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { getCardPresetById, matchBestCardPreset } from '../../data/bankCards';
import { triggerHaptic } from '../../utils/haptics';
import { BankCardBack } from './BankCardBack';
import { BankCardFront } from './BankCardFront';

export interface BankCardProps {
  design?: string;
  colorVariant?: string;
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  cvv?: string;
  showSensitiveData?: boolean;
  flipped?: boolean;
  onFlip?: (flipped: boolean) => void;
  interactive?: boolean;
  showFlipButton?: boolean;
  className?: string;
  fallbackBankName?: string;
  isNewlyAdded?: boolean;
}

export function BankCard({
  design,
  colorVariant,
  cardNumber,
  cardHolder,
  expiryDate,
  cvv,
  showSensitiveData = false,
  flipped: controlledFlipped,
  onFlip,
  interactive = true,
  showFlipButton = false,
  className = '',
  fallbackBankName,
  isNewlyAdded = false,
}: BankCardProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

  const handleToggleFlip = () => {
    if (!interactive) return;
    const next = !isFlipped;
    setIsFlipping(true);
    setInternalFlipped(next);
    onFlip?.(next);
    triggerHaptic(12);

    // Reset flipping state after spring settles
    setTimeout(() => {
      setIsFlipping(false);
    }, 600);
  };

  // Encontra o preset correto pelo ID ou faz fallback inteligente pelo nome do banco
  const preset =
    getCardPresetById(design) ||
    matchBestCardPreset(fallbackBankName, design) ||
    getCardPresetById('nubank-roxinho')!;

  return (
    <div className={`flex flex-col items-center gap-3 w-full ${className}`}>
      {/* Container com perspectiva 3D aprimorada para realismo físico */}
      <div
        className="w-full relative select-none"
        style={{ perspective: '1400px' }}
      >
        <motion.div
          onClick={interactive ? handleToggleFlip : undefined}
          role={interactive ? 'button' : undefined}
          tabIndex={interactive ? 0 : undefined}
          onKeyDown={e => {
            if (interactive && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              handleToggleFlip();
            }
          }}
          aria-label={interactive ? `Cartão ${preset.name}. Toque para virar e ver ${isFlipped ? 'a frente' : 'o verso (CVV)'}.` : `Cartão ${preset.name}`}
          animate={{
            rotateY: isFlipped ? 180 : 0,
            scale: isFlipping ? 1.03 : 1,
            z: isFlipping ? 30 : 0,
          }}
          whileHover={interactive ? { scale: 1.018, y: -2 } : undefined}
          whileTap={interactive ? { scale: 0.985 } : undefined}
          transition={{
            rotateY: { 
              type: 'spring', 
              stiffness: 240, 
              damping: 24, 
              mass: 0.85 
            },
            scale: { 
              duration: 0.28, 
              ease: [0.16, 1, 0.3, 1] 
            },
            z: { 
              duration: 0.28 
            },
          }}
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: 'center center',
          }}
          className={`relative w-full cursor-pointer rounded-[22px] sm:rounded-[26px] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
            isNewlyAdded 
              ? 'ring-4 ring-emerald-400/80 shadow-[0_0_35px_rgba(16,185,129,0.4)] animate-glow-pulse' 
              : ''
          }`}
        >
          {/* Frente do Cartão */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)',
            }}
            className="w-full relative"
          >
            <BankCardFront
              preset={preset}
              colorVariant={colorVariant}
              cardNumber={cardNumber}
              cardHolder={cardHolder}
              expiryDate={expiryDate}
              showSensitiveData={showSensitiveData}
            />

            {/* Brilho dinâmico ao virar o cartão */}
            {isFlipping && (
              <motion.div
                initial={{ opacity: 0, x: '-100%' }}
                animate={{ opacity: [0, 0.6, 0], x: '200%' }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                className="absolute inset-0 pointer-events-none rounded-[22px] sm:rounded-[26px] bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] z-30"
              />
            )}
          </div>

          {/* Verso do Cartão */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            className="w-full absolute inset-0"
          >
            <BankCardBack
              preset={preset}
              colorVariant={colorVariant}
              cvv={cvv}
              showSensitiveData={showSensitiveData}
            />

            {/* Brilho dinâmico no verso ao virar */}
            {isFlipping && (
              <motion.div
                initial={{ opacity: 0, x: '200%' }}
                animate={{ opacity: [0, 0.5, 0], x: '-100%' }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                className="absolute inset-0 pointer-events-none rounded-[22px] sm:rounded-[26px] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[20deg] z-30"
              />
            )}
          </div>
        </motion.div>
      </div>

      {/* Botão de acessibilidade / ação para virar o cartão com feedback suave */}
      {showFlipButton && interactive && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleToggleFlip}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-200/70 hover:bg-slate-300/80 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer select-none shadow-xs border border-black/[0.04] dark:border-white/[0.08]"
        >
          <motion.div
            animate={{ rotate: isFlipped ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <RotateCcw size={13} className="text-emerald-500" />
          </motion.div>
          <span>{isFlipped ? 'Ver frente do cartão' : 'Virar para ver verso (CVV)'}</span>
        </motion.button>
      )}
    </div>
  );
}
