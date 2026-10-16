import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard as CardIcon, Percent, DollarSign, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { CreditCard } from '../types';
import { formatCurrency, addMonths } from '../utils/financeCalculations';
import { BankLogo } from './BankLogo';
import { Button } from './Button';

interface PayCardBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: CreditCard | null;
  currentMonth: string;
  totalAmount: number;
  onConfirmPayment: (paymentData: {
    card: CreditCard;
    monthYear: string;
    paidAmount: number;
    totalAmount: number;
    paymentType: 'full' | 'partial';
    interestRate: number;
    interestAmount: number;
    remainingBalance: number;
    rolledOverDebt: number;
    nextMonth: string;
  }) => void;
}

export function PayCardBillModal({
  isOpen,
  onClose,
  card,
  currentMonth,
  totalAmount,
  onConfirmPayment,
}: PayCardBillModalProps) {
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (typeof document === 'undefined') return null;

  // Determine estimated interest rate based on bank name
  const getBankInterestRate = (bankName: string) => {
    const b = (bankName || '').toLowerCase();
    if (b.includes('nubank') || b.includes('nu')) return 12.5;
    if (b.includes('itau') || b.includes('itaú')) return 13.9;
    if (b.includes('bradesco')) return 14.2;
    if (b.includes('santander')) return 14.9;
    if (b.includes('inter')) return 11.5;
    if (b.includes('c6')) return 12.0;
    if (b.includes('xp') || b.includes('rico')) return 11.0;
    return 13.0;
  };

  const defaultRate = card ? getBankInterestRate(card.bank || card.name) : 13.0;
  const [paymentMode, setPaymentMode] = useState<'full' | 'partial'>('full');
  const [customPercent, setCustomPercent] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>(Math.round(totalAmount * 0.5).toString());
  const [interestRate, setInterestRate] = useState<number>(defaultRate);
  const [carryOverToNextMonth, setCarryOverToNextMonth] = useState<boolean>(true);

  const paidAmount = paymentMode === 'full' ? totalAmount : Math.min(totalAmount, parseFloat(customAmount) || 0);
  const remainingBalance = Math.max(0, totalAmount - paidAmount);
  const interestAmount = paymentMode === 'partial' ? remainingBalance * (interestRate / 100) : 0;
  const rolledOverDebt = remainingBalance + interestAmount;
  const nextMonth = addMonths(currentMonth, 1);

  const handlePercentPreset = (pct: number) => {
    setCustomPercent(pct);
    const amt = (totalAmount * pct) / 100;
    setCustomAmount(amt.toFixed(2));
  };

  const handleConfirm = () => {
    if (!card) return;
    onConfirmPayment({
      card,
      monthYear: currentMonth,
      paidAmount,
      totalAmount,
      paymentType: paymentMode,
      interestRate: paymentMode === 'partial' ? interestRate : 0,
      interestAmount: paymentMode === 'partial' ? interestAmount : 0,
      remainingBalance,
      rolledOverDebt: carryOverToNextMonth ? rolledOverDebt : 0,
      nextMonth,
    });
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && card && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={onClose}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/70 dark:bg-black/80 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#1C1C1E] w-full max-w-lg rounded-[28px] shadow-2xl border border-slate-200/60 dark:border-white/[0.08] overflow-hidden flex flex-col max-h-[90vh]"
          >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-slate-50 dark:bg-[#2C2C2E]/50 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BankLogo bankName={card.bank || card.name} size={40} className="shrink-0" />
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Pagamento de Fatura • {card.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fatura total: <strong className="text-slate-800 dark:text-white">{formatCurrency(totalAmount)}</strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200/60 dark:bg-[#3A3A3C]/60 hover:bg-slate-200 dark:hover:bg-white/[0.08] flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
            
            {/* Payment Type Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-[#2C2C2E]/80 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setPaymentMode('full')}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paymentMode === 'full'
                    ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Pagar Integral (100%)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('partial')}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paymentMode === 'partial'
                    ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Pagamento Parcial (Juros)
              </button>
            </div>

            {paymentMode === 'partial' && (
              <div className="space-y-4 animate-in fade-in duration-200 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/50 p-4 rounded-2xl">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <AlertCircle size={18} />
                  <span className="font-extrabold text-xs">Simulação de Rotativo e Juros</span>
                </div>

                {/* Presets */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                    Escolher Percentual de Pagamento:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[25, 50, 75].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handlePercentPreset(pct)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          customPercent === pct && paidAmount === (totalAmount * pct) / 100
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white dark:bg-[#2C2C2E] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.10]'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                    <div className="relative">
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          const val = parseFloat(e.target.value) || 0;
                          if (totalAmount > 0) setCustomPercent(Math.round((val / totalAmount) * 100));
                        }}
                        placeholder="Outro"
                        className="w-full h-full text-center bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden px-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Values Breakdown */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-white/80 dark:bg-[#1C1C1E]/60 p-3 rounded-xl border border-slate-200 dark:border-white/[0.08]">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Valor a Pagar Agora</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(paidAmount)}
                    </span>
                  </div>

                  <div className="bg-white/80 dark:bg-[#1C1C1E]/60 p-3 rounded-xl border border-slate-200 dark:border-white/[0.08]">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Saldo Restante</span>
                    <span className="text-sm font-bold text-rose-500">
                      {formatCurrency(remainingBalance)}
                    </span>
                  </div>
                </div>

                {/* Interest settings */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Taxa de Juros do Rotativo ({card.bank || 'Banco'}):
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{interestRate}% a.m.</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="25"
                    step="0.5"
                    value={interestRate}
                    onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                    aria-label="Taxa de Juros do Rotativo ao mês"
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Rollover calculation result */}
                <div className="bg-amber-100/60 dark:bg-amber-900/30 p-3.5 rounded-xl border border-amber-300 dark:border-amber-700/50 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300">Juros Incididos:</span>
                    <strong className="text-rose-600 dark:text-rose-400">+ {formatCurrency(interestAmount)}</strong>
                  </div>
                  <div className="flex justify-between text-xs font-bold pt-1 border-t border-amber-200 dark:border-amber-800">
                    <span className="text-slate-900 dark:text-white">Dívida Rolada para Próximo Mês:</span>
                    <span className="text-rose-600 dark:text-rose-400 text-sm">{formatCurrency(rolledOverDebt)}</span>
                  </div>

                  <label className="flex items-center gap-2 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={carryOverToNextMonth}
                      onChange={(e) => setCarryOverToNextMonth(e.target.checked)}
                      className="w-4 h-4 rounded-md accent-amber-600"
                    />
                    <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                      Adicionar automaticamente como ajuste na fatura de {nextMonth}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {paymentMode === 'full' && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-emerald-900 dark:text-emerald-300">Pagamento Integral da Fatura</h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    O valor de {formatCurrency(totalAmount)} será registrado como pago e a fatura será encerrada sem incidência de juros.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-6 bg-slate-50 dark:bg-[#2C2C2E]/50 border-t border-slate-100 dark:border-white/[0.08] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              rightIcon={<ArrowRight size={14} />}
              className="w-full sm:w-auto"
            >
              Confirmar Pagamento
            </Button>
          </div>

        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

