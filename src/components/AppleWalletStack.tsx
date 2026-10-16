import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Layers, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { CardBillPayment, CreditCard, ExpenseItem } from '../types';
import { CreditCardVisual } from './CreditCardVisual';
import { BankLogo } from './BankLogo';
import { formatCurrency, formatMonthDisplay } from '../utils/financeCalculations';
import { triggerHaptic } from '../utils/haptics';

interface AppleWalletStackProps {
  cards: CreditCard[];
  selectedCardId: string;
  onSelectCard: (cardId: string) => void;
  activeExpenses: { expense: ExpenseItem; currentInstallmentForMonth?: number; totalInstallments?: number }[];
  paidBills: CardBillPayment[];
  currentMonth: string;
  getDueStatus: (card: CreditCard, isPaid: boolean) => { text: string; color: string };
  onOpenAddCard: () => void;
  newlyAddedCardId?: string | null;
}

export function AppleWalletStack({
  cards,
  selectedCardId,
  onSelectCard,
  activeExpenses,
  paidBills,
  currentMonth,
  getDueStatus,
  onOpenAddCard,
  newlyAddedCardId,
}: AppleWalletStackProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [metricMode, setMetricMode] = useState<'invoice' | 'limit'>('invoice');

  // Total das faturas de todos os cartões
  const totalInvoices = cards.reduce((acc, card) => {
    const exp = activeExpenses.filter((e) => e.expense.cardId === card.id);
    return acc + exp.reduce((sum, curr) => sum + curr.expense.amount, 0);
  }, 0);

  const totalLimits = cards.reduce((acc, card) => acc + (card.limit || 0), 0);
  const totalAvailable = Math.max(0, totalLimits - totalInvoices);

  if (!cards || cards.length === 0) {
    return null;
  }

  const selectedCard = cards.find((c) => c.id === selectedCardId) || cards[0];
  const selectedIndex = Math.max(0, cards.findIndex((c) => c.id === selectedCard?.id));

  // Se houver apenas 1 cartão
  if (cards.length === 1) {
    const card = cards[0];
    const isPaid = paidBills.some((p) => p.cardId === card.id && p.monthYear === currentMonth);
    const exp = activeExpenses.filter((e) => e.expense.cardId === card.id);
    const totalInvoice = exp.reduce((acc, curr) => acc + curr.expense.amount, 0);
    const availLimit = Math.max(0, (card.limit || 0) - totalInvoice);
    const dueStatus = getDueStatus(card, isPaid);

    return (
      <div className="w-full max-w-lg mx-auto">
        <motion.div
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="cursor-pointer"
        >
          <CreditCardVisual
            card={card}
            totalInvoice={totalInvoice}
            availableLimit={availLimit}
            dueStatus={dueStatus}
            isSelected={true}
            interactive={true}
            tiltLimit={14}
            scale={1.03}
          />
        </motion.div>
      </div>
    );
  }

  // Deslocamento vertical refinado (Apple Wallet)
  // No estilo da Apple Wallet, quando um cartão está selecionado, ele sobe e os outros dão espaço
  const collapsedHeaderPeek = 54; // Altura visível de cada cartão na pilha

  return (
    <div className="w-full max-w-lg mx-auto select-none">
      {/* Container Principal da Carteira */}
      <div className="relative rounded-[30px] sm:rounded-[36px] bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-md overflow-hidden transition-all duration-300">
        
        {/* Cabeçalho Limpo e Profissional */}
        <div className="pt-4 px-5 sm:px-6 pb-3 flex items-center justify-between z-30 relative border-b border-slate-200/60 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Cartões
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.06]">
              {cards.length}
            </span>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsExpanded(!isExpanded);
              triggerHaptic(8);
            }}
            className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer border border-slate-200/60 dark:border-white/[0.08] shadow-xs"
          >
            <Layers size={13} className="text-emerald-400" />
            <span>{isExpanded ? 'Empilhar' : 'Expandir'}</span>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </motion.button>
        </div>

        {/* ÁREA DOS CARTÕES (STACK APPLE WALLET) */}
        <div id="cards-container" className="p-3.5 sm:p-5 relative">
          
          {isExpanded ? (
            /* Modo Expandido: Todos os cartões em lista aberta com transições de layout */
            <div className="space-y-4 pb-2">
              <AnimatePresence mode="popLayout">
                {cards.map((card, index) => {
                  const isSelected = card.id === selectedCard.id;
                  const isNewlyAdded = card.id === newlyAddedCardId;
                  const isPaid = paidBills.some((p) => p.cardId === card.id && p.monthYear === currentMonth);
                  const exp = activeExpenses.filter((e) => e.expense.cardId === card.id);
                  const totalInvoice = exp.reduce((acc, curr) => acc + curr.expense.amount, 0);
                  const availLimit = Math.max(0, (card.limit || 0) - totalInvoice);
                  const dueStatus = getDueStatus(card, isPaid);

                  return (
                    <motion.div
                      key={card.id}
                      layout
                      initial={
                        isNewlyAdded
                          ? { opacity: 0, y: 35, scale: 0.88, rotateZ: -2 }
                          : { opacity: 0, y: 15, scale: 0.95 }
                      }
                      animate={{ opacity: 1, y: 0, scale: 1, rotateZ: 0 }}
                      exit={{ opacity: 0, scale: 0.85, y: -20, transition: { duration: 0.22 } }}
                      whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ 
                        type: 'spring', 
                        stiffness: isNewlyAdded ? 320 : 400, 
                        damping: 28 
                      }}
                      onClick={() => {
                        onSelectCard(card.id);
                        triggerHaptic(8);
                      }}
                      className={`relative cursor-pointer transition-all duration-200 rounded-[22px] ${
                        isNewlyAdded
                          ? 'ring-4 ring-emerald-400/90 shadow-[0_0_35px_rgba(16,185,129,0.4)]'
                          : isSelected
                            ? 'shadow-[0_16px_32px_rgba(0,0,0,0.7)] ring-2 ring-emerald-500/30'
                            : 'opacity-85 hover:opacity-100'
                      }`}
                    >
                      {isNewlyAdded && (
                        <div className="absolute -top-3 right-4 z-50 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] tracking-wide shadow-lg shadow-emerald-500/30 flex items-center gap-1 border border-emerald-300 pointer-events-none">
                          <Sparkles size={11} className="stroke-[2.5]" />
                          <span>NOVO CARTÃO</span>
                        </div>
                      )}
                      <CreditCardVisual
                        card={card}
                        totalInvoice={totalInvoice}
                        availableLimit={availLimit}
                        dueStatus={dueStatus}
                        isSelected={isSelected}
                        interactive={true}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            /* Modo Stack Apple Wallet (Pilha Dinâmica com Reorganização Automática) */
            <motion.div 
              layout
              className="relative w-full"
              style={{
                height: `${210 + (cards.length - 1) * collapsedHeaderPeek}px`,
              }}
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 30,
              }}
            >
              <AnimatePresence mode="popLayout">
                {cards.map((card, index) => {
                  const isSelected = card.id === selectedCard.id;
                  const isNewlyAdded = card.id === newlyAddedCardId;
                  const isPaid = paidBills.some((p) => p.cardId === card.id && p.monthYear === currentMonth);
                  const exp = activeExpenses.filter((e) => e.expense.cardId === card.id);
                  const totalInvoice = exp.reduce((acc, curr) => acc + curr.expense.amount, 0);
                  const availLimit = Math.max(0, (card.limit || 0) - totalInvoice);
                  const dueStatus = getDueStatus(card, isPaid);

                  // Posicionamento vertical dinâmico estilo Apple Wallet
                  const yPos = index * collapsedHeaderPeek;
                  const zIndex = isNewlyAdded ? 50 : isSelected ? 40 : 10 + index;

                  return (
                    <motion.div
                      key={card.id}
                      layout
                      initial={
                        isNewlyAdded
                          ? { opacity: 0, scale: 0.8, y: yPos + 60, rotateZ: -3 }
                          : { opacity: 0, scale: 0.9, y: yPos + 20 }
                      }
                      animate={{
                        opacity: 1,
                        y: yPos,
                        scale: isSelected ? 1.02 : 1 - (cards.length - 1 - index) * 0.015,
                        rotateZ: 0,
                        zIndex,
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.85,
                        y: yPos - 30,
                        zIndex: 50,
                        transition: { duration: 0.25 }
                      }}
                      whileHover={
                        !isSelected
                          ? { y: yPos - 12, scale: 1.008, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }
                          : { scale: 1.025, transition: { duration: 0.22 } }
                      }
                      whileTap={{ scale: 0.985 }}
                      transition={{
                        layout: {
                          type: 'spring',
                          stiffness: 340,
                          damping: 26,
                        },
                        type: 'spring',
                        stiffness: isNewlyAdded ? 320 : 380,
                        damping: 28,
                      }}
                      onClick={() => {
                        onSelectCard(card.id);
                        triggerHaptic(10);
                      }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex,
                      }}
                      className={`cursor-pointer transition-all duration-300 rounded-[22px] ${
                        isNewlyAdded
                          ? 'ring-4 ring-emerald-400/90 shadow-[0_0_40px_rgba(16,185,129,0.45)]'
                          : isSelected
                            ? 'drop-shadow-[0_22px_40px_rgba(0,0,0,0.9)]'
                            : 'drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] opacity-95 hover:opacity-100'
                      }`}
                    >
                      {/* Badge NOVO flutuante no cartão recém-adicionado */}
                      {isNewlyAdded && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.7, y: -6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 20 }}
                          className="absolute -top-3 right-4 z-50 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] tracking-wide shadow-lg shadow-emerald-500/30 flex items-center gap-1 border border-emerald-300 pointer-events-none"
                        >
                          <Sparkles size={11} className="stroke-[2.5]" />
                          <span>NOVO CARTÃO</span>
                        </motion.div>
                      )}

                      <CreditCardVisual
                        card={card}
                        totalInvoice={totalInvoice}
                        availableLimit={availLimit}
                        dueStatus={dueStatus}
                        isSelected={isSelected}
                        interactive={true}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

        </div>

        {/* RODAPÉ ELEGANTE COM TOTAL BALANCE (Sem botões extras feios de seleção) */}
        <div className="px-5 sm:px-6 pb-5 pt-3.5 z-50 relative bg-slate-50 dark:bg-[#1C1C1E] border-t border-slate-200/60 dark:border-white/[0.08]">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {metricMode === 'invoice' ? 'Total Faturas' : 'Total Limites'}
                </span>
                <button
                  type="button"
                  onClick={() => setMetricMode(metricMode === 'invoice' ? 'limit' : 'invoice')}
                  className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold underline cursor-pointer"
                >
                  {metricMode === 'invoice' ? 'Ver Limites' : 'Ver Faturas'}
                </button>
              </div>

              <div className="flex items-center gap-3 mt-1">
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {showBalance ? (
                    formatCurrency(metricMode === 'invoice' ? totalInvoices : totalLimits)
                  ) : (
                    <span className="tracking-widest">••••••••</span>
                  )}
                </h3>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <span>Selecionado: <strong className="text-slate-800 dark:text-white font-bold">{selectedCard.name}</strong></span>
                <span>•</span>
                <span>{formatMonthDisplay(currentMonth)}</span>
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              {/* Botão de Olho (Show/Hide Balance) */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowBalance(!showBalance);
                  triggerHaptic(6);
                }}
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-200/60 dark:border-white/[0.08] shadow-md"
                title={showBalance ? 'Ocultar Saldo' : 'Mostrar Saldo'}
              >
                {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
              </motion.button>

              {/* Indicador de 4 últimos dígitos do cartão selecionado */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/[0.02] px-2.5 py-1 rounded-full border border-slate-200/60 dark:border-white/[0.06] shadow-xs">
                <BankLogo bankName={selectedCard.bank || selectedCard.name} size={16} className="shrink-0" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  •••• {selectedCard.lastDigits || '••••'}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AppleWalletStack;
