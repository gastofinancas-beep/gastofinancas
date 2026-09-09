import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Plus, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  Phone, 
  Send, 
  Check, 
  Copy,
  Edit3,
  Trash2,
  CreditCard as CardIcon,
  ShieldCheck,
  Sparkles,
  LayoutGrid,
  List,
  CheckCheck,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, ExpenseItem, Person, UserProfile } from '../types';
import { formatCurrency, formatMonthDisplay } from '../utils/financeCalculations';

interface PeopleSplitViewProps {
  people: Person[];
  cards: CreditCard[];
  activeExpenses: { expense: ExpenseItem; currentInstallmentForMonth?: number; totalInstallments?: number }[];
  currentMonth: string;
  userProfile?: UserProfile;
  onToggleExpensePaid: (id: string) => void;
  onMarkAllPersonExpensesPaid: (personId: string, month: string) => void;
  onOpenAddPerson: () => void;
  onEditPerson?: (person: Person) => void;
  onDeletePerson?: (personId: string) => void;
  onOpenAddExpenseForPerson: (personId: string) => void;
  onEditExpense?: (expense: ExpenseItem) => void;
  onDeleteExpense?: (expenseId: string) => void;
}

export function PeopleSplitView({
  people,
  cards,
  activeExpenses,
  currentMonth,
  userProfile,
  onToggleExpensePaid,
  onMarkAllPersonExpensesPaid,
  onOpenAddPerson,
  onEditPerson,
  onDeletePerson,
  onOpenAddExpenseForPerson,
  onEditExpense,
  onDeleteExpense,
}: PeopleSplitViewProps) {
  const [copiedPersonId, setCopiedPersonId] = useState<string | null>(null);
  const [copiedPixKey, setCopiedPixKey] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'settled'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Calculate Consolidated Split Analytics
  const splitAnalytics = useMemo(() => {
    let grandTotal = 0;
    let selfTotal = 0;
    let borrowedTotal = 0;
    let borrowedPaid = 0;
    let borrowedPending = 0;

    people.forEach((person) => {
      const items = activeExpenses.filter((e) => e.expense.personId === person.id);
      const total = items.reduce((acc, curr) => acc + curr.expense.amount, 0);
      const paid = items.filter((e) => e.expense.paidByPerson).reduce((acc, curr) => acc + curr.expense.amount, 0);
      const pending = total - paid;

      grandTotal += total;
      if (person.isSelf) {
        selfTotal += total;
      } else {
        borrowedTotal += total;
        borrowedPaid += paid;
        borrowedPending += pending;
      }
    });

    return {
      grandTotal,
      selfTotal,
      borrowedTotal,
      borrowedPaid,
      borrowedPending,
    };
  }, [people, activeExpenses]);

  // Generate WhatsApp Message
  const generatePixMessage = (person: Person, total: number, pending: number, items: any[]) => {
    let msg = `Olá, ${person.name}! 👋\nSeguem suas compras no meu cartão em *${formatMonthDisplay(currentMonth)}*:\n\n`;
    
    items.forEach((item, index) => {
      const card = cards.find((c) => c.id === item.expense.cardId)?.name || 'Cartão';
      const inst = item.currentInstallmentForMonth ? ` (Parcela ${item.currentInstallmentForMonth}/${item.totalInstallments})` : '';
      const status = item.expense.paidByPerson ? '✅ Pago' : '⏳ Pendente';
      msg += `${index + 1}. *${item.expense.description}*${inst}\n   💳 ${card} • ${formatCurrency(item.expense.amount)} [${status}]\n`;
    });

    msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    if (pending > 0) {
      msg += `💰 *Valor a acertar este mês: ${formatCurrency(pending)}*\n`;
    } else {
      msg += `🎉 *Status: Todas as compras já estão quitadas!*\n`;
    }

    const myPixKey = userProfile?.pixKey || person.pixKey;
    if (myPixKey) {
      msg += `🔑 *Chave Pix para transferência:* ${myPixKey}\n`;
    }

    msg += `\nObrigado! 😊`;
    return msg;
  };

  const handleCopyMessage = (person: Person, total: number, pending: number, items: any[]) => {
    const msg = generatePixMessage(person, total, pending, items);
    navigator.clipboard.writeText(msg);
    setCopiedPersonId(person.id);
    setTimeout(() => setCopiedPersonId(null), 2500);
  };

  const handleOpenWhatsApp = (person: Person, total: number, pending: number, items: any[]) => {
    const msg = generatePixMessage(person, total, pending, items);
    const cleanPhone = person.phone?.replace(/\D/g, '');
    const url = cleanPhone 
      ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleCopyPixKey = (key: string, personId: string) => {
    navigator.clipboard.writeText(key);
    setCopiedPixKey(personId);
    setTimeout(() => setCopiedPixKey(null), 2000);
  };

  // Filtered people
  const filteredPeople = useMemo(() => {
    return people.filter((person) => {
      const items = activeExpenses.filter((e) => e.expense.personId === person.id);
      const total = items.reduce((acc, curr) => acc + curr.expense.amount, 0);
      const paid = items.filter((e) => e.expense.paidByPerson).reduce((acc, curr) => acc + curr.expense.amount, 0);
      const pending = total - paid;
      const isSettled = total > 0 && pending === 0;

      if (filterType === 'pending') return pending > 0;
      if (filterType === 'settled') return isSettled;
      return true;
    });
  }, [people, activeExpenses, filterType]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* HEADER WITH TITLE & ACTION BUTTON                                         */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-2xs">
            <Users size={20} className="stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Divisão de Contas & Cobrança
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Acertos e cobranças de compras compartilhadas em {formatMonthDisplay(currentMonth)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAddPerson}
          className="self-start sm:self-auto flex items-center gap-2 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <UserPlus size={15} />
          <span>Nova Pessoa</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* UNIFIED DASHBOARD SUMMARY CARD (CONSOLIDATED METRICS)                     */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/[0.08] shadow-[0_2px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-white/[0.06]">
          
          {/* 1. Total Emprestado */}
          <div className="p-5 flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CardIcon size={14} className="text-indigo-500" />
                Emprestado
              </span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/40 px-2 py-0.5 rounded-full">
                {splitAnalytics.grandTotal > 0 ? `${((splitAnalytics.borrowedTotal / splitAnalytics.grandTotal) * 100).toFixed(0)}% da fatura` : '0%'}
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(splitAnalytics.borrowedTotal)}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Compras de terceiros
              </p>
            </div>
          </div>

          {/* 2. Pendente para Receber (A Cobrar) */}
          <div className="p-5 flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock size={14} className="text-amber-500" />
                A Receber
              </span>
              {splitAnalytics.borrowedPending > 0 ? (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/40 px-2 py-0.5 rounded-full">
                  Pendente
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 px-2 py-0.5 rounded-full">
                  Quitado
                </span>
              )}
            </div>
            <div>
              <div className={`text-xl sm:text-2xl font-black tracking-tight ${
                splitAnalytics.borrowedPending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
              }`}>
                {formatCurrency(splitAnalytics.borrowedPending)}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Pendente de acerto
              </p>
            </div>
          </div>

          {/* 3. Já Acertado / Quitado */}
          <div className="p-5 flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Já Quitado
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 px-2 py-0.5 rounded-full">
                {splitAnalytics.borrowedTotal > 0 ? `${((splitAnalytics.borrowedPaid / splitAnalytics.borrowedTotal) * 100).toFixed(0)}% recebido` : '100%'}
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {formatCurrency(splitAnalytics.borrowedPaid)}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Transferido para você
              </p>
            </div>
          </div>

          {/* 4. Seus Gastos Pessoais (Titular) */}
          <div className="p-5 flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-blue-500" />
                Seus Gastos
              </span>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/40 px-2 py-0.5 rounded-full">
                {splitAnalytics.grandTotal > 0 ? `${((splitAnalytics.selfTotal / splitAnalytics.grandTotal) * 100).toFixed(0)}% da fatura` : '100%'}
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(splitAnalytics.selfTotal)}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Suas compras próprias
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* FILTER BAR & VIEW TOGGLE                                                  */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* iOS Segmented Filter Control */}
        <div className="flex items-center p-1 bg-slate-100/90 dark:bg-white/[0.06] rounded-2xl border border-slate-200/60 dark:border-white/[0.05]">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todos ({people.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'pending'
                ? 'bg-white dark:bg-[#1C1C1E] text-amber-600 dark:text-amber-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pendentes
          </button>
          <button
            type="button"
            onClick={() => setFilterType('settled')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'settled'
                ? 'bg-white dark:bg-[#1C1C1E] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Quitados
          </button>
        </div>

        {/* Right side: View Switcher & subtle tip */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex text-xs text-slate-400 dark:text-slate-500 items-center gap-1.5">
            <Sparkles size={13} className="text-amber-500 shrink-0" />
            <span>Clique no círculo da compra para alternar pagamento</span>
          </div>

          <div className="flex items-center p-1 bg-slate-100/90 dark:bg-white/[0.06] rounded-2xl border border-slate-200/60 dark:border-white/[0.05] self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Visualização em Lista Consolidada"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PEOPLE VIEW: GRID MODE (APPLE CLEAN MINIMAL CARDS)                        */}
      {/* ========================================================================= */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredPeople.map((person) => {
              const personItems = activeExpenses.filter((e) => e.expense.personId === person.id);
              const totalAmount = personItems.reduce((acc, curr) => acc + curr.expense.amount, 0);
              const paidAmount = personItems
                .filter((e) => e.expense.paidByPerson)
                .reduce((acc, curr) => acc + curr.expense.amount, 0);
              const pendingAmount = totalAmount - paidAmount;
              const isSettled = totalAmount > 0 && pendingAmount === 0;
              const progressPercent = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 100;

              return (
                <motion.div
                  key={person.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col justify-between group transition-all"
                >
                  <div>
                    {/* Minimalist Card Header */}
                    <div className="p-5 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Clean Soft Avatar */}
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                            person.isSelf
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40'
                              : 'bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/[0.05]'
                          }`}
                        >
                          {person.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="font-bold text-base text-slate-900 dark:text-white truncate tracking-tight">
                              {person.name}
                            </h2>
                            {person.isSelf && (
                              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-[10px] rounded-lg border border-blue-200/60 dark:border-blue-800/40">
                                Titular (Você)
                              </span>
                            )}
                          </div>

                          {/* Secondary info pills */}
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                            <span>
                              {personItems.length} {personItems.length === 1 ? 'compra' : 'compras'}
                            </span>

                            {person.phone && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                  <Phone size={10} className="text-slate-400" />
                                  {person.phone}
                                </span>
                              </>
                            )}

                            {person.pixKey && (
                              <>
                                <span>•</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyPixKey(person.pixKey!, person.id)}
                                  className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hover:underline cursor-pointer"
                                  title="Copiar Chave Pix"
                                >
                                  <QrCode size={10} />
                                  <span>{copiedPixKey === person.id ? 'Copiada!' : 'Pix'}</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Header Right: Total + Status Badge */}
                      <div className="text-right shrink-0">
                        <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                          {formatCurrency(totalAmount)}
                        </p>
                        
                        <div className="mt-0.5">
                          {person.isSelf ? (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                              Compras próprias
                            </span>
                          ) : isSettled ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 px-2 py-0.5 rounded-full">
                              <Check size={10} strokeWidth={3} /> Quitado
                            </span>
                          ) : totalAmount === 0 ? (
                            <span className="text-[11px] text-slate-400">Sem compras</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/40 px-2 py-0.5 rounded-full">
                              Falta {formatCurrency(pendingAmount)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Subtle Progress Line if pending/settled */}
                    {!person.isSelf && totalAmount > 0 && (
                      <div className="w-full h-1 bg-slate-100 dark:bg-white/[0.04]">
                        <div
                          style={{ width: `${progressPercent}%` }}
                          className={`h-full transition-all duration-500 ${
                            isSettled ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                      </div>
                    )}

                    {/* Purchases List */}
                    <div className="divide-y divide-slate-100/80 dark:divide-white/[0.04] max-h-56 overflow-y-auto">
                      {personItems.length === 0 ? (
                        <div className="py-6 px-4 text-center text-xs text-slate-400 dark:text-slate-500">
                          Nenhuma compra associada a esta pessoa neste mês.
                        </div>
                      ) : (
                        personItems.map((item) => {
                          const exp = item.expense;
                          const card = cards.find((c) => c.id === exp.cardId);

                          return (
                            <div
                              key={exp.id}
                              className="px-5 py-3 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-3 text-xs group/item"
                            >
                              {/* Left Checkbox & Name */}
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() => onToggleExpensePaid(exp.id)}
                                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                    exp.paidByPerson
                                      ? 'bg-emerald-600 text-white shadow-2xs'
                                      : 'border-2 border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-500'
                                  }`}
                                  title={exp.paidByPerson ? 'Pago (clique para alternar)' : 'Pendente (clique para marcar como pago)'}
                                >
                                  <Check size={10} strokeWidth={3.5} />
                                </button>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`font-semibold text-xs sm:text-[13px] truncate ${
                                      exp.paidByPerson 
                                        ? 'text-slate-400 dark:text-slate-500 line-through' 
                                        : 'text-slate-800 dark:text-slate-100'
                                    }`}>
                                      {exp.description}
                                    </span>

                                    {item.currentInstallmentForMonth && (
                                      <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-white/10 text-[10px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                                        {item.currentInstallmentForMonth}/{item.totalInstallments}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                    <span>{card?.name || 'Cartão'}</span>
                                    {exp.date && (
                                      <>
                                        <span>•</span>
                                        <span>{exp.date.split('-')[2]}/{exp.date.split('-')[1]}</span>
                                      </>
                                    )}
                                    {exp.paidByPerson && (
                                      <>
                                        <span>•</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Acertado</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Amount & Surgical Actions */}
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`font-bold text-xs sm:text-[13px] tracking-tight ${
                                  exp.paidByPerson ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
                                }`}>
                                  {formatCurrency(exp.amount)}
                                </span>

                                <div className="opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center">
                                  {onEditExpense && (
                                    <button
                                      type="button"
                                      onClick={() => onEditExpense(exp)}
                                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                      title="Editar compra"
                                    >
                                      <Edit3 size={12} />
                                    </button>
                                  )}
                                  {onDeleteExpense && (
                                    <button
                                      type="button"
                                      onClick={() => onDeleteExpense(exp.id)}
                                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                      title="Excluir compra"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Clean Actions Footer */}
                  <div className="px-5 py-3.5 bg-slate-50/60 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2 text-xs">
                    
                    {/* Left: Add expense */}
                    <button
                      type="button"
                      onClick={() => onOpenAddExpenseForPerson(person.id)}
                      className="py-1.5 px-2.5 hover:bg-slate-200/70 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Lançar Gasto</span>
                    </button>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5">
                      {!person.isSelf && pendingAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => onMarkAllPersonExpensesPaid(person.id, currentMonth)}
                          className="py-1.5 px-2.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-xl transition-colors cursor-pointer"
                          title="Marcar todas as compras como acertadas"
                        >
                          ✓ Quitar Tudo
                        </button>
                      )}

                      {!person.isSelf && totalAmount > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsApp(person, totalAmount, pendingAmount, personItems)}
                            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                            title="Enviar cobrança via WhatsApp"
                          >
                            <Send size={12} />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyMessage(person, totalAmount, pendingAmount, personItems)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                            title="Copiar texto de cobrança com chave Pix"
                          >
                            {copiedPersonId === person.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                        </>
                      )}

                      {/* Edit Person info */}
                      {onEditPerson && (
                        <button
                          type="button"
                          onClick={() => onEditPerson(person)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                          title="Editar dados da pessoa"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}

                      {/* Delete Person if not self */}
                      {!person.isSelf && onDeletePerson && (
                        <button
                          type="button"
                          onClick={() => onDeletePerson(person.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                          title="Excluir pessoa"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* ========================================================================= */
        /* PEOPLE VIEW: CONSOLIDATED LIST/TABLE MODE                                 */
        /* ========================================================================= */
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] overflow-hidden divide-y divide-slate-100 dark:divide-white/[0.06]">
          {filteredPeople.map((person) => {
            const personItems = activeExpenses.filter((e) => e.expense.personId === person.id);
            const totalAmount = personItems.reduce((acc, curr) => acc + curr.expense.amount, 0);
            const paidAmount = personItems
              .filter((e) => e.expense.paidByPerson)
              .reduce((acc, curr) => acc + curr.expense.amount, 0);
            const pendingAmount = totalAmount - paidAmount;
            const isSettled = totalAmount > 0 && pendingAmount === 0;

            return (
              <div key={person.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Person info */}
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        person.isSelf
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                          : 'bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {person.name}
                        </span>
                        {person.isSelf && (
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-[10px] rounded-lg">
                            Titular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {personItems.length} {personItems.length === 1 ? 'item' : 'itens'} na fatura
                        {person.phone && ` • ${person.phone}`}
                      </p>
                    </div>
                  </div>

                  {/* Amounts & Status */}
                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="text-right">
                      <p className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                        {formatCurrency(totalAmount)}
                      </p>
                      <p className="text-[11px] font-semibold">
                        {person.isSelf ? (
                          <span className="text-slate-400">Próprio</span>
                        ) : isSettled ? (
                          <span className="text-emerald-600 dark:text-emerald-400">✓ Quitado</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">Pendente: {formatCurrency(pendingAmount)}</span>
                        )}
                      </p>
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-2">
                      {!person.isSelf && totalAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsApp(person, totalAmount, pendingAmount, personItems)}
                          className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                          title="WhatsApp"
                        >
                          <Send size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenAddExpenseForPerson(person.id)}
                        className="p-2 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        title="Lançar gasto"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredPeople.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1C1C1E] border border-dashed border-slate-200 dark:border-white/[0.08]">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <Users size={22} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Nenhuma pessoa encontrada
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            Alterne o filtro acima ou cadastre uma nova pessoa para registrar compras no seu cartão de crédito.
          </p>
          <button
            type="button"
            onClick={onOpenAddPerson}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <UserPlus size={14} /> Cadastrar Pessoa
          </button>
        </div>
      )}

    </div>
  );
}
