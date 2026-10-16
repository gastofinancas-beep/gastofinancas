import React from 'react';
import { CardNetwork } from '../../data/bankCards/types';

interface CardBrandLogoProps {
  network: CardNetwork;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CardBrandLogo({ network, className = '', size = 'md' }: CardBrandLogoProps) {
  if (network === 'mastercard') {
    const sphereSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 sm:w-5.5 h-5 sm:h-5.5';
    const overlap = size === 'sm' ? '-space-x-1.5' : '-space-x-2 sm:-space-x-2.5';

    return (
      <div className={`flex items-center ${overlap} select-none ${className}`} title="Mastercard">
        <div className={`${sphereSize} rounded-full bg-[#EB001B] shadow-xs`} />
        <div className={`${sphereSize} rounded-full bg-[#F79E1B]/95 shadow-xs`} />
      </div>
    );
  }

  if (network === 'visa') {
    const textClass = size === 'sm' ? 'text-xs tracking-wider' : size === 'lg' ? 'text-lg tracking-widest' : 'text-sm sm:text-base tracking-widest';
    return (
      <div className={`flex items-center font-black italic select-none ${textClass} ${className}`} title="Visa">
        <span className="text-[#1A1F71] dark:text-white drop-shadow-xs">VISA</span>
      </div>
    );
  }

  if (network === 'elo') {
    return (
      <div className={`flex items-center gap-1 select-none font-bold text-xs ${className}`} title="Elo">
        <div className="relative w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-current" />
        </div>
        <span className="tracking-tight lowercase text-xs font-black">elo</span>
      </div>
    );
  }

  if (network === 'amex') {
    return (
      <div
        className={`px-1.5 py-0.5 rounded bg-[#002663] text-white font-black text-[10px] tracking-wider select-none uppercase ${className}`}
        title="American Express"
      >
        AMEX
      </div>
    );
  }

  // Hipercard
  return (
    <div
      className={`px-1.5 py-0.5 rounded bg-[#B30000] text-white font-black text-[9px] tracking-tight select-none uppercase ${className}`}
      title="Hipercard"
    >
      HIPER
    </div>
  );
}
