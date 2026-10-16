import React, { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const threshold = 70;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0 || refreshing) return;
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance * 0.4, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (startY === 0 || refreshing) return;
    if (pullDistance > threshold) {
      setRefreshing(true);
      triggerHaptic(20);
      try {
        await onRefresh();
      } catch (err) {
        console.error(err);
      } finally {
        setRefreshing(false);
      }
    }
    setStartY(0);
    setPullDistance(0);
  };

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-full"
    >
      {(pullDistance > 0 || refreshing) && (
        <div 
          className="absolute left-0 right-0 flex items-center justify-center transition-all duration-200 z-30 pointer-events-none"
          style={{ top: `${Math.max(pullDistance - 35, 8)}px` }}
        >
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-xl rounded-full px-4 py-2 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <RefreshCw size={15} className={`animate-spin ${refreshing ? 'text-emerald-500' : ''}`} />
            <span>{refreshing ? 'Atualizando...' : pullDistance > threshold ? 'Solte para atualizar' : 'Puxe para atualizar'}</span>
          </div>
        </div>
      )}
      <div style={{ transform: `translateY(${refreshing ? 45 : pullDistance}px)`, transition: pullDistance === 0 ? 'transform 0.2s ease' : 'none' }}>
        {children}
      </div>
    </div>
  );
}
