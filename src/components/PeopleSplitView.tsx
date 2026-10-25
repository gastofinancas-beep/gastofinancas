import { normalizeBrazilPhone, buildWhatsAppUrl } from '../utils/whatsapp';
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
  Mail,
  Check, 
  Copy,
  Edit3,
  Trash2,
  CreditCard as CardIcon,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Eye,
  X,
  Receipt,
  ArrowRight,
  Calendar,
  AlertCircle,
  HandCoins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, ExpenseItem, Person, UserProfile, WalletAccount } from '../types';
import { PersonDebtsSection } from './PersonDebtsSection';
import { summarizePersonDebts } from '../utils/personDebts';
import { formatCurrency, formatMonthDisplay } from '../utils/financeCalculations';
import { triggerHaptic } from '../utils/haptics';

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
  walletAccounts: WalletAccount[];
  onSaveDebt: (personId: string, data: { id?: string; description: string; totalAmount: number; installments: number; startMonthYear: string }) => void;
  onDeleteDebt: (personId: string, debtId: string) => void;
  onPayDebtInstallment: (personId: string, debtId: string, index: number, accountId?: string) => void;
  onUnpayDebtInstallment: (personId: string, debtId: string, index: number) => void;
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
  walletAccounts,
  onSaveDebt,
  onDeleteDebt,
  onPayDebtInstallment,
  onUnpayDebtInstallment,
}: PeopleSplitViewProps) {
  const [openDebtOnMount, setOpenDebtOnMount] = useState(false);
  const [copiedPersonId, setCopiedPersonId] = useState<string | null>(null);
  const [copiedPixKey, setCopiedPixKey] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'settled'>('all');
  const [selectedPersonForDetails, setSelectedPersonForDetails] = useState<Person | null>(null);
  const [modalExpenseFilter, setModalExpenseFilter] = useState<'all' | 'pending' | 'paid'>('all');

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

  // Quanto o titular deve às pessoas (dívidas registradas em cada uma)
  const debtsOverview = useMemo(() => {
    let pending = 0;
    let paid = 0;
    let count = 0;
    let peopleCount = 0;
    people.forEach((p) => {
      if (p.isSelf) return;
      const t = summarizePersonDebts(p.debts);
      if (t.count === 0) return;
      count += t.count;
      pending += t.pending;
      paid += t.paid;
      if (t.pending > 0) peopleCount++;
    });
    return { pending, paid, count, people: peopleCount };
  }, [people]);

  // Mensagem curta de cobrança (WhatsApp): só o que está pendente
  const generateChargeMessage = (person: Person, pending: number, items: any[]) => {
    const firstName = person.name.trim().split(/\s+/)[0];
    const pendingItems = items.filter((i) => !i.expense.paidByPerson);
    let msg = `Oi, ${firstName}! Tudo bem?\nPassando para lembrar do acerto de ${formatMonthDisplay(currentMonth)}: você está me devendo *${formatCurrency(pending)}*.\n`;

    if (pendingItems.length > 0 && pendingItems.length <= 5) {
      msg += `\n`;
      pendingItems.forEach((item) => {
        const inst = item.currentInstallmentForMonth ? ` (${item.currentInstallmentForMonth}/${item.totalInstallments})` : '';
        msg += `- ${item.expense.description}${inst}: ${formatCurrency(item.expense.amount)}\n`;
      });
    }

    const myPixKey = userProfile?.pixKey || person.pixKey;
    if (myPixKey) {
      msg += `\nChave Pix: ${myPixKey}\n`;
    }
    msg += `\nObrigado!`;
    return msg;
  };

  // Mensagem completa (copiar / e-mail), com todas as compras do mês
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
    triggerHaptic(10);
    const msg = generatePixMessage(person, total, pending, items);
    navigator.clipboard.writeText(msg);
    setCopiedPersonId(person.id);
    setTimeout(() => setCopiedPersonId(null), 2500);
  };

  const handleOpenWhatsApp = (person: Person, pending: number, items: any[]) => {
    triggerHaptic(12);
    const phone = normalizeBrazilPhone(person.phone);
    if (!phone) {
      onEditPerson?.(person);
      return;
    }
    const url = buildWhatsAppUrl(phone, generateChargeMessage(person, pending, items));
    window.open(url, '_blank', 'noopener');
  };

  const handleOpenEmail = (person: Person, total: number, pending: number, items: any[]) => {
    triggerHaptic(10);
    if (!person.email) return;
    const msg = generatePixMessage(person, total, pending, items);
    const subject = `Lembrete de Compras no Cartão - ${formatMonthDisplay(currentMonth)}`;
    try {
      window.open(`mailto:${encodeURIComponent(person.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg)}`, '_blank');
    } catch (e) {
      console.warn('Could not open email client:', e);
    }
  };

  const handleCopyPixKey = (key: string, personId: string) => {
    triggerHaptic(10);
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

  // Selected person items for details modal
  const selectedPersonItems = useMemo(() => {
    if (!selectedPersonForDetails) return [];
    return activeExpenses.filter((e) => e.expense.personId === selectedPersonForDetails.id);
  }, [selectedPersonForDetails, activeExpenses]);

  const selectedPersonStats = useMemo(() => {
    if (!selectedPersonForDetails) return { total: 0, paid: 0, pending: 0, isSettled: false };
    const total = selectedPersonItems.reduce((acc, curr) => acc + curr.expense.amount, 0);
    const paid = selectedPersonItems.filter((e) => e.expense.paidByPerson).reduce((acc, curr) => acc + curr.expense.amount, 0);
    const pending = total - paid;
    return {
      total,
      paid,
      pending,
      isSettled: total > 0 && pending === 0
    };
  }, [selectedPersonForDetails, selectedPersonItems]);

  const filteredSelectedPersonItems = useMemo(() => {
    if (modalExpenseFilter === 'pending') {
      return selectedPersonItems.filter((item) => !item.expense.paidByPerson);
    }
    if (modalExpenseFilter === 'paid') {
      return selectedPersonItems.filter((item) => item.expense.paidByPerson);
    }
    return selectedPersonItems;
  }, [selectedPersonItems, modalExpenseFilter]);

  // Se houver uma pessoa selecionada para ver gastos, exibimos a página de detalhes inline na tela (sem janela fixa / modal)
  if (selectedPersonForDetails) {
    const person = people.find((p) => p.id === selectedPersonForDetails.id) || selectedPersonForDetails;
    const paidPercentage = selectedPersonStats.total > 0 
      ? Math.round((selectedPersonStats.paid / selectedPersonStats.total) * 100)
      : 100;

    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        {/* Barra Superior de Navegação */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            id="btn-back-to-people-list"
            onClick={() => {
              triggerHaptic(6);
              setSelectedPersonForDetails(null);
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.05] text-xs font-bold text-slate-700 dark:text-slate-200 transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <ChevronLeft size={16} className="stroke-[2.5]" />
            <span>Voltar para Pessoas</span>
          </button>

          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.06] px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-white/[0.04]">
            Fatura de <strong className="text-slate-800 dark:text-slate-200 font-bold">{formatMonthDisplay(currentMonth)}</strong>
          </span>
        </div>

        {/* Card Principal Unificado da Pessoa e Finanças */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/60 dark:border-white/[0.08] shadow-xs space-y-4">
          
          {/* Cabeçalho da Pessoa */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-base shrink-0 shadow-2xs ${
                  person.isSelf
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/30'
                }`}
              >
                {person.photoURL || (person.isSelf && userProfile?.photoURL) ? (
                  <img 
                    src={person.photoURL || (person.isSelf ? userProfile?.photoURL : undefined)} 
                    alt={person.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  person.name.charAt(0).toUpperCase()
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                    {person.name}
                  </h2>
                  {person.isSelf && (
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-[9px] rounded-md border border-blue-200/60 dark:border-blue-800/40">
                      Você
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {selectedPersonItems.length} {selectedPersonItems.length === 1 ? 'compra nesta fatura' : 'compras nesta fatura'}
                </p>
              </div>
            </div>

            {/* Status Pill */}
            <div className="shrink-0">
              {selectedPersonStats.isSettled ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <CheckCircle2 size={13} /> Quitado
                </span>
              ) : selectedPersonStats.total === 0 ? (
                <span className="text-xs text-slate-400 font-medium">Sem compras</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 text-xs font-bold">
                  <Clock size={13} /> Pendente
                </span>
              )}
            </div>
          </div>

          {/* Destaque Financeiro Consolidado em 3 Colunas Compactas */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50/80 dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-white/[0.05]">
            {/* Total */}
            <div className="text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5 block whitespace-nowrap">
                {formatCurrency(selectedPersonStats.total)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {selectedPersonItems.length} {selectedPersonItems.length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            {/* Pendente */}
            <div className="text-center border-x border-slate-200/60 dark:border-white/[0.08] px-1">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                Pendente
              </span>
              <span className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5 block whitespace-nowrap">
                {formatCurrency(selectedPersonStats.pending)}
              </span>
              <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70 font-medium block mt-0.5">
                A receber
              </span>
            </div>

            {/* Quitado */}
            <div className="text-center">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Quitado
              </span>
              <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block whitespace-nowrap">
                {formatCurrency(selectedPersonStats.paid)}
              </span>
              <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-medium block mt-0.5">
                {paidPercentage}% pago
              </span>
            </div>
          </div>

          {/* Barra de Progresso de Quitação */}
          {selectedPersonStats.total > 0 && (
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-white/[0.08] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${paidPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Barra de Ações Rápidas Compacta e Estilizada */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(8);
                onOpenAddExpenseForPerson(person.id);
              }}
              className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={14} className="stroke-[2.5]" />
              <span>Lançar Gasto</span>
            </button>

            {!person.isSelf && selectedPersonStats.pending > 0 && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(12);
                  onMarkAllPersonExpensesPaid(person.id, currentMonth);
                }}
                className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <Check size={14} strokeWidth={3} />
                <span>Quitar Tudo</span>
              </button>
            )}

            {!person.isSelf && selectedPersonStats.pending > 0 && (
              <button
                type="button"
                onClick={() => handleOpenWhatsApp(person, selectedPersonStats.pending, selectedPersonItems)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
                title={normalizeBrazilPhone(person.phone) ? 'Cobrar pelo WhatsApp' : 'Cadastre o WhatsApp para cobrar'}
              >
                <Send size={13} />
                <span>{normalizeBrazilPhone(person.phone) ? 'Cobrar no WhatsApp' : 'Add WhatsApp'}</span>
              </button>
            )}

            {person.pixKey && (
              <button
                type="button"
                onClick={() => handleCopyPixKey(person.pixKey!, person.id)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                title="Copiar Chave Pix"
              >
                <QrCode size={13} />
                <span>{copiedPixKey === person.id ? 'Copiada!' : 'Pix'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Dívidas do titular com esta pessoa */}
        {!person.isSelf && (
          <PersonDebtsSection
            person={person}
            currentMonth={currentMonth}
            walletAccounts={walletAccounts}
            onSaveDebt={onSaveDebt}
            onDeleteDebt={onDeleteDebt}
            onPayDebtInstallment={onPayDebtInstallment}
            onUnpayDebtInstallment={onUnpayDebtInstallment}
            openOnMount={openDebtOnMount}
            onConsumedOpenOnMount={() => setOpenDebtOnMount(false)}
          />
        )}

        {/* Lista de Compras */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl sm:rounded-3xl border border-slate-200/60 dark:border-white/[0.08] shadow-xs overflow-hidden">
          
          {/* Header da lista com filtros */}
          <div className="p-3.5 sm:px-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Receipt size={15} className="text-slate-400" />
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                Compras ({filteredSelectedPersonItems.length})
              </h3>
            </div>

            {/* Segmented Control de Filtros */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-white/[0.08] rounded-xl border border-slate-200/60 dark:border-white/[0.04] text-[10px] sm:text-xs">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(6);
                  setModalExpenseFilter('all');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  modalExpenseFilter === 'all'
                    ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(6);
                  setModalExpenseFilter('pending');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  modalExpenseFilter === 'pending'
                    ? 'bg-white dark:bg-[#2C2C2E] text-amber-600 dark:text-amber-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                Pendentes
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(6);
                  setModalExpenseFilter('paid');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  modalExpenseFilter === 'paid'
                    ? 'bg-white dark:bg-[#2C2C2E] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                Pagas
              </button>
            </div>
          </div>

          {/* Itens da lista */}
          <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {filteredSelectedPersonItems.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <Receipt size={28} className="text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                  Nenhuma compra encontrada
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs mx-auto">
                  {selectedPersonItems.length === 0
                    ? 'Nenhuma compra lançada para esta pessoa nesta fatura.'
                    : 'Nenhuma compra corresponde ao filtro selecionado.'}
                </p>
                {selectedPersonItems.length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      onOpenAddExpenseForPerson(person.id);
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus size={13} /> Lançar Compra
                  </button>
                )}
              </div>
            ) : (
              filteredSelectedPersonItems.map((item) => {
                const exp = item.expense;
                const card = cards.find((c) => c.id === exp.cardId);

                return (
                  <div
                    key={exp.id}
                    className="p-3 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Checkbox para alternar Pago / Pendente */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(10);
                          onToggleExpensePaid(exp.id);
                        }}
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                          exp.paidByPerson
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'border-2 border-slate-300 dark:border-white/[0.12] text-transparent hover:border-emerald-500'
                        }`}
                        title={exp.paidByPerson ? 'Gasto pago (toque para marcar como pendente)' : 'Gasto pendente (toque para marcar como pago)'}
                      >
                        <Check size={11} strokeWidth={3.5} />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold text-xs sm:text-sm truncate ${
                            exp.paidByPerson
                              ? 'text-slate-500 dark:text-slate-400 line-through'
                              : 'text-slate-900 dark:text-white'
                          }`}>
                            {exp.description}
                          </span>

                          {item.currentInstallmentForMonth && item.totalInstallments && item.totalInstallments > 1 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
                              {item.currentInstallmentForMonth}/{item.totalInstallments}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                          <span className="font-medium text-slate-600 dark:text-slate-400">{card?.name || 'Cartão'}</span>
                          {exp.date && (
                            <>
                              <span>•</span>
                              <span>{exp.date.split('-')[2]}/{exp.date.split('-')[1]}</span>
                            </>
                          )}
                          <span>•</span>
                          {exp.paidByPerson ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Acertado</span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">Pendente</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Valor e Ações */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`font-bold text-xs sm:text-sm tracking-tight whitespace-nowrap ${
                        exp.paidByPerson ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'
                      }`}>
                        {formatCurrency(exp.amount)}
                      </span>

                      <div className="flex items-center">
                        {onEditExpense && (
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic(8);
                              onEditExpense(exp);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer"
                            title="Editar compra"
                          >
                            <Edit3 size={13} />
                          </button>
                        )}

                        {onDeleteExpense && (
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic(12);
                              onDeleteExpense(exp.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir compra"
                          >
                            <Trash2 size={13} />
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

        {/* Botão Voltar Rodapé */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(6);
              setSelectedPersonForDetails(null);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.05] text-xs font-bold text-slate-700 dark:text-slate-200 transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <ChevronLeft size={16} className="stroke-[2.5]" />
            <span>Voltar para Pessoas</span>
          </button>
        </div>
      </div>
    );
  }

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
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Divisão de Contas
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Acertos e cobranças de compras em {formatMonthDisplay(currentMonth)}
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-add-new-person"
          data-tour="add-person"
          onClick={() => {
            triggerHaptic(10);
            onOpenAddPerson();
          }}
          className="self-start sm:self-auto flex items-center gap-2 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <UserPlus size={15} />
          <span>Nova Pessoa</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4 QUADRADOS RESUMO: 2 POR LINHA (2x2 GRID - CONFORME SOLICITADO)          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        
        {/* 1. Emprestado (Compras de terceiros) */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/60 dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between aspect-square sm:aspect-auto min-h-[140px] sm:min-h-[155px] transition-all hover:border-indigo-300 dark:hover:border-indigo-800/60">
          <div className="flex items-center justify-between gap-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <CardIcon size={16} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/40 px-2 py-0.5 rounded-full truncate">
              {splitAnalytics.grandTotal > 0 ? `${((splitAnalytics.borrowedTotal / splitAnalytics.grandTotal) * 100).toFixed(0)}%` : '0%'}
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">
              Emprestado
            </span>
            <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate mt-0.5">
              {formatCurrency(splitAnalytics.borrowedTotal)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Compras de terceiros
            </p>
          </div>
        </div>

        {/* 2. A Receber (Pendente de acerto) */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/60 dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between aspect-square sm:aspect-auto min-h-[140px] sm:min-h-[155px] transition-all hover:border-amber-300 dark:hover:border-amber-800/60">
          <div className="flex items-center justify-between gap-1">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
            {splitAnalytics.borrowedPending > 0 ? (
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/40 px-2 py-0.5 rounded-full truncate">
                Pendente
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 px-2 py-0.5 rounded-full truncate">
                Quitado
              </span>
            )}
          </div>
          <div className="mt-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">
              A Receber
            </span>
            <div className={`text-lg sm:text-2xl font-bold tracking-tight truncate mt-0.5 ${
              splitAnalytics.borrowedPending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
            }`}>
              {formatCurrency(splitAnalytics.borrowedPending)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Pendente de acerto
            </p>
          </div>
        </div>

        {/* 3. Já Quitado (Transferido para você) */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/60 dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between aspect-square sm:aspect-auto min-h-[140px] sm:min-h-[155px] transition-all hover:border-emerald-300 dark:hover:border-emerald-800/60">
          <div className="flex items-center justify-between gap-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 px-2 py-0.5 rounded-full truncate">
              {splitAnalytics.borrowedTotal > 0 ? `${((splitAnalytics.borrowedPaid / splitAnalytics.borrowedTotal) * 100).toFixed(0)}%` : '100%'}
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">
              Já Quitado
            </span>
            <div className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight truncate mt-0.5">
              {formatCurrency(splitAnalytics.borrowedPaid)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Transferido para você
            </p>
          </div>
        </div>

        {/* 4. Seus Gastos (Suas compras próprias) */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/60 dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between aspect-square sm:aspect-auto min-h-[140px] sm:min-h-[155px] transition-all hover:border-blue-300 dark:hover:border-blue-800/60">
          <div className="flex items-center justify-between gap-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={16} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/40 px-2 py-0.5 rounded-full truncate">
              {splitAnalytics.grandTotal > 0 ? `${((splitAnalytics.selfTotal / splitAnalytics.grandTotal) * 100).toFixed(0)}%` : '100%'}
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">
              Seus Gastos
            </span>
            <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate mt-0.5">
              {formatCurrency(splitAnalytics.selfTotal)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Suas compras próprias
            </p>
          </div>
        </div>

      </div>

      {/* Quanto eu devo às pessoas */}
      {debtsOverview.count > 0 && (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/60 dark:border-white/[0.08] p-3.5 sm:p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <HandCoins size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Eu devo</p>
              <p className="text-[11px] text-slate-400 truncate">
                {debtsOverview.people} {debtsOverview.people === 1 ? 'pessoa' : 'pessoas'} • já paguei {formatCurrency(debtsOverview.paid)}
              </p>
            </div>
          </div>
          <p className={`text-lg font-bold tracking-tight whitespace-nowrap ${debtsOverview.pending > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {debtsOverview.pending > 0 ? formatCurrency(debtsOverview.pending) : 'Tudo pago'}
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FILTER BAR FOR PEOPLE                                                     */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center p-1 bg-slate-100/90 dark:bg-white/[0.06] rounded-2xl border border-slate-200/60 dark:border-white/[0.05]">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(6);
              setFilterType('all');
            }}
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
            onClick={() => {
              triggerHaptic(6);
              setFilterType('pending');
            }}
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
            onClick={() => {
              triggerHaptic(6);
              setFilterType('settled');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'settled'
                ? 'bg-white dark:bg-[#1C1C1E] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Quitados
          </button>
        </div>

        <div className="hidden sm:flex text-xs text-slate-500 dark:text-slate-400 items-center gap-1.5">
          <Sparkles size={13} className="text-amber-500 shrink-0" />
          <span>Toque em &quot;Ver gastos&quot; para abrir os detalhes de cada pessoa</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LISTA DE PESSOAS COMPACTA COM BOTÃO "VER GASTOS"                         */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredPeople.map((person) => {
            const personItems = activeExpenses.filter((e) => e.expense.personId === person.id);
            const totalAmount = personItems.reduce((acc, curr) => acc + curr.expense.amount, 0);
            const paidAmount = personItems
              .filter((e) => e.expense.paidByPerson)
              .reduce((acc, curr) => acc + curr.expense.amount, 0);
            const pendingAmount = totalAmount - paidAmount;
            const isSettled = totalAmount > 0 && pendingAmount === 0;

            return (
              <motion.div
                key={person.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white dark:bg-[#1C1C1E] rounded-2xl sm:rounded-3xl border border-slate-200/60 dark:border-white/[0.08] p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:border-emerald-500/30 dark:hover:border-white/20 transition-all group"
              >
                {/* Top Info Area: Avatar, Name, Amount & Status */}
                <div 
                  onClick={() => {
                    triggerHaptic(8);
                    setSelectedPersonForDetails(person);
                  }}
                  className="flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  {/* Left: Avatar & Person Identification */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Avatar */}
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs transition-transform group-hover:scale-105 ${
                        person.isSelf
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40'
                          : 'bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/[0.05]'
                      }`}
                    >
                      {person.photoURL || (person.isSelf && userProfile?.photoURL) ? (
                        <img 
                          src={person.photoURL || (person.isSelf ? userProfile?.photoURL : undefined)} 
                          alt={person.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        person.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Name & Subtitle */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {person.name}
                        </span>
                        {person.isSelf && (
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-[10px] rounded-lg border border-blue-200/60 dark:border-blue-800/40">
                            Titular (Você)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          {personItems.length} {personItems.length === 1 ? 'compra' : 'compras'}
                        </span>

                        {person.phone && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 truncate max-w-[120px]">
                              <Phone size={10} />
                              {person.phone}
                            </span>
                          </>
                        )}
                        {person.pixKey && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                              Pix cadastrado
                            </span>
                          </>
                        )}
                      </div>
                      {(() => {
                        const owed = summarizePersonDebts(person.debts).pending;
                        return owed > 0 ? (
                          <p className="mt-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            Você deve {formatCurrency(owed)}
                          </p>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  {/* Right: Amount & Status Badge */}
                  <div className="text-right shrink-0">
                    <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                      {formatCurrency(totalAmount)}
                    </p>
                    <div className="mt-0.5">
                      {person.isSelf ? (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Compras próprias
                        </span>
                      ) : isSettled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 px-2.5 py-0.5 rounded-full">
                          <Check size={10} strokeWidth={3} /> Quitado
                        </span>
                      ) : totalAmount === 0 ? (
                        <span className="text-[11px] text-slate-400">Sem compras</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/40 px-2.5 py-0.5 rounded-full">
                          Falta {formatCurrency(pendingAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar: "Ver Gastos" prominent button + well-spaced quick actions */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
                  {/* Botão Ver Gastos (dominante, largura generosa, sem quebra de texto) */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setSelectedPersonForDetails(person);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3.5 bg-blue-50 hover:bg-blue-100/80 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl border border-blue-200/60 dark:border-blue-800/40 transition-all active:scale-[0.98] cursor-pointer shadow-2xs whitespace-nowrap"
                    title="Ver compras e faturas detalhadas desta pessoa"
                  >
                    <Receipt size={14} className="stroke-[2.2]" />
                    <span>Ver Gastos</span>
                    <ChevronRight size={14} className="opacity-60 ml-auto" />
                  </button>

                  {/* Ações Rápidas (espaçadas e organizadas) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Quick Add Expense */}
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(8);
                        onOpenAddExpenseForPerson(person.id);
                      }}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                      title="Lançar gasto para esta pessoa"
                    >
                      <Plus size={15} />
                    </button>

                    {/* Registrar dívida (eu devo a esta pessoa) */}
                    {!person.isSelf && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(8);
                          setOpenDebtOnMount(true);
                          setSelectedPersonForDetails(person);
                        }}
                        className="p-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs"
                        title="Registrar dívida: eu devo a esta pessoa"
                      >
                        <HandCoins size={15} />
                      </button>
                    )}

                    {/* WhatsApp Button (if not self and has purchases) */}
                    {!person.isSelf && pendingAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsApp(person, pendingAmount, personItems)}
                        className={`p-2.5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs ${
                          normalizeBrazilPhone(person.phone)
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] text-slate-500'
                        }`}
                        title={normalizeBrazilPhone(person.phone) ? 'Cobrar pelo WhatsApp' : 'Cadastre o WhatsApp para cobrar'}
                      >
                        <Send size={13} />
                      </button>
                    )}

                    {/* Edit Person info */}
                    {onEditPerson && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(8);
                          onEditPerson(person);
                        }}
                        className="p-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded-xl transition-colors cursor-pointer"
                        title="Editar cadastro da pessoa"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}

                    {/* Delete Person if not self */}
                    {!person.isSelf && onDeletePerson && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(12);
                          onDeletePerson(person.id);
                        }}
                        className="p-2.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
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

      {/* ========================================================================= */}
      {/* EMPTY STATE                                                               */}
      {/* ========================================================================= */}
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
            onClick={() => {
              triggerHaptic(10);
              onOpenAddPerson();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <UserPlus size={14} /> Cadastrar Pessoa
          </button>
        </div>
      )}

    </div>
  );
}
