import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft,
  CreditCard, 
  Users, 
  PiggyBank, 
  Sparkles, 
  Wallet, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  DollarSign, 
  QrCode,
  ArrowRight,
  Plus,
  TrendingUp,
  Check,
  Smartphone,
  Share2,
  MoreVertical,
  Download
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface OnboardingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddCard?: () => void;
  onOpenAddPerson?: () => void;
  onOpenAddExpense?: () => void;
  onOpenAddWalletAccount?: () => void;
}

const STEPS = [
  {
    id: 'welcome',
    badge: 'Passo 1 de 6',
    title: 'Bem-vindo ao Gastô!',
    subtitle: 'Seu controle financeiro inteligente e descomplicado',
    description: 'O Gastô? foi desenhado para te dar clareza total: acompanhe faturas de cartão de crédito, divida compras com amigos de forma justa, controle suas contas bancárias e faça suas caixinhas renderem.',
    highlights: [
      { icon: ShieldCheck, text: 'Dados 100% privados na nuvem' },
      { icon: Calendar, text: 'Gestão automática de faturas de cartão' },
      { icon: QrCode, text: 'Cobrança rápida de terceiros via Pix' },
    ],
    actionText: undefined,
    actionType: undefined,
  },
  {
    id: 'install',
    badge: 'Passo 2 de 6',
    title: 'Instale na Tela de Início',
    subtitle: 'App nativo no seu celular (iPhone & Android)',
    description: 'Adicione o Gastô? à tela inicial do seu celular para acesso instantâneo em tela cheia, sem barras do navegador e com carregamento ultra veloz.',
    highlights: [
      { icon: Share2, text: 'No iPhone (Safari): Toque em Compartilhar e selecione "Adicionar à Tela de Início"' },
      { icon: MoreVertical, text: 'No Android (Chrome): Toque nos 3 pontinhos e selecione "Instalar aplicativo"' },
      { icon: Smartphone, text: 'Acesso instantâneo e dados 100% sincronizados na nuvem' },
    ],
    actionText: undefined,
    actionType: undefined,
  },
  {
    id: 'cards',
    badge: 'Passo 3 de 6',
    title: 'Cartões de Crédito & Fechamento',
    subtitle: 'Cadastre suas datas de corte e vencimento',
    description: 'Ao cadastrar seus cartões de crédito (Nubank, Itaú, Mercado Pago, etc.), informe o dia de fechamento da fatura. O app aloca automaticamente cada nova compra na fatura correta!',
    highlights: [
      { icon: Calendar, text: 'Separação automática de fatura atual e próxima' },
      { icon: DollarSign, text: 'Acompanhamento do limite utilizado' },
    ],
    actionText: 'Cadastrar Cartão',
    actionType: 'card',
  },
  {
    id: 'wallet',
    badge: 'Passo 4 de 6',
    title: 'Sua Carteira & Bancos',
    subtitle: 'Centralize seus saldos e conta corrente',
    description: 'Na aba Carteira você cadastra suas contas (Itaú, Bradesco, Nubank, Dinheiro físico) e acompanha o saldo acumulado total. Tudo com movimentações de entradas e transferências.',
    highlights: [
      { icon: Wallet, text: 'Controle de saldo em conta corrente e dinheiro' },
      { icon: DollarSign, text: 'Extrato detalhado de receitas e despesas' },
    ],
    actionText: 'Adicionar Conta',
    actionType: 'wallet',
  },
  {
    id: 'people',
    badge: 'Passo 5 de 6',
    title: 'Divisão de Gastos com Pessoas',
    subtitle: 'Sem dor de cabeça para saber quem te deve',
    description: 'Emprestou o cartão para parentes ou comprou algo parcelado para um amigo? Atribua o responsável ao lançar a compra e gere um resumo com chave Pix para cobrar em segundos!',
    highlights: [
      { icon: Users, text: 'Resumo individual por pessoa' },
      { icon: QrCode, text: 'Copiar chave Pix pré-preenchida' },
    ],
    actionText: 'Adicionar Pessoa',
    actionType: 'person',
  },
  {
    id: 'boxes',
    badge: 'Passo 6 de 6',
    title: 'Caixinhas & Metas de Investimento',
    subtitle: 'Faça seu dinheiro trabalhar por você',
    description: 'Crie pastas de metas (Reserva de Emergência, Viagem, Carro Novo) e atribua rendimento mensal baseado no CDI. Registre aportes e resgates com simulação de rendimentos.',
    highlights: [
      { icon: PiggyBank, text: 'Simulador de rendimento CDI em tempo real' },
      { icon: CheckCircle2, text: 'Metas com barra de progresso' },
    ],
    actionText: 'Lançar Primeiro Gasto',
    actionType: 'expense',
  },
];

// Step 1 Visual Illustration: Overview & Smart Finance
function IllustrationWelcome() {
  return (
    <div className="relative w-full max-w-[260px] h-[190px] mx-auto flex items-center justify-center">
      {/* Background soft glow and grid */}
      <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-2xl -z-10" />
      <div className="absolute inset-0 flex items-center justify-center opacity-25 dark:opacity-20 pointer-events-none">
        <svg width="220" height="170" viewBox="0 0 220 170" fill="none">
          <circle cx="20" cy="30" r="2" fill="#2563eb" />
          <circle cx="50" cy="20" r="2" fill="#2563eb" />
          <circle cx="180" cy="40" r="2" fill="#2563eb" />
          <circle cx="200" cy="80" r="2" fill="#2563eb" />
          <circle cx="30" cy="140" r="2" fill="#2563eb" />
          <circle cx="190" cy="130" r="2" fill="#2563eb" />
        </svg>
      </div>

      {/* Center Phone Mockup */}
      <div className="relative w-[130px] h-[160px] bg-slate-900 dark:bg-[#18181b] rounded-[24px] border-4 border-slate-800 dark:border-white/[0.10] shadow-2xl p-2 flex flex-col justify-between overflow-hidden">
        {/* Notch */}
        <div className="w-10 h-2 bg-slate-800 dark:bg-[#3A3A3C] rounded-full mx-auto" />
        
        {/* Screen Content */}
        <div className="space-y-1.5 pt-1">
          <div className="w-12 h-2 bg-blue-500/40 rounded-full" />
          <div className="text-[13px] font-bold text-white tracking-tight leading-none">R$ 8.450</div>
          
          <div className="grid grid-cols-2 gap-1 pt-1">
            <div className="h-6 rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-[8px] font-bold text-emerald-400">+18%</span>
            </div>
            <div className="h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <span className="text-[8px] font-bold text-blue-300">Gastô</span>
            </div>
          </div>

          <div className="h-2 w-full bg-white/10 rounded-full" />
          <div className="h-2 w-3/4 bg-white/10 rounded-full" />
        </div>

        {/* Bottom bar */}
        <div className="w-8 h-1 bg-white/30 rounded-full mx-auto" />
      </div>

      {/* Floating Card Over Mockup */}
      <div className="absolute -top-1 -right-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl p-2.5 shadow-xl shadow-blue-600/30 border border-white/20 transform rotate-6 scale-95 flex items-center gap-2">
        <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
          <Sparkles size={14} className="text-white" />
        </div>
        <div>
          <div className="text-[9px] font-medium opacity-80 leading-none">Status</div>
          <div className="text-[11px] font-bold leading-tight">100% Nuvem</div>
        </div>
      </div>

      {/* Floating Check Badge */}
      <div className="absolute bottom-2 -left-2 bg-white dark:bg-[#2C2C2E] rounded-2xl p-2 shadow-xl border border-slate-200/60 dark:border-white/[0.10] flex items-center gap-2 transform -rotate-3">
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
          <Check size={14} className="stroke-[3]" />
        </div>
        <div className="text-[10px] font-bold text-slate-800 dark:text-white pr-1">Clareza Total</div>
      </div>
    </div>
  );
}

// Step 2 Visual Illustration: PWA Install Screen with iPhone & Android badges
function IllustrationInstall() {
  return (
    <div className="relative w-full max-w-[270px] h-[190px] mx-auto flex items-center justify-center">
      {/* Background soft glow */}
      <div className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-600/15 rounded-full blur-2xl -z-10" />

      {/* Main Smartphone Mockup */}
      <div className="relative w-[136px] h-[170px] bg-slate-900 dark:bg-[#18181b] rounded-[24px] border-4 border-slate-800 dark:border-white/[0.12] shadow-2xl p-2.5 flex flex-col justify-between overflow-hidden">
        <div className="w-10 h-1.5 bg-slate-800 dark:bg-[#3A3A3C] rounded-full mx-auto" />

        {/* Screen Content: App Icon on Phone Home Screen */}
        <div className="flex flex-col items-center justify-center my-auto space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-2 shadow-lg shadow-emerald-500/30 flex items-center justify-center border border-white/20">
            <span className="text-lg font-black text-white">G?</span>
          </div>
          <div className="text-[10px] font-bold text-white text-center leading-tight">
            Gastô?
          </div>
          <span className="text-[8px] font-semibold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
            App Instalado
          </span>
        </div>

        <div className="w-8 h-1 bg-white/30 rounded-full mx-auto" />
      </div>

      {/* iOS Floating Hint Card */}
      <div className="absolute -top-1 -right-1 bg-white dark:bg-[#2C2C2E] rounded-2xl p-2 shadow-xl border border-slate-200/80 dark:border-white/[0.10] flex items-center gap-2 transform rotate-3">
        <div className="w-6 h-6 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <Share2 size={13} className="stroke-[2.5]" />
        </div>
        <div className="text-left pr-1">
          <div className="text-[8px] font-bold text-slate-400 leading-none">iPhone</div>
          <div className="text-[10px] font-extrabold text-slate-800 dark:text-white leading-tight">Compartilhar</div>
        </div>
      </div>

      {/* Android Floating Hint Card */}
      <div className="absolute -bottom-1 -left-2 bg-white dark:bg-[#2C2C2E] rounded-2xl p-2 shadow-xl border border-slate-200/80 dark:border-white/[0.10] flex items-center gap-2 transform -rotate-3">
        <div className="w-6 h-6 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <MoreVertical size={13} className="stroke-[2.5]" />
        </div>
        <div className="text-left pr-1">
          <div className="text-[8px] font-bold text-slate-400 leading-none">Android</div>
          <div className="text-[10px] font-extrabold text-slate-800 dark:text-white leading-tight">Instalar app</div>
        </div>
      </div>
    </div>
  );
}

// Step 3 Visual Illustration: 3D Stacked Credit Cards (matches reference 1)
function IllustrationCards() {
  return (
    <div className="relative w-full max-w-[270px] h-[190px] mx-auto flex items-center justify-center">
      {/* Background aura */}
      <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-2xl -z-10" />

      {/* Card 3 (Bottom - Amber/Gold) */}
      <div className="absolute top-[82px] w-[210px] h-[82px] rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white shadow-xl p-3 flex flex-col justify-between transform -rotate-4 scale-90 border border-white/20 opacity-80">
        <div className="flex justify-between items-center">
          <div className="w-5 h-3.5 rounded bg-white/40" />
          <span className="text-[9px] font-extrabold tracking-wider">PREMIUM</span>
        </div>
        <div className="flex justify-between items-end">
          <span className="text-[11px] font-mono font-bold tracking-widest">•••• 8832</span>
          <div className="w-4 h-4 rounded-full bg-red-500/80" />
        </div>
      </div>

      {/* Card 2 (Middle - Matte Black) */}
      <div className="absolute top-[48px] w-[218px] h-[86px] rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-800 text-white shadow-xl p-3 flex flex-col justify-between transform rotate-2 scale-95 border border-white/15">
        <div className="flex justify-between items-center">
          <div className="w-5 h-3.5 rounded bg-amber-400/80" />
          <span className="text-[9px] font-bold tracking-widest text-slate-400">BLACK</span>
        </div>
        <div className="flex justify-between items-end">
          <span className="text-[11px] font-mono font-bold tracking-widest">•••• 4190</span>
          <div className="flex -space-x-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500/90" />
            <div className="w-3.5 h-3.5 rounded-full bg-amber-400/90" />
          </div>
        </div>
      </div>

      {/* Card 1 (Top - Royal Blue Gradient in perspective) */}
      <div className="absolute top-[12px] w-[224px] h-[92px] rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-2xl shadow-blue-600/35 p-3.5 flex flex-col justify-between transform -rotate-2 border border-white/25">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-3.5 rounded bg-yellow-300 shadow-sm" />
            <span className="text-[9px] font-bold text-white/80">Gastô Card</span>
          </div>
          <span className="text-[10px] font-bold tracking-widest text-white">R$ 4.250</span>
        </div>
        <div className="flex justify-between items-end">
          <span className="text-[11px] font-mono font-extrabold tracking-widest">•••• 9021</span>
          <div className="flex items-center gap-1">
            <Calendar size={12} className="text-white/80" />
            <span className="text-[9px] font-bold text-white/90">Dia 15</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 3 Visual Illustration: Smartphone with Balance & Banking Mockup (matches reference 2)
function IllustrationWallet() {
  return (
    <div className="relative w-full max-w-[270px] h-[190px] mx-auto flex items-center justify-center">
      {/* Background glow */}
      <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-2xl -z-10" />

      {/* Background phone / charts */}
      <div className="absolute right-3 top-2 w-[115px] h-[160px] bg-slate-100 dark:bg-[#2C2C2E] rounded-3xl border-2 border-slate-200 dark:border-white/[0.10] shadow-md p-2 flex flex-col justify-between transform rotate-6 opacity-75">
        <div className="w-8 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto" />
        <div className="space-y-1">
          <div className="text-[8px] font-bold text-slate-400">Fluxo Mensal</div>
          <div className="flex items-end gap-1 h-12 pt-2">
            <div className="w-3 bg-blue-400 h-8 rounded-t" />
            <div className="w-3 bg-blue-500 h-10 rounded-t" />
            <div className="w-3 bg-blue-600 h-6 rounded-t" />
            <div className="w-3 bg-emerald-500 h-12 rounded-t" />
          </div>
        </div>
        <div className="w-6 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto" />
      </div>

      {/* Foreground primary phone mockup */}
      <div className="relative left-[-15px] w-[138px] h-[172px] bg-white dark:bg-[#121214] rounded-[24px] border-4 border-slate-900 dark:border-white/[0.10] shadow-2xl p-2.5 flex flex-col justify-between overflow-hidden">
        {/* Notch */}
        <div className="w-10 h-2 bg-slate-900 dark:bg-[#3A3A3C] rounded-full mx-auto" />

        {/* Balance Header */}
        <div className="text-center pt-1">
          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Saldo Total</div>
          <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">R$ 15.420</div>
        </div>

        {/* Action pills */}
        <div className="flex justify-between gap-1 py-1">
          <div className="flex-1 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[8px] font-bold text-center">
            Pix
          </div>
          <div className="flex-1 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold text-center">
            Conta
          </div>
          <div className="flex-1 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[8px] font-bold text-center">
            Extrato
          </div>
        </div>

        {/* Mini transaction row */}
        <div className="space-y-1 bg-slate-50 dark:bg-[#2C2C2E]/60 p-1.5 rounded-xl">
          <div className="flex justify-between items-center text-[8px]">
            <span className="font-bold text-slate-700 dark:text-slate-200">Salário</span>
            <span className="font-bold text-emerald-600">+R$ 4.500</span>
          </div>
          <div className="flex justify-between items-center text-[8px]">
            <span className="font-bold text-slate-700 dark:text-slate-200">Mercado</span>
            <span className="font-bold text-rose-500">-R$ 380</span>
          </div>
        </div>

        <div className="w-8 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto" />
      </div>
    </div>
  );
}

// Step 4 Visual Illustration: Security Shield & People Badges (matches reference 3)
function IllustrationPeople() {
  return (
    <div className="relative w-full max-w-[270px] h-[190px] mx-auto flex items-center justify-center">
      {/* Background glow */}
      <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-2xl -z-10" />

      {/* Central Big Royal Blue Shield */}
      <div className="relative w-24 h-28 bg-gradient-to-b from-blue-500 to-blue-700 text-white rounded-b-[40px] rounded-t-[20px] shadow-2xl shadow-blue-600/30 flex items-center justify-center border-2 border-white/30">
        <ShieldCheck size={48} className="stroke-[2.2] text-white" />
      </div>

      {/* Floating Badge 1 (Top Left - Cards) */}
      <div className="absolute top-3 left-4 w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg transform -rotate-6 border border-white/20">
        <CreditCard size={18} className="stroke-[2.5]" />
      </div>

      {/* Floating Badge 2 (Top Right - Friends / Users) */}
      <div className="absolute top-3 right-4 w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg transform rotate-6 border border-white/20">
        <Users size={18} className="stroke-[2.5]" />
      </div>

      {/* Floating Badge 3 (Bottom Left - Pix QR) */}
      <div className="absolute bottom-4 left-6 w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg transform rotate-3 border border-white/20">
        <QrCode size={18} className="stroke-[2.5]" />
      </div>

      {/* Floating Badge 4 (Bottom Right - Check) */}
      <div className="absolute bottom-4 right-6 w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg transform -rotate-3 border border-white/20">
        <CheckCircle2 size={18} className="stroke-[2.5]" />
      </div>
    </div>
  );
}

// Step 5 Visual Illustration: Piggy Bank, Coins & Growth Chart (matches reference 4)
function IllustrationBoxes() {
  return (
    <div className="relative w-full max-w-[270px] h-[190px] mx-auto flex items-center justify-center">
      {/* Background glow */}
      <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-2xl -z-10" />

      {/* Upward Growth Chart on Background */}
      <div className="absolute inset-x-4 top-2 h-24 flex items-end justify-between opacity-30 pointer-events-none">
        <svg viewBox="0 0 200 80" className="w-full h-full stroke-blue-600 fill-none stroke-[3]">
          <path d="M 10 70 Q 60 50 100 40 T 190 10" />
        </svg>
      </div>

      {/* Golden Piggy Bank */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-amber-950 p-4 shadow-2xl shadow-amber-500/25 border border-white/40 flex items-center justify-center transform hover:scale-105 transition-transform">
          <PiggyBank size={54} className="stroke-[2] text-amber-950" />
        </div>

        {/* Floating Coin Dropping In */}
        <div className="absolute -top-3 w-8 h-8 rounded-full bg-gradient-to-r from-yellow-300 to-amber-400 text-amber-950 border-2 border-white shadow-lg flex items-center justify-center animate-bounce">
          <DollarSign size={16} className="stroke-[3]" />
        </div>
      </div>

      {/* Floating Coin Stacks */}
      <div className="absolute bottom-3 left-6 flex flex-col items-center">
        <div className="w-7 h-2 rounded-full bg-amber-400 border border-amber-500" />
        <div className="w-7 h-2 rounded-full bg-amber-400 border border-amber-500 -mt-1" />
        <div className="w-7 h-2 rounded-full bg-amber-400 border border-amber-500 -mt-1 shadow-md" />
      </div>

      {/* Growth Metric Badge */}
      <div className="absolute top-4 right-3 bg-white dark:bg-[#2C2C2E] rounded-2xl p-2.5 shadow-xl border border-slate-200 dark:border-white/[0.10] flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
          <TrendingUp size={14} className="stroke-[2.5]" />
        </div>
        <div>
          <div className="text-[8px] font-bold text-slate-400 leading-none">Rendimento</div>
          <div className="text-[11px] font-bold text-emerald-600 leading-tight">100% do CDI</div>
        </div>
      </div>
    </div>
  );
}

export function OnboardingTutorialModal({
  isOpen,
  onClose,
  onOpenAddCard,
  onOpenAddPerson,
  onOpenAddExpense,
  onOpenAddWalletAccount,
}: OnboardingTutorialModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStep = STEPS[currentStepIndex];
  const isLast = currentStepIndex === STEPS.length - 1;
  const isFirst = currentStepIndex === 0;

  const handleNext = () => {
    triggerHaptic(8);
    if (isLast) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    triggerHaptic(8);
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    triggerHaptic(8);
    onClose();
  };

  const handleAction = () => {
    triggerHaptic(12);
    if (currentStep.actionType === 'card' && onOpenAddCard) {
      onClose();
      onOpenAddCard();
    } else if (currentStep.actionType === 'wallet' && onOpenAddWalletAccount) {
      onClose();
      onOpenAddWalletAccount();
    } else if (currentStep.actionType === 'person' && onOpenAddPerson) {
      onClose();
      onOpenAddPerson();
    } else if (currentStep.actionType === 'expense' && onOpenAddExpense) {
      onClose();
      onOpenAddExpense();
    }
  };

  // Render appropriate illustration
  const renderIllustration = () => {
    switch (currentStepIndex) {
      case 0:
        return <IllustrationWelcome />;
      case 1:
        return <IllustrationInstall />;
      case 2:
        return <IllustrationCards />;
      case 3:
        return <IllustrationWallet />;
      case 4:
        return <IllustrationPeople />;
      case 5:
        return <IllustrationBoxes />;
      default:
        return <IllustrationWelcome />;
    }
  };

  return (
    <div
      id="onboarding-tutorial-fullscreen"
      className="fixed inset-0 z-[9999] bg-white dark:bg-[#000000] flex flex-col justify-between overflow-y-auto select-none font-sans text-slate-900 dark:text-white"
    >
      <div className="w-full max-w-sm sm:max-w-md mx-auto flex-1 flex flex-col justify-between p-5 sm:p-7 min-h-screen">
        
        {/* Top Header & Segmented Progress Bar (matches the exact reference layout) */}
        <div className="w-full pt-2">
          {/* 6 Segmented Progress Bars */}
          <div className="grid grid-cols-6 gap-1.5 w-full">
            {STEPS.map((_, idx) => {
              const isFilled = idx <= currentStepIndex;
              return (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isFilled
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-slate-200 dark:bg-[#2C2C2E]'
                  }`}
                />
              );
            })}
          </div>

          {/* Top Navigation Row: Step Tag + Skip Button */}
          <div className="flex items-center justify-between mt-3 px-0.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {currentStep.badge}
            </span>

            <button
              type="button"
              id="btn-skip-tutorial-top"
              onClick={handleSkip}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04]"
            >
              Pular
            </button>
          </div>
        </div>

        {/* Central Illustration Area */}
        <div className="my-auto py-3 flex flex-col items-center">
          {/* Main Visual Artwork */}
          <div className="w-full mb-3 flex items-center justify-center">
            {renderIllustration()}
          </div>

          {/* Stepper Dots Indicator (pill for active, dots for others) */}
          <div className="flex items-center justify-center gap-1.5 my-3">
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  setCurrentStepIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-7 bg-blue-600 dark:bg-blue-500'
                    : 'w-1.5 bg-slate-200 dark:bg-[#2C2C2E]'
                }`}
                title={`Ir para o passo ${idx + 1}`}
              />
            ))}
          </div>

          {/* Typography: Title & Subtitle */}
          <div className="text-center px-1 max-w-sm">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
              {currentStep.title}
            </h1>
            <p className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">
              {currentStep.subtitle}
            </p>
            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          {/* Feature Highlights Cards */}
          {currentStep.highlights && currentStep.highlights.length > 0 && (
            <div className="w-full space-y-2 mt-4 max-w-sm">
              {currentStep.highlights.map((h, i) => {
                const HIcon = h.icon;
                return (
                  <div 
                    key={i} 
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-[#1C1C1E]/60 border border-slate-100 dark:border-white/[0.08]/80 text-left"
                  >
                    <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <HIcon size={14} className="stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {h.text}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Actions Bar (matches reference screen with prominent Next button) */}
        <div className="w-full pt-3 pb-2 space-y-2">
          {/* Main Primary Button */}
          <button
            type="button"
            id="btn-tutorial-next"
            onClick={handleNext}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold text-sm sm:text-base shadow-lg shadow-blue-600/25 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{isLast ? 'Começar a Usar' : 'Próximo'}</span>
            {!isLast && <ChevronRight size={18} className="stroke-[2.5]" />}
          </button>

          {/* Secondary Action: Contextual Direct Action (e.g. Cadastrar Cartão) or Back */}
          <div className="flex items-center justify-between gap-2">
            {!isFirst ? (
              <button
                type="button"
                id="btn-tutorial-prev"
                onClick={handlePrev}
                className="py-2.5 px-4 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer rounded-xl flex items-center gap-1"
              >
                <ChevronLeft size={16} />
                <span>Voltar</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep.actionText && (
              <button
                type="button"
                id="btn-tutorial-shortcut"
                onClick={handleAction}
                className="py-2.5 px-4 text-xs font-extrabold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{currentStep.actionText}</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
