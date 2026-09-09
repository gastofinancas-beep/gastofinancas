import React, { useState, useEffect } from 'react';
import { X, UserPlus, Phone, QrCode, CreditCard, Sparkles } from 'lucide-react';
import { Person } from '../types';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (personData: Partial<Person>) => void;
  editingPerson?: Person | null;
}

const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-blue-600',
  'bg-violet-600',
  'bg-pink-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-indigo-600',
  'bg-teal-600',
  'bg-cyan-600',
  'bg-slate-700',
];

const SUGGESTED_RELATIONS = [
  'Namorada(o)',
  'Esposa / Marido',
  'Irmão / Irmã',
  'Mãe / Pai',
  'Filho(a)',
  'Amigo(a)',
  'Colega de Trabalho',
];

export function AddPersonModal({ isOpen, onClose, onSave, editingPerson }: AddPersonModalProps) {
  const [name, setName] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarBg, setAvatarBg] = useState(AVATAR_COLORS[0]);

  useEffect(() => {
    if (editingPerson) {
      setName(editingPerson.name || '');
      setPixKey(editingPerson.pixKey || '');
      setPhone(editingPerson.phone || '');
      setAvatarBg(editingPerson.avatarBg || AVATAR_COLORS[0]);
    } else {
      setName('');
      setPixKey('');
      setPhone('');
      setAvatarBg(AVATAR_COLORS[0]);
    }
  }, [editingPerson, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: editingPerson?.id,
      name: name.trim(),
      pixKey: pixKey.trim() || undefined,
      phone: phone.trim() || undefined,
      avatarBg,
      isSelf: editingPerson?.isSelf,
    });

    onClose();
  };

  const handleApplySuggestion = (rel: string) => {
    if (!name) {
      setName(rel);
    } else if (!name.includes('(')) {
      setName(`${name} (${rel})`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 dark:border-white/[0.08]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold shadow-2xs">
              {editingPerson ? <CreditCard size={18} /> : <UserPlus size={18} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {editingPerson ? 'Editar Pessoa / Empréstimo' : 'Nova Pessoa (Cartão Emprestado)'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Organize as compras de amigos e familiares no seu cartão
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Name & Quick Suggestions */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome ou Apelido *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mariana (Namorada), Lucas (Irmão)..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />

            {!editingPerson && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Sparkles size={10} /> Sugestões:
                </span>
                {SUGGESTED_RELATIONS.map((rel) => (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => handleApplySuggestion(rel)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-medium transition-colors cursor-pointer"
                  >
                    +{rel}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pix Key */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <QrCode size={14} className="text-emerald-500" />
              Chave Pix da pessoa (opcional)
            </label>
            <input
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              Facilita identificar ou guardar a chave para eventuais devoluções.
            </p>
          </div>

          {/* WhatsApp / Phone */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Phone size={14} className="text-blue-500" />
              WhatsApp / Telefone para Cobrança (opcional)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: 11999998888 ou (11) 99999-8888"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              Permite enviar cobranças prontas com um único clique direto no WhatsApp.
            </p>
          </div>

          {/* Avatar Color */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Cor de Identificação
            </label>
            <div className="flex items-center gap-2">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAvatarBg(color)}
                  className={`w-7 h-7 rounded-xl ${color} transition-all cursor-pointer ${
                    avatarBg === color ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110 shadow-xs' : 'opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 font-bold bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              {editingPerson ? 'Salvar Alterações' : 'Cadastrar Pessoa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
