import React, { useState, useEffect } from 'react';
import { X, Target, CheckCircle2 } from 'lucide-react';
import { FreelanceGoals } from '../types';

interface FreelanceGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: FreelanceGoals;
  onSave?: (newGoals: FreelanceGoals) => void;
  onSaveGoals?: (newGoals: FreelanceGoals) => void;
}

export function FreelanceGoalsModal({
  isOpen,
  onClose,
  goals,
  onSave,
  onSaveGoals
}: FreelanceGoalsModalProps) {
  const [monthlyGoal, setMonthlyGoal] = useState('');

  useEffect(() => {
    if (goals && goals.monthlyIncomeGoal !== undefined && goals.monthlyIncomeGoal !== null) {
      setMonthlyGoal(goals.monthlyIncomeGoal.toString());
    } else {
      setMonthlyGoal('0');
    }
  }, [goals, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanGoal = parseFloat(monthlyGoal.replace(',', '.'));
    if (isNaN(cleanGoal) || cleanGoal < 0) return;

    const payload = {
      monthlyIncomeGoal: cleanGoal,
    };

    if (onSave) {
      onSave(payload);
    } else if (onSaveGoals) {
      onSaveGoals(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.1] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Target size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Meta Mensal de Freelance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Objetivo de faturamento para o mês
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="bg-slate-50 dark:bg-black/20 p-6 rounded-3xl border border-slate-100 dark:border-white/5 text-center space-y-4">
            <label className="block text-sm font-bold text-slate-500 dark:text-slate-400">
              Objetivo de Faturamento Mensal
            </label>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">R$</span>
              <input
                type="number"
                step="50"
                min="0"
                required
                value={monthlyGoal}
                onChange={e => setMonthlyGoal(e.target.value)}
                placeholder="0,00"
                className="w-40 bg-transparent text-4xl sm:text-5xl font-bold text-indigo-600 dark:text-indigo-400 focus:outline-hidden text-center placeholder:text-indigo-600/30 dark:placeholder:text-indigo-400/30"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-500">
              Acompanhe seu progresso em tempo real conforme registra novos projetos.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={18} />
              Salvar Meta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
