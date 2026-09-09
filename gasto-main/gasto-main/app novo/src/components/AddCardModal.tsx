import React, { useState } from 'react';
import { X, CreditCard as CardIcon, DollarSign, Calendar, Sparkles } from 'lucide-react';
import { CreditCard } from '../types';
import { BankLogo } from './BankLogo';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: Partial<CreditCard>) => void;
}

const BANK_PRESETS = [
  { bank: 'Nubank', name: 'Nubank Ultravioleta', color: '#8A05BE', gradient: 'from-purple-950 via-purple-700 to-indigo-950' },
  { bank: 'Itaú', name: 'Itaú Black', color: '#EC7000', gradient: 'from-amber-800 via-orange-600 to-stone-950' },
  { bank: 'Inter', name: 'Inter Mastercard', color: '#FF7A00', gradient: 'from-orange-600 via-amber-500 to-yellow-600' },
  { bank: 'C6 Bank', name: 'C6 Carbon', color: '#242424', gradient: 'from-stone-900 via-neutral-800 to-black' },
  { bank: 'Bradesco', name: 'Bradesco Elo Nanquim', color: '#CC092F', gradient: 'from-rose-900 via-red-700 to-slate-950' },
  { bank: 'Santander', name: 'Santander Unlimited', color: '#EC0000', gradient: 'from-red-900 via-red-700 to-stone-950' },
  { bank: 'Banco do Brasil', name: 'BB Altus Visa', color: '#003882', gradient: 'from-blue-900 via-blue-800 to-slate-950' },
  { bank: 'Caixa', name: 'Caixa Visa Infinite', color: '#005CA9', gradient: 'from-blue-900 via-cyan-800 to-stone-950' },
  { bank: 'Mercado Pago', name: 'Mercado Pago Visa', color: '#00A650', gradient: 'from-teal-700 via-emerald-600 to-cyan-950' },
  { bank: 'XP', name: 'XP Visa Infinite', color: '#000000', gradient: 'from-zinc-950 via-neutral-900 to-black' },
  { bank: 'BTG Pactual', name: 'BTG Black', color: '#0B1E36', gradient: 'from-slate-950 via-blue-950 to-neutral-900' },
];

export function AddCardModal({ isOpen, onClose, onSave }: AddCardModalProps) {
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [lastDigits, setLastDigits] = useState('');
  const [limit, setLimit] = useState('5000');
  const [closingDay, setClosingDay] = useState('8');
  const [dueDay, setDueDay] = useState('15');
  const [selectedTheme, setSelectedTheme] = useState(BANK_PRESETS[0]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof BANK_PRESETS[0]) => {
    setBank(preset.bank);
    setName(preset.name);
    setSelectedTheme(preset);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !bank.trim()) return;

    onSave({
      name: name.trim(),
      bank: bank.trim(),
      lastDigits: lastDigits.trim() || undefined,
      limit: parseFloat(limit) || 1000,
      closingDay: parseInt(closingDay, 10) || 8,
      dueDay: parseInt(dueDay, 10) || 15,
      color: selectedTheme.color,
      gradient: selectedTheme.gradient,
    });

    setName('');
    setBank('');
    setLastDigits('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-white/[0.12] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CardIcon size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Cadastrar Novo Cartão
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Bank Presets with Official Icons */}
        <div className="mt-4">
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-[11px]">
            Selecione o Banco
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {BANK_PRESETS.map((preset) => {
              const isSelected = bank.toLowerCase() === preset.bank.toLowerCase();
              return (
                <button
                  key={preset.bank}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 shrink-0 transition-all text-xs font-semibold select-none ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <BankLogo bankName={preset.bank} size={18} />
                  <span>{preset.bank}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-3 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome do Cartão *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Nubank Ultravioleta, Itaú Click..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Banco Emissor *
              </label>
              <input
                type="text"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                placeholder="Ex: Nubank, Itaú..."
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Últimos 4 Dígitos
              </label>
              <input
                type="text"
                maxLength={4}
                value={lastDigits}
                onChange={(e) => setLastDigits(e.target.value)}
                placeholder="Ex: 8492"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Limite Total
              </label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dia Fechamento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dia Vencimento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-xs font-bold"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              Salvar Cartão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
