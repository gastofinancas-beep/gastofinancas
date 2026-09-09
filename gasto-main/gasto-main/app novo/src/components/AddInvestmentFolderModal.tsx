import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Folder, Shield, Sparkles, Target, Compass, Heart } from 'lucide-react';
import { InvestmentFolder } from '../types';

interface AddInvestmentFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveFolder: (folderData: Partial<InvestmentFolder>) => void;
  folderToEdit?: InvestmentFolder | null;
}

const ICONS = [
  { id: 'Folder', label: 'Pasta Padrão', icon: Folder },
  { id: 'Shield', label: 'Segurança / Reserva', icon: Shield },
  { id: 'Sparkles', label: 'Sonhos & Conquistas', icon: Sparkles },
  { id: 'Target', label: 'Metas Claras', icon: Target },
  { id: 'Compass', label: 'Viagens & Planos', icon: Compass },
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveFolder({
      ...(folderToEdit ? { id: folderToEdit.id } : {}),
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      icon,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FolderPlus size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {folderToEdit ? 'Editar Pasta de Caixinhas' : 'Nova Pasta de Caixinhas'}
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
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome da Pasta *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Reserva de Emergência, Viagens..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Caixinhas dedicadas para metas de 2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Ícone
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ICONS.map((item) => {
                const IconComp = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcon(item.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                      icon === item.id
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <IconComp size={16} />
                    <span className="text-[10px] truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Cor de Destaque
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all active:scale-95"
            >
              Salvar Pasta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
