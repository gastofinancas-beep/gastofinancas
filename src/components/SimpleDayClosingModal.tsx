import React, { useState } from 'react';
import { Sparkles, Calendar, Wallet, Check, X, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WalletAccount } from '../types';
import { formatCurrency } from '../utils/financeCalculations';
import { DatePickerInput } from './DatePickerInput';
import { todayLocalISO } from '../utils/dateUtils';

interface SimpleDayClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: WalletAccount[];
  title: string;
  subtitle: string;
  incomeLabel?: string;
  expenseLabel?: string;
  defaultIncomeCategory?: string;
  defaultExpenseCategory?: string;
  onSave: (data: {
    income: number;
    expense: number;
    incomeDescription: string;
    expenseDescription: string;
    date: string;
    accountId?: string;
  }) => void;
}

export function SimpleDayClosingModal({
  isOpen,
  onClose,
  accounts,
  title,
  subtitle,
  incomeLabel = "Quanto entrou hoje (Ganhos)",
  expenseLabel = "Quanto gastou hoje (Despesas)",
  defaultIncomeCategory = "Ganhos do dia",
  defaultExpenseCategory = "Gastos do dia",
  onSave,
}: SimpleDayClosingModalProps) {
  const [date, setDate] = useState(() => todayLocalISO());
  const [accountId, setAccountId] = useState<string>(() => accounts[0]?.id || '');
  const [incomeInput, setIncomeInput] = useState('');
  const [expenseInput, setExpenseInput] = useState('');
  const [incomeNotes, setIncomeNotes] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');

  if (!isOpen) return null;

  const parseVal = (val: string): number => {
    if (!val) return 0;
    const clean = parseFloat(val.replace(/\./g, '').replace(',', '.'));
    return isNaN(clean) ? 0 : Math.max(0, clean);
  };

  const incomeAmount = parseVal(incomeInput);
  const expenseAmount = parseVal(expenseInput);
  const netAmount = incomeAmount - expenseAmount;

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (incomeAmount === 0 && expenseAmount === 0) return;

    onSave({
      income: incomeAmount,
      expense: expenseAmount,
      incomeDescription: incomeNotes.trim() || defaultIncomeCategory,
      expenseDescription: expenseNotes.trim() || defaultExpenseCategory,
      date,
      accountId: accountId || undefined,
    });

    // Reset and close
    setIncomeInput('');
    setExpenseInput('');
    setIncomeNotes('');
    setExpenseNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden flex flex-col z-10"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleQuickSubmit} className="p-5 sm:p-6 space-y-4 sm:space-y-5">
          {/* Quick Date & Account bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <DatePickerInput
                label="Data do Fechamento"
                value={date}
                onChange={newDate => setDate(newDate)}
              />
            </div>

            {accounts.length > 0 && (
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Conta da Carteira
                </label>
                <div className="relative">
                  <Wallet size={14} className="absolute left-3 top-3 text-slate-400" />
                  <select
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 truncate cursor-pointer"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {acc.name} ({formatCurrency(acc.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Income Box */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-500/5 border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <ArrowUpRight size={16} className="stroke-[2.5]" />
                {incomeLabel}
              </label>
              <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase">
                Entrada
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 sm:top-3 text-base sm:text-lg font-bold text-emerald-600/70">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={incomeInput}
                onChange={e => setIncomeInput(e.target.value)}
                autoFocus
                className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl border border-emerald-500/30 bg-white dark:bg-[#1C1C1E] text-lg sm:text-xl font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-300 dark:placeholder:text-white/20"
              />
            </div>

            <input
              type="text"
              placeholder="Identificação opcional (ex: Uber + 99, Site cliente X, etc)"
              value={incomeNotes}
              onChange={e => setIncomeNotes(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-transparent hover:border-emerald-500/20 focus:border-emerald-500/40 bg-white/60 dark:bg-white/5 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
            />
          </div>

          {/* Expense Box */}
          <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-500/5 border border-rose-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <ArrowDownRight size={16} className="stroke-[2.5]" />
                {expenseLabel}
              </label>
              <span className="text-[10px] font-bold text-rose-600/70 dark:text-rose-400/70 uppercase">
                Saída
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 sm:top-3 text-base sm:text-lg font-bold text-rose-600/70">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={expenseInput}
                onChange={e => setExpenseInput(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl border border-rose-500/30 bg-white dark:bg-[#1C1C1E] text-lg sm:text-xl font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 placeholder:text-slate-300 dark:placeholder:text-white/20"
              />
            </div>

            <input
              type="text"
              placeholder="Identificação opcional (ex: Gasolina R$80 + Almoço R$25, etc)"
              value={expenseNotes}
              onChange={e => setExpenseNotes(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-transparent hover:border-rose-500/20 focus:border-rose-500/40 bg-white/60 dark:bg-white/5 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
            />
          </div>

          {/* Net Profit Preview Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white dark:bg-white/5 border border-slate-800 dark:border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Resultado do Dia
              </span>
              <span className="text-xs text-slate-400">
                Quanto sobra limpo no bolso
              </span>
            </div>
            <div className="text-right">
              <span className={`text-lg sm:text-xl font-bold tabular-nums ${netAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(netAmount)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={incomeAmount === 0 && expenseAmount === 0}
              className="w-2/3 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Check size={18} className="stroke-[3]" />
              <span>Concluir Fechamento</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
