import React from 'react';
import { DriverAppType } from '../types';
import { Car, Navigation, Sparkles, Compass, UtensilsCrossed, Package, Truck, Star } from 'lucide-react';

interface DriverAppLogoProps {
  app: DriverAppType;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

export function DriverAppLogo({ app, size = 'md', showName = false, className = '' }: DriverAppLogoProps) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs rounded-lg',
    md: 'w-9 h-9 text-sm rounded-xl',
    lg: 'w-12 h-12 text-base rounded-2xl'
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 24
  };

  const renderBadge = () => {
    switch (app) {
      case 'uber':
        return (
          <div
            className={`${sizeClasses[size]} bg-black text-white flex items-center justify-center font-bold tracking-tighter shadow-2xs border border-white/10`}
          >
            <span className="scale-95">U</span>
          </div>
        );
      case '99':
        return (
          <div
            className={`${sizeClasses[size]} bg-[#F59E0B] text-slate-950 flex items-center justify-center font-bold tracking-tight shadow-2xs`}
          >
            <span>99</span>
          </div>
        );
      case 'indrive':
        return (
          <div
            className={`${sizeClasses[size]} bg-[#10B981] text-white flex items-center justify-center font-bold tracking-tighter shadow-2xs`}
          >
            <span className="font-sans font-bold">iD</span>
          </div>
        );
      case 'ifood':
        return (
          <div
            className={`${sizeClasses[size]} bg-[#EA1D2C] text-white flex items-center justify-center font-bold tracking-tighter shadow-2xs`}
          >
            <span className="font-sans font-bold text-[11px] sm:text-xs">iF</span>
          </div>
        );
      case 'rappi':
        return (
          <div
            className={`${sizeClasses[size]} bg-[#FF441F] text-white flex items-center justify-center font-bold tracking-tighter shadow-2xs`}
          >
            <span className="font-sans font-bold">R</span>
          </div>
        );
      case 'lalamove':
        return (
          <div
            className={`${sizeClasses[size]} bg-[#FF6B00] text-white flex items-center justify-center font-bold tracking-tighter shadow-2xs`}
          >
            <Truck size={iconSizes[size]} className="stroke-[2.5]" />
          </div>
        );
      case 'particular':
        return (
          <div
            className={`${sizeClasses[size]} bg-[#2563EB] text-white flex items-center justify-center font-bold tracking-tighter shadow-2xs`}
          >
            <Star size={iconSizes[size]} className="fill-amber-300 stroke-amber-300" />
          </div>
        );
      case 'blablacar':
        return (
          <div
            className={`${sizeClasses[size]} bg-[#0284C7] text-white flex items-center justify-center font-bold tracking-tighter shadow-2xs`}
          >
            <Compass size={iconSizes[size]} className="stroke-[2.5]" />
          </div>
        );
      case 'outro':
      default:
        return (
          <div
            className={`${sizeClasses[size]} bg-purple-600 text-white flex items-center justify-center font-bold shadow-2xs`}
          >
            <Car size={iconSizes[size]} className="stroke-[2.2]" />
          </div>
        );
    }
  };

  const getAppName = () => {
    switch (app) {
      case 'uber':
        return 'Uber';
      case '99':
        return '99 App';
      case 'indrive':
        return 'inDrive';
      case 'ifood':
        return 'iFood';
      case 'rappi':
        return 'Rappi';
      case 'lalamove':
        return 'Lalamove';
      case 'particular':
        return 'Particular';
      case 'blablacar':
        return 'BlaBlaCar';
      case 'outro':
      default:
        return 'Outro App';
    }
  };

  if (!showName) {
    return renderBadge();
  }

  return (
    <div className="flex items-center gap-2">
      {renderBadge()}
      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
        {getAppName()}
      </span>
    </div>
  );
}
