import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Check, Calendar, CreditCard as CardIcon, User as UserIcon } from 'lucide-react';
import { CreditCard, Person, SubscriptionBillingCycle, SubscriptionCategory, SubscriptionItem } from '../types';
import { POPULAR_SUBSCRIPTION_PRESETS, ServicePreset } from '../data/subscriptionPresets';
import { SubscriptionLogo } from './SubscriptionLogo';

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subscriptionData: Partial<SubscriptionItem>) => void;
  editingSubscription?: SubscriptionItem | null;
  cards: CreditCard[];
  people: Person[];
}

const CATEGORIES: { id: SubscriptionCategory; label: string }[] = [
  { id: 'streaming', label: 'Streaming' },
  { id: 'musica', label: 'Música' },
  { id: 'ia', label: 'IA & Tech' },
  { id: 'produtividade', label: 'Produtividade' },
  { id: 'jogos', label: 'Jogos' },
  { id: 'nuvem', label: 'Nuvem' },
  { id: 'educacao', label: 'Educação' },
  { id: 'saude', label: 'Saúde' },
  { id: 'outros', label: 'Outros' },
];

export function AddSubscriptionModal({
  isOpen,
  onClose,
  onSave,
  editingSubscription,
  cards,
  people,
}: AddSubscriptionModalProps) {
  const [name, setName] = useState('');
  const [serviceKey, setServiceKey] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<SubscriptionCategory>('streaming');
  const [billingCycle, setBillingCycle] = useState<SubscriptionBillingCycle>('mensal');
  const [billingDay, setBillingDay] = useState<number>(10);
  const [cardId, setCardId] = useState<string>('');
  const [personId, setPersonId] = useState<string>('');
  const [active, setActive] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (editingSubscription) {
      setName(editingSubscription.name);
      setServiceKey(editingSubscription.serviceKey || '');
      setAmountStr(editingSubscription.amount ? editingSubscription.amount.toString().replace('.', ',') : '');
      setCategory(editingSubscription.category || 'streaming');
      setBillingCycle(editingSubscription.billingCycle || 'mensal');
      setBillingDay(editingSubscription.billingDay || 10);
      setCardId(editingSubscription.cardId || '');
      setPersonId(editingSubscription.personId || '');
      setActive(editingSubscription.active ?? true);
      setNotes(editingSubscription.notes || '');
    } else {
      setName('');
      setServiceKey('');
      setAmountStr('');
      setCategory('streaming');
      setBillingCycle('mensal');
      setBillingDay(new Date().getDate() || 10);
      setCardId(cards[0]?.id || '');
      setPersonId(people.find(p => p.isSelf)?.id || people[0]?.id || '');
      setActive(true);
      setNotes('');
    }
  }, [editingSubscription, isOpen, cards, people]);

  const handleSelectPreset = (preset: ServicePreset) => {
    setName(preset.name);
    setServiceKey(preset.serviceKey);
    setCategory(preset.category);
    setAmountStr(preset.defaultAmount.toFixed(2).replace('.', ','));
    setBillingDay(preset.suggestedBillingDay || 10);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedAmount = parseFloat(amountStr.replace(',', '.')) || 0;

    onSave({
      id: editingSubscription?.id,
      name: name.trim(),
      serviceKey: serviceKey || name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      amount: parsedAmount,
      category,
      billingCycle,
      billingDay: Number(billingDay) || 1,
      cardId: cardId || undefined,
      personId: personId || undefined,
      active,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl border border-black/[0.08] dark:border-white/[0.1] p-5 sm:p-7 z-10 my-auto overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <Sparkles size={20} className="stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    {editingSubscription ? 'Editar Assinatura' : 'Nova Assinatura'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cadastre o valor e a data de renovação
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Quick Template Selector (Only when creating) */}
              {!editingSubscription && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Serviços Populares
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {POPULAR_SUBSCRIPTION_PRESETS.map((preset) => {
                      const isSelected = serviceKey === preset.serviceKey;
                      return (
                        <button
                          key={preset.serviceKey}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-semibold shrink-0 transition-all cursor-pointer select-none ${
                            isSelected
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                              : 'bg-slate-50 dark:bg-white/[0.04] border-slate-200/70 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:border-slate-300'
                          }`}
                        >
                          <SubscriptionLogo serviceKey={preset.serviceKey} name={preset.name} size={20} />
                          <span>{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Service Name & Preview */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nome do Serviço / Assinatura *
                </label>
                <div className="flex items-center gap-2.5">
                  <SubscriptionLogo
                    serviceKey={serviceKey}
                    category={category}
                    name={name}
                    size={42}
                  />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Spotify, Netflix, ChatGPT, iCloud..."
                    className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              {/* Amount & Billing Cycle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Valor Recorrente (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="text"
                      required
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value)}
                      placeholder="0,00"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white font-bold text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Ciclo de Cobrança
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10">
                    {(['mensal', 'anual', 'semanal'] as SubscriptionBillingCycle[]).map((cycle) => (
                      <button
                        key={cycle}
                        type="button"
                        onClick={() => setBillingCycle(cycle)}
                        className={`py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer select-none ${
                          billingCycle === cycle
                            ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                        }`}
                      >
                        {cycle}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Day of Month & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Dia da Renovação
                  </label>
                  <div className="relative">
                    <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={billingDay}
                      onChange={(e) => setBillingDay(Number(e.target.value))}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>
                          Dia {day} de cada mês
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SubscriptionCategory)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linked Card & Linked Person */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cartão Cobrado
                  </label>
                  <div className="relative">
                    <CardIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={cardId}
                      onChange={(e) => setCardId(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
                    >
                      <option value="">Nenhum / Débito em Conta</option>
                      {cards.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.bank})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Membro Responsável
                  </label>
                  <div className="relative">
                    <UserIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={personId}
                      onChange={(e) => setPersonId(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
                    >
                      <option value="">Eu mesmo (Titular)</option>
                      {people.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.isSelf ? '(Você)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Assinatura Ativa
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {active ? 'Contabilizar nas despesas mensais' : 'Pausada'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    active ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <motion.div layout className="w-4.5 h-4.5 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Notas (Opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Plano Família, senha compartilhada..."
                  className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={16} className="stroke-[2.5]" />
                  <span>{editingSubscription ? 'Salvar Alterações' : 'Cadastrar Assinatura'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
