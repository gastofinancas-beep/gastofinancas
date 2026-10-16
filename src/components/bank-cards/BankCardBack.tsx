import React from 'react';
import { BankCardPreset } from '../../data/bankCards/types';
import { computeCardThemeStyles } from '../../utils/cards/cardThemeStyles';
import { formatCvv } from '../../utils/cards/formatters';
import { CardBrandLogo } from './CardBrandLogo';

export interface BankCardBackProps {
  preset: BankCardPreset;
  colorVariant?: string;
  cvv?: string;
  showSensitiveData?: boolean;
  className?: string;
}

export function BankCardBack({
  preset,
  colorVariant,
  cvv,
  showSensitiveData = false,
  className = '',
}: BankCardBackProps) {
  const styles = computeCardThemeStyles(preset, colorVariant);
  const formattedCvv = formatCvv(cvv, showSensitiveData);

  return (
    <div
      style={{
        background: styles.background,
        color: styles.color,
        borderColor: styles.borderColor,
      }}
      className={`relative w-full aspect-[1.586/1] rounded-[20px] sm:rounded-[24px] overflow-hidden flex flex-col justify-between shadow-xl border select-none transition-all duration-300 py-3 sm:py-4 ${className}`}
    >
      {/* 1. Faixa Magnética Superior */}
      <div className="w-full h-8 sm:h-10 bg-[#151515] shadow-inner shrink-0 relative">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
      </div>

      {/* 2. Painel de Assinatura & Código CVV */}
      <div className="px-4 sm:px-6 my-auto space-y-2">
        <div className="flex items-center gap-2">
          {/* Faixa branca de assinatura com padrão anti-fraude */}
          <div className="h-7 sm:h-8 flex-1 bg-white/95 rounded-sm flex items-center px-3 shadow-inner relative overflow-hidden">
            <div
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, #e2e8f0 0, #e2e8f0 4px, #f8fafc 4px, #f8fafc 8px)',
              }}
              className="absolute inset-0 opacity-40 pointer-events-none"
            />
            <span className="relative z-10 text-[9px] sm:text-[10px] italic text-slate-400 font-serif select-none">
              Assinatura autorizada
            </span>
          </div>

          {/* Caixa do Código de Segurança (CVV) */}
          <div className="h-7 sm:h-8 px-2.5 rounded-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/20 flex flex-col items-center justify-center shrink-0 shadow-xs">
            <span className="text-[7px] uppercase font-semibold text-slate-400">
              CVV
            </span>
            <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-widest">
              {formattedCvv}
            </span>
          </div>
        </div>

        {/* 3. Texto legal e Central de Atendimento */}
        <div className="text-[7px] sm:text-[8px] leading-tight text-current/60 space-y-0.5">
          <p>
            Cartão emitido por {preset.bankName}. Em caso de perda, roubo ou dúvidas, acesse o app oficial ou ligue para a Central de Atendimento ao Cliente.
          </p>
          <p className="opacity-80">
            SAC: 0800 700 0000 • Ouvidoria: 0800 722 0000 • Uso pessoal e intransferível.
          </p>
        </div>
      </div>

      {/* 4. Rodapé do verso: Holograma e Marca */}
      <div className="px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0">
        {/* Holograma de segurança */}
        <div className="w-8 sm:w-10 h-6 sm:h-7 rounded bg-gradient-to-tr from-amber-400/40 via-purple-400/40 to-emerald-400/40 border border-white/30 flex items-center justify-center shadow-xs">
          <span className="text-[8px] font-bold text-white/90 drop-shadow-xs">SEC</span>
        </div>

        {/* Bandeira no verso */}
        <CardBrandLogo network={preset.network} size="sm" />
      </div>
    </div>
  );
}
