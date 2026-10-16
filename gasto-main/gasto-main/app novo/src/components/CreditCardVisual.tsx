import React from 'react';
import { motion } from 'motion/react';
import { CreditCard } from '../types';
import { BankLogo, normalizeBankName } from './BankLogo';
import { TiltCard } from './TiltCard';
import { formatCurrency } from '../utils/financeCalculations';
import { getCardPresetById, matchBestCardPreset } from '../data/bankCards';
import { computeCardThemeStyles } from '../utils/cards/cardThemeStyles';

export type CardBrand = 'mastercard' | 'visa' | 'elo' | 'amex' | 'hipercard' | 'generic';

/**
 * Retorna o gradiente autêntico e vibrante da instituição se o cartão não tiver gradiente customizado
 */
export function getVibrantBankGradient(bankName?: string): string {
  const key = normalizeBankName(bankName);
  switch (key) {
    case 'nubank':
      return 'from-[#820AD1] via-[#9914E8] to-[#5C0D8B]';
    case 'itau':
      return 'from-[#EC7000] via-[#FA7D09] to-[#002D72]';
    case 'inter':
      return 'from-[#FF7A00] via-[#FF9432] to-[#E65C00]';
    case 'c6':
      return 'from-[#2A2A2E] via-[#1C1C1F] to-[#111113]';
    case 'bradesco':
      return 'from-[#CC092F] via-[#E8113A] to-[#8A0019]';
    case 'santander':
      return 'from-[#EC0000] via-[#FF2626] to-[#A30000]';
    case 'bb':
      return 'from-[#003882] via-[#0051BD] to-[#00224F]';
    case 'caixa':
      return 'from-[#005CA9] via-[#007EE6] to-[#003E73]';
    case 'mercadopago':
      return 'from-[#009EE3] via-[#1EB6FC] to-[#007AB0]';
    case 'xp':
      return 'from-[#242424] via-[#141414] to-[#000000]';
    case 'btg':
      return 'from-[#0B1E36] via-[#183E6E] to-[#061120]';
    case 'picpay':
      return 'from-[#11C76F] via-[#1EE381] to-[#0B9652]';
    case 'pagbank':
      return 'from-[#00A868] via-[#00C97D] to-[#007548]';
    case 'neon':
      return 'from-[#00D1FF] via-[#0094FF] to-[#0055D4]';
    case 'sicredi':
      return 'from-[#006634] via-[#004A26] to-[#00331A]';
    case 'sicoob':
      return 'from-[#005263] via-[#003641] to-[#002229]';
    default:
      return 'from-[#2563EB] via-[#3B82F6] to-[#1D4ED8]';
  }
}

/**
 * Detecta a bandeira do cartão com base no banco, nome ou dígitos
 */
export function detectCardBrand(bankName?: string, cardName?: string, digits?: string): CardBrand {
  const combined = `${bankName || ''} ${cardName || ''}`.toLowerCase();
  
  // Detecção por dígitos iniciais (se informado)
  if (digits && digits.length >= 1) {
    if (digits.startsWith('4')) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
    if (/^(34|37)/.test(digits)) return 'amex';
    if (/^(4011|4389|4514|4576|5041|5066|5090|6277|6362|6363|6504|6505|6507|6509|6516|6550)/.test(digits)) return 'elo';
    if (/^(606282|3841)/.test(digits)) return 'hipercard';
  }

  // Detecção por palavras-chave
  if (combined.includes('visa') || combined.includes('infinite') || (combined.includes('platinum') && combined.includes('bb')) || combined.includes('xp')) return 'visa';
  if (combined.includes('elo') || combined.includes('nanquim') || combined.includes('grafite')) return 'elo';
  if (combined.includes('amex') || combined.includes('american express') || combined.includes('centurion')) return 'amex';
  if (combined.includes('hiper') || combined.includes('hipercard')) return 'hipercard';
  if (combined.includes('master') || combined.includes('black') || combined.includes('nubank') || combined.includes('inter') || combined.includes('c6') || combined.includes('ultravioleta')) return 'mastercard';

  return 'mastercard';
}

/**
 * Logotipo vetorial de alta definição da Bandeira do Cartão
 */
export function CardBrandBadge({ brand, className = '' }: { brand: CardBrand; className?: string }) {
  switch (brand) {
    case 'visa':
      return (
        <div className={`flex items-center justify-center select-none ${className}`} title="Visa">
          <svg viewBox="0 0 64 24" className="h-5 sm:h-6 w-auto" fill="none" aria-hidden="true">
            <path
              d="M26.2 3.2L20.8 20.8H15.9L12.4 7.6C12.2 6.6 11.9 6.2 10.9 5.7C9.3 4.9 6.8 4.2 4.6 3.7L4.7 3.2H12.6C13.7 3.2 14.6 4 14.8 5.3L16.8 15.6L21.4 3.2H26.2ZM32.3 15.2C32.3 9.4 24.3 9.1 24.4 6.5C24.4 5.7 25.2 4.9 26.8 4.7C27.6 4.6 29.8 4.5 32.2 5.6L33.1 1.4C31.9 0.9 30.2 0.5 28.1 0.5C22.6 0.5 18.7 3.4 18.7 7.6C18.6 10.7 21.4 12.4 23.5 13.5C25.7 14.5 26.4 15.2 26.4 16.2C26.4 17.7 24.6 18.3 22.9 18.3C20.6 18.3 19.3 17.9 17.6 17.1L16.7 21.4C18.3 22.1 20.9 22.7 23.6 22.7C29.4 22.7 32.3 19.8 32.3 15.2ZM43.3 20.8H47.6L43.8 3.2H39.8C38.9 3.2 38.1 3.7 37.7 4.6L30.5 20.8H35.4L36.4 18.1H42.4L43.3 20.8ZM37.7 14.5L40.2 7.7L41.6 14.5H37.7ZM61.3 3.2L57.5 20.8H53L56.8 3.2H61.3Z"
              fill="#FFFFFF"
            />
            <path
              d="M10.9 5.7C11.9 6.2 12.2 6.6 12.4 7.6L14.8 5.3C14.6 4 13.7 3.2 12.6 3.2H4.7L4.6 3.7C6.8 4.2 9.3 4.9 10.9 5.7Z"
              fill="#F9A825"
            />
          </svg>
        </div>
      );

    case 'elo':
      return (
        <div className={`flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 select-none ${className}`} title="Elo">
          <span className="text-[11px] font-bold tracking-tight text-white lowercase">elo</span>
          <div className="flex -space-x-1 items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-[#E51B24] shadow-xs" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#F5A623] shadow-xs" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#00A4E8] shadow-xs" />
          </div>
        </div>
      );

    case 'amex':
      return (
        <div className={`flex items-center justify-center bg-[#006FCF] px-2 py-0.5 rounded-md border border-white/20 shadow-xs select-none ${className}`} title="American Express">
          <span className="text-[10px] font-bold tracking-tighter text-white uppercase font-mono">
            AMEX
          </span>
        </div>
      );

    case 'hipercard':
      return (
        <div className={`flex items-center justify-center bg-[#8B0000] px-2 py-0.5 rounded-md border border-white/20 shadow-xs select-none ${className}`} title="Hipercard">
          <span className="text-[10px] font-bold tracking-tight text-white uppercase italic">
            HIPER
          </span>
        </div>
      );

    case 'mastercard':
    default:
      return (
        <div className={`flex items-center justify-center select-none ${className}`} title="Mastercard">
          <div className="flex -space-x-2.5 items-center drop-shadow-sm">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#EB001B] opacity-95 shadow-sm" />
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#F79E1B] opacity-95 shadow-sm mix-blend-screen" />
          </div>
        </div>
      );
  }
}

/**
 * Micro-Chip EMV Dourado com Contatos e Reflexo Especular
 */
export function EmvSmartChip({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const widthClass = size === 'sm' ? 'w-8 h-6' : size === 'lg' ? 'w-12 h-9' : 'w-10 h-7 sm:w-11 sm:h-8';
  return (
    <div
      className={`${widthClass} rounded-md bg-gradient-to-br from-[#FFE993] via-[#DCA328] to-[#996D09] border border-[#FFF7C2]/80 p-0.5 sm:p-1 shadow-md shrink-0 flex flex-col justify-between relative overflow-hidden select-none [transform:translateZ(12px)]`}
      title="EMV Chip Contact"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/35 to-transparent pointer-events-none" />
      <div className="w-full h-[0.75px] bg-black/35" />
      <div className="flex justify-between items-center px-0.5 z-10">
        <div className="w-1.5 h-1.5 rounded-xs border border-black/40 bg-[#BA8812]/50" />
        <div className="w-2.5 h-[0.75px] bg-black/40" />
        <div className="w-1.5 h-1.5 rounded-xs border border-black/40 bg-[#BA8812]/50" />
      </div>
      <div className="w-full h-[0.75px] bg-black/35" />
    </div>
  );
}

/**
 * Ícone Contactless / NFC Estilizado
 */
export function ContactlessIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-4 h-4 sm:w-5 sm:h-5 fill-none stroke-current stroke-[2.2] opacity-85 rotate-90 select-none ${className}`}
      aria-hidden="true"
    >
      <path d="M5 19a12 12 0 0 1 0-14" strokeLinecap="round" />
      <path d="M8.5 16.5a8 8 0 0 1 0-9" strokeLinecap="round" />
      <path d="M12 14a4 4 0 0 1 0-4" strokeLinecap="round" />
    </svg>
  );
}

export interface CreditCardVisualProps {
  card: Partial<CreditCard>;
  totalInvoice?: number;
  availableLimit?: number;
  dueStatus?: { text: string; color: string };
  isSelected?: boolean;
  interactive?: boolean;
  tiltLimit?: number;
  scale?: number;
  className?: string;
  onClick?: () => void;
  showDetails?: boolean;
}

/**
 * Componente Visual de Cartão de Crédito com cores fiéis, acabamento limpo e profissional
 */
export function CreditCardVisual({
  card,
  totalInvoice,
  availableLimit,
  dueStatus,
  isSelected = false,
  interactive = true,
  tiltLimit = 14,
  scale = 1.03,
  className = '',
  onClick,
}: CreditCardVisualProps) {
  const preset = card.cardDesignId
    ? getCardPresetById(card.cardDesignId)
    : matchBestCardPreset(card.bank, card.name);

  const themeStyles = preset ? computeCardThemeStyles(preset, card.colorVariant) : null;
  const brand = card.brand || (preset?.network) || detectCardBrand(card.bank, card.name, card.lastDigits);
  const lastDigits = card.lastDigits ? String(card.lastDigits).replace(/\D/g, '') : '••••';
  const closingDay = card.closingDay ? String(card.closingDay).padStart(2, '0') : '08';
  const dueDay = card.dueDay ? String(card.dueDay).padStart(2, '0') : '15';

  const isDarkText = card.textColor === 'dark' || (themeStyles?.color === '#041B2D' || themeStyles?.color === '#171717');
  const textPrimary = isDarkText ? 'text-slate-950' : 'text-white';
  const textMuted = isDarkText ? 'text-slate-800/85' : 'text-white/80';
  const borderSubtle = isDarkText ? 'border-slate-900/15' : 'border-white/20';

  // Se tiver gradiente explícito, usa ele. Se não, usa o estilo computado do preset ou o gradiente vibrante correspondente.
  const gradientClass = card.gradient
    ? (card.gradient.includes('bg-gradient') ? card.gradient : `bg-gradient-to-tr ${card.gradient}`)
    : (card.color ? '' : (themeStyles ? '' : `bg-gradient-to-tr ${getVibrantBankGradient(card.bank || card.name)}`));

  const inlineBackground = card.gradient
    ? undefined
    : (card.color ? card.color : themeStyles?.background);

  const hasPhotoBackground = Boolean(card.cardPhotoUrl && card.visualStyle !== 'digital');

  const cardInner = (
    <motion.div
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={`relative w-full aspect-[1.586/1] min-h-[190px] sm:min-h-[210px] rounded-[22px] p-5 sm:p-6 ${textPrimary} overflow-hidden flex flex-col justify-between transition-all duration-300 select-none border-0 ${
        gradientClass
      } ${
        isSelected
          ? 'shadow-[0_20px_45px_-12px_rgba(0,0,0,0.45)]'
          : 'shadow-[0_12px_30px_-10px_rgba(0,0,0,0.30)]'
      }`}
      style={{
        background: inlineBackground,
        borderColor: themeStyles?.borderColor,
      }}
    >
      {/* Textura Visual do Cartão Real (SVG Pattern) */}
      {!hasPhotoBackground && themeStyles?.textureOverlay && (
        <div
          style={{ backgroundImage: themeStyles.textureOverlay, backgroundSize: '16px 16px' }}
          className="absolute inset-0 opacity-35 pointer-events-none mix-blend-overlay z-[1]"
        />
      )}

      {/* Acabamento Metálico / Holográfico */}
      {!hasPhotoBackground && themeStyles?.finishOverlay && (
        <div
          style={{ background: themeStyles.finishOverlay }}
          className="absolute inset-0 pointer-events-none z-[1]"
        />
      )}
      {/* 0. Textura Fotográfica Real do Cartão Escaneado */}
      {hasPhotoBackground && (
        <div className="absolute inset-0 z-0 overflow-hidden rounded-[21px] pointer-events-none">
          <img
            src={card.cardPhotoUrl}
            alt={card.name || 'Cartão Físico'}
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          {card.visualStyle === 'hybrid' ? (
            <div className="absolute inset-0 bg-gradient-to-tr from-black/45 via-black/15 to-transparent pointer-events-none" />
          ) : (
            <div className={`absolute inset-0 ${isDarkText ? 'bg-white/10 backdrop-contrast-[1.03]' : 'bg-black/20 backdrop-contrast-[1.05]'} pointer-events-none`} />
          )}
        </div>
      )}

      {/* 1. Iluminação e Reflexos Cristalinos (Sem escurecer as cores originais) */}
      <div className="absolute -right-12 -top-12 w-52 h-52 rounded-full bg-white/[0.18] blur-2xl pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/[0.16] pointer-events-none z-[1]" />

      {/* TOP ROW: Banco, Logo, Chip EMV & NFC */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <BankLogo bankName={card.bank || card.name} size={34} className="shrink-0 drop-shadow-xs" />
          <div>
            <span className={`text-xs sm:text-sm font-bold tracking-wide ${textPrimary} drop-shadow-xs leading-none block uppercase`}>
              {card.bank || 'Cartão'}
            </span>
            <div className="flex items-center gap-1 mt-1">
              <p className={`text-[10px] ${textMuted} font-medium tracking-wide leading-none`}>
                Crédito
              </p>
              {card.cardPhotoUrl && (
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/80 text-white backdrop-blur-xs leading-none">
                  Fiel
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Chip EMV & Contactless Wave */}
        <div className="flex items-center gap-2">
          <ContactlessIcon className={isDarkText ? 'text-slate-900/90' : 'text-white/90'} />
          <EmvSmartChip size="md" />
        </div>
      </div>

      {/* MIDDLE ROW: Fatura ou Dígitos Mascarados em Relevo */}
      <div className="relative z-10 my-auto py-1">
        {totalInvoice !== undefined ? (
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold tracking-widest uppercase ${textMuted} drop-shadow-2xs`}>
                Fatura Atual
              </span>
              {dueStatus && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md border border-white/25 shadow-xs ${dueStatus.color}`}>
                  {dueStatus.text}
                </span>
              )}
            </div>
            <h3 className={`text-2xl sm:text-[28px] font-bold tracking-tight ${textPrimary} mt-0.5 tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]`}>
              {formatCurrency(totalInvoice)}
            </h3>
            {availableLimit !== undefined && card.limit ? (
              <p className={`text-[10px] ${textMuted} font-medium mt-0.5 drop-shadow-2xs`}>
                Disponível: <strong className={`${textPrimary} font-bold`}>{formatCurrency(availableLimit)}</strong>
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className={`text-base sm:text-lg font-mono font-bold tracking-[0.22em] ${textPrimary} drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.65)]`}>
              •••• &nbsp;•••• &nbsp;•••• &nbsp;{lastDigits}
            </p>
          </div>
        )}
      </div>

      {/* BOTTOM ROW: Titular, Datas de Corte/Vencimento & Logotipo da Bandeira */}
      <div className={`relative z-10 flex items-end justify-between pt-2 border-t ${borderSubtle}`}>
        <div className="max-w-[62%]">
          {totalInvoice !== undefined && (
            <p className={`text-[11px] sm:text-xs font-mono font-bold tracking-widest ${textPrimary} drop-shadow-xs mb-0.5 truncate`}>
              •••• {lastDigits}
            </p>
          )}
          <span className={`text-[8px] sm:text-[9px] uppercase tracking-wider font-bold ${textMuted} block leading-none`}>
            Titular do Cartão
          </span>
          <p className={`text-xs sm:text-sm font-bold ${textPrimary} tracking-wide truncate mt-0.5 drop-shadow-xs`}>
            {card.name || 'Seu Cartão'}
          </p>
        </div>

        <div className="flex items-end gap-3">
          <div className="text-right">
            <div className={`flex items-center gap-1.5 text-[9px] sm:text-[10px] ${textMuted} font-bold leading-none drop-shadow-2xs`}>
              <span>Corte {closingDay}</span>
              <span>•</span>
              <span>Venc {dueDay}</span>
            </div>
            {card.limit && totalInvoice === undefined ? (
              <p className={`text-[11px] font-bold ${textPrimary} mt-1 tabular-nums drop-shadow-xs`}>
                {formatCurrency(card.limit)}
              </p>
            ) : null}
          </div>

          <CardBrandBadge brand={brand} />
        </div>
      </div>
    </motion.div>
  );

  if (interactive) {
    return (
      <TiltCard
        tiltLimit={tiltLimit}
        perspective={1000}
        className={`w-full rounded-[22px] ${className}`}
        cardClassName="rounded-[22px]"
      >
        {cardInner}
      </TiltCard>
    );
  }

  return <div className={`w-full ${className}`}>{cardInner}</div>;
}

export default CreditCardVisual;
