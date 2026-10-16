import React, { useState, useEffect } from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';

export interface SyncStatusIndicatorProps {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  isOnline: boolean;
}

export function SyncStatusIndicator({
  isSyncing,
  lastSyncedAt,
  isOnline,
}: SyncStatusIndicatorProps) {
  const [showSavedText, setShowSavedText] = useState(false);

  useEffect(() => {
    if (!isOnline || isSyncing || !lastSyncedAt) {
      setShowSavedText(false);
      return;
    }

    const elapsed = Date.now() - lastSyncedAt.getTime();
    if (elapsed < 3000) {
      setShowSavedText(true);
      const remainingTime = 3000 - elapsed;
      const timer = setTimeout(() => {
        setShowSavedText(false);
      }, remainingTime);
      return () => clearTimeout(timer);
    } else {
      setShowSavedText(false);
    }
  }, [lastSyncedAt, isSyncing, isOnline]);

  // Offline status takes priority
  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-500 transition-opacity duration-300 select-none">
        <WifiOff size={12} className="shrink-0" />
        <span>Sem conexão</span>
      </div>
    );
  }

  // Actively syncing / saving to cloud
  if (isSyncing) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 transition-opacity duration-300 select-none">
        <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 dark:border-slate-600 border-t-slate-500 dark:border-t-slate-300 animate-spin shrink-0" />
        <span>Salvando...</span>
      </div>
    );
  }

  // Successfully synced state
  if (lastSyncedAt) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-500 transition-opacity duration-300 select-none">
        <CheckCircle2 size={12} className="shrink-0" />
        {showSavedText && <span>Salvo</span>}
      </div>
    );
  }

  // Never synced yet and online
  return null;
}
