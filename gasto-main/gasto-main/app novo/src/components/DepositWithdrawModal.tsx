import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, DollarSign } from 'lucide-react';
import { InvestmentBox } from '../types';
import { formatCurrency } from '../utils/financeCalculations';

interface DepositWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  box: InvestmentBox | null;
  mode: 'deposit' | 'withdraw';
  onConfirm: (boxId: string, amount: number, mode: 'deposit' | 'withdraw', notes?: string) => void;
}

export function DepositWithdrawModal({
  isOpen,
  onClose,
  box,
  mode,
  onConfirm,
}: DepositWithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen || !box) return null;

  const isDeposit = mode === 'deposit';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    onConfirm(box.id, parsedAmount, mode, notes.trim() || undefined);
    setAmount('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                isDeposit
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
              }`}
            >
              {isDeposit ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isDeposit ? 'Fazer Aporte / Depósito' : 'Fazer Resgate / Retirada'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Caixinha: <span className="font-semibold text-slate-700 dark:text-slate-300">{box.title}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Saldo Atual na Caixinha:</span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(box.currentBalance)}
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Valor da Movimentação (R$) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-slate-400">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm font-bold focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Motivo / Observação
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isDeposit ? 'Ex: Sobra do 13º, economia do mês...' : 'Ex: Conserto do carro, compra planejada...'}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 font-semibold text-white rounded-xl shadow-xs transition-all active:scale-95 ${
                isDeposit
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isDeposit ? 'Confirmar Aporte' : 'Confirmar Resgate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
