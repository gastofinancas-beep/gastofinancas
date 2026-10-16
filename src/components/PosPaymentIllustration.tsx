import React from 'react';
import { motion } from 'motion/react';
const welcomePosArt = '/images/welcome_pos_art.webp';

export function PosPaymentIllustration() {
  return (
    <div className="relative w-full max-w-[320px] sm:max-w-[380px] md:max-w-[420px] max-h-[38dvh] sm:max-h-[44dvh] aspect-square flex items-center justify-center select-none mx-auto shrink min-h-0 bg-transparent">
      {/* Floating vector illustration directly on the background without any card or box frame */}
      <motion.div
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-full h-full flex items-center justify-center min-h-0"
      >
        <div className="relative w-full h-full max-w-[310px] max-h-[310px] sm:max-w-[380px] sm:max-h-[380px] flex items-center justify-center min-h-0">
          <img
            src={welcomePosArt}
            alt="Ilustração de Pagamento com Cartão e Máquina"
            className="w-full h-full object-contain mix-blend-multiply scale-105 sm:scale-110"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        </div>
      </motion.div>
    </div>
  );
}
