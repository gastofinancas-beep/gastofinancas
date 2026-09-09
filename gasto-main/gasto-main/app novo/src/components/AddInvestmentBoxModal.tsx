import React, { useState, useEffect } from 'react';
import { X, PiggyBank, DollarSign, Target, TrendingUp, Building2 } from 'lucide-react';
import { InvestmentBox, InvestmentFolder } from '../types';

interface AddInvestmentBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBox: (boxData: Partial<InvestmentBox>) => void;
  folders: InvestmentFolder[];
  boxToEdit?: InvestmentBox | null;
  defaultFolderId?: string;
}

export function AddInvestmentBoxModal({
  isOpen,
  onClose,
  onSaveBox,
  folders,
  boxToEdit,
  defaultFolderId,
}: AddInvestmentBoxModalProps) {
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [monthlyYieldPercent, setMonthlyYieldPercent] = useState('1.05');
  const [yieldDescription, setYieldDescription] = useState('100% CDI');
  const [institution, setInstitution] = useState('Nubank');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (boxToEdit) {
      setTitle(boxToEdit.title);
      setFolderId(boxToEdit.folderId);
      setCurrentBalance(boxToEdit.currentBalance.toString());
      setTargetAmount(boxToEdit.targetAmount ? boxToEdit.targetAmount.toString() : '');
      setMonthlyYieldPercent(boxToEdit.monthlyYieldPercent.toString());
      setYieldDescription(boxToEdit.yieldDescription || '100% CDI');
      setInstitution(boxToEdit.institution || 'Nubank');
      setNotes(boxToEdit.notes || '');
    } else {
      setTitle('');
      setFolderId(defaultFolderId || (folders[0]?.id || 'default'));
      setCurrentBalance('');
      setTargetAmount('');
      setMonthlyYieldPercent('1.05');
      setYieldDescription('100% CDI');
      setInstitution('Nubank');
      setNotes('');
    }
  }, [boxToEdit, isOpen, defaultFolderId, folders]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSaveBox({
      ...(boxToEdit ? { id: boxToEdit.id } : {}),
      title: title.trim(),
      folderId: folderId || 'default',
      currentBalance: parseFloat(currentBalance.replace(',', '.')) || 0,
      targetAmount: targetAmount ? parseFloat(targetAmount.replace(',', '.')) : undefined,
      monthlyYieldPercent: parseFloat(monthlyYieldPercent.replace(',', '.')) || 1.0,
      yieldDescription: yieldDescription.trim() || undefined,
      institution: institution.trim() || 'Nubank',
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <PiggyBank size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {boxToEdit ? 'Editar Caixinha' : 'Nova Caixinha de Investimento'}
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
              Nome da Caixinha *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reserva Nubank, Viagem Réveillon, Troca de Carro..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pasta de Organização
              </label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
              >
                <option value="default">Geral (Sem Pasta)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Building2 size={14} className="text-purple-500" />
                Instituição / Banco
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Ex: Nubank, Inter, Rico..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <DollarSign size={14} className="text-emerald-500" />
                Saldo Atual (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Target size={14} className="text-blue-500" />
                Meta de Valor (R$, opcional)
              </label>
              <input
                type="number"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="Ex: 20000,00"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-amber-500" />
                Rendimento Mensal Médio (% a.m.)
              </label>
              <input
                type="number"
                step="0.01"
                value={monthlyYieldPercent}
                onChange={(e) => setMonthlyYieldPercent(e.target.value)}
                placeholder="1.05"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo / Indexador
              </label>
              <input
                type="text"
                value={yieldDescription}
                onChange={(e) => setYieldDescription(e.target.value)}
                placeholder="Ex: 100% CDI, IPCA + 6%..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notas & Detalhes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Liquidez diária para resgate a qualquer momento"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs"
            />
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
              Salvar Caixinha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
