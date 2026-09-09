import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  DollarSign, 
  Briefcase, 
  Laptop, 
  TrendingUp, 
  Gift, 
  ShoppingBag, 
  HelpCircle,
  Calendar,
  CheckCircle2,
  Repeat,
  Sparkles
} from 'lucide-react';
import { IncomeItem, IncomeCategory } from '../types';
import { formatMonthDisplay } from '../utils/financeCalculations';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (income: Partial<IncomeItem>) => void;
  editingIncome?: IncomeItem | null;
  currentMonth: string;
}

export const INCOME_CATEGORIES: {
  id: IncomeCategory;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  badgeBg: string;
}[] = [
  { id: 'salario', name: 'Salário / Fixo', icon: Briefcase, color: 'text-emerald-500', badgeBg: 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-white/10' },
  { id: 'freelance', name: 'Freelance / Bicos', icon: Laptop, color: 'text-indigo-500', badgeBg: 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-white/10' },
  { id: 'investimentos', name: 'Rendimentos / Juros', icon: TrendingUp, color: 'text-cyan-500', badgeBg: 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-white/10' },
  { id: 'beneficios', name: 'Benefícios / VR / VA', icon: Gift, color: 'text-purple-500', badgeBg: 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-white/10' },
  { id: 'vendas', name: 'Vendas / Desapegos', icon: ShoppingBag, color: 'text-amber-500', badgeBg: 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-white/10' },
  { id: 'outros', name: 'Outras Entradas', icon: HelpCircle, color: 'text-slate-500', badgeBg: 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-white/10' },
];

export function AddIncomeModal({
  isOpen,
  onClose,
  onSave,
  editingIncome,
  currentMonth,
}: AddIncomeModalProps) {
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<IncomeCategory>('salario');
  const [type, setType] = useState<'fixa' | 'unica'>('fixa');
  const [date, setDate] = useState(`${currentMonth}-05`);
  const [received, setReceived] = useState(true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingIncome) {
      setDescription(editingIncome.description);
      setAmountStr(String(editingIncome.amount));
      setCategory(editingIncome.category || 'salario');
      setType(editingIncome.type || 'fixa');
      setDate(editingIncome.date || `${currentMonth}-05`);
      setReceived(editingIncome.received ?? true);
      setNotes(editingIncome.notes || '');
      setError('');
    } else {
      setDescription('');
      setAmountStr('');
      setCategory('salario');
      setType('fixa');
      setDate(`${currentMonth}-05`);
      setReceived(true);
      setNotes('');
      setError('');
    }
  }, [editingIncome, isOpen, currentMonth]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amountStr.replace(',', '.'));

    if (!description.trim()) {
      setError('Por favor, informe uma descrição para o ganho.');
      return;
    }

    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setError('Por favor, informe um valor válido maior que zero.');
      return;
    }

    const monthYear = date.slice(0, 7) || currentMonth;

    onSave({
      id: editingIncome?.id,
      description: description.trim(),
      amount: cleanAmount,
      category,
      type,
      monthYear,
      date,
      received,
      receivedDate: received ? (editingIncome?.receivedDate || date) : undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/[0.1] overflow-hidden z-10 my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                <DollarSign size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingIncome ? 'Editar Ganho / Entrada' : 'Nova Entrada / Renda'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mês de referência: {formatMonthDisplay(currentMonth)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Descrição do Ganho *
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Salário Empresa X, Freelance Website, Venda..."
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
                autoFocus
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Valor Recebido (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  R$
                </span>
                <input
                  type="text"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Type Selection: Fixa vs Única */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Frequência da Entrada
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('fixa')}
                  className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                    type === 'fixa'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                      : 'bg-slate-50 dark:bg-[#2C2C2E] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Repeat size={16} className={type === 'fixa' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
                  <div>
                    <div>Recorrente Mensal</div>
                    <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400">Todo mês (ex: Salário)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setType('unica')}
                  className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                    type === 'unica'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                      : 'bg-slate-50 dark:bg-[#2C2C2E] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Sparkles size={16} className={type === 'unica' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
                  <div>
                    <div>Entrada Pontual</div>
                    <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400">Apenas este mês</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Categoria da Renda
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {INCOME_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-2xl border text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 shadow-2xs ring-1 ring-emerald-500'
                          : 'bg-slate-50 dark:bg-[#2C2C2E] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <Icon size={16} className={cat.color} />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Received Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Data de Recebimento
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status do Pagamento
                </label>
                <button
                  type="button"
                  onClick={() => setReceived(!received)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                    received
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={15} className={received ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'} />
                    {received ? 'Já Recebido / Na Conta' : 'Aguardando / Previsto'}
                  </span>
                  <span className="text-[10px] uppercase font-bold opacity-80">
                    {received ? 'Recebido' : 'Pendente'}
                  </span>
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Observações / Detalhes (Opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Depositado no Itaú, bônus por meta..."
                className="w-full px-4 py-2 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 size={15} />
                {editingIncome ? 'Salvar Alterações' : 'Adicionar Ganho'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
