import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Wallet, CreditCard, Plus, Home, Users, Package, Repeat, Target, CheckCircle2, Hand, Sparkles,
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { Button } from './Button';
import type { MainTabType } from '../types';

type StepKind = 'info' | 'tap-new' | 'form' | 'saved';

interface TourStepDef {
  id: string;
  kind: StepKind;
  tab?: MainTabType;
  target?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  text: string;
  button?: string;
}

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  hasAccount: boolean;
  isAccountModalOpen: boolean;
  goToTab: (tab: MainTabType) => void;
  /** Pausa o tour (some da tela) enquanto outra janela, como o perfil, estiver aberta. */
  paused?: boolean;
}

interface Rect { top: number; left: number; width: number; height: number }

const PAD = 8;

function isFixed(el: HTMLElement | null): boolean {
  for (let n: HTMLElement | null = el; n && n !== document.body; n = n.parentElement) {
    if (getComputedStyle(n).position === 'fixed') return true;
  }
  return false;
}

function findVisible(selector: string): HTMLElement | null {
  const list = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  return list.find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }) || null;
}

function useTargetRect(selector: string | null, active: boolean): { rect: Rect | null; settled: boolean } {
  const [state, setState] = useState<{ rect: Rect | null; settled: boolean; selector: string | null }>({ rect: null, settled: false, selector: null });

  useLayoutEffect(() => {
    setState({ rect: null, settled: false, selector });
    if (!active || !selector) return;
    let timer = 0;
    let scrolled = false;
    let misses = 0;
    let firstSeen = 0;
    let stableTicks = 0;
    let last: Rect | null = null;
    const tick = () => {
      const el = findVisible(selector);
      if (el) {
        misses = 0;
        if (!firstSeen) firstSeen = Date.now();
        if (!scrolled) {
          scrolled = true;
          // Deixa o alvo no terço de cima da tela, longe do cartão de explicação que fica embaixo
          const prevMargin = el.style.scrollMarginTop;
          el.style.scrollMarginTop = `${Math.round(window.innerHeight * 0.22)}px`;
          el.scrollIntoView({ block: 'start', behavior: 'smooth' });
          window.setTimeout(() => { el.style.scrollMarginTop = prevMargin; }, 1200);
        }
        const b = el.getBoundingClientRect();
        const r: Rect = { top: b.top, left: b.left, width: b.width, height: b.height };
        const same = last && Math.abs(last.top - r.top) < 1 && Math.abs(last.left - r.left) < 1 &&
          Math.abs(last.width - r.width) < 1 && Math.abs(last.height - r.height) < 1;
        stableTicks = same ? stableTicks + 1 : 0;
        last = r;
        // Só considera "parado" depois que a rolagem suave terminou
        const settled = isFixed(el) ? true : stableTicks >= 2 && Date.now() - firstSeen > 600;
        setState((prev) => (same && prev.settled === settled && prev.rect && prev.selector === selector ? prev : { rect: r, settled, selector }));

      } else {
        // Dá um tempo para a tela do passo terminar de carregar antes de desistir do alvo
        misses += 1;
        if (misses > 6) {
          last = null;
          stableTicks = 0;
          setState((prev) => (prev.rect ? { rect: null, settled: false, selector } : prev));
        }
      }
      timer = window.setTimeout(tick, 120);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [selector, active]);

  // Ignora uma medida que ainda é do passo anterior
  return state.selector === selector ? { rect: state.rect, settled: state.settled } : { rect: null, settled: false };
}

function buildSteps(hasAccountAtStart: boolean): TourStepDef[] {
  const start: TourStepDef[] = hasAccountAtStart
    ? [{
        id: 'saved', kind: 'saved', tab: 'carteira', target: '[data-tour="account-card"]', icon: Wallet,
        title: 'Suas contas ficam aqui',
        text: 'Cada cartão mostra o saldo de uma conta. Toque nele para ver o extrato, editar ou apagar.',
        button: 'Próximo',
      }]
    : [
        {
          id: 'intro', kind: 'info', icon: Hand,
          title: 'Vamos começar pela sua conta',
          text: 'Tudo que você lança no Gastô sai de uma conta, que pode ser um banco ou dinheiro. Sem ela, os gastos não aparecem. Vamos criar uma agora, de teste, com R$ 1.000. Você pode editar ou apagar depois.',
          button: 'Criar minha conta de teste',
        },
        {
          id: 'tap-new', kind: 'tap-new', tab: 'carteira', target: '[data-tour="add-account"]', icon: Wallet,
          title: 'Toque aqui',
          text: 'Esse é o botão para cadastrar uma conta. Toque nele.',
        },
        {
          id: 'form', kind: 'form', target: '[data-tour="save-account"]', icon: Wallet,
          title: 'Já deixei tudo preenchido',
          text: 'Preenchi uma "Conta Teste" com R$ 1.000. Se quiser, troque o nome, o banco ou o saldo. Quando estiver bom, toque em Salvar.',
        },
        {
          id: 'saved', kind: 'saved', tab: 'carteira', target: '[data-tour="account-card"]', icon: CheckCircle2,
          title: 'Sua conta foi criada',
          text: 'Esse é o cartão dela, com saldo de R$ 1.000. Quando quiser, apague a conta de teste e cadastre a sua de verdade.',
          button: 'Continuar',
        },
      ];

  return [
    ...start,
    {
      id: 'wallet-actions', kind: 'info', tab: 'carteira', target: '[data-tour="wallet-actions"]', icon: Wallet,
      title: 'Movimente cada conta',
      text: 'Em cada conta você registra um gasto, uma entrada ou ajusta o saldo. Também dá para transferir dinheiro entre contas.',
      button: 'Próximo',
    },
    {
      id: 'add', kind: 'info', target: '[data-tour="add-expense"]', icon: Plus,
      title: 'O botão + é seu atalho',
      text: 'Em qualquer tela, toque no + para lançar um gasto, uma entrada ou uma transferência. É o botão que você mais vai usar.',
      button: 'Próximo',
    },
    {
      id: 'dash-actions', kind: 'info', tab: 'dashboard', target: '[data-tour="dash-actions"]', icon: Home,
      title: 'Início: ações rápidas',
      text: 'Na tela inicial ficam os atalhos para lançar receitas e despesas sem sair do resumo.',
      button: 'Próximo',
    },
    {
      id: 'dash-month', kind: 'info', tab: 'dashboard', target: '[data-tour="dash-month"]', icon: Home,
      title: 'Gastos do mês',
      text: 'Aqui você vê para onde o dinheiro foi, por categoria, e quanto já gastou em relação ao mês. Role a tela para ver gráficos e próximas faturas.',
      button: 'Próximo',
    },
    {
      id: 'cartoes', kind: 'info', tab: 'cartoes', target: '[data-tour="cards-header"]', icon: CreditCard,
      title: 'Cartões e faturas',
      text: 'Cadastre seus cartões de crédito com o dia de fechamento. O Gastô coloca cada compra na fatura certa e mostra o limite usado. Você cadastra o seu quando quiser.',
      button: 'Próximo',
    },
    {
      id: 'pessoas', kind: 'info', tab: 'pessoas', target: '[data-tour="add-person"]', icon: Users,
      title: 'Dividir gastos com pessoas',
      text: 'Cadastre quem usa seu cartão ou divide compras com você. Ao lançar um gasto, escolha a pessoa e veja quanto ela te deve, com a chave Pix pronta para cobrar.',
      button: 'Próximo',
    },
    {
      id: 'caixinhas', kind: 'info', tab: 'investimentos', target: '[data-tour="add-box"]', icon: Package,
      title: 'Caixinhas e cofres',
      text: 'Crie uma caixinha para guardar dinheiro (reserva, viagem, objetivo). Registre aportes e resgates e acompanhe o rendimento.',
      button: 'Próximo',
    },
    {
      id: 'assinaturas', kind: 'info', tab: 'assinaturas', target: '[data-tour="add-subscription"]', icon: Repeat,
      title: 'Assinaturas',
      text: 'Netflix, Spotify, academia e outras cobranças fixas ficam todas aqui, com o total por mês.',
      button: 'Próximo',
    },
    {
      id: 'metas', kind: 'info', tab: 'metas', target: '[data-tour="add-goal"]', icon: Target,
      title: 'Metas',
      text: 'Defina um objetivo e um valor, e acompanhe quanto já juntou. Você também pode definir limites de gasto por categoria.',
      button: 'Próximo',
    },
    {
      id: 'mais', kind: 'info', tab: 'dashboard', target: '[data-tour="nav-more"]', icon: Sparkles,
      title: 'Tem mais no menu',
      text: 'Em "Mais" ficam Meu Uber, Pessoas, Caixinhas, Assinaturas e Metas, e também seu perfil, com PIN de segurança e dados da conta.',
      button: 'Próximo',
    },
    {
      id: 'fim', kind: 'info', tab: 'dashboard', icon: CheckCircle2,
      title: 'Tudo pronto',
      text: 'Agora é só lançar seus gastos. Para rever este tour, toque em "Guia & Tutorial" no rodapé do app.',
      button: 'Começar a usar',
    },
  ];
}

export function GuidedTour({ isOpen, onClose, hasAccount, isAccountModalOpen, goToTab, paused = false }: GuidedTourProps) {
  const [startedWithAccount, setStartedWithAccount] = useState(hasAccount);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStartedWithAccount(hasAccount);
      setIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const steps = useMemo(() => buildSteps(startedWithAccount), [startedWithAccount]);
  const step = steps[Math.min(index, steps.length - 1)];

  // Leva o app para a tela do passo.
  useEffect(() => {
    if (isOpen && step.tab) goToTab(step.tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step.id]);

  // Avança sozinho conforme a pessoa usa o app de verdade.
  useEffect(() => {
    if (!isOpen) return;
    if (step.kind === 'tap-new' && isAccountModalOpen) setIndex((i) => i + 1);
    else if (step.kind === 'form' && !isAccountModalOpen) setIndex((i) => (hasAccount ? i + 1 : i - 1));
  }, [isOpen, step.kind, isAccountModalOpen, hasAccount]);

  const { rect, settled } = useTargetRect(step.target || null, isOpen);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [placed, setPlaced] = useState<{ stepId: string; side: 'top' | 'bottom' }>({ stepId: '', side: 'bottom' });
  // O cartão começa embaixo e só sobe se o destaque ficar escondido atrás dele. Decide uma vez por passo, sem ficar pulando.
  const placement: 'top' | 'bottom' = placed.stepId === step.id ? placed.side : 'bottom';
  useEffect(() => {
    if (!rect || !settled || placement === 'top') return;
    const cardH = cardRef.current?.offsetHeight || 240;
    const cardTop = window.innerHeight - 88 - cardH;
    if (rect.top + rect.height + PAD > cardTop - 4) setPlaced({ stepId: step.id, side: 'top' });
  }, [rect, settled, placement, step.id]);

  if (!isOpen || paused || typeof document === 'undefined') return null;

  const interactive = step.kind === 'tap-new' || step.kind === 'form';
  const canLeave = hasAccount;
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const isFirst = index === 0;
  const isLast = index >= steps.length - 1;
  const Icon = step.icon;

  const hole = rect
    ? {
        top: Math.max(0, rect.top - PAD),
        left: Math.max(0, rect.left - PAD),
        width: Math.min(vw, rect.width + PAD * 2),
        height: rect.height + PAD * 2,
      }
    : null;

  const centered = isFirst && step.id === 'intro';
  const shade = 'fixed bg-black/60 transition-all duration-200 ease-out';
  const shadeCls = 'fixed bg-black/60';

  // Toca no elemento real em vez de deixar o toque "vazar" para o que estiver embaixo.
  const pressTarget = () => {
    if (!step.target) return;
    const el = findVisible(step.target);
    if (el) { triggerHaptic(10); el.click(); }
  };

  const advance = () => {
    triggerHaptic(8);
    if (isLast) onClose();
    else setIndex((i) => i + 1);
  };

  return createPortal(
    <div id="guided-tour" className="fixed inset-0 z-[10000]" style={{ pointerEvents: 'none' }}>
      {hole ? (
        <>
          <div className={shade} style={{ pointerEvents: 'auto', top: 0, left: 0, right: 0, height: hole.top }} />
          <div className={shade} style={{ pointerEvents: 'auto', top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} />
          <div className={shade} style={{ pointerEvents: 'auto', top: hole.top, left: 0, width: hole.left, height: hole.height }} />
          <div className={shade} style={{ pointerEvents: 'auto', top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} />
          <div
            className="fixed rounded-2xl border-2 border-emerald-400 transition-all duration-200 ease-out"
            onClick={interactive ? pressTarget : undefined}
            style={{
              top: hole.top, left: hole.left, width: hole.width, height: hole.height,
              pointerEvents: 'auto',
              cursor: interactive ? 'pointer' : 'default',
              animation: 'tourPulse 1.6s ease-in-out infinite',
            }}
          />
        </>
      ) : (
        <div className={shadeCls} style={{ pointerEvents: 'auto', inset: 0 }} />
      )}

      <div
        className="fixed left-0 right-0 flex justify-center px-4"
        style={{
          pointerEvents: 'none',
          ...(centered
            ? { top: '50%', transform: 'translateY(-50%)' }
            : {
                bottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 5.5rem))',
                transform: placement === 'top'
                  ? `translateY(-${Math.max(0, vh - 88 - (cardRef.current?.offsetHeight || 240) - 24)}px)`
                  : 'translateY(0)',
              }),
        }}
      >
        <div
          ref={cardRef}
          key={step.id}
          className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-2xl p-5 tour-card-in"
          style={{ pointerEvents: 'auto', animationDelay: step.target ? '170ms' : '0ms' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Icon size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Tutorial • {Math.min(index + 1, steps.length)} de {steps.length}
                </span>
                {canLeave && !isLast && (
                  <button
                    type="button"
                    onClick={() => { triggerHaptic(8); onClose(); }}
                    className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white py-1 px-2 -mr-2 cursor-pointer"
                  >
                    Pular
                  </button>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug mt-0.5">{step.title}</h2>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">{step.text}</p>

          <div className="mt-3 h-1 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-[#00C48C] rounded-full transition-all duration-300"
              style={{ width: `${((Math.min(index, steps.length - 1) + 1) / steps.length) * 100}%` }}
            />
          </div>

          {step.button && (
            <div className="mt-4 flex items-center gap-2">
              {canLeave && !isFirst && step.kind === 'info' && (
                <Button type="button" variant="secondary" size="lg" className="shrink-0" onClick={() => { triggerHaptic(8); setIndex((i) => Math.max(0, i - 1)); }}>
                  Voltar
                </Button>
              )}
              <Button type="button" id="btn-tour-next" size="lg" fullWidth onClick={advance}>
                {isLast ? 'Começar a usar' : step.button}
              </Button>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes tourCardIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.tour-card-in{animation:tourCardIn 220ms ease-out both}@keyframes tourPulse{0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,.55)}50%{box-shadow:0 0 0 8px rgba(52,211,153,0)}}`}</style>
    </div>,
    document.body
  );
}
