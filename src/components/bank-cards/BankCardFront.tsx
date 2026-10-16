import React from 'react';
import { BankCardPreset } from '../../data/bankCards/types';
import { computeCardThemeStyles } from '../../utils/cards/cardThemeStyles';
import { formatCardHolder, formatCardNumber, formatExpiryDate } from '../../utils/cards/formatters';
import { CardBankLogo } from './CardBankLogo';
import { CardBrandLogo } from './CardBrandLogo';
import { CardChip } from './CardChip';
import { CardContactless } from './CardContactless';

export interface BankCardFrontProps {
  preset: BankCardPreset;
  colorVariant?: string;
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  showSensitiveData?: boolean;
  className?: string;
}

export function BankCardFront({
  preset,
  colorVariant,
  cardNumber,
  cardHolder,
  expiryDate,
  showSensitiveData = false,
  className = '',
}: BankCardFrontProps) {
  const styles = computeCardThemeStyles(preset, colorVariant);
  const formattedNumber = formatCardNumber(cardNumber, showSensitiveData);
  const formattedHolder = formatCardHolder(cardHolder);
  const formattedExpiry = formatExpiryDate(expiryDate);

  const chipColor = preset.appearance.chipColor || 'gold';

  return (
    <div
      style={{
        background: styles.background,
        color: styles.color,
        borderColor: styles.borderColor,
      }}
      className={`relative w-full aspect-[1.586/1] rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 overflow-hidden flex flex-col justify-between shadow-xl border select-none transition-all duration-300 ${className}`}
    >
      {/* 1. Textura Visual Customizada (SVG Pattern) */}
      {styles.textureOverlay && (
        <div
          style={{ backgroundImage: styles.textureOverlay, backgroundSize: '16px 16px' }}
          className="absolute inset-0 opacity-40 pointer-events-none mix-blend-overlay"
        />
      )}

      {/* 2. Acabamento Metálico / Holográfico / Reflexivo */}
      {styles.finishOverlay && (
        <div
          style={{ background: styles.finishOverlay }}
          className="absolute inset-0 pointer-events-none"
        />
      )}

      {/* 3. Reflexo de luz de canto */}
      <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />

      {/* ================= TOPO DO CARTÃO ================= */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        {/* Logo do Banco */}
        <div className="flex items-center gap-2">
          <CardBankLogo bankName={preset.bankName} size={30} />
          {preset.category === 'black' || preset.category === 'infinite' || preset.category === 'premium' ? (
            <span
              style={{ color: styles.accent }}
              className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-black/30 border border-current/30"
            >
              {preset.name.replace(preset.bankName, '').trim() || 'BLACK'}
            </span>
          ) : null}
        </div>

        {/* Contactless */}
        <div className="text-current opacity-85">
          <CardContactless size={20} />
        </div>
      </div>

      {/* ================= MEIO: CHIP EMV ================= */}
      <div className="relative z-10 my-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CardChip color={chipColor} size="md" />
        </div>

        {/* Nome do produto (se não estiver no topo) */}
        <span className="text-[10px] sm:text-xs font-semibold tracking-wider opacity-75 uppercase">
          {preset.name}
        </span>
      </div>

      {/* ================= RODAPÉ: DADOS E BANDEIRA ================= */}
      <div className="relative z-10 space-y-1.5 sm:space-y-2">
        {/* Número do Cartão */}
        <div className="font-mono text-sm sm:text-base font-bold tracking-[0.16em] sm:tracking-[0.2em] text-current/95 drop-shadow-xs">
          {formattedNumber}
        </div>

        {/* Nome do Titular, Validade e Bandeira */}
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[8px] sm:text-[9px] font-medium uppercase tracking-wider text-current/60">
              Titular do Cartão
            </p>
            <p className="text-[10px] sm:text-xs font-bold tracking-wider text-current truncate uppercase">
              {formattedHolder}
            </p>
          </div>

          <div className="shrink-0 text-center px-2">
            <p className="text-[7px] sm:text-[8px] font-medium uppercase tracking-wider text-current/60">
              Validade
            </p>
            <p className="font-mono text-[10px] sm:text-xs font-bold text-current">
              {formattedExpiry}
            </p>
          </div>

          {/* Bandeira */}
          <div className="shrink-0 flex items-center justify-end pl-1">
            <CardBrandLogo network={preset.network} size="md" />
          </div>
        </div>
      </div>
    </div>
  );
}
