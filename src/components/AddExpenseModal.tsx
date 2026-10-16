import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { z } from 'zod';
import { 
  ArrowLeft, 
  CreditCard as CardIcon, 
  User, 
  Calendar, 
  Tag, 
  ChevronDown, 
  Delete, 
  Check, 
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  Layers,
  Sliders,
  Calculator,
  Plus,
  Minus,
  X,
  ChevronRight,
  Clock,
  Utensils,
  ShoppingCart,
  Car,
  Fuel,
  HeartPulse,
  ShoppingBag,
  Plane,
  Home,
  Tv,
  Smartphone,
  GraduationCap,
  FileText,
  Coffee
} from 'lucide-react';

import { CreditCard, ExpenseItem, Person } from '../types';
import { BankLogo } from './BankLogo';
import { triggerHaptic } from '../utils/haptics';
import { formatCurrency, formatMonthDisplay, formatMonthShort, addMonths } from '../utils/financeCalculations';
import { DatePickerInput } from './DatePickerInput';
import { Button } from './Button';
import { toLocalISODate, toLocalMonth } from '../utils/dateUtils';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Partial<ExpenseItem>) => void;
  editingExpense: ExpenseItem | null;
  cards: CreditCard[];
  people: Person[];
  currentMonth: string;
  defaultPersonId?: string;
  defaultCardId?: string;
}

export const EXPENSE_CATEGORIES_LIST: {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  color: string;
}[] = [
  { id: 'alimentacao', label: 'Alimentação & Restaurante', icon: Utensils, color: 'text-amber-500' },
  { id: 'mercado', label: 'Supermercado & Feira', icon: ShoppingCart, color: 'text-emerald-500' },
  { id: 'transporte', label: 'Transporte & Mobilidade', icon: Car, color: 'text-blue-500' },
  { id: 'combustivel', label: 'Combustível & Posto', icon: Fuel, color: 'text-rose-500' },
  { id: 'saude', label: 'Saúde & Farmácia', icon: HeartPulse, color: 'text-pink-500' },
  { id: 'compras', label: 'Compras & Vestuário', icon: ShoppingBag, color: 'text-teal-500' },
  { id: 'lazer', label: 'Lazer & Viagem', icon: Plane, color: 'text-orange-500' },
  { id: 'moradia', label: 'Moradia & Casa', icon: Home, color: 'text-purple-500' },
  { id: 'servicos', label: 'Assinaturas & Serviços', icon: Tv, color: 'text-cyan-500' },
  { id: 'eletronicos', label: 'Tecnologia & Celular', icon: Smartphone, color: 'text-indigo-500' },
  { id: 'educacao', label: 'Educação & Cursos', icon: GraduationCap, color: 'text-violet-500' },
  { id: 'outros', label: 'Outros / Diversos', icon: Tag, color: 'text-slate-400' },
];

export const EXPENSE_SUGGESTIONS = [
  { label: 'Almoço / Lanche', cat: 'alimentacao', icon: Utensils },
  { label: 'Supermercado', cat: 'mercado', icon: ShoppingCart },
  { label: 'Uber / Transporte', cat: 'transporte', icon: Car },
  { label: 'Combustível', cat: 'combustivel', icon: Fuel },
  { label: 'Farmácia', cat: 'saude', icon: HeartPulse },
  { label: 'Shopping', cat: 'compras', icon: ShoppingBag },
  { label: 'Assinatura', cat: 'servicos', icon: Tv },
  { label: 'Casa / Moradia', cat: 'moradia', icon: Home },
];

const expenseSchema = z.object({
  description: z
    .string()
    .min(1, 'A descrição deve ter entre 1 e 100 caracteres')
    .max(100, 'A descrição deve ter no máximo 100 caracteres'),
  amount: z
    .number()
    .positive('O valor deve ser maior que zero'),
  category: z
    .string()
    .min(1, 'A categoria é obrigatória'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'A data deve estar no formato AAAA-MM-DD'),
});

export function AddExpenseModal({
  isOpen,
  onClose,
  onSave,
  editingExpense,
  cards,
  people,
  currentMonth,
  defaultPersonId,
  defaultCardId,
}: AddExpenseModalProps) {
  // Step navigation: 1 = Valor, Cartão & Parcelamento, 2 = Detalhes (Descrição, Dono, Categoria)
  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [amountCents, setAmountCents] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('outros');
  const [type, setType] = useState<'unica' | 'parcelada' | 'fixa'>('unica');
  const [cardId, setCardId] = useState('');
  const [personId, setPersonId] = useState('');
  const [totalInstallments, setTotalInstallments] = useState(2);
  const [currentInstallment, setCurrentInstallment] = useState(1);
  const [startMonthYear, setStartMonthYear] = useState(currentMonth);
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [showAlreadyPaidPicker, setShowAlreadyPaidPicker] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const [isPersonMenuOpen, setIsPersonMenuOpen] = useState(false);
  const personMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
      if (personMenuRef.current && !personMenuRef.current.contains(event.target as Node)) {
        setIsPersonMenuOpen(false);
      }
    }
    if (isCategoryMenuOpen || isPersonMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCategoryMenuOpen, isPersonMenuOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsCategoryMenuOpen(false);
      setIsPersonMenuOpen(false);
    }
  }, [isOpen, step]);

  // Modo de inserção do valor no parcelado: 'per_installment' (valor da parcela) ou 'total_purchase' (valor total da compra)
  const [installmentAmountMode, setInstallmentAmountMode] = useState<'per_installment' | 'total_purchase'>('per_installment');

  // Swipe to go back / dismiss gesture state
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);

  // Keyboard shortcut: Esc to go back or close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCategoryMenuOpen) {
          setIsCategoryMenuOpen(false);
        } else if (isPersonMenuOpen) {
          setIsPersonMenuOpen(false);
        } else if (showInstallmentModal) {
          setShowInstallmentModal(false);
        } else if (showCardPicker) {
          setShowCardPicker(false);
        } else if (showAlreadyPaidPicker) {
          setShowAlreadyPaidPicker(false);
        } else if (step === 2) {
          setStep(1);
          triggerHaptic(6);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCategoryMenuOpen, isPersonMenuOpen, showInstallmentModal, showCardPicker, showAlreadyPaidPicker, step, onClose]);

  // Touch gesture handlers for sliding sideways (swipe right to go back/dismiss)
  const handleTouchStart = (e: React.TouchEvent) => {
    // Avoid triggering if nested pickers are open
    if (showInstallmentModal || showCardPicker || showAlreadyPaidPicker) return;
    if (e.touches.length !== 1) return;

    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartRef.current.x;
    const deltaY = currentY - touchStartRef.current.y;

    // Detect horizontal swipe from left to right (deltaX > 0)
    if (deltaX > 12 && deltaX > Math.abs(deltaY) * 1.15) {
      setIsSwiping(true);
      const maxDrag = typeof window !== 'undefined' ? window.innerWidth : 400;
      // Rubberband damping
      const damped = Math.min(maxDrag * 0.8, deltaX);
      setSwipeOffset(damped);
    } else if (Math.abs(deltaY) > deltaX) {
      if (!isSwiping) {
        touchStartRef.current = null;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) {
      setSwipeOffset(0);
      setIsSwiping(false);
      return;
    }

    const currentX = e.changedTouches[0]?.clientX ?? 0;
    const currentY = e.changedTouches[0]?.clientY ?? 0;
    const deltaX = currentX - touchStartRef.current.x;
    const deltaY = currentY - touchStartRef.current.y;
    const duration = Date.now() - touchStartRef.current.time;
    const isQuickFlick = deltaX > 45 && duration < 280 && deltaX > Math.abs(deltaY);
    const isPassedThreshold = deltaX > 75;

    if (isQuickFlick || isPassedThreshold) {
      triggerHaptic(12);
      if (step === 2) {
        setStep(1);
      } else {
        onClose();
      }
    }

    setSwipeOffset(0);
    setIsSwiping(false);
    touchStartRef.current = null;
  };

  // Calculate actual numeric amount from cents
  const numericAmount = amountCents / 100;

  // Cálculos dinâmicos de parcelas baseados no modo de inserção
  const effectiveInstallmentAmount = useMemo(() => {
    if (type !== 'parcelada' || totalInstallments <= 0) return numericAmount;
    if (installmentAmountMode === 'total_purchase') {
      return numericAmount / totalInstallments;
    }
    return numericAmount;
  }, [type, totalInstallments, numericAmount, installmentAmountMode]);

  const effectiveTotalAmount = useMemo(() => {
    if (type !== 'parcelada' || totalInstallments <= 0) return numericAmount;
    if (installmentAmountMode === 'total_purchase') {
      return numericAmount;
    }
    return numericAmount * totalInstallments;
  }, [type, totalInstallments, numericAmount, installmentAmountMode]);

  // Data de término das parcelas
  const endMonthYear = useMemo(() => {
    if (type !== 'parcelada' || totalInstallments <= 1) return startMonthYear;
    const remaining = Math.max(0, totalInstallments - currentInstallment);
    return addMonths(startMonthYear, remaining);
  }, [type, totalInstallments, currentInstallment, startMonthYear]);

  // Parcelas restantes a serem cobradas no app
  const remainingInstallmentsCount = useMemo(() => {
    if (type !== 'parcelada') return 1;
    return Math.max(1, totalInstallments - currentInstallment + 1);
  }, [type, totalInstallments, currentInstallment]);

  // Valor total restante das parcelas no app
  const remainingTotalAmount = useMemo(() => {
    return effectiveInstallmentAmount * remainingInstallmentsCount;
  }, [effectiveInstallmentAmount, remainingInstallmentsCount]);

  // Synchronize state on open or when editing
  useEffect(() => {
    if (isOpen) {
      if (editingExpense) {
        setAmountCents(Math.round((editingExpense.amount || 0) * 100));
        setDescription(editingExpense.description || '');
        setCategory(editingExpense.category || 'outros');
        setType(editingExpense.type || 'unica');
        setCardId(editingExpense.cardId || (cards[0]?.id || ''));
        const today = new Date();
        const currentYearMonth = toLocalMonth(today);
        const defaultDate = currentMonth === currentYearMonth 
          ? toLocalISODate(today) 
          : `${currentMonth}-01`;

        setPersonId(editingExpense.personId || (people[0]?.id || ''));
        setTotalInstallments(editingExpense.totalInstallments || 2);
        setCurrentInstallment(editingExpense.currentInstallment || 1);
        setStartMonthYear(editingExpense.startMonthYear || currentMonth);
        setDate(editingExpense.date || defaultDate);
        setNotes(editingExpense.notes || '');
        setStep(1);
        setInstallmentAmountMode('per_installment');
        setErrors({});
      } else {
        const today = new Date();
        const currentYearMonth = toLocalMonth(today);
        const defaultDate = currentMonth === currentYearMonth 
          ? toLocalISODate(today) 
          : `${currentMonth}-01`;

        setAmountCents(0);
        setDescription('');
        setCategory('outros');
        setType('unica');
        setCardId(defaultCardId || (cards[0]?.id || ''));
        setPersonId(defaultPersonId || (people[0]?.id || ''));
        setTotalInstallments(2);
        setCurrentInstallment(1);
        setStartMonthYear(currentMonth);
        setDate(defaultDate);
        setNotes('');
        setStep(1);
        setInstallmentAmountMode('per_installment');
        setErrors({});
      }
      setShowCardPicker(false);
      setShowInstallmentModal(false);
    }
  }, [isOpen, editingExpense, currentMonth, defaultPersonId, defaultCardId, cards, people]);

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

  // Listen to physical keyboard on Step 1
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showInstallmentModal) {
          setShowInstallmentModal(false);
          return;
        }
        if (showCardPicker) {
          setShowCardPicker(false);
          return;
        }
        onClose();
        return;
      }

      if (showInstallmentModal || showCardPicker) return;

      const target = e.target as HTMLElement | null;
      const isInputActive = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');

      if (isInputActive) {
        if (e.key === 'Enter' && step === 1 && numericAmount > 0) {
          handleContinueToStep2();
        }
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
  }, [isOpen, step, numericAmount, onClose, description, category, cardId, personId, type, totalInstallments, currentInstallment, startMonthYear, date, notes, showInstallmentModal, showCardPicker, installmentAmountMode]);

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

  const selectedCard = cards.find((c) => c.id === cardId) || cards[0];
  const selectedPerson = people.find((p) => p.id === personId) || people[0];
  const selectedCategoryObj = EXPENSE_CATEGORIES_LIST.find(
    (c) => c.id === (category || 'outros').toLowerCase().trim() || c.label.toLowerCase() === (category || 'outros').toLowerCase().trim()
  ) || EXPENSE_CATEGORIES_LIST.find((c) => c.id === 'outros') || EXPENSE_CATEGORIES_LIST[0];

  // Advance to Step 2
  const handleContinueToStep2 = () => {
    if (numericAmount <= 0) {
      triggerHaptic(20);
      setErrors((prev) => ({ ...prev, amount: 'O valor deve ser maior que zero' }));
      return;
    }
    triggerHaptic(10);
    setStep(2);
  };

  // Quick Direct Save from Step 1: salva o lançamento e finaliza diretamente
  const handleQuickSaveDirect = () => {
    const finalDesc = description.trim() || 'Novo Lançamento';
    const finalCategory = category?.trim() || 'outros';
    const valAmount = type === 'parcelada' ? effectiveInstallmentAmount : numericAmount;
    const valDate = date || `${startMonthYear}-01`;
    const result = expenseSchema.safeParse({
      description: finalDesc,
      amount: valAmount,
      category: finalCategory,
      date: valDate,
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
    const payload: Partial<ExpenseItem> = {
      ...(editingExpense ? { id: editingExpense.id } : {}),
      description: finalDesc,
      category: finalCategory,
      amount: type === 'parcelada' ? effectiveInstallmentAmount : numericAmount,
      type,
      cardId: cardId || undefined,
      personId: personId || undefined,
      startMonthYear,
      date: valDate,
      notes: notes.trim() || undefined,
    };

    if (type === 'parcelada') {
      const total = totalInstallments || 2;
      const curr = currentInstallment || 1;
      payload.totalInstallments = total;
      payload.currentInstallment = curr;
      payload.totalAmount = effectiveTotalAmount;
    }

    onSave(payload);
    onClose();
  };

  // Submit complete expense
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDesc = description.trim() || 'Novo Gasto';
    const valAmount = type === 'parcelada' ? effectiveInstallmentAmount : numericAmount;
    const valDate = date || `${startMonthYear}-01`;
    const result = expenseSchema.safeParse({
      description: finalDesc,
      amount: valAmount,
      category: category?.trim() || '',
      date: valDate,
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
    const payload: Partial<ExpenseItem> = {
      ...(editingExpense ? { id: editingExpense.id } : {}),
      description: finalDesc,
      category,
      amount: type === 'parcelada' ? effectiveInstallmentAmount : numericAmount,
      type,
      cardId: cardId || undefined,
      personId: personId || undefined,
      startMonthYear,
      date: valDate,
      notes: notes.trim() || undefined,
    };

    if (type === 'parcelada') {
      const total = totalInstallments || 2;
      const curr = currentInstallment || 1;
      payload.totalInstallments = total;
      payload.currentInstallment = curr;
      payload.totalAmount = effectiveTotalAmount;
    }

    onSave(payload);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="add-expense-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[200] bg-slate-950/60 dark:bg-black/80 backdrop-blur-md flex flex-col items-center justify-end sm:justify-center overflow-hidden"
        >
          <motion.div
            key="add-expense-modal-panel"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: '0%' }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 32,
              mass: 0.85
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: swipeOffset > 0 ? `translateX(${swipeOffset}px)` : undefined,
              opacity: swipeOffset > 0 ? Math.max(0.4, 1 - (swipeOffset / (typeof window !== 'undefined' ? window.innerWidth : 400)) * 0.55) : 1,
              overscrollBehavior: 'contain',
            }}
            className="w-full h-[100dvh] sm:h-[94vh] sm:max-h-[920px] sm:max-w-2xl bg-slate-100 dark:bg-[#09090B] sm:rounded-[32px] sm:border sm:border-slate-200/60 dark:sm:border-white/[0.08] sm:shadow-2xl flex flex-col text-slate-900 dark:text-slate-100 overflow-y-auto select-none"
          >
      {/* Floating gesture feedback indicator when dragging sideways */}
      {isSwiping && swipeOffset > 18 && (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-[260] bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 pointer-events-none transition-transform border border-white/10 dark:border-black/10 animate-in fade-in">
          <ArrowLeft size={16} className={`transition-transform stroke-[2.5] ${swipeOffset > 75 ? '-translate-x-1.5' : ''}`} />
          <span className="text-xs font-bold">
            {step === 2 
              ? (swipeOffset > 75 ? 'Solte para voltar ao valor' : 'Deslize para voltar ao valor')
              : (swipeOffset > 75 ? 'Solte para fechar' : 'Deslize para voltar')
            }
          </span>
        </div>
      )}

      {/* Invisible edge drag trigger on the left to capture swipes with ease */}
      <div 
        className="fixed left-0 top-0 bottom-0 w-8 z-30 pointer-events-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        title="Deslize da borda para voltar"
      />
      
      {/* Full-Screen Header with Clear Back Button and Swipe Hint */}
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
            className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
            title={step === 2 ? "Voltar para valor (ou deslize pro lado)" : "Voltar (ou deslize pro lado)"}
          >
            <ArrowLeft size={18} className="stroke-[2.5]" />
            <span className="text-xs font-bold">Voltar</span>
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {editingExpense ? 'Editar Despesa' : 'Novo Lançamento'}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <span>{editingExpense ? 'Edite as informações do gasto' : 'Valor, Cartão & Parcelas'}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hidden xs:inline">• Deslize → para voltar</span>
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
        {/* ETAPA 1: VALOR, CARTÃO E DURAÇÃO/PARCELAS (Inspirado na Tela de Referência) */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-5">
            
            {/* Card / Bank Capsule Banner (Inspirado no Bloco "Home Loan" da Imagem) */}
            <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xs relative">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Cartão Selecionado
              </span>

              <button
                type="button"
                onClick={() => setShowCardPicker(!showCardPicker)}
                className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-2xl transition-all cursor-pointer select-none"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center p-2 shrink-0">
                    <BankLogo bankName={selectedCard?.bank || selectedCard?.name} size={34} />
                  </div>
                  <div className="text-left truncate">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                      {selectedCard?.name || 'Selecione o Cartão'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {selectedCard?.bank ? `Banco ${selectedCard.bank}` : 'Cartão de Crédito'}
                      {selectedCard?.limit ? ` • Limite ${formatCurrency(selectedCard.limit)}` : ''}
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                  <ChevronDown size={16} className={`transition-transform duration-200 ${showCardPicker ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Dropdown Card Picker */}
              {showCardPicker && (
                <div className="mt-3 p-1.5 bg-slate-50 dark:bg-[#202024] border border-slate-200 dark:border-white/15 rounded-2xl shadow-lg max-h-56 overflow-y-auto space-y-1">
                  {cards.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCardId(c.id);
                        setShowCardPicker(false);
                        triggerHaptic(8);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer ${
                        cardId === c.id
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'hover:bg-white dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <BankLogo bankName={c.bank || c.name} size={28} />
                        <div className="text-left truncate">
                          <p className="text-xs font-bold truncate">{c.name}</p>
                          <p className="text-[10px] text-slate-400">{c.bank || 'Cartão'}</p>
                        </div>
                      </div>
                      {cardId === c.id && <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Descrição do Gasto: O que você comprou / gastou */}
            <div className="bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="expense-description-input" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Tag size={15} className="text-emerald-500" />
                  <span>Com o que você gastou? (Nome do Gasto)</span>
                </label>
                <span className="text-[10px] text-slate-400">Ex: Mercado, Uber, Almoço</span>
              </div>

              <div className="relative">
                <input
                  id="expense-description-input"
                  type="text"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                  }}
                  placeholder="Digite aqui o que você comprou..."
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-2xl text-slate-900 dark:text-white text-sm font-semibold placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
                {description && (
                  <button
                    type="button"
                    onClick={() => setDescription('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                    title="Limpar nome"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                )}
              </div>
              {errors.description && (
                <p className="text-rose-500 text-xs mt-1">{errors.description}</p>
              )}

              {/* Sugestões Rápidas de 1 Toque */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Sugestões Rápidas
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { label: 'Supermercado', name: 'Supermercado', cat: 'mercado', icon: ShoppingCart },
                    { label: 'Almoço', name: 'Almoço / Refeição', cat: 'alimentacao', icon: Utensils },
                    { label: 'Uber', name: 'Uber / Viagem', cat: 'transporte', icon: Car },
                    { label: 'Combustível', name: 'Posto de Gasolina', cat: 'combustivel', icon: Fuel },
                    { label: 'Farmácia', name: 'Farmácia / Remédios', cat: 'saude', icon: HeartPulse },
                    { label: 'Lanche', name: 'Ifood / Lanche', cat: 'alimentacao', icon: Utensils },
                    { label: 'Roupas', name: 'Compras / Roupas', cat: 'compras', icon: ShoppingBag },
                    { label: 'Café', name: 'Padaria & Café', cat: 'alimentacao', icon: Coffee },
                    { label: 'Assinatura', name: 'Assinatura', cat: 'servicos', icon: Tv },
                  ].map((sug) => {
                    const SugIcon = sug.icon;
                    return (
                      <button
                        key={sug.label}
                        type="button"
                        onClick={() => {
                          triggerHaptic(6);
                          setDescription(sug.name);
                          setCategory(sug.cat);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
                          description === sug.name
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs scale-105'
                            : 'bg-slate-50 dark:bg-[#2C2C2E] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400'
                        }`}
                      >
                        <SugIcon size={13} strokeWidth={1.8} className="shrink-0 text-current" />
                        <span>{sug.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Duration / Cobrança: À Vista vs Parcelado vs Fixo */}
            <div className="bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-3.5">
              
              {/* Segmented Control de Tipo */}
              <div className="flex p-1 bg-slate-100 dark:bg-[#2C2C2E] rounded-2xl">
                <button
                  type="button"
                  onClick={() => { setType('unica'); triggerHaptic(8); }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                    type === 'unica'
                      ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  À Vista
                </button>

                <button
                  type="button"
                  onClick={() => { setType('parcelada'); triggerHaptic(8); }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    type === 'parcelada'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Layers size={14} />
                  <span>Parcelado</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setType('fixa'); triggerHaptic(8); }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                    type === 'fixa'
                      ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Fixo / Recorrente
                </button>
              </div>

              {/* SELETOR DE PARCELAS LIMPO & ORGANIZADO */}
              {type === 'parcelada' && (
                <div className="pt-2 border-t border-slate-100 dark:border-white/[0.08] space-y-3">
                  
                  {/* 1. Seleção da Quantidade de Parcelas */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Quantidade de Parcelas
                      </span>
                      
                      {/* Stepper Compacto */}
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#2C2C2E] p-1 rounded-xl">
                        <button
                          type="button"
                          disabled={totalInstallments <= 2}
                          onClick={() => {
                            triggerHaptic(6);
                            setTotalInstallments((prev) => Math.max(2, prev - 1));
                            if (currentInstallment > totalInstallments - 1) {
                              setCurrentInstallment(Math.max(1, totalInstallments - 1));
                            }
                          }}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-[#1C1C1E] flex items-center justify-center text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="px-2 font-black text-xs text-slate-900 dark:text-white tabular-nums">
                          {totalInstallments}x
                        </span>
                        <button
                          type="button"
                          disabled={totalInstallments >= 48}
                          onClick={() => {
                            triggerHaptic(6);
                            setTotalInstallments((prev) => Math.min(48, prev + 1));
                          }}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-[#1C1C1E] flex items-center justify-center text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Chips rápidos de parcelas */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {[2, 3, 4, 5, 6, 10, 12, 18, 24].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            setTotalInstallments(num);
                            if (currentInstallment > num) {
                              setCurrentInstallment(num);
                            }
                            triggerHaptic(6);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                            totalInstallments === num
                              ? 'bg-emerald-500 text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-[#2C2C2E] text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
                          }`}
                        >
                          {num}x
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(8);
                          setShowInstallmentModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 bg-slate-100 dark:bg-[#2C2C2E] text-slate-600 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1 cursor-pointer"
                      >
                        <Sliders size={12} />
                        <span>Todas</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Alternador de Modo do Valor */}
                  <div className="flex p-1 bg-slate-100 dark:bg-[#2C2C2E] rounded-xl text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(6);
                        setInstallmentAmountMode('per_installment');
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer text-center ${
                        installmentAmountMode === 'per_installment'
                          ? 'bg-white dark:bg-[#1C1C1E] text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      Digitando Valor de Cada Parcela
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(6);
                        setInstallmentAmountMode('total_purchase');
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer text-center ${
                        installmentAmountMode === 'total_purchase'
                          ? 'bg-white dark:bg-[#1C1C1E] text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      Digitando Valor Total da Compra
                    </button>
                  </div>

                  {/* 3. Parcelas Já Pagas (Gaveta Opcional e Limpa) */}
                  {!showAlreadyPaidPicker && currentInstallment === 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(6);
                        setShowAlreadyPaidPicker(true);
                        setCurrentInstallment(2);
                      }}
                      className="w-full py-1.5 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 size={13} />
                      <span>Já pagou parcelas dessa compra antes?</span>
                    </button>
                  ) : (
                    <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span>Parcela Atual no Mês</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(6);
                            setCurrentInstallment(1);
                            setShowAlreadyPaidPicker(false);
                          }}
                          className="text-[11px] font-bold text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          Voltar para 1ª parcela
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={currentInstallment <= 1}
                          onClick={() => {
                            triggerHaptic(6);
                            setCurrentInstallment((prev) => Math.max(1, prev - 1));
                          }}
                          className="w-8 h-8 rounded-lg bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.10] flex items-center justify-center text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer shadow-2xs"
                        >
                          <Minus size={13} />
                        </button>

                        <div className="flex-1 text-center bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.10] py-1.5 px-3 rounded-xl shadow-2xs">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            Cobrar a <strong className="text-emerald-600 dark:text-emerald-400 font-black">{currentInstallment}ª parcela</strong> ({currentInstallment}/{totalInstallments})
                          </span>
                          <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {currentInstallment - 1} já quitada(s) • Restam {remainingInstallmentsCount} a pagar
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={currentInstallment >= totalInstallments}
                          onClick={() => {
                            triggerHaptic(6);
                            setCurrentInstallment((prev) => Math.min(totalInstallments, prev + 1));
                          }}
                          className="w-8 h-8 rounded-lg bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.10] flex items-center justify-center text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer shadow-2xs"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4. Resumo Financeiro Sucinto */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#2C2C2E]/60 border border-slate-200/60 dark:border-white/[0.06] text-xs flex items-center justify-between flex-wrap gap-1">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      {currentInstallment > 1 ? (
                        <>Cobrando <strong>{currentInstallment}/{totalInstallments}</strong> • Restam {remainingInstallmentsCount}x</>
                      ) : (
                        <>Plano: <strong>{totalInstallments} meses</strong> (até {formatMonthShort(endMonthYear)})</>
                      )}
                    </span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {currentInstallment > 1 ? (
                        <>Restante: {formatCurrency(remainingTotalAmount)}</>
                      ) : (
                        <>Total: {formatCurrency(effectiveTotalAmount)}</>
                      )}
                    </span>
                  </div>

                </div>
              )}
            </div>

            {/* Big Amount Display (Hero Value Center) */}
            <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xs text-center space-y-3">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {type === 'parcelada' 
                  ? (installmentAmountMode === 'total_purchase' ? 'Valor Total da Compra' : 'Valor de Cada Parcela') 
                  : 'Valor Total do Gasto'}
              </span>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(numericAmount)}
              </h1>
              {errors.amount && (
                <p className="text-rose-500 text-xs mt-1 text-center">{errors.amount}</p>
              )}

              {/* Quick Amount Presets */}
              <div className="flex items-center justify-center flex-wrap gap-1.5 pt-1">
                {[
                  { label: '+R$ 20', add: 2000 },
                  { label: '+R$ 50', add: 5000 },
                  { label: '+R$ 100', add: 10000 },
                  { label: '+R$ 200', add: 20000 },
                  { label: '+R$ 500', add: 50000 },
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

              {type === 'parcelada' && numericAmount > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between text-xs px-2">
                  <span className="text-slate-500 dark:text-slate-400">
                    {installmentAmountMode === 'total_purchase' ? 'Valor da Parcela Mensal:' : 'Total Acumulado:'}
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {installmentAmountMode === 'total_purchase' 
                      ? `${totalInstallments}x de ${formatCurrency(effectiveInstallmentAmount)}`
                      : `${formatCurrency(effectiveTotalAmount)} (${totalInstallments}x de ${formatCurrency(effectiveInstallmentAmount)})`}
                  </span>
                </div>
              )}
            </div>

            {/* Numeric Keypad (Teclado Limpo de 1-9, Clear, 0, Backspace) */}
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

            {/* Action in Step 1: Advance to Step 2 Details Screen */}
            <div className="pt-2">
              <Button
                id="btn-add-expense-step1"
                disabled={numericAmount <= 0}
                onClick={handleContinueToStep2}
                size="lg"
                variant="primary"
                className="w-full text-base font-bold shadow-md shadow-emerald-600/20 py-4"
                leftIcon={<Check size={20} className="stroke-[2.5]" />}
              >
                Salvar Lançamento
              </Button>
            </div>

            {/* Cancel & Go Back Text Action for Step 1 */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 py-2.5 px-4 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Cancelar e voltar ao início (ou deslize pro lado)</span>
              </button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* ETAPA 2: DETALHES, RESUMO & INFORMAÇÕES (Inspirado na 2ª Tela de Referência) */}
        {/* ========================================================================= */}
        {step === 2 && (
          <form onSubmit={handleFinalSubmit} className="space-y-5">
            
            {/* Reckoning / Resumo Financeiro da Cobrança */}
            <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.08]">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Resumo da Despesa
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
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Cartão</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <BankLogo bankName={selectedCard?.bank || selectedCard?.name} size={18} />
                    {selectedCard?.name}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Tipo de Cobrança</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {type === 'unica' ? 'Compra À Vista' : type === 'parcelada' ? `Parcelado em ${totalInstallments}x` : 'Assinatura / Fixo'}
                  </span>
                </div>

                {type === 'parcelada' && (
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Parcela Atual / Pagas</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {currentInstallment > 1 ? (
                        <>Parcela {currentInstallment} de {totalInstallments} ({currentInstallment - 1} já paga{currentInstallment - 1 > 1 ? 's' : ''})</>
                      ) : (
                        <>1ª de {totalInstallments} (0 pagas antes)</>
                      )}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/[0.08]">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {type === 'parcelada' ? 'Valor por Mês' : 'Valor Total'}
                  </span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(effectiveInstallmentAmount)}
                  </span>
                </div>

                {type === 'parcelada' && (
                  <>
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium text-xs">
                      <span>Total da Compra</span>
                      <span className="tabular-nums font-bold text-slate-900 dark:text-white">{formatCurrency(effectiveTotalAmount)}</span>
                    </div>

                    {currentInstallment > 1 && (
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-[11px]">
                        <span>Restante no Cartão ({remainingInstallmentsCount} parcelas)</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {formatCurrency(remainingTotalAmount)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Informações da Despesa */}
            <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-4">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Detalhes da Despesa
              </span>

              {/* 1. Descrição do Gasto & Sugestões Rápidas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Descrição do Gasto (Opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                  }}
                  placeholder={`Ex: ${selectedCategoryObj.label.split('&')[0].trim()}, Supermercado, Almoço...`}
                  autoFocus
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-2xl text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition-colors"
                />
                {errors.description && (
                  <p className="text-rose-500 text-xs mt-1">{errors.description}</p>
                )}

                {/* Quick Suggestion Chips using Lucide Icons */}
                <div className="flex items-center flex-wrap gap-1.5 mt-2">
                  {EXPENSE_SUGGESTIONS.map((sug) => {
                    const SugIcon = sug.icon;
                    return (
                      <button
                        key={sug.label}
                        type="button"
                        onClick={() => {
                          triggerHaptic(6);
                          setDescription(sug.label);
                          setCategory(sug.cat);
                          if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                          if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#2C2C2E]/80 hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        <SugIcon size={13} strokeWidth={1.8} className="shrink-0 text-current" />
                        <span>{sug.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Quem Gastou / Dono (Custom Dropdown) */}
              <div ref={personMenuRef} className="relative">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User size={14} className="text-emerald-500" />
                  <span>Quem Gastou / Dono</span>
                </label>
                <button
                  type="button"
                  id="person-menu-trigger"
                  onClick={() => {
                    setIsPersonMenuOpen((prev) => !prev);
                    setIsCategoryMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-2xl text-slate-900 dark:text-white text-xs font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-emerald-600 flex items-center justify-between transition-colors shadow-2xs"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {selectedPerson?.name?.charAt(0) || 'U'}
                    </span>
                    <span>{selectedPerson?.name} {selectedPerson?.isSelf ? '(Você)' : ''}</span>
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 ${isPersonMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isPersonMenuOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-white dark:bg-[#242426] border border-slate-200 dark:border-white/[0.12] rounded-2xl shadow-xl z-50 space-y-1">
                    {people.map((p) => {
                      const isSelected = p.id === selectedPerson.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic(6);
                            setPersonId(p.id);
                            setIsPersonMenuOpen(false);
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-colors cursor-pointer text-left ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] font-medium'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {p.name.charAt(0)}
                          </span>
                          <span className="truncate">{p.name} {p.isSelf ? '(Você)' : ''}</span>
                          {isSelected && (
                            <Check size={16} strokeWidth={2.2} className="ml-auto shrink-0 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Categoria da Despesa (Custom Dropdown with Lucide library icons) */}
              <div ref={categoryMenuRef} className="relative">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Tag size={14} className="text-amber-500" />
                  <span>Categoria</span>
                </label>
                <button
                  type="button"
                  id="category-menu-trigger"
                  onClick={() => {
                    setIsCategoryMenuOpen((prev) => !prev);
                    setIsPersonMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-2xl text-slate-900 dark:text-white text-xs font-semibold cursor-pointer outline-none focus:ring-2 focus:ring-emerald-600 flex items-center justify-between transition-colors shadow-2xs"
                >
                  <span className="flex items-center gap-2.5">
                    {React.createElement(selectedCategoryObj.icon, {
                      size: 17,
                      strokeWidth: 2,
                      className: `shrink-0 ${selectedCategoryObj.color || 'text-emerald-600 dark:text-emerald-400'}`
                    })}
                    <span>{selectedCategoryObj.label}</span>
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 ${isCategoryMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isCategoryMenuOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-white dark:bg-[#242426] border border-slate-200 dark:border-white/[0.12] rounded-2xl shadow-xl z-50 space-y-1 max-h-60 overflow-y-auto">
                    {EXPENSE_CATEGORIES_LIST.map((c) => {
                      const Icon = c.icon;
                      const isSelected = c.id === selectedCategoryObj.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          id={`category-option-${c.id}`}
                          onClick={() => {
                            triggerHaptic(6);
                            setCategory(c.id);
                            setIsCategoryMenuOpen(false);
                            if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-colors cursor-pointer text-left ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] font-medium'
                          }`}
                        >
                          <Icon size={17} strokeWidth={2} className={`shrink-0 ${c.color || 'text-current'}`} />
                          <span className="truncate">{c.label}</span>
                          {isSelected && (
                            <Check size={16} strokeWidth={2.2} className="ml-auto shrink-0 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                {errors.category && (
                  <p className="text-rose-500 text-xs mt-1">{errors.category}</p>
                )}
              </div>

              {/* 4. Data da Despesa / Cobrança */}
              <div>
                <DatePickerInput
                  label="Data da Despesa / Cobrança"
                  mode="date"
                  value={date || `${startMonthYear}-01`}
                  onChange={(newDate) => {
                    setDate(newDate);
                    setStartMonthYear(newDate.slice(0, 7));
                    if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                  }}
                />
                {errors.date && (
                  <p className="text-rose-500 text-xs mt-1">{errors.date}</p>
                )}
              </div>

              {/* 5. Progresso das Parcelas (quando for parcelado) */}
              {type === 'parcelada' && (
                <div className="bg-slate-50 dark:bg-[#2C2C2E]/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Layers size={14} className="text-emerald-500" />
                      <span>Parcela Inicial neste Mês / Parcelas Já Pagas</span>
                    </label>
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      {currentInstallment}ª de {totalInstallments}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentInstallment <= 1}
                      onClick={() => {
                        triggerHaptic(6);
                        setCurrentInstallment((prev) => Math.max(1, prev - 1));
                      }}
                      className="w-9 h-9 rounded-xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.10] flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Diminuir parcela"
                    >
                      <Minus size={15} />
                    </button>

                    <div className="flex-1 text-center bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.10] py-2 px-2.5 rounded-xl">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {currentInstallment > 1 ? (
                          <>Começa na <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{currentInstallment}ª parcela</strong> ({currentInstallment - 1} já quitadas)</>
                        ) : (
                          <>Começa na <strong>1ª parcela</strong> (nenhuma paga antes)</>
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={currentInstallment >= totalInstallments}
                      onClick={() => {
                        triggerHaptic(6);
                        setCurrentInstallment((prev) => Math.min(totalInstallments, prev + 1));
                      }}
                      className="w-9 h-9 rounded-xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.10] flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Aumentar parcela"
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Restam {remainingInstallmentsCount} parcelas a serem cobradas de {formatMonthShort(startMonthYear)} até {formatMonthShort(endMonthYear)}.
                  </p>
                </div>
              )}

              {/* 6. Observações (opcional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <FileText size={14} className="text-slate-400" />
                  <span>Observações (opcional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Compra com desconto, frete grátis..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-2xl text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
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
                id="btn-save-expense-final"
                size="lg"
                className="flex-1"
                leftIcon={<Check size={18} className="stroke-[2.5]" />}
              >
                Salvar Lançamento
              </Button>
            </div>

          </form>
        )}

      </main>

      {/* ========================================================================= */}
      {/* MODAL / BOTTOM SHEET COMPLETO: SELETOR DE TODAS AS PARCELAS (1x até 48x) */}
      {/* ========================================================================= */}
      {showInstallmentModal && (
        <div className="fixed inset-0 z-[250] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-t-[32px] sm:rounded-[32px] border border-slate-200 dark:border-white/[0.10] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
            
            {/* Header do Seletor */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Calculator size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Selecionar Parcelas
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Escolha de 1x a 48x ou personalize
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(6);
                  setShowInstallmentModal(false);
                }}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-500 hover:text-slate-900 dark:text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stepper e Input Numérico Direto */}
            <div className="p-4 bg-slate-50 dark:bg-[#2C2C2E]/60 border-b border-slate-100 dark:border-white/[0.08] shrink-0 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ajuste Rápido (+ / -)
                </span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  {totalInstallments}x de {formatCurrency(effectiveInstallmentAmount)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={totalInstallments <= 1}
                  onClick={() => {
                    triggerHaptic(8);
                    setTotalInstallments(prev => Math.max(1, prev - 1));
                  }}
                  className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.10] flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer active:scale-95"
                  title="Diminuir 1 parcela"
                >
                  <Minus size={18} className="stroke-[2.5]" />
                </button>

                <div className="flex-1 relative">
                  <input
                    type="number"
                    min="1"
                    max="96"
                    value={totalInstallments}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 1 && val <= 96) {
                        setTotalInstallments(val);
                      }
                    }}
                    className="w-full text-center text-2xl font-black py-2.5 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.10] rounded-2xl text-slate-900 dark:text-white tabular-nums outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    vezes
                  </span>
                </div>

                <button
                  type="button"
                  disabled={totalInstallments >= 96}
                  onClick={() => {
                    triggerHaptic(8);
                    setTotalInstallments(prev => Math.min(96, prev + 1));
                  }}
                  className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.10] flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer active:scale-95"
                  title="Aumentar 1 parcela"
                >
                  <Plus size={18} className="stroke-[2.5]" />
                </button>
              </div>

              {/* Ajuste de Parcelas Já Pagas dentro do Modal */}
              <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.06] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span>Parcelas Já Pagas Anteriormente:</span>
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {currentInstallment > 1 ? `${currentInstallment - 1} de ${totalInstallments} quitada(s)` : '0 (Começar na 1ª)'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                  {Array.from({ length: Math.min(totalInstallments, 24) }, (_, idx) => idx + 1).map((instNum) => {
                    const isCurrent = currentInstallment === instNum;
                    const paidCount = instNum - 1;
                    return (
                      <button
                        key={instNum}
                        type="button"
                        onClick={() => {
                          triggerHaptic(6);
                          setCurrentInstallment(instNum);
                        }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-500 text-white shadow-2xs'
                            : 'bg-white dark:bg-[#1C1C1E] text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.10] border border-slate-200/70 dark:border-white/[0.06]'
                        }`}
                      >
                        {paidCount === 0 ? '1ª (0 pagas)' : `${instNum}ª (${paidCount} paga${paidCount > 1 ? 's' : ''})`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Grade Completa de Todas as Parcelas (1x até 48x) com Cálculos em Tempo Real */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block px-1 pb-1">
                Todas as Opções de Parcelas
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Array.from({ length: 48 }, (_, i) => i + 1).map((num) => {
                  const isSelected = totalInstallments === num;
                  const instValue = installmentAmountMode === 'total_purchase' 
                    ? (numericAmount > 0 ? numericAmount / num : 0)
                    : numericAmount;
                  const totalVal = installmentAmountMode === 'total_purchase'
                    ? numericAmount
                    : (numericAmount > 0 ? numericAmount * num : 0);
                  const endMonth = addMonths(startMonthYear, num - 1);

                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        triggerHaptic(8);
                        setTotalInstallments(num);
                        setShowInstallmentModal(false);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-md scale-[1.01]'
                          : 'bg-slate-50/80 dark:bg-[#2C2C2E]/60 border-slate-200/80 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected 
                            ? 'bg-white/20 text-white' 
                            : 'bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                        }`}>
                          {num}x
                        </div>
                        <div>
                          <div className="text-xs font-bold tabular-nums">
                            {numericAmount > 0 ? `${num}x de ${formatCurrency(instValue)}` : `${num} parcelas`}
                          </div>
                          <div className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                            Até {formatMonthShort(endMonth)} {numericAmount > 0 && `• Total ${formatCurrency(totalVal)}`}
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <Check size={18} className="text-white shrink-0" />
                      ) : (
                        <ChevronRight size={14} className="text-slate-400 shrink-0 opacity-60" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer do Modal com Botão Confirmar */}
            <div className="p-4 border-t border-slate-100 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] shrink-0">
              <Button
                type="button"
                fullWidth
                size="lg"
                onClick={() => {
                  triggerHaptic(8);
                  setShowInstallmentModal(false);
                }}
                leftIcon={<Check size={18} />}
              >
                Confirmar {totalInstallments}x de {formatCurrency(effectiveInstallmentAmount)}
              </Button>
            </div>

          </div>
        </div>
      )}

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
