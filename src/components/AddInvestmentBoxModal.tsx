import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Check, PiggyBank, DollarSign, Target, TrendingUp, Building2 } from 'lucide-react';
import { InvestmentBox, InvestmentFolder } from '../types';
import { CurrencyInput } from './CurrencyInput';
import { triggerHaptic } from '../utils/haptics';
import { Button } from './Button';

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
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [monthlyYieldPercent, setMonthlyYieldPercent] = useState('1.05');
  const [yieldDescription, setYieldDescription] = useState('100% CDI');
  const [institution, setInstitution] = useState('Nubank');
  const [notes, setNotes] = useState('');

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
    if (boxToEdit) {
      setTitle(boxToEdit.title);
      setFolderId(boxToEdit.folderId);
      setCurrentBalance(boxToEdit.currentBalance || 0);
      setTargetAmount(boxToEdit.targetAmount || 0);
      setMonthlyYieldPercent(boxToEdit.monthlyYieldPercent.toString());
      setYieldDescription(boxToEdit.yieldDescription || '100% CDI');
      setInstitution(boxToEdit.institution || 'Nubank');
      setNotes(boxToEdit.notes || '');
    } else {
      setTitle('');
      setFolderId(defaultFolderId || (folders[0]?.id || 'default'));
      setCurrentBalance(0);
      setTargetAmount(0);
      setMonthlyYieldPercent('1.05');
      setYieldDescription('100% CDI');
      setInstitution('Nubank');
      setNotes('');
    }
  }, [boxToEdit, isOpen, defaultFolderId, folders]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    triggerHaptic(12);
    onSaveBox({
      ...(boxToEdit ? { id: boxToEdit.id } : {}),
      title: title.trim(),
      folderId: folderId || 'default',
      currentBalance,
      targetAmount: targetAmount > 0 ? targetAmount : undefined,
      monthlyYieldPercent: (() => {
        const v = parseFloat(monthlyYieldPercent.replace(',', '.'));
        return Number.isFinite(v) && v >= 0 ? v : 1.0;
      })(),
      yieldDescription: yieldDescription.trim() || undefined,
      institution: institution.trim() || 'Nubank',
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return createPortal(
    <div 
      id="fixed-investment-box-screen"
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
              {boxToEdit ? 'Editar Caixinha' : 'Nova Caixinha de Investimento'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reserva de emergência, metas e rendimento automático
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
            <span>Salvar Caixinha</span>
          </button>
        </div>
      </header>

      {/* Main Content Area - Fully Scrollable Vertical Container */}
      <main className="flex-1 overflow-y-auto overscroll-contain max-w-4xl w-full mx-auto px-4 sm:px-6 py-5 pb-28 sm:pb-16">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Card: Basic Data */}
            <div className="bg-white dark:bg-[#1C1C1E] p-4.5 rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-2xs space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome da Caixinha *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Reserva Nubank, Viagem Réveillon, Troca de Carro..."
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Pasta de Organização
                  </label>
                  <select
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-xl text-slate-900 dark:text-white text-xs font-medium cursor-pointer"
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <Building2 size={13} className="text-purple-500" />
                    Banco / Corretora
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Ex: Nubank, Inter, Rico..."
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-xl text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Notas & Detalhes (Opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Liquidez diária para resgate a qualquer momento"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-xl text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>

            {/* Right Card: Values & Yields */}
            <div className="bg-white dark:bg-[#1C1C1E] p-4.5 rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-2xs space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <DollarSign size={13} className="text-emerald-500" />
                    Saldo Atual (R$)
                  </label>
                  <CurrencyInput
                    value={currentBalance}
                    onChange={setCurrentBalance}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <Target size={13} className="text-blue-500" />
                    Meta de Valor (R$)
                  </label>
                  <CurrencyInput
                    value={targetAmount}
                    onChange={setTargetAmount}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <TrendingUp size={13} className="text-amber-500" />
                    Rendimento (% a.m.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={monthlyYieldPercent}
                    onChange={(e) => setMonthlyYieldPercent(e.target.value)}
                    placeholder="1.05"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-xl text-slate-900 dark:text-white text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tipo / Indexador
                  </label>
                  <input
                    type="text"
                    value={yieldDescription}
                    onChange={(e) => setYieldDescription(e.target.value)}
                    placeholder="Ex: 100% CDI, IPCA + 6%..."
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-xl text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
                <span className="font-semibold block mb-0.5">Rendimento Automático</span>
                <span>O saldo renderá aproximadamente <strong className="font-bold">{monthlyYieldPercent || '1.05'}%</strong> ao mês com base nas taxas cadastradas.</span>
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
              {boxToEdit ? 'Salvar Alterações' : 'Salvar Caixinha'}
            </Button>
          </div>

        </form>
      </main>
    </div>,
    document.body
  );
}
