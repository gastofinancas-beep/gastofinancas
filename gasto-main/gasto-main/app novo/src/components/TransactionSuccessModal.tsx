import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Check, Copy, Volume2, X } from 'lucide-react';
import { playTransactionSuccessFeedback, playSuccessChime } from '../utils/soundEffects';

export interface TransactionSuccessData {
  id?: string;
  type: 'despesa' | 'receita' | 'transferencia' | 'fatura' | 'freelance' | 'motorista' | 'assinatura';
  title?: string;
  subtitle?: string;
  amount: number;
  from?: string;
  to?: string;
  category?: string;
  date?: string;
  transactionId?: string;
  paymentMethod?: string;
  installments?: string;
}

interface TransactionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TransactionSuccessData | null;
}

/**
 * Authentic Scalloped Rosette Seal Badge matching the user reference image
 */
function ScallopedSeal({ size = 112 }: { size?: number }) {
  // Generate 22 smooth scalloped petals
  const pathData = useMemo(() => {
    const points: string[] = [];
    const teeth = 22;
    const cx = 60;
    const cy = 60;
    const outerR = 56;
    const innerR = 48;

    for (let i = 0; i < teeth; i++) {
      const angle1 = (i * 2 * Math.PI) / teeth;
      const angleMid = ((i + 0.5) * 2 * Math.PI) / teeth;
      const angle2 = ((i + 1) * 2 * Math.PI) / teeth;

      const x0 = cx + innerR * Math.cos(angle1);
      const y0 = cy + innerR * Math.sin(angle1);
      const xPeak = cx + outerR * Math.cos(angleMid);
      const yPeak = cy + outerR * Math.sin(angleMid);
      const x1 = cx + innerR * Math.cos(angle2);
      const y1 = cy + innerR * Math.sin(angle2);

      if (i === 0) {
        points.push(`M ${x0.toFixed(2)} ${y0.toFixed(2)}`);
      }
      points.push(`Q ${xPeak.toFixed(2)} ${yPeak.toFixed(2)} ${x1.toFixed(2)} ${y1.toFixed(2)}`);
    }
    return points.join(' ') + ' Z';
  }, []);

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Outer ambient glow */}
      <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-xl animate-pulse pointer-events-none" />

      <svg width={size} height={size} viewBox="0 0 120 120" className="relative drop-shadow-md">
        <defs>
          <linearGradient id="scallopOuterGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A7F3D0" />
            <stop offset="100%" stopColor="#6EE7B7" />
          </linearGradient>
          <linearGradient id="scallopInnerGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>

        {/* Outer scalloped ring */}
        <path d={pathData} fill="url(#scallopOuterGrad)" />

        {/* Middle subtle ring */}
        <circle cx="60" cy="60" r="46" fill="#059669" opacity="0.35" />

        {/* Inner solid circular seal */}
        <circle cx="60" cy="60" r="42" fill="url(#scallopInnerGrad)" />

        {/* Crisp White Checkmark */}
        <motion.path
          d="M44 60.5 L53.5 70 L77 46.5"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.22, duration: 0.45, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}

function getFormattedCurrentDate(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = now.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${day} ${capitalizedMonth} ${year} / ${hours}:${minutes}`;
}

export function TransactionSuccessModal({
  isOpen,
  onClose,
  data
}: TransactionSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  // Play audio chime when opened
  useEffect(() => {
    if (isOpen && data) {
      playSuccessChime();
    }
  }, [isOpen, data]);

  // Lock body scroll and listen for Escape key when open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const formattedAmount = data ? new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(data.amount) : '';

  const displayDate = data?.date || getFormattedCurrentDate();
  const displayTransactionId = data?.transactionId || (data ? `#${(data.id || Math.random().toString()).replace(/\D/g, '').slice(0, 8) || '01062445'}` : '');

  const defaultTitle = 
    data?.title ||
    (data?.type === 'receita'
      ? 'Receita Confirmada!'
      : data?.type === 'despesa'
      ? 'Despesa Registrada!'
      : data?.type === 'transferencia'
      ? 'Transferência Concluída!'
      : data?.type === 'fatura'
      ? 'Fatura Paga!'
      : 'Registro Concluído!');

  const defaultSubtitle = data?.subtitle || 'Seu registro foi realizado com sucesso!';

  const handleShare = async () => {
    if (!data) return;
    const textToShare = `Comprovante Gastô?\n${defaultTitle}\nValor: ${formattedAmount}\nData: ${displayDate}\nID: ${displayTransactionId}\nOrigem: ${data.from || 'Conta'}\nDestino: ${data.to || 'Lançamento'}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: defaultTitle,
          text: textToShare,
        });
        return;
      } catch {
        // Fallback to clipboard if cancelled or fails
      }
    }

    try {
      await navigator.clipboard.writeText(textToShare);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignored
    }
  };

  const handleReplayChime = () => {
    playSuccessChime();
  };

  return (
    <AnimatePresence>
      {isOpen && data && (
        <motion.div
          key="transaction-success-fullscreen"
          role="dialog"
          aria-modal="true"
          aria-label="Comprovante de Transação"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-[#1C1C1E] overflow-y-auto"
        >
          {/* Top Section with App Brand Emerald Gradient (Full Width) */}
          <div className="relative pt-safe pb-8 px-6 text-center bg-gradient-to-b from-emerald-600 via-emerald-600 to-emerald-700 text-white overflow-hidden shrink-0 shadow-md">
            {/* Subtle ambient rings */}
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-teal-400/20 blur-xl pointer-events-none" />

            {/* Top Bar with Brand & Controls */}
            <div className="max-w-md mx-auto w-full flex items-center justify-between pt-3 pb-2 relative z-20">
              <span className="text-xs font-bold tracking-wider uppercase text-emerald-100/90">
                Gastô Comprovante
              </span>

              {/* Close Button & Sound Replay */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReplayChime}
                  title="Tocar som de confirmação"
                  className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <Volume2 size={17} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  title="Fechar"
                  className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            <div className="max-w-md mx-auto w-full flex flex-col items-center pt-2">
              {/* Animated Scalloped Rosette Seal */}
              <motion.div
                initial={{ scale: 0, rotate: -25 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 320, delay: 0.1 }}
                className="mb-4 inline-block"
              >
                <ScallopedSeal size={112} />
              </motion.div>

              {/* Title & Subtitle */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1.5 drop-shadow-xs"
              >
                {defaultTitle}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                className="text-xs sm:text-sm text-emerald-100 font-medium px-4 leading-relaxed"
              >
                {defaultSubtitle}
              </motion.p>
            </div>
          </div>

          {/* Receipt Ticket Body (Fills remaining full-screen space) */}
          <div className="flex-1 flex flex-col justify-between w-full max-w-md mx-auto px-5 sm:px-6 pt-6 pb-safe">
            {/* Upper details */}
            <div className="space-y-4">
              {/* Receipt Content List */}
              <div className="space-y-3 text-xs sm:text-sm">
                {/* De / Origem */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">De</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-right truncate max-w-[220px]">
                    {data.from || 'Origem de Renda'}
                  </span>
                </div>

                {/* Para / Destino */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Para</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-right truncate max-w-[220px]">
                    {data.to || 'Carteira'}
                  </span>
                </div>

                {/* ID da Transação */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">ID do Registro</span>
                  <span className="font-bold font-mono text-slate-700 dark:text-slate-300">
                    {displayTransactionId}
                  </span>
                </div>

                {/* Data e Hora */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Data & Hora</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {displayDate}
                  </span>
                </div>

                {/* Categoria */}
                {data.category && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Categoria</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 capitalize">
                      {data.category}
                    </span>
                  </div>
                )}

                {/* Parcelas (se houver) */}
                {data.installments && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Parcelamento</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {data.installments}
                    </span>
                  </div>
                )}

                {/* Forma de Pagamento (se houver) */}
                {data.paymentMethod && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Forma de Pagamento</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {data.paymentMethod}
                    </span>
                  </div>
                )}
              </div>

              {/* Perforation Line with Ticket Cutouts on Left and Right */}
              <div className="relative py-4 my-2">
                {/* Left Ticket Notch Cutout */}
                <div className="absolute -left-8 sm:-left-9 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#F2F2F7] dark:bg-black shadow-inner" />
                
                {/* Dashed Tear Line */}
                <div className="border-b-2 border-dashed border-slate-200 dark:border-white/10 w-full" />
                
                {/* Right Ticket Notch Cutout */}
                <div className="absolute -right-8 sm:-right-9 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#F2F2F7] dark:bg-black shadow-inner" />
              </div>

              {/* Total Payment Row */}
              <div className="flex items-center justify-between pt-1 pb-3">
                <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Valor Total
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formattedAmount}
                </span>
              </div>
            </div>

            {/* Action Buttons at the Bottom */}
            <div className="space-y-3 pt-6 pb-4">
              {/* Primary Button: Back to Home / Concluir */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-4 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-sm sm:text-base shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Check size={18} className="stroke-[2.5]" />
                <span>Voltar ao Início</span>
              </button>

              {/* Secondary Button: Share / Compartilhar */}
              <button
                type="button"
                onClick={handleShare}
                className="w-full py-3.5 px-4 rounded-full border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 active:scale-98 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-emerald-500 stroke-[2.5]" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copiado para área de transferência!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={16} />
                    <span>Compartilhar Comprovante</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
