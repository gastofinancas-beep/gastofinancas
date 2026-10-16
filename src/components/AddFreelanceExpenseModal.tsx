import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Edit2, 
  Calendar, 
  Clock, 
  FileText, 
  ShoppingBag, 
  Wallet,
  CheckCircle2,
  Receipt
} from 'lucide-react';
import { FreelanceExpense, FreelanceExpenseCategory, FreelanceEntry, WalletAccount } from '../types';
import { FREELANCE_EXPENSE_CATEGORY_CONFIG } from '../data/initialFreelanceData';
import { formatCurrency } from '../utils/financeCalculations';
import { CurrencyInput } from './CurrencyInput';
import { triggerHaptic } from '../utils/haptics';
import { DatePickerInput } from './DatePickerInput';
import { todayLocalISO } from '../utils/dateUtils';

interface AddFreelanceExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Omit<FreelanceExpense, 'id' | 'createdAt'>, editId?: string) => void;
  accounts: WalletAccount[];
  freelanceEntries?: FreelanceEntry[];
  editingExpense?: FreelanceExpense | null;
  currentMonth?: string;
}

export function AddFreelanceExpenseModal({
  isOpen,
  onClose,
  onSave,
  accounts = [],
  freelanceEntries = [],
  editingExpense
}: AddFreelanceExpenseModalProps) {
  const safeAccounts = accounts || [];
  const defaultAccount = safeAccounts.find(a => a.isDefault) || safeAccounts[0];

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FreelanceExpenseCategory>('ferramentas');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(todayLocalISO());
  const [time, setTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  const [accountId, setAccountId] = useState(defaultAccount?.id || '');
  const [freelanceEntryId, setFreelanceEntryId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      setDescription(editingExpense.description);
      setCategory(editingExpense.category);
      setAmount(editingExpense.amount || 0);
      setDate(editingExpense.date);
      setTime(editingExpense.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      setAccountId(editingExpense.accountId || defaultAccount?.id || safeAccounts[0]?.id || '');
      setFreelanceEntryId(editingExpense.freelanceEntryId || '');
      setNotes(editingExpense.notes || '');
    } else {
      setDescription('');
      setCategory('ferramentas');
      setAmount(0);
      setDate(todayLocalISO());
      setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      setAccountId(defaultAccount?.id || safeAccounts[0]?.id || '');
      setFreelanceEntryId('');
      setNotes('');
    }
  }, [editingExpense, isOpen, defaultAccount, safeAccounts]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    if (!description.trim()) return;

    triggerHaptic(12);
    onSave({
      description: description.trim(),
      category,
      amount,
      date,
      time: time || undefined,
      accountId: accountId || accounts[0]?.id || '',
      freelanceEntryId: freelanceEntryId || undefined,
      notes: notes.trim() || undefined,
    }, editingExpense?.id);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.1] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              {editingExpense ? <Edit2 size={18} /> : <Receipt size={20} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingExpense ? 'Editar Despesa de Freelance' : 'Nova Despesa / Gasto do Freela'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registrar gasto operacional ou custo de projeto
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          
          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Valor do Gasto *
            </label>
            <div className="text-3xl font-bold">
              <CurrencyInput
                value={amount}
                onChange={setAmount}
                required
              />
            </div>
          </div>

          {/* Date & Description */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <DatePickerInput
                  label="Data"
                  value={date}
                  onChange={newDate => setDate(newDate)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as FreelanceExpenseCategory)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#252528] text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {Object.entries(FREELANCE_EXPENSE_CATEGORY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Descrição do Gasto *
              </label>
              <div className="relative">
                <ShoppingBag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Plugin, Licença de Software, Impressão..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Advanced Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            {showAdvanced ? 'Ocultar opções avançadas' : 'Mostrar mais opções'}
          </button>

          {/* Advanced Fields */}
          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/[0.08]">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Horário
                </label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Account Sync Selection */}
              <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                    <Wallet size={14} className="text-rose-600 dark:text-rose-400" />
                    Conta de Origem (Debitar na Carteira)
                  </label>
                </div>

                <select
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-rose-500/30 bg-white dark:bg-[#1C1C1E] text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.institution}) - Saldo: {formatCurrency(acc.currentBalance)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Link to specific Freelance Project */}
              {freelanceEntries.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vincular a um Projeto Específico (Opcional)
                  </label>
                  <select
                    value={freelanceEntryId}
                    onChange={e => setFreelanceEntryId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#252528] text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
                  >
                    <option value="">Gasto Geral (sem vínculo a projeto)</option>
                    {freelanceEntries.map(entry => (
                      <option key={entry.id} value={entry.id}>
                        {entry.title} - {formatCurrency(entry.amount)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações (Opcional)
                </label>
                <div className="relative">
                  <FileText size={16} className="absolute left-3 top-3 text-slate-400" />
                  <textarea
                    rows={2}
                    placeholder="Ex: Comprovante, motivo do custo..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm shadow-rose-600/30 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={18} />
              {editingExpense ? 'Salvar Alterações' : 'Confirmar Despesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
