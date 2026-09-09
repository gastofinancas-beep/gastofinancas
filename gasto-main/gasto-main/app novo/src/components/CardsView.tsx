import React, { useState } from 'react';
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
  Check, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { CardBillPayment, CreditCard, ExpenseItem, Person } from '../types';
import { formatCurrency, formatMonthDisplay } from '../utils/financeCalculations';
import { BankLogo } from './BankLogo';

interface CardsViewProps {
  cards: CreditCard[];
  people: Person[];
  activeExpenses: { expense: ExpenseItem; currentInstallmentForMonth?: number; totalInstallments?: number }[];
  currentMonth: string;
  paidBills: CardBillPayment[];
  onOpenAddCard: () => void;
  onOpenAddExpenseForCard: (cardId: string) => void;
  onEditExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
  onTogglePaid: (id: string) => void;
  onPayBill: (card: CreditCard, amount: number, monthYear: string) => void;
  onUnpayBill: (cardId: string, monthYear: string) => void;
}

export function CardsView({
  cards,
  people,
  activeExpenses,
  currentMonth,
  paidBills,
  onOpenAddCard,
  onOpenAddExpenseForCard,
  onEditExpense,
  onDeleteExpense,
  onTogglePaid,
  onPayBill,
  onUnpayBill,
}: CardsViewProps) {
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');

  const selectedCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  const cardExpenses = activeExpenses.filter((e) => e.expense.cardId === selectedCard?.id);
  const totalCardAmount = cardExpenses.reduce((acc, curr) => acc + curr.expense.amount, 0);
  const isBillPaid = paidBills.some((p) => p.cardId === selectedCard?.id && p.monthYear === currentMonth);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Add Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            Meus Cartões de Crédito
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Faturas, limites utilizados e compras ativas em {formatMonthDisplay(currentMonth)}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddCard}
          className="self-start sm:self-auto flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95"
        >
          <Plus size={16} />
          <span>Novo Cartão</span>
        </button>
      </div>

      {/* Cards Horizontal Carousel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const exp = activeExpenses.filter((e) => e.expense.cardId === card.id);
          const total = exp.reduce((acc, curr) => acc + curr.expense.amount, 0);
          const isSelected = card.id === selectedCard?.id;
          const paid = paidBills.some((p) => p.cardId === card.id && p.monthYear === currentMonth);

          return (
            <div
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
              className={`cursor-pointer rounded-3xl p-5 relative overflow-hidden transition-all text-white shadow-md ${
                isSelected
                  ? 'ring-3 ring-emerald-500 scale-[1.02] shadow-xl'
                  : 'opacity-85 hover:opacity-100'
              } bg-gradient-to-br ${card.gradient || 'from-slate-800 to-slate-950'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <BankLogo bankName={card.bank || card.name} size={32} className="shadow-xs rounded-xl" />
                  <div>
                    <span className="text-[10px] font-bold tracking-wider uppercase opacity-80 block">
                      {card.bank}
                    </span>
                    <h3 className="font-extrabold text-base tracking-tight">{card.name}</h3>
                  </div>
                </div>
                {card.lastDigits && (
                  <span className="text-xs font-mono opacity-80 bg-black/20 px-2 py-0.5 rounded-md">•••• {card.lastDigits}</span>
                )}
              </div>

              <div className="mt-6 flex justify-between items-end">
                <div>
                  <span className="text-[10px] uppercase font-semibold opacity-75">Fatura Atual</span>
                  <p className="text-xl font-black">{formatCurrency(total)}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] opacity-75">Vencimento</span>
                  <p className="text-xs font-bold">Dia {card.dueDay}</p>
                </div>
              </div>

              {/* Status pill */}
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span className="opacity-80">Corte dia {card.closingDay}</span>
                {paid ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1">
                    <Check size={10} /> Paga
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/80 text-white font-bold text-[10px]">
                    Em Aberto
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Card Detailed Invoice */}
      {selectedCard && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <BankLogo bankName={selectedCard.bank || selectedCard.name} size={36} className="shadow-xs rounded-xl" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    Fatura: {selectedCard.name}
                  </h3>
                  {isBillPaid ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs border border-emerald-300 dark:border-emerald-800">
                      FATURA PAGA
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-extrabold text-xs border border-amber-300 dark:border-amber-800">
                      EM ABERTO
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Fechamento dia {selectedCard.closingDay} • Vencimento dia {selectedCard.dueDay}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isBillPaid ? (
                <button
                  type="button"
                  onClick={() => onUnpayBill(selectedCard.id, currentMonth)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <RotateCcw size={14} />
                  <span>Reabrir Fatura</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onPayBill(selectedCard, totalCardAmount, currentMonth)}
                  disabled={totalCardAmount === 0}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 size={15} />
                  <span>Pagar Fatura Integral ({formatCurrency(totalCardAmount)})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenAddExpenseForCard(selectedCard.id)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                title="Adicionar compra neste cartão"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Expenses in this Card */}
          {cardExpenses.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Nenhuma compra lançada neste cartão para o mês selecionado.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {cardExpenses.map((item) => {
                const exp = item.expense;
                const person = people.find((p) => p.id === exp.personId);

                return (
                  <div
                    key={exp.id}
                    className="py-3.5 flex items-center justify-between gap-3 group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-2xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onTogglePaid(exp.id)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          exp.paidByPerson
                            ? 'bg-emerald-600 text-white'
                            : 'border-2 border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-500'
                        }`}
                        title={exp.paidByPerson ? 'Gasto marcado como pago' : 'Marcar como pago'}
                      >
                        <Check size={12} strokeWidth={3} />
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {exp.description}
                          </span>
                          {item.currentInstallmentForMonth && (
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 rounded-md">
                              {item.currentInstallmentForMonth}/{item.totalInstallments}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span
                            className={`w-2 h-2 rounded-full ${person?.avatarBg || 'bg-slate-400'}`}
                          />
                          <span>{person?.name || 'Pessoa'}</span>
                          <span>•</span>
                          <span className="capitalize">{exp.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {formatCurrency(exp.amount)}
                        </span>
                        {exp.totalAmount && exp.type === 'parcelada' && (
                          <span className="block text-[10px] text-slate-400">
                            Total: {formatCurrency(exp.totalAmount)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => onEditExpense(exp)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteExpense(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
