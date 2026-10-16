import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { z } from 'zod';
import { 
  ArrowLeft, 
  DollarSign, 
  Wallet,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Gift, 
  ShoppingBag, 
  CirclePlus,
  Coins,
  Zap,
  Calendar,
  CheckCircle2,
  Repeat,
  Sparkles,
  Check,
  ArrowRight,
  Delete,
  ChevronDown
} from 'lucide-react';

import { IncomeItem, IncomeCategory, WalletAccount } from '../types';
import { formatCurrency, formatMonthDisplay } from '../utils/financeCalculations';
import { triggerHaptic } from '../utils/haptics';
import { DatePickerInput } from './DatePickerInput';
import { Button } from './Button';
import { toLocalISODate, toLocalMonth } from '../utils/dateUtils';
import { BankLogo } from './BankLogo';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (income: Partial<IncomeItem>) => void;
  editingIncome?: IncomeItem | null;
  currentMonth: string;
  accounts?: WalletAccount[];
}

export const INCOME_CATEGORIES: {
  id: IncomeCategory;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  color: string;
  emoji?: string;
}[] = [
  { id: 'salario', name: 'Salário / Fixo', icon: Wallet, color: 'text-emerald-500', emoji: '' },
  { id: 'freelance', name: 'Freelance / Bicos', icon: BriefcaseBusiness, color: 'text-emerald-600 dark:text-emerald-400', emoji: '' },
  { id: 'investimentos', name: 'Rendimentos / Juros', icon: ChartNoAxesCombined, color: 'text-cyan-500', emoji: '' },
  { id: 'beneficios', name: 'Benefícios / VR / VA', icon: Gift, color: 'text-purple-500', emoji: '' },
  { id: 'vendas', name: 'Vendas / Desapegos', icon: ShoppingBag, color: 'text-amber-500', emoji: '' },
  { id: 'outros', name: 'Outras Entradas', icon: CirclePlus, color: 'text-slate-500', emoji: '' },
];

const incomeSchema = z.object({
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

export function AddIncomeModal({
  isOpen,
  onClose,
  onSave,
  editingIncome,
  currentMonth,
  accounts = [],
}: AddIncomeModalProps) {
  // Step navigation: 1 = Valor & Frequência, 2 = Detalhes & Categoria
  const [step, setStep] = useState<1 | 2>(1);

  // Keypad & Amount in Cents
  const [amountCents, setAmountCents] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IncomeCategory>('salario');
  const [type, setType] = useState<'fixa' | 'unica'>('fixa');
  const [date, setDate] = useState(`${currentMonth}-05`);
  const [received, setReceived] = useState(true);
  const [accountId, setAccountId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    }
    if (isCategoryMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCategoryMenuOpen]);

  const numericAmount = amountCents / 100;

  useEffect(() => {
    if (isOpen) {
      setIsCategoryMenuOpen(false);
      const today = new Date();
      const currentYearMonth = toLocalMonth(today);
      const defaultDate = currentMonth === currentYearMonth 
        ? toLocalISODate(today) 
        : `${currentMonth}-05`;

      const defaultAccountId = editingIncome?.accountId || (accounts.length > 0 ? accounts[0].id : '');

      if (editingIncome) {
        setAmountCents(Math.round((editingIncome.amount || 0) * 100));
        setDescription(editingIncome.description || '');
        setCategory(editingIncome.category || 'salario');
        setType(editingIncome.type || 'fixa');
        setDate(editingIncome.date || defaultDate);
        setReceived(editingIncome.received ?? true);
        setAccountId(defaultAccountId);
        setNotes(editingIncome.notes || '');
        setStep(1);
        setErrors({});
      } else {
        setAmountCents(0);
        setDescription('');
        setCategory('salario');
        setType('fixa');
        setDate(defaultDate);
        setReceived(true);
        setAccountId(defaultAccountId);
        setNotes('');
        setStep(1);
        setErrors({});
      }
    }
  }, [editingIncome, isOpen, currentMonth, accounts]);

  // Handle Keypad presses for Step 1
  const handleKeypadPress = (key: string) => {
    triggerHaptic(8);
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
    if (key === 'backspace') {
      setAmountCents((prev) => Math.floor(prev / 10));
    } else if (key === 'clear') {
      setAmountCents(0);
    } else {
      const digit = parseInt(key, 10);
      if (!isNaN(digit)) {
        setAmountCents((prev) => {
          if (prev > 99999999) return prev;
          return prev * 10 + digit;
        });
      }
    }
  };

  // Keyboard navigation
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
          if (numericAmount > 0) {
            triggerHaptic(12);
            setStep(2);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, numericAmount, onClose]);

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

  const handleContinueToStep2 = () => {
    if (numericAmount <= 0) {
      triggerHaptic(20);
      setErrors((prev) => ({ ...prev, amount: 'O valor deve ser maior que zero' }));
      return;
    }
    triggerHaptic(10);
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = incomeSchema.safeParse({
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
    const monthYear = date.slice(0, 7) || currentMonth;

    onSave({
      id: editingIncome?.id,
      description: finalDesc,
      amount: numericAmount,
      category,
      type,
      monthYear,
      date,
      received,
      receivedDate: received ? (editingIncome?.receivedDate || date) : undefined,
      notes: notes.trim() || undefined,
      accountId: accountId || (accounts && accounts.length > 0 ? accounts[0].id : undefined),
    });

    onClose();
  };

  const selectedCategoryObj = INCOME_CATEGORIES.find(c => c.id === category) || INCOME_CATEGORIES[0];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="add-income-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[200] bg-slate-950/60 dark:bg-black/80 backdrop-blur-md flex flex-col items-center justify-end sm:justify-center overflow-hidden"
        >
          <motion.div
            key="add-income-modal-panel"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: '0%' }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 32,
              mass: 0.85
            }}
            style={{ overscrollBehavior: 'contain' }}
            className="w-full h-[100dvh] sm:h-[94vh] sm:max-h-[920px] sm:max-w-2xl bg-slate-100 dark:bg-[#09090B] sm:rounded-[32px] sm:border sm:border-slate-200/60 dark:sm:border-white/[0.08] sm:shadow-2xl flex flex-col text-slate-900 dark:text-slate-100 overflow-y-auto select-none"
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
              {editingIncome ? 'Editar Renda' : 'Nova Entrada / Renda'}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {step === 1 ? 'Etapa 1 de 2 • Valor & Frequência' : 'Etapa 2 de 2 • Detalhes & Categoria'}
            </p>
          </div>
        </div>

        {/* Progress Indicator Pill */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#2C2C2E] px-3 py-1.5 rounded-full">
          <span className={`w-2 h-2 rounded-full transition-all ${step === 1 ? 'bg-emerald-500 w-5' : 'bg-emerald-500/40'}`} />
          <span className={`w-2 h-2 rounded-full transition-all ${step === 2 ? 'bg-emerald-500 w-5' : 'bg-slate-300 dark:bg-slate-600'}`} />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-between">
        
        {/* ========================================================================= */}
        {/* ETAPA 1: VALOR E FREQUÊNCIA (Design Moderno em Tela Cheia)               */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-5">
            
            {/* Income Type Capsule (Inspirado no bloco "Duration" da Imagem) */}
            <div className="bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Frequência da Entrada
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setType('fixa'); triggerHaptic(8); }}
                  className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-center ${
                    type === 'fixa'
                      ? 'border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'bg-slate-100 dark:bg-[#2C2C2E] text-slate-600 dark:text-slate-400 hover:bg-slate-200/70'
                  }`}
                >
                  <div className="font-bold">Recorrente Mensal</div>
                  <div className="text-[10px] font-normal opacity-80">Salário / Renda Fixa</div>
                </button>

                <button
                  type="button"
                  onClick={() => { setType('unica'); triggerHaptic(8); }}
                  className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-center ${
                    type === 'unica'
                      ? 'border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'bg-slate-100 dark:bg-[#2C2C2E] text-slate-600 dark:text-slate-400 hover:bg-slate-200/70'
                  }`}
                >
                  <div className="font-bold">Entrada Pontual</div>
                  <div className="text-[10px] font-normal opacity-80">Freela / Venda / Bônus</div>
                </button>
              </div>
            </div>

            {/* Big Amount Display (Hero Value Center) */}
            <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xs text-center space-y-3">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Valor da Entrada
              </span>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(numericAmount)}
              </h1>
              {errors.amount && (
                <p className="text-rose-500 text-xs mt-1 text-center">{errors.amount}</p>
              )}

              {/* Quick Amount Preset Chips */}
              <div className="flex items-center justify-center flex-wrap gap-1.5 pt-1">
                {[
                  { label: '+R$ 100', add: 10000 },
                  { label: '+R$ 500', add: 50000 },
                  { label: '+R$ 1.000', add: 100000 },
                  { label: '+R$ 2.500', add: 250000 },
                  { label: '+R$ 5.000', add: 500000 },
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

            {/* Action in Step 1: Single Confirm Button leading to Entry Summary */}
            <div className="pt-2">
              <Button
                id="btn-add-income-confirm-step1"
                disabled={numericAmount <= 0}
                onClick={handleContinueToStep2}
                size="lg"
                fullWidth
                variant="primary"
                leftIcon={<Check size={18} className="stroke-[2.5]" />}
                rightIcon={<ArrowRight size={18} className="stroke-[2.5]" />}
              >
                Confirmar Entrada
              </Button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* ETAPA 2: DETALHES DA RENDA (Inspirado na 2ª Tela de Referência)          */}
        {/* ========================================================================= */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Reckoning / Resumo Financeiro */}
            <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.08]">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Resumo da Entrada
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
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Frequência</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {type === 'fixa' ? 'Recorrente Mensal' : 'Entrada Pontual'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Mês de Referência</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatMonthDisplay(date.slice(0, 7) || currentMonth)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/[0.08]">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Valor Total</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(numericAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Informações da Renda */}
            <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-4">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Detalhes da Entrada
              </span>

              {/* 1. Descrição & Sugestões Rápidas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Descrição do Ganho (Opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                  }}
                  placeholder={`Ex: ${selectedCategoryObj.name}, Freela, Reembolso...`}
                  autoFocus
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-2xl text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                />
                {errors.description && (
                  <p className="text-rose-500 text-xs mt-1">{errors.description}</p>
                )}

                {/* Quick Title Suggestions */}
                <div className="flex items-center flex-wrap gap-1.5 mt-2">
                  {[
                    { label: 'Salário', cat: 'salario' as const, icon: Wallet },
                    { label: 'Freela', cat: 'freelance' as const, icon: BriefcaseBusiness },
                    { label: 'Renda Extra', cat: 'freelance' as const, icon: Coins },
                    { label: 'Rendimentos', cat: 'investimentos' as const, icon: ChartNoAxesCombined },
                    { label: 'Benefício / VR', cat: 'beneficios' as const, icon: Gift },
                    { label: 'Venda', cat: 'vendas' as const, icon: ShoppingBag },
                    { label: 'Pix Recebido', cat: 'outros' as const, icon: Zap },
                  ].map((sug) => {
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

              {/* 2. Categoria */}
              <div ref={categoryMenuRef} className="relative">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Categoria da Renda
                </label>
                <button
                  type="button"
                  id="category-menu-trigger"
                  onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-2xl text-slate-900 dark:text-white text-xs font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-emerald-600 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    {React.createElement(selectedCategoryObj.icon, {
                      size: 18,
                      strokeWidth: 1.8,
                      className: 'shrink-0 text-emerald-600 dark:text-emerald-400'
                    })}
                    <span>{selectedCategoryObj.name}</span>
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 ${isCategoryMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isCategoryMenuOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-white dark:bg-[#242426] border border-slate-200 dark:border-white/[0.12] rounded-2xl shadow-xl z-50 space-y-1">
                    {INCOME_CATEGORIES.map((c) => {
                      const Icon = c.icon;
                      const isSelected = c.id === category;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          id={`category-option-${c.id}`}
                          onClick={() => {
                            triggerHaptic(6);
                            setCategory(c.id);
                            setIsCategoryMenuOpen(false);
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-colors cursor-pointer text-left ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] font-medium'
                          }`}
                        >
                          <Icon size={18} strokeWidth={1.8} className="shrink-0 text-current" />
                          <span className="truncate">{c.name}</span>
                          {isSelected && (
                            <Check size={16} strokeWidth={2.2} className="ml-auto shrink-0 text-current" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Data Prevista / Recebida */}
              <div>
                <DatePickerInput
                  label="Data do Recebimento"
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

              {/* 4. Status de Recebimento */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-[#2C2C2E] rounded-2xl border border-slate-200 dark:border-white/[0.10]">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className={received ? 'text-emerald-500' : 'text-slate-400'} />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Já foi recebido?</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Marque se o dinheiro já está na conta</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={received}
                    onChange={(e) => setReceived(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* 4b. Conta para Depósito / Saldo */}
              {accounts && accounts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Conta para Depósito
                    </label>
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      {received ? 'Creditado no saldo' : 'Previsto'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {accounts.map((acc) => {
                      const isSelected = (accountId || accounts[0]?.id) === acc.id;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic(6);
                            setAccountId(acc.id);
                          }}
                          className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500/20'
                              : 'border-slate-200 dark:border-white/[0.10] bg-slate-50/50 dark:bg-[#2C2C2E]/50 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                          }`}
                        >
                          <BankLogo bankName={acc.institution || acc.name} size={24} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate leading-tight">{acc.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {formatCurrency(acc.currentBalance)}
                            </p>
                          </div>
                          {isSelected && (
                            <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. Observações */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Observações (opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Desconto de impostos, bônus de performance..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center gap-2.5 sm:gap-3">
              <Button
                variant="secondary"
                size="lg"
                className="w-24 sm:w-28 shrink-0"
                onClick={() => setStep(1)}
              >
                Voltar
              </Button>

              <Button
                type="submit"
                id="btn-save-income-final"
                size="lg"
                className="flex-1"
                leftIcon={<Check size={18} className="stroke-[2.5]" />}
              >
                Salvar Entrada
              </Button>
            </div>

          </form>
        )}

      </main>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
