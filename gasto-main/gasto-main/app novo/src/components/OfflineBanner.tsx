import React from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OfflineBannerProps {
  isOnline: boolean;
}

export function OfflineBanner({ isOnline }: OfflineBannerProps) {
  if (isOnline) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-amber-600 dark:bg-amber-700 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-md relative z-50 overflow-hidden"
      >
        <WifiOff size={16} className="animate-pulse shrink-0 text-amber-200" />
        <span>
          <strong>Você está offline.</strong> As alterações serão sincronizadas com o banco assim que a conexão retornar.
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
