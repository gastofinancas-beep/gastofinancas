import React, { useState, useEffect } from 'react';
import { 
  X, 
  Fuel, 
  Car, 
  Wrench, 
  Sparkles, 
  DollarSign, 
  Calendar, 
  Check, 
  CircleDollarSign,
  Utensils,
  ParkingCircle,
  Tag
} from 'lucide-react';
import { motion } from 'motion/react';
import { DriverExpense, DriverExpenseCategory, DriverAppType } from '../types';
import { APP_CONFIGS } from '../data/initialDriverData';

import { localDateString } from '../utils/financeCalculations';
interface AddDriverExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (expenseData: Omit<DriverExpense, 'id'>, editId?: string) => void;
  editingExpense?: DriverExpense | null;
}

const EXPENSE_CATEGORIES: {
  id: DriverExpenseCategory;
  label: string;
  icon: React.ElementType;
  color: string;
  defaultDesc: string;
}[] = [
  {
    id: 'combustivel',
    label: 'Combustível',
    icon: Fuel,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    defaultDesc: 'Abastecimento'
  },
  {
    id: 'pedagio',
    label: 'Pedágio',
    icon: CircleDollarSign,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    defaultDesc: 'Pedágio na rota'
  },
  {
    id: 'estacionamento',
    label: 'Estacionamento',
    icon: ParkingCircle,
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    defaultDesc: 'Estacionamento'
  },
  {
    id: 'manutencao',
    label: 'Manutenção',
    icon: Wrench,
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    defaultDesc: 'Troca de óleo'
  },
  {
    id: 'lavagem',
    label: 'Lavagem',
    icon: Sparkles,
    color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    defaultDesc: 'Lavagem completa'
  },
  {
    id: 'alimentacao',
    label: 'Alimentação',
    icon: Utensils,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    defaultDesc: 'Lanche / Café na rua'
  },
  {
    id: 'outros',
    label: 'Outros',
    icon: Tag,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    defaultDesc: 'Despesa de trabalho'
  }
];

export function AddDriverExpenseModal({
  isOpen,
  onClose,
  onSaveExpense,
  editingExpense
}: AddDriverExpenseModalProps) {
  const [category, setCategory] = useState<DriverExpenseCategory>('combustivel');
  const [description, setDescription] = useState<string>('Abastecimento');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(() => localDateString());
  const [appLinked, setAppLinked] = useState<DriverAppType | 'geral'>('geral');
  const [liters, setLiters] = useState<string>('');
  const [fuelType, setFuelType] = useState<'gasolina' | 'etanol' | 'gnv' | 'diesel' | 'eletrico'>('etanol');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (editingExpense) {
      setCategory(editingExpense.category);
      setDescription(editingExpense.description);
      setAmount(editingExpense.amount ? editingExpense.amount.toFixed(2) : '');
      setDate(editingExpense.date);
      setAppLinked(editingExpense.appLinked || 'geral');
      setLiters(editingExpense.liters ? String(editingExpense.liters) : '');
      setFuelType(editingExpense.fuelType || 'etanol');
      setNotes(editingExpense.notes || '');
    } else {
      setCategory('combustivel');
      setDescription('Abastecimento');
      setAmount('');
      setDate(localDateString());
      setAppLinked('geral');
      setLiters('');
      setFuelType('etanol');
      setNotes('');
    }
  }, [editingExpense, isOpen]);

  const handleCategorySelect = (catId: DriverExpenseCategory) => {
    setCategory(catId);
    const found = EXPENSE_CATEGORIES.find(c => c.id === catId);
    if (found && (!description || description === 'Abastecimento' || description === 'Troca de óleo / Revisão' || description === 'Pedágio na rota')) {
      setDescription(found.defaultDesc);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;
    if (parsedAmount <= 0) return;

    onSaveExpense({
      category,
      description: description.trim() || 'Despesa do motorista',
      amount: parsedAmount,
      date,
      appLinked,
      liters: category === 'combustivel' && liters ? parseFloat(liters.replace(',', '.')) : undefined,
      fuelType: category === 'combustivel' ? fuelType : undefined,
      notes: notes.trim() || undefined
    }, editingExpense?.id);

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <Fuel size={19} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                {editingExpense ? 'Editar Despesa de Trabalho' : 'Lançar Despesa do Motorista'}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Combustível, pedágios, manutenção e custos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5 flex-1">
          
          {/* Category Badges */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
              Tipo de Despesa
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {EXPENSE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`p-2.5 rounded-2xl border text-left flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-slate-900 dark:text-white ring-2 ring-rose-500/20 shadow-2xs'
                        : 'border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cat.color}`}>
                      <Icon size={16} />
                    </div>
                    <span className="text-[11px] font-bold text-center">
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Valor da Despesa (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-rose-500 text-base">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-black text-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Descrição
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Abastecimento Posto Ipiranga"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Special Maintenance Options */}
          {category === 'manutencao' && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2.5">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <Wrench size={14} />
                Selecione o Item de Manutenção
              </span>

              {/* Quick Maintenance Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  'Troca de óleo',
                  'Pneus',
                  'Freios',
                  'Bateria',
                  'Revisão',
                  'Seguro',
                  'IPVA',
                  'Licenciamento',
                  'Outros'
                ].map((item) => {
                  const isSelected = description.toLowerCase().includes(item.toLowerCase()) || description === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setDescription(item === 'Outros' ? '' : item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-white hover:text-rose-600'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Fuel Options */}
          {category === 'combustivel' && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Fuel size={14} />
                Detalhes do Combustível
              </span>

              {/* Fuel Type Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['etanol', 'gasolina', 'gnv', 'diesel', 'eletrico'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFuelType(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      fuelType === t
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-white/60 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Liters Input */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Litros / m³ (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 35.0"
                    value={liters}
                    onChange={(e) => setLiters(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  {amount && liters && parseFloat(liters) > 0 && (
                    <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-2">
                      ≈ R$ {(parseFloat(amount.replace(',', '.')) / parseFloat(liters.replace(',', '.'))).toFixed(2)}/L
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Date & App Link */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Data
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Vincular a App
              </label>
              <select
                value={appLinked}
                onChange={(e) => setAppLinked(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="geral">Geral (Todos os Apps)</option>
                <option value="uber">Uber</option>
                <option value="99">99</option>
                <option value="indrive">inDrive</option>
                <option value="blablacar">BlaBlaCar</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Observação / Recibo
            </label>
            <input
              type="text"
              placeholder="Ex: Nota fiscal 4382, Km do carro 85.400"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check size={16} strokeWidth={3} />
            <span>{editingExpense ? 'Atualizar Despesa' : 'Salvar Despesa'}</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
