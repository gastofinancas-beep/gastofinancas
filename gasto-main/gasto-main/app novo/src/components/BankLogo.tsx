import React from 'react';

interface BankLogoProps {
  bankName?: string;
  className?: string;
  size?: number;
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

  return 'default';
}

export function BankLogo({ bankName, className = '', size = 28 }: BankLogoProps) {
  const bankKey = normalizeBankName(bankName);
  const pxSize = `${size}px`;

  switch (bankKey) {
    case 'nubank':
      return (
        <div
          style={{ width: pxSize, height: pxSize }}
          className={`shrink-0 rounded-lg bg-[#820AD1] flex items-center justify-center shadow-xs ${className}`}
          title="Nubank"
        >
          <svg viewBox="0 0 40 40" className="w-4/5 h-4/5 fill-white" aria-hidden="true">
            {/* Nu Monogram Style */}
            <path d="M12.5 12C10.5 12 9 13.5 9 15.5V28H13V16.8C13 15.8 13.8 15 14.8 15C15.8 15 16.6 15.8 16.6 16.8V28H20.6V16C20.6 13.8 18.8 12 16.6 12C15 12 13.6 12.9 12.5 14.2V12.5H12.5ZM23.4 12V24.5C23.4 26.4 24.9 28 26.8 28C28.4 28 29.8 27.1 30.9 25.8V28H31V12H27V23.2C27 24.2 26.2 25 25.2 25C24.2 25 23.4 24.2 23.4 23.2V12H23.4Z" />
          </svg>
        </div>
      );

    case 'itau':
      return (
        <div
          style={{ width: pxSize, height: pxSize }}
          className={`shrink-0 rounded-lg bg-[#EC7000] flex items-center justify-center shadow-xs overflow-hidden ${className}`}
          title="Itaú"
        >
          <div className="w-[82%] h-[82%] rounded-md bg-[#002D72] flex items-center justify-center">
            <span className="font-extrabold text-amber-400 text-[10px] tracking-tighter lowercase select-none" style={{ fontSize: `${size * 0.38}px` }}>
              itaú
            </span>
          </div>
        </div>
      );

    case 'inter':
      return (
        <div
          style={{ width: pxSize, height: pxSize }}
          className={`shrink-0 rounded-lg bg-[#FF7A00] flex items-center justify-center shadow-xs ${className}`}
          title="Banco Inter"
        >
          <span className="font-black text-white tracking-tighter lowercase select-none" style={{ fontSize: `${size * 0.36}px` }}>
            inter
          </span>
        </div>
      );

    case 'c6':
      return (
        <div
          style={{ width: pxSize, height: pxSize }}
          className={`shrink-0 rounded-lg bg-[#181818] border border-white/10 flex items-center justify-center shadow-xs ${className}`}
          title="C6 Bank"
        >
          <span className="font-black text-white tracking-wider select-none" style={{ fontSize: `${size * 0.38}px` }}>
            C6
          </span>
        </div>
      );

    case 'bradesco':
      return (
        <div
          style={{ width: pxSize, height: pxSize }}
          className={`shrink-0 rounded-lg bg-[#CC092F] flex items-center justify-center shadow-xs ${className}`}
          title="Bradesco"
        >
          <svg viewBox="0 0 40 40" className="w-3/5 h-3/5 fill-white" aria-hidden="true">
            {/* Bradesco stylized geometric arcs */}
            <circle cx="20" cy="11" r="3.2" />
            <path d="M12 28C12 21.5 16 16.5 20 16.5C24 16.5 28 21.5 28 28H24.5C24.5 23 22.5 19.5 20 19.5C17.5 19.5 15.5 23 15.5 28H12Z" />
            <path d="M8 28C8 19 13.5 13.5 20 13.5C26.5 13.5 32 19 32 28H29C29 20.5 25 16 20 16C15 16 11 20.5 11 28H8Z" />
          </svg>
        </div>
      );

    case 'santander':
      return (
        <div
          style={{ width: pxSize, height: pxSize }}
          className={`shrink-0 rounded-lg bg-[#EC0000] flex items-center justify-center shadow-xs ${className}`}
          title="Santander"
        >
          <svg viewBox="0 0 40 40" className="w-3/5 h-3/5 fill-white" aria-hidden="true">
            {/* Santander flame style */}
            <path d="M20 7C20 7 24 12 24 16.5C24 19 22.5 21 20 21C17.5 21 16 19 16 16.5C16 12 20 7 20 7Z" />
            <path d="M14 14C14 14 10 18 10 22.5C10 27 14.5 30 20 30C25.5 30 30 27 30 22.5C30 18 26 14 26 14C27.5 17 28 20 28 22C28 25.5 24.5 27.5 20 27.5C15.5 27.5 12 25.5 12 22C12 20 12.5 17 14 14Z" />
          </svg>
        </div>
      );

    case 'bb':
      return (
        <div
          style={{ width: pxSize, height: pxSize }}
          className={`shrink-0 rounded-lg bg-[#003882] flex items-center justify-center shadow-xs ${className}`}
          title="Banco do Brasil"
        >
          <div className="w-3/4 h-3/4 bg-[#F8D210] rounded-sm flex items-center justify-center p-0.5">
            <span className="font-extrabold text-[#003882] tracking-tighter" style={{ fontSize: `${size * 0.38}px` }}>
              BB
            </span>
          </div>
        </div>
      );

    case 'caixa':
      return (
        <div
          style={{ width: pxSize, height: pxSize }}
          className={`shrink-0 rounded-lg bg-[#005CA9] flex items-center justify-center shadow-xs relative overflow-hidden ${className}`}
          title="Caixa Econômica"
        >
          <span className="font-black text-white tracking-tighter uppercase select-none flex items-center" style={{ fontSize: `${size * 0.36}px` }}>
            C<span className="text-[#F37021]">X</span>
          </span>
        </div>
      );

    case 'mercadopago':
      return (
        <div
          style={{ width: pxSize, height: pxSize }}
          className={`shrink-0 rounded-lg bg-[#009EE3] flex items-center justify-center shadow-xs ${className}`}
          title="Mercado Pago"
        >
          <svg viewBox="0 0 40 40" className="w-3/5 h-3/5 fill-white" aria-hidden="true">
            {/* Handshake symbol */}
            <path d="M12 23C13.5 20 17 18 20 20L22 17C18 15 13 17 10 21L12 23ZM28 17C26.5 20 23 22 20 20L18 23C22 25 27 23 30 19L28 17Z" />
            <circle cx="20" cy="12" r="3.5" />
          </svg>
        </div>
      );

    case 'btg':
      return (
        <div
          style={{ width: pxSize, height: pxSize }}
          className={`shrink-0 rounded-lg bg-[#0B1E36] border border-[#C5A059]/40 flex items-center justify-center shadow-xs ${className}`}
          title="BTG Pactual"
        >
          <span className="font-bold text-[#C5A059] tracking-tighter" style={{ fontSize: `${size * 0.34}px` }}>
            BTG
          </span>
        </div>
      );

    case 'xp':
      return (
        <div
          style={{ width: pxSize, height: pxSize }}
          className={`shrink-0 rounded-lg bg-black border border-white/15 flex items-center justify-center shadow-xs ${className}`}
          title="XP Investimentos"
        >
          <span className="font-black text-[#FFE600] tracking-tight" style={{ fontSize: `${size * 0.38}px` }}>
            XP
          </span>
        </div>
      );

    case 'picpay':
      return (
        <div
          style={{ width: pxSize, height: pxSize }}
          className={`shrink-0 rounded-lg bg-[#11C76F] flex items-center justify-center shadow-xs ${className}`}
          title="PicPay"
        >
          <span className="font-black text-white tracking-tighter" style={{ fontSize: `${size * 0.38}px` }}>
            P
          </span>
        </div>
      );

    default:
      return (
        <div
          style={{ width: pxSize, height: pxSize }}
          className={`shrink-0 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 flex items-center justify-center shadow-2xs ${className}`}
          title={bankName || 'Cartão'}
        >
          <svg viewBox="0 0 24 24" className="w-1/2 h-1/2 stroke-current fill-none stroke-2" aria-hidden="true">
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
          </svg>
        </div>
      );
  }
}
