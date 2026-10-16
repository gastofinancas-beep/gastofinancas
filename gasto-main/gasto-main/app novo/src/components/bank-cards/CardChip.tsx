import React from 'react';

interface CardChipProps {
  color?: 'gold' | 'silver' | 'black-gold';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CardChip({ color = 'gold', size = 'md', className = '' }: CardChipProps) {
  const sizeMap = {
    sm: { w: 'w-8', h: 'h-6', r: 'rounded-md' },
    md: { w: 'w-10 sm:w-11', h: 'h-7 sm:h-8', r: 'rounded-md' },
    lg: { w: 'w-12', h: 'h-9', r: 'rounded-lg' },
  }[size];

  const colorStyles = {
    gold: {
      bg: 'bg-gradient-to-tr from-[#D4AF37] via-[#F3E5AB] to-[#AA771C]',
      border: 'border-[#AA771C]/50',
      lines: 'border-[#8B6508]/40',
      shine: 'from-amber-200/50 to-transparent',
    },
    silver: {
      bg: 'bg-gradient-to-tr from-[#C0C0C0] via-[#E8E8E8] to-[#8A8A8A]',
      border: 'border-[#707070]/50',
      lines: 'border-[#505050]/40',
      shine: 'from-slate-100/50 to-transparent',
    },
    'black-gold': {
      bg: 'bg-gradient-to-tr from-[#1A1A1A] via-[#2D2D2D] to-[#121212]',
      border: 'border-[#D4AF37]/60',
      lines: 'border-[#D4AF37]/50',
      shine: 'from-[#F3E5AB]/30 to-transparent',
    },
  }[color];

  return (
    <div
      className={`relative ${sizeMap.w} ${sizeMap.h} ${sizeMap.r} ${colorStyles.bg} border ${colorStyles.border} shadow-sm overflow-hidden select-none shrink-0 ${className}`}
    >
      {/* Brilho metálico angular */}
      <div className={`absolute inset-0 bg-gradient-to-tr ${colorStyles.shine} pointer-events-none`} />

      {/* Traçados reais de microcircuito EMV */}
      <div className={`absolute inset-1 rounded-sm border ${colorStyles.lines} flex items-center justify-center pointer-events-none`}>
        {/* Linha horizontal central */}
        <div className={`w-full h-[1px] bg-black/30 dark:bg-black/40`} />
        {/* Linha vertical central */}
        <div className={`absolute h-full w-[1px] bg-black/30 dark:bg-black/40`} />
        {/* Núcleo interno arredondado */}
        <div className={`absolute w-3 h-3 rounded-full border ${colorStyles.lines} bg-black/10`} />
      </div>
    </div>
  );
}
