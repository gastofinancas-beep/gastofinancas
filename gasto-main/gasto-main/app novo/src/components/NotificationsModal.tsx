import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronLeft, 
  Bell, 
  CreditCard as CardIcon, 
  Sparkles, 
  Check, 
  ChevronRight,
  Calendar
} from 'lucide-react';
import { CreditCard, SubscriptionItem, ExpenseItem, MainTabType } from '../types';
import { formatCurrency } from '../utils/financeCalculations';
import { currentMonthLocal } from '../utils/dateUtils';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards?: CreditCard[];
  subscriptions?: SubscriptionItem[];
  expenses?: ExpenseItem[];
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
  currentMonth = currentMonthLocal(),
  onTabChange,
  onOpenProfile,
}: NotificationsModalProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('todos');

  const today = new Date();
  const currentDay = today.getDate();

  // Process card bills
  const cardItems = useMemo(() => {
    return cards.map(card => {
      const cardExpenses = expenses.filter(e => {
        if (e.cardId !== card.id) return false;
        return e.startMonthYear === currentMonth || e.date?.startsWith(currentMonth);
      });
      const billTotal = cardExpenses.reduce((sum, exp) => sum + exp.amount, 0);

      const dueDay = card.dueDay;
      const daysDiff = dueDay - currentDay;

      let status: 'overdue' | 'today' | 'upcoming' | 'later' = 'later';
      if (daysDiff < 0) {
        status = daysDiff >= -4 ? 'overdue' : 'later';
      } else if (daysDiff === 0) {
        status = 'today';
      } else if (daysDiff <= 7) {
        status = 'upcoming';
      }

      return {
        id: `card-${card.id}`,
        type: 'card' as const,
        name: card.name,
        subtitle: `Fatura • Vence dia ${card.dueDay}`,
        dueDay,
        closingDay: card.closingDay,
        amount: billTotal,
        daysDiff,
        status,
        color: card.color || '#10b981',
      };
    });
  }, [cards, expenses, currentMonth, currentDay]);

  // Process subscriptions
  const subscriptionItems = useMemo(() => {
    return subscriptions
      .filter(sub => sub.active)
      .map(sub => {
        const billingDay = sub.billingDay;
        const daysDiff = billingDay - currentDay;

        let status: 'overdue' | 'today' | 'upcoming' | 'later' = 'later';
        if (daysDiff < 0) {
          status = daysDiff >= -3 ? 'overdue' : 'later';
        } else if (daysDiff === 0) {
          status = 'today';
        } else if (daysDiff <= 7) {
          status = 'upcoming';
        }

        return {
          id: `sub-${sub.id}`,
          type: 'subscription' as const,
          name: sub.name,
          subtitle: `Assinatura • Dia ${sub.billingDay}`,
          dueDay: billingDay,
          closingDay: undefined,
          amount: sub.amount,
          daysDiff,
          status,
          color: sub.color || '#6366f1',
        };
      });
  }, [subscriptions, currentDay]);

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
      if (s === 'overdue') return -100 + d;
      if (s === 'today') return -50;
      if (s === 'upcoming') return d;
      return 100 + d;
    };

    return items.sort((a, b) => weight(a.status, a.daysDiff) - weight(b.status, b.daysDiff));
  }, [activeFilter, cardItems, subscriptionItems]);

  const urgentCount = allItems.filter(i => i.status === 'overdue' || i.status === 'today').length;
  const upcomingCount = allItems.filter(i => i.status === 'upcoming').length;

  const handleNavigate = (type: 'card' | 'subscription') => {
    if (onTabChange) {
      onTabChange(type === 'card' ? 'cartoes' : 'assinaturas');
    }
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 dark:bg-black/75 backdrop-blur-xs p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 14 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="w-full h-full sm:h-[85vh] sm:max-w-lg sm:rounded-3xl bg-white dark:bg-[#09090B] text-slate-900 dark:text-white shadow-xl sm:border border-slate-200/60 dark:border-white/[0.08]/80 flex flex-col overflow-hidden"
      >
        {/* Minimal Clean Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.08]/80 flex items-center justify-between shrink-0 bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 -ml-1 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]/60 flex items-center justify-center transition-colors cursor-pointer"
              title="Voltar"
              aria-label="Voltar"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Lembretes & Notificações
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04] flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Clean Filter Switch */}
        <div className="px-5 pt-3 pb-2 shrink-0">
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-[#1C1C1E] flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter('todos')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeFilter === 'todos'
                  ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Todos ({cardItems.length + subscriptionItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('cartoes')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeFilter === 'cartoes'
                  ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Cartões ({cardItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('assinaturas')}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeFilter === 'assinaturas'
                  ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Assinaturas ({subscriptionItems.length})
            </button>
          </div>
        </div>

        {/* Status Line (Minimalist) */}
        {(urgentCount > 0 || upcomingCount > 0) && (
          <div className="px-5 py-1.5">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              {urgentCount > 0 && (
                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {urgentCount} pendência{urgentCount > 1 ? 's' : ''} hoje
                </span>
              )}
              {upcomingCount > 0 && (
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  {upcomingCount} nos próximos 7 dias
                </span>
              )}
            </div>
          </div>
        )}

        {/* Content List */}
        <div className="flex-1 overflow-y-auto px-5 py-2 divide-y divide-slate-100 dark:divide-white/[0.06]">
          {allItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#1C1C1E] text-slate-500 dark:text-slate-400 flex items-center justify-center mb-3">
                <Check size={22} className="stroke-[2.5]" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Tudo em dia!
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                Nenhum vencimento ou fatura pendente cadastrada no momento.
              </p>
            </div>
          ) : (
            allItems.map(item => {
              const isOverdue = item.status === 'overdue';
              const isToday = item.status === 'today';
              const isUpcoming = item.status === 'upcoming';

              return (
                <div
                  key={item.id}
                  onClick={() => handleNavigate(item.type)}
                  className="py-3 flex items-center justify-between gap-3 group cursor-pointer hover:bg-slate-50/60 dark:hover:bg-white/[0.04] -mx-3 px-3 rounded-xl transition-colors"
                >
                  {/* Left: Clean Icon + Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.type === 'card' ? (
                        <CardIcon size={18} className="stroke-[2]" />
                      ) : (
                        <Sparkles size={18} className="stroke-[2]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount & Status Tag */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(item.amount)}
                      </p>
                      <span className={`inline-block text-xs font-normal text-slate-500 ${
                        isOverdue 
                          ? 'text-rose-600 dark:text-rose-400 font-semibold' 
                          : isToday 
                          ? 'text-amber-600 dark:text-amber-400 font-semibold' 
                          : isUpcoming 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {isOverdue 
                          ? `Venceu há ${Math.abs(item.daysDiff)}d` 
                          : isToday 
                          ? 'Vence hoje' 
                          : isUpcoming 
                          ? `Em ${item.daysDiff} dias` 
                          : `Dia ${item.dueDay}`}
                      </span>
                    </div>

                    <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Minimal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-400 shrink-0">
          {onOpenProfile ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenProfile();
              }}
              className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Bell size={13} />
              Configurar Push no Celular
            </button>
          ) : (
            <span>Toque em um item para gerenciar</span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="font-medium text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </motion.div>
    </div>,
    document.body
  );
}
