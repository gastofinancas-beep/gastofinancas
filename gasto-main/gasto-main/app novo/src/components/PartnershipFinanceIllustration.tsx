import React from 'react';
import { motion } from 'motion/react';
const financeTrackingImage = '/images/finance_tracking.png';

export function PartnershipFinanceIllustration() {
  return (
    <div className="relative w-full max-w-[320px] sm:max-w-[380px] md:max-w-[420px] max-h-[36dvh] sm:max-h-[42dvh] aspect-4/3 flex items-center justify-center select-none mx-auto shrink min-h-0">
      {/* Subtle floating animation */}
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-full h-full flex items-center justify-center min-h-0"
      >
        <div className="relative w-full h-full max-w-[300px] max-h-[260px] sm:max-w-[360px] sm:max-h-[320px] flex items-center justify-center min-h-0">
          <img
            src={financeTrackingImage}
            alt="Acompanhe Suas Finanças"
            className="w-full h-full object-contain scale-105 sm:scale-110 drop-shadow-[0_8px_20px_rgba(0,0,0,0.04)]"
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
