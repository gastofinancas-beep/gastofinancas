import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Check, ChevronRight, Repeat } from 'lucide-react';
import { BankLogo } from './BankLogo';
import { CreditCard, SubscriptionItem, ExpenseItem, MainTabType, CardBillPayment } from '../types';
import { formatCurrency } from '../utils/financeCalculations';
import { getCardBillTotal, getNextDue, isCardBillPaid } from '../utils/billReminders';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards?: CreditCard[];
  subscriptions?: SubscriptionItem[];
  expenses?: ExpenseItem[];
  paidBills?: CardBillPayment[];
  /** Mantido por compatibilidade: os lembretes usam sempre o mês real, não o mês que a pessoa está vendo. */
  currentMonth?: string;
  onTabChange?: (tab: MainTabType) => void;
  onOpenProfile?: () => void;
}

type FilterTab = 'todos' | 'cartoes' | 'assinaturas';

export function NotificationsModal({
  isOpen,
  onClose,
  cards = [],
  subscriptions = [],
  expenses = [],
  paidBills = [],
  onTabChange,
  onOpenProfile,
}: NotificationsModalProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('todos');

  const today = new Date();

  type ReminderStatus = 'paid' | 'overdue' | 'today' | 'upcoming' | 'later';
  const statusFor = (daysDiff: number): ReminderStatus => {
    if (daysDiff < 0) return 'overdue';
    if (daysDiff === 0) return 'today';
    if (daysDiff <= 7) return 'upcoming';
    return 'later';
  };

  // Process card bills
  const cardItems = useMemo(() => {
    return cards.map(card => {
      const dueDay = card.dueDay || 15;
      const { billMonth, daysDiff } = getNextDue(dueDay, today);
      const paid = isCardBillPaid(card, paidBills, billMonth);
      const status: ReminderStatus = paid ? 'paid' : statusFor(daysDiff);

      return {
        id: `card-${card.id}`,
        type: 'card' as const,
        name: card.name,
        subtitle: `Cartão · dia ${dueDay}`,
        dueDay,
        closingDay: card.closingDay,
        amount: getCardBillTotal(card, expenses, billMonth),
        daysDiff,
        status,
        color: card.color || '#10b981',
        bank: card.bank,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, expenses, paidBills, today.toDateString()]);

  // Process subscriptions
  const subscriptionItems = useMemo(() => {
    return subscriptions
      .filter(sub => sub.active)
      .map(sub => {
        const { daysDiff } = getNextDue(sub.billingDay, today, 3);

        return {
          id: `sub-${sub.id}`,
          type: 'subscription' as const,
          name: sub.name,
          subtitle: `Assinatura · dia ${sub.billingDay}`,
          dueDay: sub.billingDay,
          closingDay: undefined,
          amount: sub.amount,
          daysDiff,
          status: statusFor(daysDiff),
          color: sub.color || '#6366f1',
          bank: undefined as string | undefined,
        };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions, today.toDateString()]);

  // Combined & sorted
  const allItems = useMemo(() => {
    let items = [];
    if (activeFilter === 'todos') {
      items = [...cardItems, ...subscriptionItems];
    } else if (activeFilter === 'cartoes') {
      items = [...cardItems];
    } else {
      items = [...subscriptionItems];
    }

    // Sort: Overdue first, then Today, then Upcoming, then Later
    const weight = (s: string, d: number) => {
      if (s === 'paid') return 1000;
      if (s === 'overdue') return -100 + d;
      if (s === 'today') return -50;
      if (s === 'upcoming') return d;
      return 100 + d;
    };

    return items.sort((a, b) => weight(a.status, a.daysDiff) - weight(b.status, b.daysDiff));
  }, [activeFilter, cardItems, subscriptionItems]);

  const urgentCount = allItems.filter(i => i.status === 'overdue' || i.status === 'today').length;

  const pending = allItems.filter(i => i.status !== 'paid');
  const weekTotal = pending
    .filter(i => i.status === 'overdue' || i.status === 'today' || i.status === 'upcoming')
    .reduce((sum, i) => sum + i.amount, 0);
  const weekCount = pending.filter(i => i.status !== 'later').length;

  const groups: { key: string; label: string; items: typeof allItems }[] = [
    { key: 'overdue', label: 'Em atraso', items: allItems.filter(i => i.status === 'overdue') },
    { key: 'today', label: 'Hoje', items: allItems.filter(i => i.status === 'today') },
    { key: 'upcoming', label: 'Próximos 7 dias', items: allItems.filter(i => i.status === 'upcoming') },
    { key: 'later', label: 'Mais adiante', items: allItems.filter(i => i.status === 'later') },
    { key: 'paid', label: 'Pagas neste ciclo', items: allItems.filter(i => i.status === 'paid') },
  ].filter(g => g.items.length > 0);

  const whenLabel = (status: string, d: number, dueDay: number) => {
    if (status === 'paid') return 'Paga';
    if (status === 'overdue') return d === -1 ? 'Venceu ontem' : `Venceu há ${Math.abs(d)} dias`;
    if (status === 'today') return 'Vence hoje';
    if (d === 1) return 'Vence amanhã';
    if (status === 'upcoming') return `Em ${d} dias`;
    return `Dia ${dueDay}`;
  };

  const handleNavigate = (type: 'card' | 'subscription') => {
    if (onTabChange) onTabChange(type === 'card' ? 'cartoes' : 'assinaturas');
    onClose();
  };

  if (!isOpen) return null;

  const filters: { id: FilterTab; label: string }[] = [
    { id: 'todos', label: 'Tudo' },
    { id: 'cartoes', label: 'Cartões' },
    { id: 'assinaturas', label: 'Assinaturas' },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/40 dark:bg-black/75 backdrop-blur-xs p-0 sm:p-4" onClick={onClose}>
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full h-[100dvh] sm:h-[85vh] sm:max-w-lg sm:rounded-3xl bg-slate-50 dark:bg-[#09090B] text-slate-900 dark:text-white shadow-xl sm:border border-slate-200/60 dark:border-white/[0.08] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 shrink-0 bg-white dark:bg-[#1C1C1E] border-b border-slate-200/60 dark:border-white/[0.08]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Vencimentos</p>
              <h1 className="text-xl font-bold tracking-tight mt-0.5">Avisos</h1>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 -mr-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4">
            {weekCount > 0 ? (
              <>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">A pagar nos próximos 7 dias</p>
                <p className="text-3xl font-bold tracking-tight mt-1 tabular-nums">{formatCurrency(weekTotal)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {weekCount} {weekCount === 1 ? 'vencimento' : 'vencimentos'}
                  {urgentCount > 0 && <span className="text-rose-600 dark:text-rose-400 font-medium"> · {urgentCount} {urgentCount === 1 ? 'precisa de atenção' : 'precisam de atenção'}</span>}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300">Nenhum vencimento nos próximos 7 dias.</p>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            {filters.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/[0.1]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista agrupada */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {groups.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <Check size={22} className="stroke-[2.5]" />
              </div>
              <p className="text-sm font-semibold">Nada a pagar por enquanto</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                Cadastre cartões e assinaturas para receber os avisos de vencimento aqui.
              </p>
            </div>
          ) : (
            groups.map(group => (
              <section key={group.key}>
                <h2 className={`text-[11px] uppercase tracking-wider font-semibold mb-2 px-1 ${
                  group.key === 'overdue' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {group.label}
                </h2>
                <div className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] divide-y divide-slate-100 dark:divide-white/[0.06] overflow-hidden">
                  {group.items.map(item => {
                    const tone =
                      item.status === 'overdue' ? 'text-rose-600 dark:text-rose-400'
                      : item.status === 'today' ? 'text-amber-600 dark:text-amber-400'
                      : item.status === 'paid' ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400';
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavigate(item.type)}
                        className={`w-full px-4 py-3.5 flex items-center gap-3 text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors ${item.status === 'paid' ? 'opacity-70' : ''}`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                          {item.type === 'card' ? (
                            <BankLogo bankName={item.bank || item.name} size={26} />
                          ) : (
                            <Repeat size={17} style={{ color: item.color }} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{item.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.subtitle}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold tabular-nums">{formatCurrency(item.amount)}</p>
                          <p className={`text-xs font-medium ${tone}`}>{whenLabel(item.status, item.daysDiff, item.dueDay)}</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        {/* Rodapé */}
        {onOpenProfile && (
          <div className="px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0 bg-white dark:bg-[#1C1C1E] border-t border-slate-200/60 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => { onClose(); onOpenProfile(); }}
              className="w-full flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <span className="flex items-center gap-2"><Bell size={15} className="text-emerald-600 dark:text-emerald-400" />Ativar avisos no celular</span>
              <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
            </button>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
}
