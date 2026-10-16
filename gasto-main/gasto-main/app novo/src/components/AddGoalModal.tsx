import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, 
  Check, 
  Target, 
  Sparkles, 
  Calendar, 
  PiggyBank, 
  ShieldCheck, 
  Plane, 
  Car, 
  Home, 
  Laptop, 
  GraduationCap,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { AccumulationGoal, GoalCategory } from '../types';
import { CurrencyInput } from './CurrencyInput';
import { triggerHaptic } from '../utils/haptics';
import { formatCurrency, formatMonthDisplay, formatMonthShort, addMonths } from '../utils/financeCalculations';
import { Button } from './Button';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGoal: (goal: AccumulationGoal) => void;
  goalToEdit?: AccumulationGoal | null;
  currentMonth: string;
}

const CATEGORY_OPTIONS: { id: GoalCategory; label: string; icon: React.ElementType }[] = [
  { id: 'reserva', label: 'Reserva de Emergência', icon: ShieldCheck },
  { id: 'viagem', label: 'Viagem & Férias', icon: Plane },
  { id: 'veiculo', label: 'Carro / Veículo', icon: Car },
  { id: 'imovel', label: 'Casa / Imóvel', icon: Home },
  { id: 'eletronicos', label: 'Tecnologia / Eletrônicos', icon: Laptop },
  { id: 'estudos', label: 'Estudos & Cursos', icon: GraduationCap },
  { id: 'outro', label: 'Objetivo Geral', icon: PiggyBank },
];

const COLOR_PALETTE = [
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#F59E0B', // amber
  '#EC4899', // pink
  '#06B6D4', // cyan
];

const PRESET_MONTHS = [3, 6, 12, 18, 24, 36];

export function AddGoalModal({
  isOpen,
  onClose,
  onSaveGoal,
  goalToEdit,
  currentMonth,
}: AddGoalModalProps) {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [startMonth, setStartMonth] = useState(currentMonth);
  const [targetMonthsCount, setTargetMonthsCount] = useState<number>(12);
  const [category, setCategory] = useState<GoalCategory>('outro');
  const [color, setColor] = useState('#10B981');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Lock body scroll when screen is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Sync state when opening for edit or new
  useEffect(() => {
    if (goalToEdit) {
      setTitle(goalToEdit.title || '');
      setTargetAmount(goalToEdit.targetAmount || 0);
      setCurrentAmount(goalToEdit.currentAmount || 0);
      setStartMonth(goalToEdit.startMonth || currentMonth);
      setTargetMonthsCount(goalToEdit.targetMonthsCount || 12);
      setCategory(goalToEdit.category || 'outro');
      setColor(goalToEdit.color || '#10B981');
      setNotes(goalToEdit.notes || '');
      setErrorMessage('');
    } else {
      setTitle('');
      setTargetAmount(0);
      setCurrentAmount(0);
      setStartMonth(currentMonth);
      setTargetMonthsCount(12);
      setCategory('outro');
      setColor('#10B981');
      setNotes('');
      setErrorMessage('');
    }
  }, [goalToEdit, isOpen, currentMonth]);

  // Calculations
  const remainingNeeded = Math.max(0, targetAmount - currentAmount);
  const validMonths = Math.max(1, targetMonthsCount || 1);
  const monthlyNeeded = remainingNeeded / validMonths;
  const targetEndMonth = useMemo(() => {
    return addMonths(startMonth || currentMonth, validMonths);
  }, [startMonth, currentMonth, validMonths]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Por favor, informe o nome do seu objetivo.');
      return;
    }
    if (targetAmount <= 0) {
      setErrorMessage('Defina um valor total maior que zero para a sua meta.');
      return;
    }

    triggerHaptic(12);

    const goalData: AccumulationGoal = {
      id: goalToEdit ? goalToEdit.id : `goal-${Date.now()}`,
      title: title.trim(),
      targetAmount,
      currentAmount,
      startMonth: startMonth || currentMonth,
      targetMonthsCount: validMonths,
      category,
      color,
      notes: notes.trim() || undefined,
      createdAt: goalToEdit ? goalToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveGoal(goalData);
    onClose();
  };

  return createPortal(
    <div 
      id="fixed-goal-creation-screen"
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
              {goalToEdit ? 'Editar Meta de Juntar Dinheiro' : 'Nova Meta de Juntar Dinheiro'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Defina quanto quer juntar, o prazo e acompanhe o cálculo automático
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hidden sm:inline-flex"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            leftIcon={<Check size={16} className="stroke-[2.5]" />}
          >
            Salvar Meta
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overscroll-contain max-w-3xl w-full mx-auto px-4 sm:px-6 py-5 pb-32 sm:pb-16 space-y-4">
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Card 1: Objetivo & Nome */}
          <div className="bg-white dark:bg-[#1C1C1E] p-4.5 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome do Objetivo *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Ex: Viagem de Férias, Reserva de Emergência, Troca de Carro..."
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Categoria da Meta
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORY_OPTIONS.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold'
                          : 'border-slate-200/70 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                      }`}>
                        <Icon size={14} />
                      </div>
                      <span className="text-[11px] leading-tight truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cor de Identificação */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Cor de Identificação
              </label>
              <div className="flex items-center gap-2.5">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check size={14} className="text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Valores Financeiros */}
          <div className="bg-white dark:bg-[#1C1C1E] p-4.5 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-2xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Quanto quer juntar no total? *
                </label>
                <CurrencyInput
                  value={targetAmount}
                  onChange={(val) => {
                    setTargetAmount(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="0,00"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Valor final do seu objetivo
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Já tem algum valor guardado?
                </label>
                <CurrencyInput
                  value={currentAmount}
                  onChange={setCurrentAmount}
                  placeholder="0,00"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Ponto de partida atual (opcional)
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Prazo e Previsão */}
          <div className="bg-white dark:bg-[#1C1C1E] p-4.5 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-2xs space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Em quanto tempo quer alcançar esse valor?
                </label>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  {targetMonthsCount} {targetMonthsCount === 1 ? 'mês' : 'meses'}
                </span>
              </div>

              {/* Chips Rápidos de Meses */}
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_MONTHS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTargetMonthsCount(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      targetMonthsCount === m
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-2xs'
                        : 'border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    {m < 12 ? `${m} meses` : m === 12 ? '1 ano (12m)' : `${m / 12} anos (${m}m)`}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">Ou digite outro prazo:</span>
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={targetMonthsCount}
                  onChange={(e) => setTargetMonthsCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-24 px-3 py-1.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-xl text-slate-900 dark:text-white text-xs font-bold text-center"
                />
                <span className="text-xs text-slate-500">meses</span>
              </div>
            </div>

            {/* Início e Previsão */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/[0.04] flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" />
                <span>Início: <strong>{formatMonthShort(startMonth)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-emerald-500" />
                <span>Previsão de Conquista: <strong className="text-emerald-600 dark:text-emerald-400">{formatMonthDisplay(targetEndMonth)}</strong></span>
              </div>
            </div>
          </div>

          {/* Card 4: Hero de Cálculo Inteligente em Tempo Real */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} />
                <span>Cálculo Automático por Mês</span>
              </span>
              <span className="text-[11px] bg-white/15 px-2 py-0.5 rounded-full font-medium text-emerald-50">
                Economia Mensal
              </span>
            </div>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums">
                {formatCurrency(monthlyNeeded)}
              </span>
              <span className="text-xs font-medium text-emerald-100">/ por mês</span>
            </div>

            <p className="text-xs text-emerald-50/90 leading-relaxed pt-1">
              {remainingNeeded > 0 ? (
                <>
                  Falta juntar <strong>{formatCurrency(remainingNeeded)}</strong>. Guardando <strong>{formatCurrency(monthlyNeeded)}</strong> todo mês durante <strong>{validMonths} meses</strong>, você atinge seu objetivo em <strong>{formatMonthDisplay(targetEndMonth)}</strong>.
                </>
              ) : targetAmount > 0 ? (
                <>
                  🎉 Parabéns! O valor atual guardado já atinge ou supera a meta total cadastrada!
                </>
              ) : (
                <>
                  Preencha o valor total da meta para calcular automaticamente a quantia exata necessária por mês.
                </>
              )}
            </p>
          </div>

          {/* Card 5: Anotações Opcionais */}
          <div className="bg-white dark:bg-[#1C1C1E] p-4.5 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-white/[0.08] shadow-2xs space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Observações & Detalhes (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Juntar na conta rendendo 100% do CDI, não resgatar antes do prazo..."
              rows={2}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-xl text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/40 resize-none"
            />
          </div>
        </form>
      </main>

      {/* Sticky Bottom Action Bar on Mobile */}
      <footer className="shrink-0 sm:hidden bg-white dark:bg-[#1C1C1E] border-t border-slate-200 dark:border-white/[0.08] p-4 flex gap-3 z-10 shadow-lg">
        <Button
          variant="secondary"
          onClick={onClose}
          className="w-24 shrink-0"
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          className="flex-1"
          leftIcon={<Check size={16} className="stroke-[2.5]" />}
        >
          Salvar Meta
        </Button>
      </footer>
    </div>,
    document.body
  );
}
