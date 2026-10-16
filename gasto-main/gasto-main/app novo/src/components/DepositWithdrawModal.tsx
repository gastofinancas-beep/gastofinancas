import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Check, DollarSign } from 'lucide-react';
import { InvestmentBox } from '../types';
import { formatCurrency } from '../utils/financeCalculations';
import { CurrencyInput } from './CurrencyInput';
import { triggerHaptic } from '../utils/haptics';
import { addBoxHistoryEntry } from '../lib/investmentHistory';
import { Button } from './Button';
import { todayLocalISO } from '../utils/dateUtils';

interface DepositWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  box: InvestmentBox | null;
  mode: 'deposit' | 'withdraw';
  onConfirm: (boxId: string, amount: number, mode: 'deposit' | 'withdraw', notes?: string) => void;
  userId: string;
}

export function DepositWithdrawModal({
  isOpen,
  onClose,
  box,
  mode,
  onConfirm,
  userId,
}: DepositWithdrawModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !box || typeof document === 'undefined') return null;

  const isDeposit = mode === 'deposit';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    triggerHaptic(12);
    const trimmedNotes = notes.trim() || undefined;

    if (userId) {
      addBoxHistoryEntry(userId, box.id, {
        type: mode,
        amount,
        date: todayLocalISO(),
        notes: trimmedNotes || (mode === 'deposit' ? 'Aporte manual' : 'Resgate manual'),
      }).catch((err) => console.warn('Failed to add box history entry:', err));
    }

    onConfirm(box.id, amount, mode, trimmedNotes);
    setAmount(0);
    setNotes('');
    onClose();
  };

  const handleQuickAdd = (value: number) => {
    triggerHaptic(8);
    setAmount((prev) => (prev || 0) + value);
  };

  return createPortal(
    <div 
      id="fixed-deposit-withdraw-screen"
      className="fixed inset-0 z-[200] bg-slate-50 dark:bg-[#09090B] flex flex-col w-full h-full overflow-hidden"
    >
      {/* Fixed Top Header */}
      <header className="shrink-0 bg-white dark:bg-[#1C1C1E] border-b border-slate-200 dark:border-white/[0.08] px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Voltar"
          >
            <ArrowLeft size={18} className="stroke-[2.5]" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {isDeposit ? 'Fazer Aporte na Caixinha' : 'Fazer Resgate da Caixinha'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Caixinha: <strong className="text-slate-800 dark:text-slate-200">{box.title}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="hidden sm:inline-flex px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={`px-4.5 py-2 rounded-full text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              isDeposit
                ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                : 'bg-amber-600 hover:bg-amber-700 active:scale-95'
            }`}
          >
            <Check size={16} className="stroke-[2.5]" />
            <span>{isDeposit ? 'Confirmar Aporte' : 'Confirmar Resgate'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area - Fully Scrollable Vertical Container */}
      <main className="flex-1 overflow-y-auto overscroll-contain max-w-xl w-full mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-16">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Box Current Status Badge */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Saldo Atual na Caixinha</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(box.currentBalance || 0)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium block">Após {isDeposit ? 'Aporte' : 'Resgate'}</span>
              <span className={`text-base font-bold tabular-nums ${isDeposit ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {formatCurrency(
                  isDeposit
                    ? (box.currentBalance || 0) + (amount || 0)
                    : Math.max(0, (box.currentBalance || 0) - (amount || 0))
                )}
              </span>
            </div>
          </div>

          {/* Amount Card & Quick Chips */}
          <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                {isDeposit ? 'Valor a Guardar (R$) *' : 'Valor a Resgatar (R$) *'}
              </label>
              <CurrencyInput
                value={amount}
                onChange={setAmount}
                required
              />
            </div>

            {/* Quick Add Buttons */}
            <div>
              <span className="text-xs font-medium text-slate-400 block mb-2">
                Atalhos Rápidos:
              </span>
              <div className="flex flex-wrap gap-2">
                {[50, 100, 200, 500, 1000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAdd(val)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#2C2C2E] dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer select-none active:scale-95"
                  >
                    +{formatCurrency(val)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmount(0)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#2C2C2E] text-slate-400 text-xs font-medium hover:text-slate-600 cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>

          {/* Notes Input */}
          <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-2xs">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Motivo ou Observação (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isDeposit ? 'Ex: Sobra do salário, rendimento extra...' : 'Ex: Compra planejada, pagamento emergencial...'}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {/* Bottom Fixed Action Buttons */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              className={!isDeposit ? 'w-full sm:w-auto bg-amber-600 hover:bg-amber-700 active:bg-amber-800' : 'w-full sm:w-auto'}
              leftIcon={<Check size={16} className="stroke-[2.5]" />}
            >
              {isDeposit ? 'Confirmar Aporte' : 'Confirmar Resgate'}
            </Button>
          </div>

        </form>
      </main>
    </div>,
    document.body
  );
}
