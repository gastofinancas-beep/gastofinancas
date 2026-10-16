import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  UserPlus, 
  Camera, 
  Trash2,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { Person } from '../types';
import { compressImageFile } from '../utils/imageUtils';
import { triggerHaptic } from '../utils/haptics';
import { Button } from './Button';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (personData: Partial<Person>) => void;
  editingPerson?: Person | null;
}

const AVATAR_COLORS = [
  { bg: 'bg-[#00965E]', name: 'Verde Esmeralda' },
  { bg: 'bg-[#2563EB]', name: 'Azul' },
  { bg: 'bg-[#7C3AED]', name: 'Roxo' },
  { bg: 'bg-[#DB2777]', name: 'Rosa' },
  { bg: 'bg-[#EA580C]', name: 'Laranja' },
  { bg: 'bg-[#E11D48]', name: 'Vermelho' },
  { bg: 'bg-[#0D9488]', name: 'Teal' },
  { bg: 'bg-[#4B5563]', name: 'Chumbo' },
];

export function AddPersonModal({ isOpen, onClose, onSave, editingPerson }: AddPersonModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [avatarBg, setAvatarBg] = useState(AVATAR_COLORS[0].bg);
  const [isUploading, setIsUploading] = useState(false);
  const [showMoreFields, setShowMoreFields] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingPerson) {
      setName(editingPerson.name || '');
      setPhone(editingPerson.phone || '');
      setPixKey(editingPerson.pixKey || '');
      setEmail(editingPerson.email || '');
      setNotes(editingPerson.notes || '');
      setPhotoURL(editingPerson.photoURL || '');
      setAvatarBg(editingPerson.avatarBg || AVATAR_COLORS[0].bg);
      if (editingPerson.email || editingPerson.notes) {
        setShowMoreFields(true);
      }
    } else {
      setName('');
      setPhone('');
      setPixKey('');
      setEmail('');
      setNotes('');
      setPhotoURL('');
      setAvatarBg(AVATAR_COLORS[0].bg);
      setShowMoreFields(false);
    }
  }, [editingPerson, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    triggerHaptic(10);
    try {
      const compressed = await compressImageFile(file, 300, 300, 0.85);
      setPhotoURL(compressed);
      triggerHaptic(15);
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    triggerHaptic(15);

    onSave({
      id: editingPerson?.id,
      name: name.trim(),
      phone: phone.trim() || undefined,
      pixKey: pixKey.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      photoURL: photoURL.trim() || undefined,
      avatarBg,
      isSelf: editingPerson?.isSelf,
    });

    onClose();
  };

  const isFormValid = name.trim().length > 0;

  return createPortal(
    <div 
      className="fixed inset-0 z-[200] bg-white dark:bg-[#121214] overflow-y-auto flex flex-col w-full h-[100dvh] text-slate-900 dark:text-slate-100 animate-in fade-in duration-150"
    >
      {/* Header Limpo e Moderno */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#121214]/90 backdrop-blur-md border-b border-slate-100 dark:border-white/[0.06] px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(6);
              onClose();
            }}
            className="w-10 h-10 rounded-2xl bg-[#F1F3F5] dark:bg-[#1E1E20] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="Voltar"
          >
            <ArrowLeft size={18} className="stroke-[2.5]" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              {editingPerson ? 'Editar Pessoa' : 'Nova Pessoa (Cartão Emprestado)'}
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Organize as compras de amigos e familiares no seu cartão
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic(6);
            onClose();
          }}
          className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-[#F1F3F5] dark:hover:bg-white/[0.08] flex items-center justify-center transition-colors cursor-pointer"
          title="Fechar"
        >
          <X size={18} />
        </button>
      </header>

      {/* Conteúdo Principal Estilo Minimalista de Alto Padrão */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-6 pb-36">
        <form id="person-form" onSubmit={handleSubmit} className="space-y-5">
          
          {/* Seção 1: Foto e Cor do Avatar */}
          <div className="p-4 rounded-3xl bg-slate-50/70 dark:bg-[#18181A] border border-slate-100 dark:border-white/[0.04] space-y-3.5">
            <div className="flex items-center gap-3.5">
              {/* Avatar circular / rounded-2xl */}
              <div className="relative shrink-0">
                <div 
                  className={`w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-xl text-white shadow-2xs transition-all ${
                    photoURL ? 'bg-slate-900' : avatarBg
                  }`}
                >
                  {photoURL ? (
                    <img 
                      src={photoURL} 
                      alt={name || 'Avatar'} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    (name || 'P').charAt(0).toUpperCase()
                  )}
                </div>

                {photoURL && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setPhotoURL('');
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-xs cursor-pointer active:scale-95"
                    title="Remover foto"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>

              {/* Controles de Foto */}
              <div className="min-w-0 flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                
                <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                  Foto ou Avatar
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Adicione uma foto de perfil ou escolha uma cor
                </span>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    fileInputRef.current?.click();
                  }}
                  disabled={isUploading}
                  className="mt-1.5 px-3 py-1.5 bg-white dark:bg-[#252528] hover:bg-slate-100 dark:hover:bg-[#2F2F34] text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-white/[0.08] rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  <Camera size={13} className="text-slate-500 dark:text-slate-300" />
                  <span>{isUploading ? 'Carregando...' : photoURL ? 'Trocar Foto' : 'Adicionar Foto'}</span>
                </button>
              </div>
            </div>

            {/* Paleta de Cores Redondas e Limpas */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.05]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Cor de Identificação
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => {
                  const isSelected = avatarBg === color.bg && !photoURL;
                  return (
                    <button
                      key={color.bg}
                      type="button"
                      onClick={() => {
                        triggerHaptic(6);
                        setAvatarBg(color.bg);
                      }}
                      className={`w-7 h-7 rounded-full ${color.bg} flex items-center justify-center transition-all cursor-pointer ${
                        isSelected 
                          ? 'ring-3 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-[#18181A] scale-110' 
                          : 'opacity-80 hover:opacity-100 hover:scale-105'
                      }`}
                      title={color.name}
                    >
                      {isSelected && <Check size={12} className="text-white stroke-[3.5]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Campo 1: Nome da Pessoa (Estilo Ref: Bold Label + Soft Rounded Gray Box) */}
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
              Nome ou Identificação <span className="text-rose-500">*</span>
            </label>
            
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mariana, Lucas (Irmão), Mãe"
              required
              autoFocus={!editingPerson}
              className="w-full px-4 py-3.5 bg-[#F1F3F5] dark:bg-[#1E1E20] border-0 rounded-2xl text-slate-900 dark:text-white text-[16px] font-medium placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/25 focus:bg-[#EAECEF] dark:focus:bg-[#252528] transition-all"
            />
          </div>

          {/* Campo 2: WhatsApp / Mobile Number */}
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
              WhatsApp / Celular
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: (11) 99999-8888"
              className="w-full px-4 py-3.5 bg-[#F1F3F5] dark:bg-[#1E1E20] border-0 rounded-2xl text-slate-900 dark:text-white text-[16px] font-medium placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/25 focus:bg-[#EAECEF] dark:focus:bg-[#252528] transition-all"
            />
            <span className="text-[11px] text-slate-400 block mt-1">
              Permite cobrar e detalhar compras no WhatsApp com 1 toque
            </span>
          </div>

          {/* Campo 3: Chave Pix */}
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
              Chave Pix da Pessoa
            </label>
            <input
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="CPF, celular, e-mail ou chave aleatória"
              className="w-full px-4 py-3.5 bg-[#F1F3F5] dark:bg-[#1E1E20] border-0 rounded-2xl text-slate-900 dark:text-white text-[16px] font-medium placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/25 focus:bg-[#EAECEF] dark:focus:bg-[#252528] transition-all"
            />
            <span className="text-[11px] text-slate-400 block mt-1">
              Fica disponível para copiar rápido durante os acertos
            </span>
          </div>

          {/* Toggle para Campos Adicionais */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(6);
                setShowMoreFields(!showMoreFields);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <span>{showMoreFields ? 'Ocultar campos extras' : 'Mais opções (E-mail, anotações)'}</span>
              {showMoreFields ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {showMoreFields && (
            <div className="space-y-4 pt-1 animate-in fade-in duration-150">
              {/* Campo 4: E-mail */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  className="w-full px-4 py-3.5 bg-[#F1F3F5] dark:bg-[#1E1E20] border-0 rounded-2xl text-slate-900 dark:text-white text-[16px] font-medium placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/25 focus:bg-[#EAECEF] dark:focus:bg-[#252528] transition-all"
                />
              </div>

              {/* Campo 5: Anotações */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  Anotações / Combinado
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Paga todo dia 10 logo após o salário..."
                  className="w-full px-4 py-3.5 bg-[#F1F3F5] dark:bg-[#1E1E20] border-0 rounded-2xl text-slate-900 dark:text-white text-[16px] font-medium placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/25 focus:bg-[#EAECEF] dark:focus:bg-[#252528] transition-all resize-none"
                />
              </div>
            </div>
          )}
        </form>
      </main>

      {/* Barra de Ações Inferior Fixa */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-md border-t border-slate-100 dark:border-white/[0.06] p-4 shadow-lg">
        <div className="max-w-md mx-auto flex items-center gap-2.5 sm:gap-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-24 sm:w-28 shrink-0"
            onClick={() => {
              triggerHaptic(6);
              onClose();
            }}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            form="person-form"
            variant="primary"
            size="lg"
            disabled={!isFormValid}
            className="flex-1"
            leftIcon={<UserPlus size={16} className="stroke-[2.5]" />}
          >
            {editingPerson ? 'Salvar Alterações' : 'Cadastrar Pessoa'}
          </Button>
        </div>
      </footer>
    </div>,
    document.body
  );
}
