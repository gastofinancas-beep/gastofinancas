import React, { useState, useMemo } from 'react';
import { 
  CreditCard as CardIcon, 
  Plus, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Check, 
  RotateCcw,
  Sparkles,
  Search,
  Sliders,
  Receipt,
  ArrowUpRight,
  ShieldCheck,
  Tag,
  User,
  ShoppingBag,
  TrendingUp,
  Wallet,
  X,
  Camera,
  Bell,
  BellRing
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CardBillPayment, CreditCard, ExpenseItem, Person } from '../types';
import { formatCurrency, formatMonthDisplay, formatMonthCompact } from '../utils/financeCalculations';
import { BankLogo, normalizeBankName } from './BankLogo';
import { PayCardBillModal } from './PayCardBillModal';
import { TiltCard } from './TiltCard';
import { CreditCardVisual, EmvSmartChip, ContactlessIcon, CardBrandBadge } from './CreditCardVisual';
import { AppleWalletStack } from './AppleWalletStack';
import { triggerHaptic } from '../utils/haptics';
import { ALL_BANKS } from './AddCardModal';
import { CardsEmptyIllustration } from './CardsEmptyIllustration';
import { getCategoryInfo } from '../data/categories';
import { 
  getNotificationPermission, 
  requestNotificationPermission
} from '../utils/notifications';

interface CardsViewProps {
  cards: CreditCard[];
  people: Person[];
  activeExpenses: { expense: ExpenseItem; currentInstallmentForMonth?: number; totalInstallments?: number }[];
  currentMonth: string;
  paidBills: CardBillPayment[];
  onOpenAddCard: (preset?: Partial<CreditCard>) => void;
  onEditCard: (card: CreditCard) => void;
  onDeleteCard: (cardId: string) => void;
  onOpenAddExpenseForCard: (cardId: string) => void;
  onEditExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
  onPayBill: (
    card: CreditCard,
    amount: number,
    monthYear: string,
    paymentType?: 'full' | 'partial',
    interestAmount?: number,
    rolledOverDebt?: number,
    nextMonth?: string
  ) => void;
  onUnpayBill: (cardId: string, monthYear: string) => void;
  newlyAddedCardId?: string | null;
}

// Popular banks shown as quick 1-tap shortcuts
const QUICK_BANK_SHORTCUTS = [
  { bank: 'Nubank', name: 'Nubank Roxinho', color: '#820AD1', gradient: 'from-[#820AD1] via-[#9B1BE8] to-[#5C0D8B]' },
  { bank: 'Itaú', name: 'Itaú Mastercard', color: '#EC7000', gradient: 'from-[#EC7000] via-[#FA7D09] to-[#002D72]' },
  { bank: 'Inter', name: 'Banco Inter', color: '#FF7A00', gradient: 'from-[#FF7A00] via-[#FF9432] to-[#E65C00]' },
  { bank: 'C6 Bank', name: 'C6 Carbon', color: '#181818', gradient: 'from-[#333338] via-[#1E1E22] to-[#121214]' },
  { bank: 'Bradesco', name: 'Bradesco Elo', color: '#CC092F', gradient: 'from-[#CC092F] via-[#E8113A] to-[#8A0019]' },
  { bank: 'Santander', name: 'Santander SX', color: '#EC0000', gradient: 'from-[#EC0000] via-[#FF2626] to-[#A30000]' },
  { bank: 'XP', name: 'XP Visa Infinite', color: '#000000', gradient: 'from-[#282828] via-[#161616] to-[#050505]' },
  { bank: 'BTG Pactual', name: 'BTG Pactual', color: '#0B1E36', gradient: 'from-[#0B1E36] via-[#183E6E] to-[#061120]' },
  { bank: 'PicPay', name: 'PicPay Card', color: '#11C76F', gradient: 'from-[#11C76F] via-[#1EE381] to-[#0B9652]' },
];

export function CardsView({
  cards,
  people,
  activeExpenses,
  currentMonth,
  paidBills,
  onOpenAddCard,
  onEditCard,
  onDeleteCard,
  onOpenAddExpenseForCard,
  onEditExpense,
  onDeleteExpense,
  onPayBill,
  onUnpayBill,
  newlyAddedCardId,
}: CardsViewProps) {
  const [selectedCardId, setSelectedCardId] = useState<string>(
    newlyAddedCardId || cards[0]?.id || ''
  );
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFaturaExpanded, setIsFaturaExpanded] = useState(true);
  const [notifPermission, setNotifPermission] = useState(getNotificationPermission());
  const [isRequestingPerm, setIsRequestingPerm] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gasto_card_notif_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  // Seleciona automaticamente o novo cartão adicionado com feedback tátil suave
  React.useEffect(() => {
    if (newlyAddedCardId && cards.some(c => c.id === newlyAddedCardId)) {
      setSelectedCardId(newlyAddedCardId);
      triggerHaptic(14);
    }
  }, [newlyAddedCardId, cards]);

  const handleRequestPermission = async () => {
    setIsRequestingPerm(true);
    try {
      const perm = await requestNotificationPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        triggerHaptic(15);
      }
      setIsBannerDismissed(true);
      try {
        localStorage.setItem('gasto_card_notif_dismissed', 'true');
      } catch {}
    } catch {
      setIsBannerDismissed(true);
    } finally {
      setIsRequestingPerm(false);
    }
  };

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
    try {
      localStorage.setItem('gasto_card_notif_dismissed', 'true');
    } catch {}
  };

  // Fallback to first card if selected is not found
  const selectedCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  // Expenses specifically for the selected card
  const cardExpenses = useMemo(() => {
    return activeExpenses
      .filter((e) => e.expense.cardId === selectedCard?.id)
      .filter((e) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          e.expense.description.toLowerCase().includes(term) ||
          e.expense.category.toLowerCase().includes(term) ||
          (e.expense.notes && e.expense.notes.toLowerCase().includes(term))
        );
      });
  }, [activeExpenses, selectedCard?.id, searchTerm]);

  // Current month total for the selected card
  const totalCardAmount = useMemo(() => {
    return activeExpenses
      .filter((e) => e.expense.cardId === selectedCard?.id)
      .reduce((acc, curr) => acc + curr.expense.amount, 0);
  }, [activeExpenses, selectedCard?.id]);

  // Overall metrics across all cards
  const totalInvoicesAll = useMemo(() => {
    return cards.reduce((acc, card) => {
      const exp = activeExpenses.filter((e) => e.expense.cardId === card.id);
      return acc + exp.reduce((sum, curr) => sum + curr.expense.amount, 0);
    }, 0);
  }, [cards, activeExpenses]);

  const totalLimitAll = useMemo(() => {
    return cards.reduce((acc, card) => acc + (card.limit || 0), 0);
  }, [cards]);

  const totalAvailableAll = Math.max(0, totalLimitAll - totalInvoicesAll);

  // Check if invoice for current month is paid
  const isBillPaid = paidBills.some((p) => p.cardId === selectedCard?.id && p.monthYear === currentMonth);

  // Available limit calculation for current selected card
  const cardLimit = selectedCard?.limit || 0;
  const availableLimit = Math.max(0, cardLimit - totalCardAmount);
  const usagePercentage = cardLimit > 0 ? Math.min(100, Math.round((totalCardAmount / cardLimit) * 100)) : 0;

  // Calculate days until due
  const getDueStatus = (card: CreditCard, isPaid: boolean) => {
    if (isPaid) {
      return { text: 'Fatura Paga ✓', color: 'bg-emerald-500 text-white' };
    }
    const hoje = new Date();
    const diaVencimento = card.dueDay || 15;
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();
    
    let vencimento = new Date(anoAtual, mesAtual - 1, diaVencimento);
    if (vencimento < hoje) {
      vencimento = new Date(anoAtual, mesAtual, diaVencimento);
    }
    
    const diff = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diff <= 0) return { text: 'Vence Hoje!', color: 'bg-rose-500 text-white animate-pulse' };
    if (diff === 1) return { text: 'Vence Amanhã', color: 'bg-rose-500 text-white animate-pulse' };
    if (diff <= 3) return { text: `Vence em ${diff} dias`, color: 'bg-rose-500 text-white' };
    if (diff <= 7) return { text: `Vence em ${diff} dias`, color: 'bg-amber-500 text-white' };
    return { text: `Vence em ${diff} dias`, color: 'bg-white/20 text-white' };
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 max-w-4xl mx-auto pb-8">
      
      {/* ========================================================================= */}
      {/* 1. CABEÇALHO MODERNO E LIMPO */}
      {/* ========================================================================= */}
      <div data-tour="cards-header" className="flex items-center justify-between gap-3 px-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Meus Cartões
          </h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {cards.length === 0 ? 'Faturas e limites' : `${cards.length} ${cards.length === 1 ? 'cartão cadastrado' : 'cartões cadastrados'}`}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <Calendar size={11} className="shrink-0" />
              {formatMonthCompact(currentMonth)}
            </span>
          </div>
        </div>

        {/* Botão Novo Cartão */}
        <div className="flex items-center gap-2">
          {cards.length > 0 && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                onOpenAddCard();
                triggerHaptic(8);
              }}
              className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold px-3.5 sm:px-4 py-2 rounded-full text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus size={15} className="stroke-[2.8]" />
              <span>Novo Cartão</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Banner de Celebração Fluido ao Adicionar Novo Cartão */}
      <AnimatePresence>
        {newlyAddedCardId && selectedCard && selectedCard.id === newlyAddedCardId && (
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-teal-500/20 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-md shadow-emerald-500/10"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-bold">
                <Sparkles size={18} className="stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  🎉 Cartão "{selectedCard.name}" adicionado com sucesso!
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                  Toque para virar e conferir seu cartão físico em 3D.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenAddExpenseForCard(selectedCard.id)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1"
            >
              <span>+ Lançar</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. CONTEÚDO PRINCIPAL: ESTADO VAZIO COM DESENHO DOS CARTÕES E GUIA INTUITIVO */}
      {/* ========================================================================= */}
      {cards.length === 0 ? (
        <CardsEmptyIllustration
          onOpenAddCard={(bankName) =>
            onOpenAddCard(bankName ? { bank: bankName, name: `${bankName} Card` } : undefined)
          }
        />
      ) : (
        /* ========================================================================= */
        /* MODO COM CARTÕES CADASTRADOS (APPLE WALLET STACK + METRICS + ACTIONS) */
        /* ========================================================================= */
        <>
          {/* Barra Resumo de Limites & Faturas Consolidadas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-3.5 border border-slate-200/60 dark:border-white/[0.08] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Faturas no Mês
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums block mt-0.5">
                {formatCurrency(totalInvoicesAll)}
              </span>
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-3.5 border border-slate-200/60 dark:border-white/[0.08] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Limite Disponível
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums block mt-0.5">
                {formatCurrency(totalAvailableAll)}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-white dark:bg-[#1C1C1E] rounded-2xl p-3.5 border border-slate-200/60 dark:border-white/[0.08] shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Cartão em Foco
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate block mt-0.5">
                  {selectedCard?.name || 'Principal'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">
                  {usagePercentage}% usado
                </span>
              </div>
            </div>
          </div>

          {/* Banner Discreto de Alerta de Faturas via Push / Notificações do Navegador */}
          {!isBannerDismissed && notifPermission === 'default' && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0 pr-2 sm:pr-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <BellRing size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    Lembretes automáticos de fatura no celular e PC
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Receba avisos nativos quando a fatura estiver prestes a vencer para evitar juros.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  disabled={isRequestingPerm}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <Bell size={13} />
                  <span>{isRequestingPerm ? 'Ativando...' : 'Ativar Lembretes'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismissBanner}
                  aria-label="Fechar aviso"
                  title="Dispensar aviso"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* APPLE WALLET STACK CONTAINER */}
          {/* ========================================================================= */}
          <div id="cards-container" className="relative my-2">
            <AppleWalletStack
              cards={cards}
              selectedCardId={selectedCard?.id || cards[0].id}
              onSelectCard={(id) => setSelectedCardId(id)}
              activeExpenses={activeExpenses}
              paidBills={paidBills}
              currentMonth={currentMonth}
              getDueStatus={getDueStatus}
              onOpenAddCard={onOpenAddCard}
              newlyAddedCardId={newlyAddedCardId}
            />
          </div>

          {/* ========================================================================= */}
          {/* AÇÕES RÁPIDAS COM DESIGN MODERNO */}
          {/* ========================================================================= */}
          {selectedCard && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider px-1">
                Ações Rápidas
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                
                {/* 1. Pagar Fatura / Reabrir */}
                {isBillPaid ? (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onUnpayBill(selectedCard.id, currentMonth)}
                    className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] hover:border-emerald-500/30 dark:hover:border-white/[0.14] shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#2C2C2E] text-slate-600 dark:text-slate-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <RotateCcw size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-white block">
                        Reabrir Fatura
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Fatura Paga ✓
                      </span>
                    </div>
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsPayModalOpen(true)}
                    disabled={totalCardAmount === 0}
                    className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CheckCircle2 size={18} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-white block">
                        Pagar Fatura
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {formatCurrency(totalCardAmount)}
                      </span>
                    </div>
                  </motion.button>
                )}

                {/* 2. Novo Lançamento */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onOpenAddExpenseForCard(selectedCard.id)}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] hover:border-emerald-400 dark:hover:border-emerald-600 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white block">
                      Novo Gasto
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Neste cartão
                    </span>
                  </div>
                </motion.button>

                {/* 3. Editar Cartão */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onEditCard(selectedCard)}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] hover:border-emerald-500/30 dark:hover:border-white/[0.14] shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white block">
                      Editar Cartão
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Nome e limite
                    </span>
                  </div>
                </motion.button>

                {/* 4. Excluir Cartão */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onDeleteCard(selectedCard.id)}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] hover:border-rose-300 dark:hover:border-rose-800 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Trash2 size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white block">
                      Excluir
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Remover cartão
                    </span>
                  </div>
                </motion.button>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* DETALHAMENTO DA FATURA & LANÇAMENTOS (ARRASTAR PARA EXPANDIR / ESCONDER) */}
          {/* ========================================================================= */}
          {selectedCard && (
            <motion.div 
              layout
              className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-slate-200/60 dark:border-white/[0.08] shadow-sm overflow-hidden transition-all duration-300"
            >
              {/* iOS-Style Drag Handle & Gesture Zone */}
              <motion.div
                onPanEnd={(_e, info) => {
                  if (info.offset.y > 25 || info.velocity.y > 120) {
                    if (isFaturaExpanded) {
                      setIsFaturaExpanded(false);
                      triggerHaptic(12);
                    }
                  } else if (info.offset.y < -25 || info.velocity.y < -120) {
                    if (!isFaturaExpanded) {
                      setIsFaturaExpanded(true);
                      triggerHaptic(12);
                    }
                  }
                }}
                onClick={() => {
                  setIsFaturaExpanded(!isFaturaExpanded);
                  triggerHaptic(12);
                }}
                className="pt-3 pb-1.5 px-4 flex flex-col items-center justify-center cursor-pointer select-none group touch-none hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors border-b border-transparent hover:border-slate-100 dark:hover:border-white/[0.04]"
                title={isFaturaExpanded ? "Toque ou arraste para recolher os lançamentos" : "Toque ou arraste para expandir os lançamentos"}
              >
                <motion.div 
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-white/20 group-hover:bg-emerald-500/70 transition-colors" 
                />
                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {isFaturaExpanded ? (
                    <>
                      <span>Arraste ou toque para recolher</span>
                      <ChevronDown size={12} className="group-hover:translate-y-0.5 transition-transform" />
                    </>
                  ) : (
                    <>
                      <span>Arraste ou toque para ver lançamentos</span>
                      <ChevronUp size={12} className="group-hover:-translate-y-0.5 transition-transform" />
                    </>
                  )}
                </div>
              </motion.div>

              {/* Collapsed Peek Header */}
              {!isFaturaExpanded ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setIsFaturaExpanded(true);
                    triggerHaptic(12);
                  }}
                  className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <Receipt size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Lançamentos da Fatura
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {cardExpenses.length} {cardExpenses.length === 1 ? 'item' : 'itens'} • Total: {formatCurrency(totalCardAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      Ver Compras
                    </span>
                    <ChevronUp size={16} className="text-slate-400 animate-bounce" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-5 sm:p-6 space-y-4 pt-2"
                >
                  {/* Header with Search and Summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                          Lançamentos da Fatura
                        </h3>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#2C2C2E] text-slate-600 dark:text-slate-300">
                          {cardExpenses.length} {cardExpenses.length === 1 ? 'item' : 'itens'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Compras vinculadas a {selectedCard.name} em {formatMonthDisplay(currentMonth)}
                      </p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar compra..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white"
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => setSearchTerm('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items List */}
                  {cardExpenses.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-xs space-y-2">
                      <p>Nenhuma compra lançada neste cartão para o mês selecionado.</p>
                      <button
                        type="button"
                        onClick={() => onOpenAddExpenseForCard(selectedCard.id)}
                        className="inline-flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1.5 rounded-full hover:bg-emerald-500/20 cursor-pointer transition-colors"
                      >
                        <Plus size={14} />
                        <span>Adicionar compra agora</span>
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                      {cardExpenses.map((item) => {
                        const exp = item.expense;
                        const person = people.find((p) => p.id === exp.personId);
                        const catInfo = getCategoryInfo(exp.category);
                        const CatIcon = catInfo.icon;

                        return (
                          <div
                            key={exp.id}
                            className="py-3 flex items-center justify-between gap-3 group hover:bg-slate-50/70 dark:hover:bg-white/[0.02] px-2 rounded-2xl transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div 
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                                style={{ backgroundColor: `${catInfo.color}15`, borderColor: `${catInfo.color}30` }}
                              >
                                <CatIcon size={18} strokeWidth={1.8} style={{ color: catInfo.color }} />
                              </div>

                              <div className="truncate">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                    {exp.description}
                                  </span>
                                  {item.currentInstallmentForMonth && item.totalInstallments && item.totalInstallments > 1 && (
                                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-bold rounded-md shrink-0 shadow-2xs">
                                      {item.currentInstallmentForMonth}/{item.totalInstallments}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${person?.avatarBg || 'bg-slate-400'}`} />
                                  <span>{person?.name || 'Você'}</span>
                                  <span>•</span>
                                  <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">{exp.category}</span>
                                  {exp.date && (
                                    <>
                                      <span>•</span>
                                      <span>{exp.date.split('-').reverse().slice(0, 2).join('/')}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Amount & Actions */}
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tabular-nums tracking-tight">
                                  {formatCurrency(exp.amount)}
                                </span>
                                {exp.totalAmount && exp.type === 'parcelada' && (
                                  <span className="block text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                    Total: {formatCurrency(exp.totalAmount)}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => onEditExpense(exp)}
                                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2C2C2E] cursor-pointer transition-colors"
                                  title="Editar despesa"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteExpense(exp.id)}
                                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                                  title="Excluir despesa"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

            </motion.div>
          )}
        </>
      )}

      {/* Pay Bill Modal */}
      <PayCardBillModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        card={selectedCard}
        currentMonth={currentMonth}
        totalAmount={totalCardAmount}
        onConfirmPayment={(paymentData) => {
          onPayBill(
            paymentData.card,
            paymentData.paidAmount,
            paymentData.monthYear,
            paymentData.paymentType,
            paymentData.interestAmount,
            paymentData.rolledOverDebt,
            paymentData.nextMonth
          );
        }}
      />
    </div>
  );
}

export default CardsView;
