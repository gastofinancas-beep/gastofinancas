import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Smartphone, 
  Sparkles, 
  X, 
  Download, 
  Share, 
  PlusSquare, 
  Check, 
  Copy, 
  Layers, 
  ArrowRight, 
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Zap,
  Info
} from 'lucide-react';
import { WidgetPreview } from './WidgetPreview';
import { triggerHaptic } from '../utils/haptics';

interface WidgetsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddExpense?: () => void;
}

export function WidgetsHubModal({ isOpen, onClose, onOpenAddExpense }: WidgetsHubModalProps) {
  const isIosDevice = typeof window !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
  const [platform, setPlatform] = useState<'ios' | 'android'>(() => isIosDevice ? 'ios' : 'android');
  const [activeTab, setActiveTab] = useState<'install' | 'preview' | 'scriptable'>('install');
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [pinToDashboard, setPinToDashboard] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gasto_show_dashboard_widgets') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsStandalone(Boolean(standalone));
    }
  }, []);

  const handleTogglePinDashboard = () => {
    triggerHaptic(8);
    const newVal = !pinToDashboard;
    setPinToDashboard(newVal);
    try {
      localStorage.setItem('gasto_show_dashboard_widgets', String(newVal));
      window.dispatchEvent(new CustomEvent('gasto_toggle_dashboard_widgets', { detail: { enabled: newVal } }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleInstallClick = async () => {
    triggerHaptic(10);
    const deferredPrompt = (window as any).deferredInstallPrompt;
    
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          (window as any).deferredInstallPrompt = null;
          setIsStandalone(true);
        }
      } catch (err) {
        console.warn('Erro ao disparar prompt de instalação:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.origin);
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 2500);
      } catch {
        // ignore
      }
    }
  };

  const scriptableScript = `// Widget Gastô? para Scriptable (iOS)
// 1. Abra o app Scriptable no iPhone
// 2. Toque em "+" no canto superior e cole este código
// 3. Volte para a tela inicial, toque e segure um espaço vazio, toque em "+" e adicione o Widget do Scriptable!

const widget = new ListWidget();
widget.backgroundColor = new Color("#18181B");

// Header Gastô?
const header = widget.addStack();
header.layoutHorizontally();

const title = header.addText("Gastô?");
title.textColor = new Color("#10B981");
title.font = Font.boldSystemFont(14);

header.addSpacer();

const tag = header.addText("Finanças");
tag.textColor = new Color("#A1A1AA");
tag.font = Font.systemFont(10);

widget.addSpacer(6);

// Status e Limite
const statusText = widget.addText("🟢 Saúde Financeira Estável");
statusText.textColor = new Color("#34D399");
statusText.font = Font.boldSystemFont(12);

widget.addSpacer(4);

const invoiceTitle = widget.addText("Próxima Fatura:");
invoiceTitle.textColor = new Color("#94A3B8");
invoiceTitle.font = Font.systemFont(11);

const invoiceVal = widget.addText("Cartões sob controle");
invoiceVal.textColor = new Color("#FFFFFF");
invoiceVal.font = Font.boldSystemFont(15);

widget.addSpacer(8);

const footer = widget.addText("⚡ Toque para registrar novo gasto");
footer.textColor = new Color("#10B981");
footer.font = Font.mediumSystemFont(10);

widget.url = "${typeof window !== 'undefined' ? window.location.origin : 'https://gastofinancas.web.app'}";

Script.setWidget(widget);
Script.complete();`;

  const handleCopyScriptable = async () => {
    try {
      await navigator.clipboard.writeText(scriptableScript);
      triggerHaptic(12);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[220] bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-[#1C1C1E] rounded-t-[28px] sm:rounded-[28px] border border-slate-200 dark:border-white/[0.10] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-150">
        
        {/* Header do Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between shrink-0 bg-white dark:bg-[#1C1C1E]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Widgets & Atalhos Rápidos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                Acesse o Gastô? direto da tela inicial do celular
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.15] text-slate-500 hover:text-slate-900 dark:text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selector - Clean Segmented Control */}
        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-black/30 flex gap-1.5">
          <button
            type="button"
            onClick={() => { setActiveTab('install'); triggerHaptic(6); }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
              activeTab === 'install'
                ? 'bg-white dark:bg-[#2C2C2E] text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Atalhos no Celular
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('preview'); triggerHaptic(6); }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-[#2C2C2E] text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Modelos de Widget
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('scriptable'); triggerHaptic(6); }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
              activeTab === 'scriptable'
                ? 'bg-white dark:bg-[#2C2C2E] text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Card Visual iPhone
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* TAB 1: COMO USAR / ENSINAR O WIDGET (LIMPO E RÁPIDO) */}
          {activeTab === 'install' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Quick Platform Switcher */}
              <div className="flex items-center justify-between p-1 bg-slate-100 dark:bg-white/[0.06] rounded-2xl border border-slate-200/60 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => { setPlatform('ios'); triggerHaptic(6); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    platform === 'ios'
                      ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <span>🍎 iPhone & iPad</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setPlatform('android'); triggerHaptic(6); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    platform === 'android'
                      ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <span>🤖 Android</span>
                </button>
              </div>

              {/* Status Badge */}
              {isStandalone && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Gastô? já está adicionado na sua tela inicial!</span>
                </div>
              )}

              {/* Fast Step-by-Step Cards */}
              <div className="space-y-2.5">
                {platform === 'ios' ? (
                  <>
                    {/* Clarification Note for iOS */}
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                      <p className="font-bold mb-1 flex items-center gap-1.5">
                        <span>💡 Como funciona no iPhone (iOS):</span>
                      </p>
                      <ul className="space-y-1 text-[11px] leading-relaxed">
                        <li>
                          <strong>1. Atalhos Rápidos (pelo Safari):</strong> Adiciona o app à tela inicial. Pressionando o ícone, você abre direto <em>Novo Gasto</em> e <em>Faturas</em>.
                        </li>
                        <li>
                          <strong>2. Card Visual com Saldo na Tela (Bloco 2x2):</strong> A Apple só permite cards visuais na grade através do app <strong>Scriptable</strong>.
                        </li>
                      </ul>
                      <button
                        type="button"
                        onClick={() => { setActiveTab('scriptable'); triggerHaptic(6); }}
                        className="mt-2 text-[11px] font-bold text-amber-700 dark:text-amber-300 underline cursor-pointer hover:opacity-80"
                      >
                        → Quero o Card Visual de Saldo na tela (Ver Scriptable)
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] flex items-start gap-3">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                        1
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                        <p className="font-bold text-slate-900 dark:text-white mb-0.5">Toque em Compartilhar no Safari</p>
                        <p className="text-slate-500 dark:text-slate-400">Na barra inferior do Safari, clique no ícone de quadrado com a seta para cima <Share size={13} className="inline mx-0.5" />.</p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] flex items-start gap-3">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                        2
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                        <p className="font-bold text-slate-900 dark:text-white mb-0.5">Adicionar à Tela de Início</p>
                        <p className="text-slate-500 dark:text-slate-400">Role o menu para baixo, toque em <strong>"Adicionar à Tela de Início"</strong> <PlusSquare size={13} className="inline mx-0.5" /> e confirme.</p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Zap size={14} className="stroke-[2.2]" />
                      </div>
                      <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                        <p className="font-bold text-emerald-700 dark:text-emerald-300 mb-0.5">Como usar os Atalhos Rápidos</p>
                        <p>Na tela inicial do seu iPhone, <strong>mantenha o dedo pressionado no ícone do Gastô?</strong>. O menu rápido abrirá com: <em>Novo Gasto</em>, <em>Minhas Faturas</em> e <em>Resumo</em> instantâneos!</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] flex items-start gap-3">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                        1
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                        <p className="font-bold text-slate-900 dark:text-white mb-0.5">Instalar aplicativo no Chrome</p>
                        <p className="text-slate-500 dark:text-slate-400">Toque nos <strong>três pontinhos (⋮)</strong> no topo do navegador e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] flex items-start gap-3">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                        2
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                        <p className="font-bold text-slate-900 dark:text-white mb-0.5">Acessar e fixar Atalhos</p>
                        <p className="text-slate-500 dark:text-slate-400">Na tela inicial, <strong>pressione e segure o ícone do Gastô?</strong> para acessar os widgets rápidos e arrastar os atalhos diretamente para sua tela!</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Botão de Ação Rápido e Limpo */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Download size={16} />
                  <span>
                    {isLinkCopied
                      ? 'Link Copiado! Cole no Safari ou Chrome'
                      : isStandalone
                      ? 'Revisar Atalhos Rápidos'
                      : 'Adicionar à Tela de Início'}
                  </span>
                </button>
              </div>

              {/* Opção de Barra de Widgets dentro do Gastô? */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Layers size={17} className="text-slate-500 dark:text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Barra de Widgets no Início
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Exibir limite e faturas no topo da tela inicial do app
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTogglePinDashboard}
                  className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                    pinToDashboard ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PREVIEW DOS WIDGETS */}
          {activeTab === 'preview' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <WidgetPreview />
            </div>
          )}

          {/* TAB 3: SCRIPTABLE (IOS AVANÇADO) */}
          {activeTab === 'scriptable' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                <p className="font-bold mb-1">💡 Widget 100% Nativo na Galeria do iOS</p>
                <p>Para adicionar um widget visual nativo (quadrado de 2x2 ou 2x4) no iPhone, instale o app gratuito <strong>Scriptable</strong> na App Store e cole o código abaixo.</p>
              </div>

              <div className="relative rounded-2xl bg-slate-900 text-slate-200 p-3.5 font-mono text-[11px] overflow-x-auto max-h-48 border border-white/10">
                <pre>{scriptableScript}</pre>
              </div>

              <button
                type="button"
                onClick={handleCopyScriptable}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
                <span>{isCopied ? 'Código Copiado com Sucesso!' : 'Copiar Código para o Scriptable'}</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50 dark:bg-[#1C1C1E] flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Sincronização em tempo real com seu Gastô?
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-xs cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
