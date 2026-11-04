import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft } from 'lucide-react';
import { PersonDebt } from '../types';
import { formatCurrency, formatMonthDisplay } from '../utils/financeCalculations';
import { summarizeDebt } from '../utils/personDebts';
import { triggerHaptic } from '../utils/haptics';

interface AddDebtModalProps {
  isOpen: boolean;
  personName: string;
  currentMonth: string;
  editingDebt?: PersonDebt | null;
  onClose: () => void;
  onSave: (data: { id?: string; description: string; totalAmount: number; installments: number; startMonthYear: string }) => void;
}

const QUICK_INSTALLMENTS = [1, 2, 3, 4, 5, 6, 10, 12];

const inputClass =
  'w-full px-4 py-3.5 bg-[#F1F3F5] dark:bg-[#1E1E20] border-0 rounded-2xl text-slate-900 dark:text-white text-[16px] font-medium placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/25 transition-all';

function parseMoney(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, '');
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function AddDebtModal({ isOpen, personName, currentMonth, editingDebt, onClose, onSave }: AddDebtModalProps) {
  const [description, setDescription] = useState('');
  const [amountText, setAmountText] = useState('');
  const [installments, setInstallments] = useState(1);
  const [startMonth, setStartMonth] = useState(currentMonth);

  // Com parcelas já pagas, valor e parcelas ficam travados para não bagunçar o histórico.
  const hasPayments = !!editingDebt && summarizeDebt(editingDebt).paidCount > 0;

  useEffect(() => {
    if (!isOpen) return;
    if (editingDebt) {
      setDescription(editingDebt.description);
      setAmountText(String(editingDebt.totalAmount).replace('.', ','));
      setInstallments(editingDebt.installments);
      setStartMonth(editingDebt.startMonthYear);
    } else {
      setDescription('');
      setAmountText('');
      setInstallments(1);
      setStartMonth(currentMonth);
    }
  }, [isOpen, editingDebt, currentMonth]);

  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const total = parseMoney(amountText);
  const perInstallment = installments > 0 ? total / installments : 0;
  const isValid = description.trim().length > 0 && total > 0 && installments >= 1 && /^\d{4}-\d{2}$/.test(startMonth);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    triggerHaptic(15);
    onSave({
      id: editingDebt?.id,
      description: description.trim(),
      totalAmount: Math.round(total * 100) / 100,
      installments,
      startMonthYear: startMonth,
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-white dark:bg-[#121214] overflow-y-auto flex flex-col w-full h-[100dvh] text-slate-900 dark:text-slate-100 animate-in fade-in duration-150">
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#121214]/90 backdrop-blur-md border-b border-slate-100 dark:border-white/[0.06] px-4 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { triggerHaptic(6); onClose(); }}
            className="w-10 h-10 rounded-2xl bg-[#F1F3F5] dark:bg-[#1E1E20] text-slate-700 dark:text-slate-200 flex items-center justify-center active:scale-95 cursor-pointer"
            title="Voltar"
          >
            <ArrowLeft size={18} className="stroke-[2.5]" />
          </button>
          <div>
            <h1 className="text-base font-bold tracking-tight leading-tight">
              {editingDebt ? 'Editar dívida' : 'Registrar dívida'}
            </h1>
            <p className="text-xs text-slate-400 font-medium">Você deve para {personName}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { triggerHaptic(6); onClose(); }}
          className="w-9 h-9 rounded-xl text-slate-400 hover:bg-[#F1F3F5] dark:hover:bg-white/[0.08] flex items-center justify-center cursor-pointer"
          title="Fechar"
        >
          <X size={18} />
        </button>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto p-4 pb-36">
        <form id="debt-form" onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2">Pelo que você deve?</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Empréstimo, Presente, Conserto do carro"
              autoFocus={!editingDebt}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Valor total</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">R$</span>
              <input
                type="text"
                inputMode="decimal"
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                placeholder="0,00"
                disabled={hasPayments}
                className={`${inputClass} pl-11 ${hasPayments ? 'opacity-60' : ''}`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Em quantas vezes?</label>
            <div className="flex flex-wrap gap-2">
              {QUICK_INSTALLMENTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={hasPayments}
                  onClick={() => { triggerHaptic(6); setInstallments(n); }}
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-60 ${
                    installments === n
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-[#F1F3F5] dark:bg-[#1E1E20] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {n === 1 ? 'À vista' : `${n}x`}
                </button>
              ))}
            </div>
            {total > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {installments === 1
                  ? `Pagamento único de ${formatCurrency(total)}`
                  : `${installments} parcelas de cerca de ${formatCurrency(perInstallment)}`}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">
              {installments === 1 ? 'Mês do pagamento' : 'Mês da 1ª parcela'}
            </label>
            <input
              type="month"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              disabled={hasPayments}
              className={`${inputClass} ${hasPayments ? 'opacity-60' : ''}`}
            />
            <span className="text-[11px] text-slate-400 block mt-1">
              {formatMonthDisplay(startMonth || currentMonth)}
            </span>
          </div>

          {hasPayments && (
            <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.04] rounded-xl p-3">
              Já existem parcelas pagas, então só a descrição pode ser alterada.
            </p>
          )}
        </form>
      </main>

      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-md border-t border-slate-100 dark:border-white/[0.06] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="submit"
          form="debt-form"
          disabled={!isValid}
          className="max-w-md w-full mx-auto block py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm disabled:opacity-40 active:scale-[0.98] transition-all cursor-pointer"
        >
          {editingDebt ? 'Salvar alterações' : 'Registrar dívida'}
        </button>
      </div>
    </div>,
    document.body
  );
}
