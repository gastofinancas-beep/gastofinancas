import React, { useState } from 'react';
import { X, CheckCircle2, ChevronRight, CreditCard, Users, PiggyBank, Sparkles, ArrowRight } from 'lucide-react';

interface OnboardingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddCard: () => void;
  onOpenAddPerson: () => void;
  onOpenAddExpense: () => void;
}

const STEPS = [
  {
    title: 'Bem-vindo ao Gastô! 🚀',
    subtitle: 'O controle financeiro feito para quem divide cartões e guarda dinheiro de verdade.',
    description: 'Aqui você tem visão cristalina de todas as faturas fechadas e futuras, sabe exatamente quanto cada pessoa te deve e acompanha seus rendimentos nas caixinhas.',
    icon: Sparkles,
    color: 'emerald',
  },
  {
    title: '1. Cadastre seus Cartões 💳',
    subtitle: 'Datas de fechamento e limites bem configurados',
    description: 'Adicione seus cartões de crédito com o dia de corte da fatura e dia de vencimento. O Gastô? calcula automaticamente em qual fatura cada compra vai cair!',
    icon: CreditCard,
    color: 'purple',
    actionText: 'Cadastrar Cartão',
    actionType: 'card',
  },
  {
    title: '2. Pessoas & Divisão Justa 👥',
    subtitle: 'Chega de confusão no fim do mês',
    description: 'Emprestou o cartão para namorada, irmão ou amigos? Cada compra pode ter um responsável. Você gera resumos instantâneos com chave Pix para cobrar sem dor de cabeça.',
    icon: Users,
    color: 'blue',
    actionText: 'Adicionar Pessoa',
    actionType: 'person',
  },
  {
    title: '3. Caixinhas de Investimento 🐷',
    subtitle: 'Reserva de emergência e metas no mesmo lugar',
    description: 'Organize suas reservas e planos em pastas inteligentes. Simule rendimento mensal do CDI e registre aportes e resgates com facilidade.',
    icon: PiggyBank,
    color: 'amber',
    actionText: 'Lançar Primeiro Gasto',
    actionType: 'expense',
  },
];

export function OnboardingTutorialModal({
  isOpen,
  onClose,
  onOpenAddCard,
  onOpenAddPerson,
  onOpenAddExpense,
}: OnboardingTutorialModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = STEPS[currentStepIndex];
  const IconComp = currentStep.icon;
  const isLast = currentStepIndex === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleAction = () => {
    if (currentStep.actionType === 'card') onOpenAddCard();
    else if (currentStep.actionType === 'person') onOpenAddPerson();
    else if (currentStep.actionType === 'expense') onOpenAddExpense();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
            <IconComp size={28} />
          </div>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {currentStep.title}
          </h2>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            {currentStep.subtitle}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed max-w-sm">
            {currentStep.description}
          </p>

          {/* Stepper indicator dots */}
          <div className="flex items-center gap-1.5 mt-6 mb-6">
            {STEPS.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentStepIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentStepIndex
                    ? 'w-6 bg-emerald-500'
                    : 'w-2 bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="w-full flex items-center gap-3">
            {currentStep.actionText && (
              <button
                type="button"
                onClick={handleAction}
                className="flex-1 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 rounded-xl transition-all"
              >
                {currentStep.actionText}
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <span>{isLast ? 'Tudo Pronto!' : 'Próximo'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
