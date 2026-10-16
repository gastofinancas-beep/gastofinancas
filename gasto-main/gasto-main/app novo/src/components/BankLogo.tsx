import React, { useState, useEffect } from 'react';
import { getOfficialBankLogo, ResolvedBankLogo } from '../utils/bankLogos';
import { CreditCard, Banknote } from 'lucide-react';

export interface BankLogoProps {
  bankName?: string;
  className?: string;
  size?: number;
  /** Se deve aplicar o fundo ('raw' por padrão: sem círculo, borda ou fundo branco) */
  variant?: 'contained' | 'raw';
}

export function normalizeBankName(name?: string): string {
  if (!name) return 'default';
  const clean = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  
  if (clean.includes('nu') || clean.includes('roxinh')) return 'nubank';
  if (clean.includes('itau') || clean.includes('personnalite')) return 'itau';
  if (clean.includes('inter')) return 'inter';
  if (clean.includes('c6')) return 'c6';
  if (clean.includes('bradesco') || clean.includes('next')) return 'bradesco';
  if (clean.includes('santander')) return 'santander';
  if (clean.includes('brasil') || clean === 'bb' || clean.includes('banco do brasil')) return 'bb';
  if (clean.includes('caixa') || clean.includes('cef')) return 'caixa';
  if (clean.includes('btg')) return 'btg';
  if (clean.includes('xp')) return 'xp';
  if (clean.includes('mercado') || clean.includes('pago')) return 'mercadopago';
  if (clean.includes('picpay')) return 'picpay';
  if (clean.includes('neon')) return 'neon';
  if (clean.includes('pagbank') || clean.includes('pagseguro')) return 'pagbank';
  if (clean.includes('sicredi')) return 'sicredi';
  if (clean.includes('sicoob')) return 'sicoob';
  if (clean.includes('cresol')) return 'cresol';
  if (clean.includes('safra')) return 'safra';
  if (clean.includes('pan')) return 'pan';
  if (clean.includes('bmg')) return 'bmg';
  if (clean.includes('stone')) return 'stone';
  if (clean.includes('genial')) return 'genial';
  if (clean.includes('asaas')) return 'asaas';
  if (clean.includes('dinheiro') || clean.includes('fisico') || clean.includes('cash')) return 'dinheiro';

  return 'default';
}

export function BankLogo({ bankName, className = '', size = 28, variant = 'raw' }: BankLogoProps) {
  const [attemptIndex, setAttemptIndex] = useState(0);
  const pxSize = `${size}px`;
  const bankKey = normalizeBankName(bankName);
  const officialLogo = getOfficialBankLogo(bankName);

  // Reset attempt when bank changes
  useEffect(() => {
    setAttemptIndex(0);
  }, [bankName]);

  // Se for dinheiro em espécie
  if (bankKey === 'dinheiro') {
    return (
      <div
        style={{ width: pxSize, height: pxSize }}
        className={`shrink-0 rounded-lg bg-emerald-600/90 text-white flex items-center justify-center select-none ${className}`}
        title="Dinheiro em Espécie"
      >
        <Banknote size={Math.max(12, Math.round(size * 0.6))} />
      </div>
    );
  }

  // Lista de fontes prioritárias para o logo oficial (logos-bancos-br & Tgentil/Bancos-em-SVG)
  const candidateSources = officialLogo ? [
    officialLogo.svgUrl,
    officialLogo.tgentilSvgUrl,
    officialLogo.cdnSvgUrl,
    officialLogo.pngUrl,
    officialLogo.cdnPngUrl,
  ].filter(Boolean) as string[] : [];

  const currentSource = candidateSources[attemptIndex];
  const hasFailedAll = candidateSources.length === 0 || attemptIndex >= candidateSources.length;

  const handleImageError = () => {
    setAttemptIndex((prev) => prev + 1);
  };

  // Se tiver um logo oficial disponível
  if (!hasFailedAll && currentSource) {
    return (
      <div
        style={{ width: pxSize, height: pxSize }}
        className={`shrink-0 flex items-center justify-center select-none bg-transparent ${className}`}
        title={officialLogo?.name || bankName || 'Instituição Financeira'}
      >
        <img
          src={currentSource}
          alt={officialLogo?.name || bankName || 'Logo da Instituição'}
          className={`w-full h-full max-w-full max-h-full object-contain pointer-events-none select-none transition-transform ${
            bankKey === 'c6' ? 'dark:brightness-0 dark:invert' : ''
          }`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={handleImageError}
        />
      </div>
    );
  }

  // Fallback visual elegante caso o banco não esteja no dataset ou a imagem falhe
  const displayName = bankName || 'Banco';
  const initial = displayName.charAt(0).toUpperCase();
  const fallbackColor = officialLogo?.brandColor || '#3B82F6';

  return (
    <div
      style={{ 
        width: pxSize, 
        height: pxSize,
        backgroundColor: fallbackColor 
      }}
      className={`shrink-0 rounded-lg text-white font-bold flex items-center justify-center select-none ${className}`}
      title={displayName}
    >
      {size >= 24 ? (
        <span style={{ fontSize: `${Math.round(size * 0.46)}px` }}>
          {initial}
        </span>
      ) : (
        <CreditCard size={Math.max(10, Math.round(size * 0.6))} />
      )}
    </div>
  );
}
