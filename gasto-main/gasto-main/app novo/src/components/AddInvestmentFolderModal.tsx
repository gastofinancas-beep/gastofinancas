import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Check, Folder, Shield, Sparkles, Target, Compass, Heart } from 'lucide-react';
import { InvestmentFolder } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { Button } from './Button';

interface AddInvestmentFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveFolder: (folderData: Partial<InvestmentFolder>) => void;
  folderToEdit?: InvestmentFolder | null;
}

const ICONS = [
  { id: 'Folder', label: 'Pasta Padrão', icon: Folder },
  { id: 'Shield', label: 'Segurança / Reserva', icon: Shield },
  { id: 'Sparkles', label: 'Sonhos & Metas', icon: Sparkles },
  { id: 'Target', label: 'Objetivos Claros', icon: Target },
  { id: 'Compass', label: 'Viagens & Lazer', icon: Compass },
  { id: 'Heart', label: 'Família & Bem-estar', icon: Heart },
];

const COLORS = [
  '#10B981', '#3B82F6', '#8A05BE', '#EC7000', '#F43F5E', '#14B8A6', '#6366F1', '#EAB308'
];

export function AddInvestmentFolderModal({
  isOpen,
  onClose,
  onSaveFolder,
  folderToEdit,
}: AddInvestmentFolderModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState('Folder');

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
    if (folderToEdit) {
      setName(folderToEdit.name);
      setDescription(folderToEdit.description || '');
      setColor(folderToEdit.color);
      setIcon(folderToEdit.icon);
    } else {
      setName('');
      setDescription('');
      setColor(COLORS[0]);
      setIcon('Folder');
    }
  }, [folderToEdit, isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    triggerHaptic(12);
    onSaveFolder({
      ...(folderToEdit ? { id: folderToEdit.id } : {}),
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      icon,
    });

    onClose();
  };

  return createPortal(
    <div 
      id="fixed-investment-folder-screen"
      className="fixed inset-0 z-[200] bg-slate-50 dark:bg-[#09090B] flex flex-col w-full h-full overflow-hidden"
    >
      {/* Fixed Top Header */}
      <header className="shrink-0 bg-white dark:bg-[#1C1C1E] border-b border-slate-200 dark:border-white/[0.08] px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Voltar"
          >
            <ArrowLeft size={18} className="stroke-[2.5]" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {folderToEdit ? 'Editar Pasta de Caixinhas' : 'Nova Pasta de Caixinhas'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Categorize e agrupe suas caixinhas e objetivos
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
            <span>Salvar Pasta</span>
          </button>
        </div>
      </header>

      {/* Main Content Area - Fully Scrollable Vertical Container */}
      <main className="flex-1 overflow-y-auto overscroll-contain max-w-xl w-full mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-16">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome da Pasta *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Reserva de Emergência, Viagens..."
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Descrição (Opcional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Caixinhas dedicadas para metas de 2026"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-xl text-slate-900 dark:text-white text-xs"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-2xs space-y-4">
            {/* Icon Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Ícone Representativo
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ICONS.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = icon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic(8);
                        setIcon(item.id);
                      }}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-white/[0.10] text-slate-600 dark:text-slate-400 hover:border-emerald-500/30'
                      }`}
                    >
                      <IconComp size={16} />
                      <span className="text-xs truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Palette */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Cor de Destaque
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setColor(c);
                    }}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                      color === c ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Fixed Action Buttons */}
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
              Salvar Pasta
            </Button>
          </div>

        </form>
      </main>
    </div>,
    document.body
  );
}
