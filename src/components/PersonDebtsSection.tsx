import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Check, ChevronDown, Edit3, Trash2, Undo2 } from 'lucide-react';
import { Person, PersonDebt, WalletAccount } from '../types';
import { formatCurrency, formatMonthDisplay } from '../utils/financeCalculations';
import { debtInstallmentAmount, debtInstallmentMonth, summarizeDebt, summarizePersonDebts } from '../utils/personDebts';
import { triggerHaptic } from '../utils/haptics';
import { AddDebtModal } from './AddDebtModal';

interface PersonDebtsSectionProps {
  person: Person;
  currentMonth: string;
  walletAccounts: WalletAccount[];
  onSaveDebt: (personId: string, data: { id?: string; description: string; totalAmount: number; installments: number; startMonthYear: string }) => void;
  onDeleteDebt: (personId: string, debtId: string) => void;
  onPayDebtInstallment: (personId: string, debtId: string, index: number, accountId?: string) => void;
  onUnpayDebtInstallment: (personId: string, debtId: string, index: number) => void;
  // Abre o cadastro automaticamente (usado pelo atalho "Registrar dívida" da lista)
  openOnMount?: boolean;
  onConsumedOpenOnMount?: () => void;
}

function shortMonth(monthYear: string): string {
  const names = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const [y, m] = monthYear.split('-');
  return `${names[parseInt(m, 10) - 1]}/${y.slice(2)}`;
}

export function PersonDebtsSection({
  person,
  currentMonth,
  walletAccounts,
  onSaveDebt,
  onDeleteDebt,
  onPayDebtInstallment,
  onUnpayDebtInstallment,
  openOnMount,
  onConsumedOpenOnMount,
}: PersonDebtsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(!!openOnMount);
  const [editingDebt, setEditingDebt] = useState<PersonDebt | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [paying, setPaying] = useState<{ debt: PersonDebt; index: number } | null>(null);
  const [accountId, setAccountId] = useState<string>('');

  React.useEffect(() => {
    if (openOnMount) onConsumedOpenOnMount?.();
  }, [openOnMount]);

  const debts = person.debts || [];
  const totals = summarizePersonDebts(debts);
  const firstName = person.name.trim().split(/\s+/)[0];
  const defaultAccountId = (walletAccounts.find((a) => a.isDefault) || walletAccounts[0])?.id || '';

  const openPay = (debt: PersonDebt, index: number) => {
    triggerHaptic(8);
    setAccountId(defaultAccountId);
    setPaying({ debt, index });
  };

  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl sm:rounded-3xl border border-slate-200/60 dark:border-white/[0.08] shadow-xs overflow-hidden">
      <div className="p-3.5 sm:px-5 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="min-w-0">
          <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">Você deve a {firstName}</h3>
          <p className={`text-[11px] mt-0.5 ${totals.pending > 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
            {debts.length === 0
              ? 'Nenhuma dívida registrada'
              : totals.pending > 0
                ? `Falta pagar ${formatCurrency(totals.pending)}`
                : 'Tudo pago'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            triggerHaptic(8);
            setEditingDebt(null);
            setIsModalOpen(true);
          }}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={14} className="stroke-[2.5]" />
          <span>Registrar dívida</span>
        </button>
      </div>

      {debts.length > 0 && (
        <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          {debts.map((debt) => {
            const s = summarizeDebt(debt);
            const isOpen = expandedId === debt.id;
            const pct = debt.totalAmount > 0 ? Math.round((s.paidAmount / debt.totalAmount) * 100) : 0;
            const nextMonth = s.nextIndex ? debtInstallmentMonth(debt, s.nextIndex) : null;
            const overdue = !!nextMonth && nextMonth < currentMonth;

            return (
              <div key={debt.id} className="p-3.5 sm:px-5 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{debt.description}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {debt.installments === 1
                        ? `À vista • ${formatMonthDisplay(debt.startMonthYear)}`
                        : `${s.paidCount} de ${s.n} parcelas pagas`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white whitespace-nowrap">{formatCurrency(debt.totalAmount)}</p>
                    {s.isSettled ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <Check size={10} strokeWidth={3} /> Quitada
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        Falta {formatCurrency(s.pendingAmount)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-1.5 w-full bg-slate-100 dark:bg-white/[0.08] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>

                <div className="flex items-center gap-2">
                  {s.nextIndex ? (
                    <button
                      type="button"
                      onClick={() => openPay(debt, s.nextIndex!)}
                      className="flex-1 flex items-center justify-between gap-2 py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <span>
                        {debt.installments === 1 ? 'Marcar como paga' : `Pagar parcela ${s.nextIndex}/${s.n}`}
                      </span>
                      <span className="whitespace-nowrap opacity-90">
                        {formatCurrency(debtInstallmentAmount(debt, s.nextIndex))}
                        {overdue ? ' • atrasada' : ` • ${shortMonth(nextMonth!)}`}
                      </span>
                    </button>
                  ) : (
                    <div className="flex-1 text-[11px] text-slate-500 dark:text-slate-400 py-2.5 px-1">Nada mais a pagar</div>
                  )}
                  <button
                    type="button"
                    onClick={() => { triggerHaptic(6); setExpandedId(isOpen ? null : debt.id); }}
                    className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                    title="Ver parcelas"
                  >
                    <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {isOpen && (
                  <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05] divide-y divide-slate-100 dark:divide-white/[0.05]">
                    {Array.from({ length: s.n }, (_, i) => i + 1).map((i) => {
                      const record = debt.paid?.[String(i)];
                      const month = debtInstallmentMonth(debt, i);
                      return (
                        <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {debt.installments === 1 ? 'Pagamento' : `Parcela ${i}/${s.n}`}
                            </span>
                            <span className="text-slate-400 ml-2">{shortMonth(month)}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(debtInstallmentAmount(debt, i))}</span>
                            {record ? (
                              <button
                                type="button"
                                onClick={() => { triggerHaptic(8); onUnpayDebtInstallment(person.id, debt.id, i); }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 cursor-pointer"
                                title="Desfazer pagamento"
                              >
                                <Check size={10} strokeWidth={3} /> Paga <Undo2 size={10} className="opacity-60" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openPay(debt, i)}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/[0.08] border border-slate-200/70 dark:border-white/[0.08] cursor-pointer"
                              >
                                Pagar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-end gap-1 px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => { triggerHaptic(8); setEditingDebt(debt); setIsModalOpen(true); }}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] cursor-pointer"
                        title="Editar dívida"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => { triggerHaptic(12); onDeleteDebt(person.id, debt.id); }}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                        title="Excluir dívida"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AddDebtModal
        isOpen={isModalOpen}
        personName={person.name}
        currentMonth={currentMonth}
        editingDebt={editingDebt}
        onClose={() => { setIsModalOpen(false); setEditingDebt(null); }}
        onSave={(data) => onSaveDebt(person.id, data)}
      />

      {paying && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[210] flex items-end justify-center bg-black/40 animate-in fade-in duration-150" onClick={() => setPaying(null)}>
          <div
            className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-t-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {paying.debt.description}
                {paying.debt.installments > 1 ? ` • parcela ${paying.index}/${paying.debt.installments}` : ''}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {formatCurrency(debtInstallmentAmount(paying.debt, paying.index))}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">para {person.name}</p>
            </div>

            {walletAccounts.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sai de qual conta?</p>
                {walletAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => { triggerHaptic(6); setAccountId(acc.id); }}
                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                      accountId === acc.id
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30'
                        : 'border-slate-200/70 dark:border-white/[0.08]'
                    }`}
                  >
                    <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">{acc.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatCurrency(acc.currentBalance)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.04] rounded-xl p-3">
                Você ainda não tem conta na Carteira, então o pagamento será só marcado aqui.
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaying(null)}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 text-sm font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  onPayDebtInstallment(person.id, paying.debt.id, paying.index, accountId || undefined);
                  setPaying(null);
                }}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold active:scale-[0.98] cursor-pointer"
              >
                Confirmar pagamento
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
