import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Plus, 
  Edit2, 
  DollarSign, 
  Calendar, 
  Clock, 
  FileText, 
  Briefcase, 
  User, 
  Wallet,
  CheckCircle2
} from 'lucide-react';
import { FreelanceEntry, FreelanceCategory, FreelanceStatus, WalletAccount } from '../types';
import { FREELANCE_CATEGORY_CONFIG } from '../data/initialFreelanceData';
import { formatCurrency } from '../utils/financeCalculations';
import { CurrencyInput } from './CurrencyInput';
import { triggerHaptic } from '../utils/haptics';
import { DatePickerInput } from './DatePickerInput';
import { todayLocalISO } from '../utils/dateUtils';

interface AddFreelanceEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entryData: Omit<FreelanceEntry, 'id' | 'createdAt'>, editId?: string) => void;
  accounts: WalletAccount[];
  editingEntry?: FreelanceEntry | null;
  currentMonth?: string;
}

export function AddFreelanceEntryModal({
  isOpen,
  onClose,
  onSave,
  accounts = [],
  editingEntry
}: AddFreelanceEntryModalProps) {
  const safeAccounts = accounts || [];
  const defaultAccount = safeAccounts.find(a => a.isDefault) || safeAccounts[0];

  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [category, setCategory] = useState<FreelanceCategory>('design');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(todayLocalISO());
  const [time, setTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  const [status, setStatus] = useState<FreelanceStatus>('recebido');
  const [accountId, setAccountId] = useState(defaultAccount?.id || '');
  const [notes, setNotes] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingEntry) {
      setTitle(editingEntry.title);
      setClientName(editingEntry.clientName || '');
      setCategory(editingEntry.category);
      setAmount(editingEntry.amount || 0);
      setDate(editingEntry.date);
      setTime(editingEntry.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      setStatus(editingEntry.status);
      setAccountId(editingEntry.accountId || defaultAccount?.id || safeAccounts[0]?.id || '');
      setNotes(editingEntry.notes || '');
    } else {
      setTitle('');
      setClientName('');
      setCategory('design');
      setAmount(0);
      setDate(todayLocalISO());
      setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      setStatus('recebido');
      setAccountId(defaultAccount?.id || safeAccounts[0]?.id || '');
      setNotes('');
    }
  }, [editingEntry, isOpen, defaultAccount, safeAccounts]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    triggerHaptic(12);
    const defaultTitle = title.trim() || `Serviço ${FREELANCE_CATEGORY_CONFIG[category]?.label || 'Freelance'}`;
    onSave({
      title: defaultTitle,
      clientName: clientName.trim() || undefined,
      category,
      amount,
      date,
      time: time || undefined,
      status,
      accountId: accountId || accounts[0]?.id || '',
      notes: notes.trim() || undefined,
    }, editingEntry?.id);

    onClose();
  };

  const selectedAccount = accounts.find(a => a.id === accountId);

  return createPortal(
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 dark:bg-black/80 backdrop-blur-sm overflow-y-auto"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] rounded-[28px] w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#2C2C2E]/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                {editingEntry ? <Edit2 size={18} /> : <Plus size={20} />}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingEntry ? 'Editar Entrada de Freelance' : 'Nova Entrada / Receita Freela'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Registrar pagamento de projeto ou serviço avulso
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto flex-1">
            
            {/* Amount - HIGHEST VISUAL HIERARCHY */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor Recebido *
              </label>
              <div className="text-3xl font-bold">
                <CurrencyInput
                  value={amount}
                  onChange={setAmount}
                  required
                />
              </div>
            </div>

            {/* Date & Title */}
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
                    onChange={e => setCategory(e.target.value as FreelanceCategory)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#2C2C2E] text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {Object.entries(FREELANCE_CATEGORY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título do Serviço / Projeto *
                </label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Criação de Identidade Visual, Site..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#2C2C2E] text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {showAdvanced ? 'Ocultar opções avançadas' : 'Mostrar mais opções'}
            </button>

            {/* Advanced Fields */}
            {showAdvanced && (
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/[0.08]">
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cliente / Empresa (Opcional)
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ex: Studio Alpha, Marcos Oliveira, Loja X"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#2C2C2E] text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

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
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#2C2C2E] text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Account Sync Selection */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <Wallet size={14} className="text-emerald-600 dark:text-emerald-400" />
                      Conta de Destino (Sincronizar com a Carteira)
                    </label>
                  </div>
                  <select
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-emerald-500/30 bg-white dark:bg-[#2C2C2E] text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.institution}) - Saldo: {formatCurrency(acc.currentBalance)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Observações (Opcional)
                  </label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-3 top-3 text-slate-400" />
                    <textarea
                      rows={2}
                      placeholder="Detalhes sobre o escopo, links..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#2C2C2E] text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
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
                className="px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={18} />
                {editingEntry ? 'Salvar Alterações' : 'Confirmar Entrada'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
