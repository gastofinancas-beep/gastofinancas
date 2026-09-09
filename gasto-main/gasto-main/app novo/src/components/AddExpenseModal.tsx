import React, { useState, useEffect } from 'react';
import { X, CreditCard as CardIcon, User, Calendar, Tag, DollarSign, Layers } from 'lucide-react';
import { CreditCard, ExpenseItem, Person } from '../types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Partial<ExpenseItem>) => void;
  editingExpense: ExpenseItem | null;
  cards: CreditCard[];
  people: Person[];
  currentMonth: string;
  defaultPersonId?: string;
  defaultCardId?: string;
}

const CATEGORIES = [
  { id: 'alimentacao', label: 'Alimentação / Restaurante' },
  { id: 'mercado', label: 'Supermercado' },
  { id: 'transporte', label: 'Transporte / Uber / Combustível' },
  { id: 'eletronicos', label: 'Eletrônicos & Gadgets' },
  { id: 'vestuario', label: 'Vestuário / Compras' },
  { id: 'saude', label: 'Saúde & Farmácia' },
  { id: 'educacao', label: 'Educação & Cursos' },
  { id: 'lazer', label: 'Lazer & Viagem' },
  { id: 'servicos', label: 'Assinaturas & Serviços' },
  { id: 'outros', label: 'Outros' },
];

export function AddExpenseModal({
  isOpen,
  onClose,
  onSave,
  editingExpense,
  cards,
  people,
  currentMonth,
  defaultPersonId,
  defaultCardId,
}: AddExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('outros');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'unica' | 'parcelada' | 'fixa'>('unica');
  const [cardId, setCardId] = useState('');
  const [personId, setPersonId] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('2');
  const [currentInstallment, setCurrentInstallment] = useState('1');
  const [startMonthYear, setStartMonthYear] = useState(currentMonth);
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingExpense) {
      setDescription(editingExpense.description);
      setCategory(editingExpense.category);
      setAmount(editingExpense.amount.toString());
      setType(editingExpense.type);
      setCardId(editingExpense.cardId);
      setPersonId(editingExpense.personId);
      setTotalInstallments(editingExpense.totalInstallments ? editingExpense.totalInstallments.toString() : '2');
      setCurrentInstallment(editingExpense.currentInstallment ? editingExpense.currentInstallment.toString() : '1');
      setStartMonthYear(editingExpense.startMonthYear);
      setDate(editingExpense.date);
      setNotes(editingExpense.notes || '');
    } else {
      setDescription('');
      setCategory('outros');
      setAmount('');
      setType('unica');
      setCardId(defaultCardId || (cards[0]?.id || ''));
      setPersonId(defaultPersonId || (people[0]?.id || ''));
      setTotalInstallments('2');
      setCurrentInstallment('1');
      setStartMonthYear(currentMonth);
      setDate(`${currentMonth}-01`);
      setNotes('');
    }
  }, [editingExpense, isOpen, currentMonth, defaultPersonId, defaultCardId, cards, people]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    const payload: Partial<ExpenseItem> = {
      ...(editingExpense ? { id: editingExpense.id } : {}),
      description: description.trim(),
      category,
      amount: parsedAmount,
      type,
      cardId,
      personId,
      startMonthYear,
      date,
      notes: notes.trim() || undefined,
    };

    if (type === 'parcelada') {
      const total = parseInt(totalInstallments, 10) || 2;
      const curr = parseInt(currentInstallment, 10) || 1;
      payload.totalInstallments = total;
      payload.currentInstallment = curr;
      payload.totalAmount = parsedAmount * total;
    }

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <DollarSign size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {editingExpense ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição do Gasto *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: iPhone, Jantar, Supermercado..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Amount & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor da Parcela/Mês (R$) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Cobrança
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="unica">Compra Única (À Vista)</option>
                <option value="parcelada">Compra Parcelada (Fatura)</option>
                <option value="fixa">Recorrência / Assinatura Fixa</option>
              </select>
            </div>
          </div>

          {/* Installments specific info */}
          {type === 'parcelada' && (
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-emerald-900 dark:text-emerald-300 mb-1">
                  Total de Parcelas
                </label>
                <input
                  type="number"
                  min="2"
                  max="48"
                  value={totalInstallments}
                  onChange={(e) => setTotalInstallments(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-emerald-900 dark:text-emerald-300 mb-1">
                  Parcela Inicial neste Mês
                </label>
                <input
                  type="number"
                  min="1"
                  max={totalInstallments}
                  value={currentInstallment}
                  onChange={(e) => setCurrentInstallment(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold"
                />
              </div>
            </div>
          )}

          {/* Card & Person Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <CardIcon size={14} className="text-emerald-500" />
                Cartão Utilizado
              </label>
              <select
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.bank})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <User size={14} className="text-blue-500" />
                Quem Gastou / Dono
              </label>
              <select
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
              >
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isSelf ? '(Você)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Tag size={14} className="text-amber-500" />
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar size={14} className="text-purple-500" />
                Mês Inicial de Cobrança
              </label>
              <input
                type="month"
                value={startMonthYear}
                onChange={(e) => setStartMonthYear(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Compra feita na Amazon com frete grátis..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all active:scale-95"
            >
              Salvar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
