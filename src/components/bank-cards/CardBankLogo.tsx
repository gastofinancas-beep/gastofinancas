import React from 'react';
import { BankLogo } from '../BankLogo';

interface CardBankLogoProps {
  bankName: string;
  size?: number;
  className?: string;
  customLogoUrl?: string;
}

export function CardBankLogo({
  bankName,
  size = 32,
  className = '',
  customLogoUrl,
}: CardBankLogoProps) {
  if (customLogoUrl) {
    return (
      <img
        src={customLogoUrl}
        alt={bankName}
        style={{ height: size, maxWidth: size * 3 }}
        className={`object-contain select-none ${className}`}
        loading="lazy"
      />
    );
  }

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <BankLogo bankName={bankName} size={size} />
      <span className="font-bold text-xs sm:text-sm tracking-tight text-current opacity-90 drop-shadow-xs">
        {bankName}
      </span>
    </div>
  );
}
