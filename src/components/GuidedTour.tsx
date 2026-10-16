import React, { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { triggerHaptic } from '../utils/haptics';

type TourStep = 'intro' | 'tap-new' | 'form' | 'saved' | 'tap-add';

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  hasAccount: boolean;
  isAccountModalOpen: boolean;
  /** Leva o app para a aba Carteira. */
  goToWallet: () => void;
}

interface Rect { top: number; left: number; width: number; height: number }

const PAD = 8;

function useTargetRect(selector: string | null, active: boolean): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    if (!active || !selector) { setRect(null); return; }
    let raf = 0;
    let scrolled = false;
    const tick = () => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el) {
        if (!scrolled) { scrolled = true; el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        const r = el.getBoundingClientRect();
        setRect((prev) =>
          prev && Math.abs(prev.top - r.top) < 1 && Math.abs(prev.left - r.left) < 1 &&
          Math.abs(prev.width - r.width) < 1 && Math.abs(prev.height - r.height) < 1
            ? prev
            : { top: r.top, left: r.left, width: r.width, height: r.height }
        );
      } else {
        setRect(null);
      }
      raf = window.setTimeout(tick, 150);
    };
    tick();
    return () => window.clearTimeout(raf);
  }, [selector, active]);

  return rect;
}

export function GuidedTour({ isOpen, onClose, hasAccount, isAccountModalOpen, goToWallet }: GuidedTourProps) {
  const [step, setStep] = useState<TourStep>('intro');
  const [startedWithAccount, setStartedWithAccount] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('intro');
      setStartedWithAccount(hasAccount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Avança sozinho conforme a pessoa usa o app de verdade.
  useEffect(() => {
    if (!isOpen) return;
    if (step === 'tap-new' && isAccountModalOpen) setStep('form');
    else if (step === 'form' && !isAccountModalOpen) setStep(hasAccount ? 'saved' : 'tap-new');
  }, [isOpen, step, isAccountModalOpen, hasAccount]);

  const selector =
    step === 'tap-new' ? '[data-tour="add-account"]' :
    step === 'form' ? '[data-tour="save-account"]' :
    step === 'saved' ? '[data-tour="account-card"]' :
    step === 'tap-add' ? '[data-tour="add-expense"]' : null;

  const rect = useTargetRect(selector, isOpen && step !== 'intro');

  if (!isOpen || typeof document === 'undefined') return null;

  const canLeave = hasAccount;
  const holeClickable = step === 'tap-new' || step === 'form';
  const vh = window.innerHeight;
  const vw = window.innerWidth;

  const next = () => { triggerHaptic(8); };

  let title = '';
  let text = '';
  let buttonLabel: string | null = null;
  let onButton: (() => void) | null = null;
  let counter = '';

  if (step === 'intro') {
    counter = '1 de 4';
    if (startedWithAccount) {
      title = 'Vamos revisar o básico';
      text = 'Eu te mostro onde ficam suas contas e como lançar um gasto. É rapidinho.';
      buttonLabel = 'Vamos lá';
      onButton = () => { next(); goToWallet(); setStep('saved'); };
    } else {
      title = 'Vamos começar pela sua conta';
      text = 'Tudo que você lança no Gastô sai de uma conta (banco ou dinheiro). Sem ela, os gastos não aparecem. Vamos criar uma agora, de teste, com R$ 1.000 de mentirinha. Você pode apagar ou editar depois.';
      buttonLabel = 'Criar minha conta de teste';
      onButton = () => { next(); goToWallet(); setStep('tap-new'); };
    }
  } else if (step === 'tap-new') {
    counter = '2 de 4';
    title = 'Toque aqui';
    text = 'Esse é o botão para cadastrar uma conta. Toque nele.';
  } else if (step === 'form') {
    counter = '3 de 4';
    title = 'Já deixei tudo preenchido';
    text = 'Preenchi uma "Conta Teste" com R$ 1.000. Dá para trocar nome, banco e saldo se quiser. Quando estiver bom, toque em Salvar.';
  } else if (step === 'saved') {
    counter = '4 de 4';
    title = startedWithAccount ? 'Aqui ficam suas contas' : 'Pronto, sua conta foi criada';
    text = startedWithAccount
      ? 'Cada cartão mostra o saldo de uma conta. Toque nele para ver o extrato ou editar.'
      : 'Esse é o cartão dela, com o saldo de R$ 1.000. Toque nele quando quiser ver o extrato, editar ou apagar a conta de teste e cadastrar a sua de verdade.';
    buttonLabel = 'Entendi';
    onButton = () => { next(); setStep('tap-add'); };
  } else {
    counter = 'Último passo';
    title = 'Para lançar um gasto';
    text = 'Toque no botão + sempre que gastar ou receber algo. O valor entra na sua conta e aparece no saldo.';
    buttonLabel = 'Terminar tutorial';
    onButton = () => { next(); onClose(); };
  }

  const bubbleOnTop = rect ? rect.top + rect.height / 2 > vh * 0.55 : false;
  const hole = rect
    ? {
        top: Math.max(0, rect.top - PAD),
        left: Math.max(0, rect.left - PAD),
        width: Math.min(vw, rect.width + PAD * 2),
        height: rect.height + PAD * 2,
      }
    : null;

  const shade = 'fixed bg-slate-950/70';

  return createPortal(
    <div id="guided-tour" className="fixed inset-0 z-[10000] font-sans" style={{ pointerEvents: 'none' }}>
      {hole ? (
        <>
          <div className={shade} style={{ pointerEvents: 'auto', top: 0, left: 0, right: 0, height: hole.top }} />
          <div className={shade} style={{ pointerEvents: 'auto', top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} />
          <div className={shade} style={{ pointerEvents: 'auto', top: hole.top, left: 0, width: hole.left, height: hole.height }} />
          <div className={shade} style={{ pointerEvents: 'auto', top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} />
          <div
            className="fixed rounded-2xl border-2 border-white"
            style={{
              top: hole.top, left: hole.left, width: hole.width, height: hole.height,
              pointerEvents: holeClickable ? 'none' : 'auto',
              animation: 'tourPulse 1.6s ease-in-out infinite',
            }}
          />
        </>
      ) : (
        <div className={shade} style={{ pointerEvents: 'auto', inset: 0 }} />
      )}

      <div
        className="fixed left-0 right-0 flex justify-center px-4"
        style={{
          pointerEvents: 'none',
          ...(step === 'intro' || !rect
            ? { top: '50%', transform: 'translateY(-50%)' }
            : bubbleOnTop
              ? { top: 'max(1rem, env(safe-area-inset-top, 0px))' }
              : { bottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))' }),
        }}
      >
        <div
          className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-2xl p-5"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{counter}</span>
            {canLeave && (
              <button
                type="button"
                onClick={() => { triggerHaptic(8); onClose(); }}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 py-1 px-2 -mr-2 cursor-pointer"
              >
                Fechar
              </button>
            )}
          </div>
          <h2 className="text-lg font-bold leading-snug">{title}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">{text}</p>
          {buttonLabel && onButton && (
            <button
              type="button"
              id="btn-tour-next"
              onClick={onButton}
              className="mt-4 w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm active:scale-[0.99] transition cursor-pointer"
            >
              {buttonLabel}
            </button>
          )}
        </div>
      </div>

      <style>{`@keyframes tourPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.55)}50%{box-shadow:0 0 0 8px rgba(255,255,255,0)}}`}</style>
    </div>,
    document.body
  );
}
