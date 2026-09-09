import React, { useState, useEffect } from 'react';
import { X, User, Phone, QrCode, LogOut, Check } from 'lucide-react';
import { Person, UserProfile } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
  profile: UserProfile;
  people: Person[];
  onSaveProfile: (updatedProfile: UserProfile, syncWithPersonMe: boolean) => void;
  onSignOut: () => void;
}

export function ProfileModal({
  isOpen,
  onClose,
  userEmail,
  profile,
  onSaveProfile,
  onSignOut,
}: ProfileModalProps) {
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [syncWithPersonMe, setSyncWithPersonMe] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNickname(profile.nickname || '');
      setPhone(profile.phone || '');
      setPixKey(profile.pixKey || '');
      setSavedSuccess(false);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(
      {
        nickname: nickname.trim() || undefined,
        phone: phone.trim() || undefined,
        pixKey: pixKey.trim() || undefined,
      },
      syncWithPersonMe
    );
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <User size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Meu Perfil & Conta
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Conta Vinculada
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5 truncate">
              {userEmail || 'Usuário'}
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Como gostaria de ser chamado(a)?
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Ex: Pedro, Mari, Dudu..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <QrCode size={14} className="text-emerald-500" />
              Sua Chave Pix para Recebimentos
            </label>
            <input
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="Ex: seu-pix@email.com ou CPF"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Phone size={14} className="text-blue-500" />
              Seu WhatsApp / Telefone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="syncMe"
              checked={syncWithPersonMe}
              onChange={(e) => setSyncWithPersonMe(e.target.checked)}
              className="rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <label htmlFor="syncMe" className="text-[11px] text-slate-600 dark:text-slate-400 select-none">
              Sincronizar meu nome na aba de divisão de gastos
            </label>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onSignOut}
              className="px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center gap-1.5"
            >
              <LogOut size={14} />
              Sair da Conta
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
            >
              {savedSuccess && <Check size={14} />}
              {savedSuccess ? 'Salvo!' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
