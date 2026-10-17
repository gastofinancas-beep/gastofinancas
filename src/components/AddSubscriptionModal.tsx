import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  Check, 
  Calendar, 
  CreditCard as CardIcon, 
  User as UserIcon,
  Repeat,
  DollarSign
} from 'lucide-react';

import { CreditCard, Person, SubscriptionBillingCycle, SubscriptionCategory, SubscriptionItem } from '../types';
import { POPULAR_SUBSCRIPTION_PRESETS, ServicePreset } from '../data/subscriptionPresets';
import { SubscriptionLogo } from './SubscriptionLogo';
import { triggerHaptic } from '../utils/haptics';
import { Button } from './Button';

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

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const nameSuggestions = React.useMemo(() => {
    const q = name.trim().toLowerCase();
    if (editingSubscription || q.length < 2) return [];
    return POPULAR_SUBSCRIPTION_PRESETS.filter(
      (p) => p.name.toLowerCase().includes(q) && p.name.toLowerCase() !== q
    ).slice(0, 5);
  }, [name, editingSubscription]);

  const handleSelectPreset = (preset: ServicePreset) => {
    triggerHaptic(8);
    setName(preset.name);
    setServiceKey(preset.serviceKey);
    setCategory(preset.category);
    setAmountStr(preset.defaultAmount.toFixed(2).replace('.', ','));
    setBillingDay(preset.suggestedBillingDay || 10);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    triggerHaptic(12);
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

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      id="fixed-subscription-screen"
      className="fixed inset-0 z-[200] bg-slate-50 dark:bg-[#09090B] flex flex-col w-full h-full overflow-hidden"
    >
      {/* Fixed Top Header */}
      <header className="shrink-0 bg-white dark:bg-[#1C1C1E] border-b border-slate-200 dark:border-white/[0.08] px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Voltar"
          >
            <ArrowLeft size={18} className="stroke-[2.5]" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {editingSubscription ? 'Editar Assinatura' : 'Nova Assinatura'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gerencie seus serviços e cobranças recorrentes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="hidden sm:inline-flex px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4.5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check size={16} className="stroke-[2.5]" />
            <span>Salvar</span>
          </button>
        </div>
      </header>

      {/* Main Content Area - Fully Scrollable Vertical Container */}
      <main className="flex-1 overflow-y-auto overscroll-contain max-w-4xl w-full mx-auto px-4 sm:px-6 py-5 pb-28 sm:pb-16">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Popular Presets Selector (Wrapped, No Scroll) */}
          {!editingSubscription && (
            <div className="bg-white dark:bg-[#1C1C1E] p-3.5 rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Atalhos Rápidos de 1 Toque
              </span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SUBSCRIPTION_PRESETS.slice(0, 8).map((preset) => {
                  const isSelected = serviceKey === preset.serviceKey;
                  return (
                    <button
                      key={preset.serviceKey}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                          : 'bg-slate-50 dark:bg-[#2C2C2E]/60 border-slate-200/70 dark:border-white/[0.10] text-slate-700 dark:text-slate-300 hover:border-emerald-500/30'
                      }`}
                    >
                      <SubscriptionLogo serviceKey={preset.serviceKey} name={preset.name} size={18} />
                      <span>{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Core Fields Grid: 2 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Column: Identification & Value */}
            <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-2xs space-y-3.5">
              
              {/* Service Name with Dynamic Logo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome do Serviço / Assinatura *
                </label>
                <div className="flex items-center gap-2.5">
                  <SubscriptionLogo
                    serviceKey={serviceKey}
                    category={category}
                    name={name}
                    size={38}
                  />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingSubscription) setServiceKey('');
                    }}
                    placeholder="Ex: Spotify, Netflix, ChatGPT, iCloud..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                {nameSuggestions.length > 0 && (
                  <div className="mt-2 rounded-xl border border-slate-200/70 dark:border-white/[0.10] divide-y divide-slate-100 dark:divide-white/[0.06] overflow-hidden">
                    {nameSuggestions.map((preset) => (
                      <button
                        key={preset.serviceKey}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                      >
                        <SubscriptionLogo serviceKey={preset.serviceKey} name={preset.name} size={24} />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{preset.name}</span>
                        <span className="ml-auto text-[11px] text-slate-400 truncate">{preset.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount & Cycle */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Valor (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="text"
                      required
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value)}
                      placeholder="0,00"
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] text-slate-900 dark:text-white font-bold text-sm tabular-nums focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Ciclo
                  </label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value as SubscriptionBillingCycle)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
                  >
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                    <option value="semanal">Semanal</option>
                  </select>
                </div>
              </div>

              {/* Day of Month & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Dia da Renovação
                  </label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={billingDay}
                      onChange={(e) => setBillingDay(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>
                          Dia {day}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SubscriptionCategory)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* Right Column: Card, Person & Settings */}
            <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-2xs space-y-3.5">
              
              {/* Linked Card */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cartão Cobrado
                </label>
                <div className="relative">
                  <CardIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
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

              {/* Linked Person */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Responsável
                </label>
                <div className="relative">
                  <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={personId}
                    onChange={(e) => setPersonId(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
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

              {/* Status Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10]">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Assinatura Ativa
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {active ? 'Contabilizar nos gastos mensais' : 'Pausada'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    setActive(!active);
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    active ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Observações (Opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Plano Família, split com amigos..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

            </div>

          </div>

          {/* Bottom Fixed Action Bar */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Check size={16} className="stroke-[2.5]" />}
              className="w-full sm:w-auto"
            >
              {editingSubscription ? 'Salvar Alterações' : 'Cadastrar Assinatura'}
            </Button>
          </div>

        </form>
      </main>
    </div>,
    document.body
  );
}
