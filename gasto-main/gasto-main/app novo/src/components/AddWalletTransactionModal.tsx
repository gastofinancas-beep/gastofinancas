import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { z } from 'zod';
import { todayLocalISO } from '../utils/dateUtils';
import { 
  ArrowLeft, 
  ArrowDownRight, 
  ArrowUpRight, 
  ArrowLeftRight, 
  Sliders, 
  QrCode, 
  CreditCard, 
  Banknote, 
  Calendar, 
  Clock, 
  Tag, 
  User, 
  Check, 
  ChevronDown,
  Delete,
  ArrowRight,
  Wallet,
  BriefcaseBusiness,
  Coins,
  ShoppingBag,
  RotateCcw,
  Zap,
  Utensils,
  ShoppingCart,
  Car,
  Fuel,
  Pill
} from 'lucide-react';

import { WalletAccount, WalletTransaction, WalletCategory } from '../types';
import { formatCurrency } from '../utils/financeCalculations';
import { BankLogo } from './BankLogo';
import { triggerHaptic } from '../utils/haptics';
import { DatePickerInput } from './DatePickerInput';
import { Button } from './Button';

interface AddWalletTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: WalletAccount[];
  onAddTransaction: (transaction: Omit<WalletTransaction, 'id' | 'createdAt'>, transferData?: { toAccountId: string }) => void;
  onAdjustBalance: (accountId: string, newBalance: number, notes?: string) => void;
  preselectedAccountId?: string;
  initialMode?: 'expense' | 'income' | 'transfer' | 'adjust';
}

const CATEGORIES: { id: WalletCategory; label: string }[] = [
  { id: 'alimentacao', label: 'Alimentação & Restaurante' },
  { id: 'mercado', label: 'Supermercado & Feira' },
  { id: 'transporte', label: 'Transporte & Mobilidade' },
  { id: 'combustivel', label: 'Combustível & Posto' },
  { id: 'moradia', label: 'Moradia & Contas' },
  { id: 'saude', label: 'Saúde & Farmácia' },
  { id: 'lazer', label: 'Lazer, Bar & Cinema' },
  { id: 'educacao', label: 'Educação & Cursos' },
  { id: 'compras', label: 'Compras & Vestuário' },
  { id: 'servicos', label: 'Serviços & Assinaturas' },
  { id: 'salario', label: 'Salário & Pró-labore' },
  { id: 'renda_extra', label: 'Renda Extra & Freela' },
  { id: 'outros', label: 'Outros Gastos' },
];

const walletTransactionSchema = z.object({
  description: z
    .string()
    .min(1, 'A descrição deve ter entre 1 e 100 caracteres')
    .max(100, 'A descrição deve ter no máximo 100 caracteres'),
  amount: z
    .number()
    .positive('O valor deve ser maior que zero'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'A data deve estar no formato AAAA-MM-DD'),
});

export function AddWalletTransactionModal({
  isOpen,
  onClose,
  accounts,
  onAddTransaction,
  onAdjustBalance,
  preselectedAccountId,
  initialMode = 'expense',
}: AddWalletTransactionModalProps) {
  // Step Navigation: 1 = Valor, Conta & Método, 2 = Descrição & Detalhes
  const [step, setStep] = useState<1 | 2>(1);

  const [activeMode, setActiveMode] = useState<'expense' | 'income' | 'transfer' | 'adjust'>(initialMode);
  
  // Keypad & Amount (in Cents for precision)
  const [amountCents, setAmountCents] = useState<number>(0);

  // Transaction fields
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<WalletCategory>('alimentacao');
  const [date, setDate] = useState(todayLocalISO());
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [recipientOrPayer, setRecipientOrPayer] = useState('');
  const [pixKeyUsed, setPixKeyUsed] = useState('');
  const [notes, setNotes] = useState('');
  const [expenseSubtype, setExpenseSubtype] = useState<'pix_out' | 'debito' | 'dinheiro_gasto'>('pix_out');
  const [incomeSubtype, setIncomeSubtype] = useState<'pix_in' | 'deposito'>('pix_in');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Account dropdown picker toggle
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  // Adjust balance field
  const [targetBalanceCents, setTargetBalanceCents] = useState<number>(0);

  // Calculate actual numeric amount from cents
  const numericAmount = amountCents / 100;
  const numericTargetBalance = targetBalanceCents / 100;

  useEffect(() => {
    if (isOpen) {
      setActiveMode(initialMode);
      setStep(1);
      setShowAccountPicker(false);

      const defaultAcc = preselectedAccountId 
        ? accounts.find(a => a.id === preselectedAccountId)
        : accounts.find(a => a.isDefault) || accounts[0];
      
      const defaultId = defaultAcc?.id || (accounts[0]?.id ?? '');
      setAccountId(defaultId);

      // Find secondary account for transfer
      const secondAcc = accounts.find(a => a.id !== defaultId);
      setToAccountId(secondAcc?.id || '');

      setAmountCents(0);
      setDescription('');
      setCategory(initialMode === 'income' ? 'salario' : 'alimentacao');
      setDate(todayLocalISO());
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      setRecipientOrPayer('');
      setPixKeyUsed('');
      setNotes('');
      setExpenseSubtype('pix_out');
      setIncomeSubtype('pix_in');
      setErrors({});

      if (defaultAcc) {
        setTargetBalanceCents(Math.round(defaultAcc.currentBalance * 100));
      }
    }
  }, [isOpen, initialMode, preselectedAccountId, accounts]);

  // Handle Keypad presses for Step 1
  const handleKeypadPress = (key: string) => {
    triggerHaptic(8);
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
    if (activeMode === 'adjust') {
      if (key === 'backspace') {
        setTargetBalanceCents((prev) => Math.floor(prev / 10));
      } else if (key === 'clear') {
        setTargetBalanceCents(0);
      } else {
        const digit = parseInt(key, 10);
        if (!isNaN(digit)) {
          setTargetBalanceCents((prev) => (prev > 99999999 ? prev : prev * 10 + digit));
        }
      }
      return;
    }

    if (key === 'backspace') {
      setAmountCents((prev) => Math.floor(prev / 10));
    } else if (key === 'clear') {
      setAmountCents(0);
    } else {
      const digit = parseInt(key, 10);
      if (!isNaN(digit)) {
        setAmountCents((prev) => (prev > 99999999 ? prev : prev * 10 + digit));
      }
    }
  };

  // Listen to physical keyboard on Step 1
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (step === 1) {
        if (e.key >= '0' && e.key <= '9') {
          handleKeypadPress(e.key);
        } else if (e.key === 'Backspace') {
          handleKeypadPress('backspace');
        } else if (e.key === 'Enter') {
          if (numericAmount > 0 || activeMode === 'adjust') {
            handleContinueToStep2();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, numericAmount, activeMode, onClose]);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const currentAccount = accounts.find(a => a.id === accountId);
  const targetAccount = accounts.find(a => a.id === toAccountId);


  // Advance to Step 2
  const handleContinueToStep2 = () => {
    if (activeMode !== 'adjust' && numericAmount <= 0) {
      triggerHaptic(20);
      setErrors((prev) => ({ ...prev, amount: 'O valor deve ser maior que zero' }));
      return;
    }
    triggerHaptic(10);
    setStep(2);
  };

  // Final Submit
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeMode === 'adjust') {
      if (!accountId) return;
      triggerHaptic(12);
      onAdjustBalance(accountId, numericTargetBalance, notes || 'Ajuste manual de saldo');
      onClose();
      return;
    }

    const result = walletTransactionSchema.safeParse({
      description: description.trim(),
      amount: numericAmount,
      date,
    });

    if (!result.success) {
      triggerHaptic(20);
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field && !fieldErrors[field as string]) {
          fieldErrors[field as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    triggerHaptic(15);
    const finalDesc = description.trim();

    if (activeMode === 'transfer') {
      if (!toAccountId || toAccountId === accountId) return;
      onAddTransaction(
        {
          accountId,
          type: 'transferencia_saida',
          amount: numericAmount,
          description: finalDesc,
          category: 'transferencia',
          date,
          time,
          recipientOrPayer: targetAccount?.name,
          toAccountId,
          notes: notes.trim() || undefined,
        },
        { toAccountId }
      );
      onClose();
      return;
    }

    if (activeMode === 'expense') {
      onAddTransaction({
        accountId,
        type: expenseSubtype,
        amount: numericAmount,
        description: finalDesc,
        category,
        date,
        time,
        recipientOrPayer: recipientOrPayer.trim() || undefined,
        pixKeyUsed: pixKeyUsed.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
      return;
    }

    if (activeMode === 'income') {
      onAddTransaction({
        accountId,
        type: incomeSubtype,
        amount: numericAmount,
        description: finalDesc,
        category: category === 'alimentacao' ? 'salario' : category,
        date,
        time,
        recipientOrPayer: recipientOrPayer.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
      return;
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[200] bg-slate-100 dark:bg-[#09090B] overflow-y-auto flex flex-col w-full h-full min-h-screen"
    >
      
      {/* Full-Screen Header with Circular Back Button */}
      <header className="sticky top-0 z-30 bg-white dark:bg-[#1C1C1E] border-b border-slate-200 dark:border-white/[0.08] px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (step === 2) {
                setStep(1);
                triggerHaptic(8);
              } else {
                onClose();
              }
            }}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
            title={step === 2 ? "Voltar para valor" : "Voltar"}
          >
            <ArrowLeft size={18} className="stroke-[2.5]" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {activeMode === 'expense' && 'Registrar Saída (Conta)'}
              {activeMode === 'income' && 'Registrar Entrada (Conta)'}
              {activeMode === 'transfer' && 'Transferir entre Contas'}
              {activeMode === 'adjust' && 'Ajustar Saldo Real'}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {step === 1 ? 'Etapa 1 de 2 • Valor, Conta & Método' : 'Etapa 2 de 2 • Detalhes & Categoria'}
            </p>
          </div>
        </div>

        {/* Progress Indicator Pill */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#2C2C2E] px-3 py-1.5 rounded-full">
          <span className={`w-2 h-2 rounded-full transition-all ${step === 1 ? 'bg-emerald-600 dark:bg-emerald-400 w-5' : 'bg-emerald-500'}`} />
          <span className={`w-2 h-2 rounded-full transition-all ${step === 2 ? 'bg-emerald-600 dark:bg-emerald-400 w-5' : 'bg-slate-300 dark:bg-slate-600'}`} />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-between">
        
        {/* ========================================================================= */}
        {/* ETAPA 1: VALOR, CONTA E TECLADO NUMÉRICO                                 */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-4 sm:space-y-5">
            
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-white dark:bg-[#1C1C1E] rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xs">
              <button
                type="button"
                onClick={() => { setActiveMode('expense'); triggerHaptic(6); }}
                className={`py-2.5 px-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  activeMode === 'expense'
                    ? 'border-2 border-rose-500 bg-rose-50/70 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                <ArrowDownRight size={14} />
                <span>Saída</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveMode('income'); triggerHaptic(6); }}
                className={`py-2.5 px-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  activeMode === 'income'
                    ? 'border-2 border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                <ArrowUpRight size={14} />
                <span>Entrada</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveMode('transfer'); triggerHaptic(6); }}
                className={`py-2.5 px-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  activeMode === 'transfer'
                    ? 'border-2 border-blue-500 bg-blue-50/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                <ArrowLeftRight size={14} />
                <span>Transferir</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveMode('adjust'); triggerHaptic(6); }}
                className={`py-2.5 px-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  activeMode === 'adjust'
                    ? 'border-2 border-amber-500 bg-amber-50/70 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                <Sliders size={14} />
                <span>Ajuste</span>
              </button>
            </div>

            {/* Account Capsule */}
            <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xs relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  {activeMode === 'expense' ? 'Conta de Saída' : activeMode === 'income' ? 'Conta de Entrada' : 'Conta de Origem'}
                </span>
                <span className="text-xs font-normal text-slate-500 text-slate-500 dark:text-slate-400">
                  Opcional
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowAccountPicker(!showAccountPicker)}
                className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-2xl transition-all cursor-pointer select-none"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#2C2C2E] flex items-center justify-center p-2 shrink-0">
                    {currentAccount ? (
                      <BankLogo bankName={currentAccount?.institution || currentAccount?.name} size={34} />
                    ) : (
                      <Wallet size={24} className="text-slate-400" />
                    )}
                  </div>
                  <div className="text-left truncate">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                      {currentAccount?.name || 'Nenhuma conta selecionada'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {currentAccount ? (
                        <>Saldo Atual: <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(currentAccount.currentBalance)}</span></>
                      ) : (
                        'Sem vínculo de conta bancária'
                      )}
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#2C2C2E] flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                  <ChevronDown size={16} className={`transition-transform duration-200 ${showAccountPicker ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Dropdown Account Picker */}
              {showAccountPicker && (
                <div className="mt-3 p-1.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-2xl shadow-lg max-h-56 overflow-y-auto space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountId('');
                      setShowAccountPicker(false);
                      triggerHaptic(8);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer ${
                      !accountId
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'hover:bg-white dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-[#3A3A3C] flex items-center justify-center text-slate-500 shrink-0">
                        <Wallet size={16} />
                      </div>
                      <div className="text-left truncate">
                        <p className="text-xs font-bold truncate">Nenhuma conta</p>
                        <p className="text-[10px] text-slate-400">Não vincular a saldo bancário</p>
                      </div>
                    </div>
                    {!accountId && <Check size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </button>

                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        setAccountId(acc.id);
                        setShowAccountPicker(false);
                        triggerHaptic(8);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer ${
                        accountId === acc.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'hover:bg-white dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <BankLogo bankName={acc.institution || acc.name} size={28} />
                        <div className="text-left truncate">
                          <p className="text-xs font-bold truncate">{acc.name}</p>
                          <p className="text-[10px] text-slate-400">Saldo: {formatCurrency(acc.currentBalance)}</p>
                        </div>
                      </div>
                      {accountId === acc.id && <Check size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subtypes Selector Pills */}
            {activeMode === 'expense' && (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { setExpenseSubtype('pix_out'); triggerHaptic(6); }}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    expenseSubtype === 'pix_out'
                      ? 'border-2 border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'bg-white dark:bg-[#1C1C1E] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <QrCode size={14} className="text-emerald-500" />
                  <span>Pix</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setExpenseSubtype('debito'); triggerHaptic(6); }}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    expenseSubtype === 'debito'
                      ? 'border-2 border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-xs'
                      : 'bg-white dark:bg-[#1C1C1E] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <CreditCard size={14} className="text-blue-500" />
                  <span>Débito</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setExpenseSubtype('dinheiro_gasto'); triggerHaptic(6); }}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    expenseSubtype === 'dinheiro_gasto'
                      ? 'border-2 border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 shadow-xs'
                      : 'bg-white dark:bg-[#1C1C1E] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Banknote size={14} className="text-teal-500" />
                  <span>Dinheiro</span>
                </button>
              </div>
            )}

            {activeMode === 'income' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setIncomeSubtype('pix_in'); triggerHaptic(6); }}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    incomeSubtype === 'pix_in'
                      ? 'border-2 border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'bg-white dark:bg-[#1C1C1E] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <QrCode size={14} className="text-emerald-500" />
                  <span>Pix Recebido</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setIncomeSubtype('deposito'); triggerHaptic(6); }}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    incomeSubtype === 'deposito'
                      ? 'border-2 border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'bg-white dark:bg-[#1C1C1E] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <ArrowUpRight size={14} className="text-indigo-500" />
                  <span>Depósito / Salário</span>
                </button>
              </div>
            )}

            {/* Big Amount Display */}
            <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xs text-center space-y-3">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {activeMode === 'expense' && 'Valor a Pagar / Retirar'}
                {activeMode === 'income' && 'Valor a Receber / Entrada'}
                {activeMode === 'transfer' && 'Valor da Transferência'}
                {activeMode === 'adjust' && 'Novo Saldo Real'}
              </span>

              <h1 className={`text-4xl sm:text-5xl font-bold tracking-tight tabular-nums ${
                activeMode === 'expense' ? 'text-rose-600 dark:text-rose-400' :
                activeMode === 'income' ? 'text-emerald-600 dark:text-emerald-400' :
                activeMode === 'transfer' ? 'text-blue-600 dark:text-blue-400' :
                'text-amber-600 dark:text-amber-400'
              }`}>
                {formatCurrency(activeMode === 'adjust' ? numericTargetBalance : numericAmount)}
              </h1>
              {errors.amount && (
                <p className="text-rose-500 text-xs mt-1 text-center">{errors.amount}</p>
              )}

              {/* Quick Amount Preset Chips */}
              {activeMode !== 'adjust' && (
                <div className="flex items-center justify-center flex-wrap gap-1.5 pt-1">
                  {[
                    { label: '+R$ 50', add: 5000 },
                    { label: '+R$ 100', add: 10000 },
                    { label: '+R$ 500', add: 50000 },
                    { label: '+R$ 1.000', add: 100000 },
                    { label: '+R$ 2.500', add: 250000 },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        triggerHaptic(8);
                        setAmountCents(prev => Math.min(prev + chip.add, 99999999));
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#2C2C2E] hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 text-[11px] font-bold text-slate-600 dark:text-slate-300 transition-colors active:scale-95 cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'backspace'].map((key) => {
                if (key === 'backspace') {
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKeypadPress('backspace')}
                      className="h-12 sm:h-14 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.04] active:scale-95 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer shadow-xs"
                      title="Apagar dígito"
                    >
                      <Delete size={22} className="stroke-[2.2]" />
                    </button>
                  );
                }

                if (key === 'clear') {
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKeypadPress('clear')}
                      className="h-12 sm:h-14 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.04] active:scale-95 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xs transition-all cursor-pointer uppercase tracking-wider shadow-xs"
                      title="Limpar valor"
                    >
                      Limpar
                    </button>
                  );
                }

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    className="h-12 sm:h-14 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.04] active:scale-95 flex items-center justify-center text-slate-900 dark:text-white font-bold text-xl transition-all cursor-pointer select-none shadow-xs"
                  >
                    {key}
                  </button>
                );
              })}
            </div>

            {/* Actions in Step 1: Single Confirm Button that Advances to Step 2 for Details */}
            <div className="pt-2">
              <Button
                type="button"
                id="btn-wallet-tx-confirm-step1"
                disabled={activeMode === 'adjust' ? !accountId : (activeMode === 'transfer' ? (!accountId || !toAccountId || numericAmount <= 0) : numericAmount <= 0)}
                onClick={handleContinueToStep2}
                size="lg"
                fullWidth
                variant={activeMode === 'expense' ? 'danger' : 'primary'}
                className={
                  activeMode === 'transfer' ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800' :
                  activeMode === 'adjust' ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800' :
                  undefined
                }
                leftIcon={<Check size={18} className="stroke-[2.5]" />}
                rightIcon={<ArrowRight size={18} className="stroke-[2.5]" />}
              >
                {activeMode === 'income' ? 'Confirmar Entrada' :
                 activeMode === 'expense' ? 'Confirmar Saída' :
                 activeMode === 'transfer' ? 'Confirmar Transferência' :
                 'Confirmar Ajuste'}
              </Button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* ETAPA 2: DESCRIÇÃO, CATEGORIA E DETALHES                                  */}
        {/* ========================================================================= */}
        {step === 2 && (
          <form onSubmit={handleFinalSubmit} className="space-y-5">
            
            {/* Resumo Financeiro da Conta e Valor */}
            <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.08]">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Resumo da Transação
                </span>
                <button
                  type="button"
                  onClick={() => { setStep(1); triggerHaptic(8); }}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Alterar Valor
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Conta</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {currentAccount ? (
                      <>
                        <BankLogo bankName={currentAccount.institution || currentAccount.name} size={18} />
                        {currentAccount.name}
                      </>
                    ) : (
                      <>
                        <Wallet size={16} className="text-slate-400" />
                        <span className="text-slate-400 font-medium">Sem conta vinculada</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Tipo de Operação</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {activeMode === 'expense' ? `Saída via ${expenseSubtype === 'pix_out' ? 'Pix' : expenseSubtype === 'debito' ? 'Débito' : 'Dinheiro'}` :
                     activeMode === 'income' ? `Entrada via ${incomeSubtype === 'pix_in' ? 'Pix' : 'Depósito'}` :
                     activeMode === 'transfer' ? `Transferência para ${targetAccount?.name || 'outra conta'}` : 'Ajuste de Saldo'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/[0.08]">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Valor Total</span>
                  <span className={`text-base font-bold tabular-nums ${
                    activeMode === 'expense' ? 'text-rose-600 dark:text-rose-400' :
                    activeMode === 'income' ? 'text-emerald-600 dark:text-emerald-400' :
                    activeMode === 'transfer' ? 'text-blue-600 dark:text-blue-400' :
                    'text-amber-600 dark:text-amber-400'
                  }`}>
                    {formatCurrency(activeMode === 'adjust' ? numericTargetBalance : numericAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Informações da Transação */}
            <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-4">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Detalhes da Transação
              </span>

              {/* Se Transferência: Conta Destino */}
              {activeMode === 'transfer' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Conta de Destino (Receberá o valor) *
                  </label>
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-2xl text-slate-900 dark:text-white text-sm font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {accounts.filter(a => a.id !== accountId).map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} — Saldo: {formatCurrency(acc.currentBalance)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Descrição & Sugestões */}
              {activeMode !== 'adjust' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Descrição da Transação (Opcional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                    }}
                    placeholder={
                      activeMode === 'expense' ? 'Ex: Almoço no Restaurante, Uber, Padaria...' :
                      activeMode === 'income' ? 'Ex: Pagamento Freela, Salário, Reembolso...' :
                      'Ex: Transferência para Poupança...'
                    }
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-2xl text-slate-900 dark:text-white text-base sm:text-sm font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                  />
                  {errors.description && (
                    <p className="text-rose-500 text-xs mt-1">{errors.description}</p>
                  )}

                  {/* Quick Suggestions Chips */}
                  <div className="flex items-center flex-wrap gap-1.5 mt-2">
                    {(activeMode === 'income' ? [
                      { label: 'Pix Recebido', cat: 'outros' as const, icon: Zap },
                      { label: 'Salário', cat: 'salario' as const, icon: Wallet },
                      { label: 'Renda Extra', cat: 'renda_extra' as const, icon: Coins },
                      { label: 'Freela', cat: 'renda_extra' as const, icon: BriefcaseBusiness },
                      { label: 'Venda', cat: 'compras' as const, icon: ShoppingBag },
                      { label: 'Reembolso', cat: 'outros' as const, icon: RotateCcw },
                    ] : [
                      { label: 'Alimentação / Lanche', cat: 'alimentacao' as const, icon: Utensils },
                      { label: 'Mercado / Compras', cat: 'mercado' as const, icon: ShoppingCart },
                      { label: 'Uber / Transporte', cat: 'transporte' as const, icon: Car },
                      { label: 'Combustível', cat: 'transporte' as const, icon: Fuel },
                      { label: 'Farmácia / Saúde', cat: 'saude' as const, icon: Pill },
                      { label: 'Pix Transferido', cat: 'outros' as const, icon: Zap },
                    ]).map((sug) => {
                      const SugIcon = sug.icon;
                      return (
                        <button
                          key={sug.label}
                          type="button"
                          onClick={() => {
                            triggerHaptic(6);
                            setDescription(sug.label);
                            setCategory(sug.cat);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#2C2C2E]/80 hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <SugIcon size={13} strokeWidth={1.8} className="shrink-0 text-current" />
                          <span>{sug.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Categoria */}
              {activeMode !== 'adjust' && activeMode !== 'transfer' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Tag size={14} className="text-amber-500" />
                    <span>Categoria</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as WalletCategory)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-2xl text-slate-900 dark:text-white text-base sm:text-xs font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {activeMode === 'income' ? (
                      <>
                        <option value="salario">Salário / Empresa</option>
                        <option value="renda_extra">Renda Extra / Freela</option>
                        <option value="compras">Vendas & Desapegos</option>
                        <option value="outros">Outra Entrada</option>
                      </>
                    ) : (
                      CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}

              {/* Destinatário / Pagador */}
              {activeMode !== 'adjust' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {activeMode === 'income' ? 'Quem enviou / Pagador' : 'Estabelecimento / Favorecido'}
                    </label>
                    <input
                      type="text"
                      value={recipientOrPayer}
                      onChange={(e) => setRecipientOrPayer(e.target.value)}
                      placeholder={activeMode === 'income' ? 'Ex: Cliente João, Empresa...' : 'Ex: Padaria Bella, Posto Ipiranga...'}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-2xl text-slate-900 dark:text-white text-base sm:text-xs outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  {activeMode === 'expense' && expenseSubtype === 'pix_out' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Chave Pix utilizada
                      </label>
                      <input
                        type="text"
                        value={pixKeyUsed}
                        onChange={(e) => setPixKeyUsed(e.target.value)}
                        placeholder="CPF, e-mail, telefone..."
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-2xl text-slate-900 dark:text-white text-base sm:text-xs outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Data & Horário */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <DatePickerInput
                    label="Data"
                    value={date}
                    onChange={(newDate) => {
                      setDate(newDate);
                      if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                    }}
                  />
                  {errors.date && (
                    <p className="text-rose-500 text-xs mt-1">{errors.date}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock size={14} className="text-blue-500" />
                    <span>Horário</span>
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-2xl text-slate-900 dark:text-white text-base sm:text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Observações (opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Comprovante salvo, almoço de trabalho..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-2xl text-slate-900 dark:text-white text-base sm:text-xs outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center gap-2.5 sm:gap-3">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-24 sm:w-28 shrink-0"
                onClick={() => setStep(1)}
              >
                Voltar
              </Button>

              <Button
                type="submit"
                id="btn-wallet-tx-save"
                size="lg"
                className={`flex-1 ${
                  activeMode === 'transfer' ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800' :
                  activeMode === 'adjust' ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800' : ''
                }`}
                variant={activeMode === 'expense' ? 'danger' : 'primary'}
                leftIcon={<Check size={18} className="stroke-[2.5]" />}
              >
                {activeMode === 'expense' && 'Confirmar Saída'}
                {activeMode === 'income' && 'Confirmar Entrada'}
                {activeMode === 'transfer' && 'Confirmar Transferência'}
                {activeMode === 'adjust' && 'Salvar Saldo'}
              </Button>
            </div>

          </form>
        )}

      </main>
    </div>,
    document.body
  );
}
