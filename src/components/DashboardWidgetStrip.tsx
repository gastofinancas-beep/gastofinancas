import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, CreditCard, ShieldCheck, Clock, X, Zap } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface DashboardWidgetStripProps {
  onOpenWidgetsHub: () => void;
}

export function DashboardWidgetStrip({ onOpenWidgetsHub }: DashboardWidgetStripProps) {
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gasto_show_dashboard_widgets') === 'true';
    } catch {
      return false;
    }
  });

  const [widgetData, setWidgetData] = useState<any>(null);

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const enabled = localStorage.getItem('gasto_show_dashboard_widgets') === 'true';
        setIsVisible(enabled);
        const stored = localStorage.getItem('gasto_widget_data');
        if (stored) {
          setWidgetData(JSON.parse(stored));
        }
      } catch (e) {
        console.error(e);
      }
    };

    handleUpdate();

    window.addEventListener('gasto_toggle_dashboard_widgets', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('gasto_toggle_dashboard_widgets', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(6);
    setIsVisible(false);
    try {
      localStorage.setItem('gasto_show_dashboard_widgets', 'false');
    } catch (err) {
      console.error(err);
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      onClick={() => {
        triggerHaptic(8);
        onOpenWidgetsHub();
      }}
      className="p-3 sm:p-4 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border border-emerald-500/20 shadow-xs cursor-pointer hover:border-emerald-500/40 transition-all group relative animate-in fade-in slide-in-from-top-2"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles size={13} className="stroke-[2.5]" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>Widget Rápido Gastô?</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 uppercase">
              Ao Vivo
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic(8);
              onOpenWidgetsHub();
            }}
            className="px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
          >
            <Sparkles size={12} />
            <span>Como Ativar</span>
          </button>

          <button
            type="button"
            onClick={handleHide}
            title="Ocultar do início"
            className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors ml-0.5"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div className="bg-white/80 dark:bg-black/40 backdrop-blur-xs p-2.5 rounded-2xl border border-slate-200/50 dark:border-white/5">
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">
            Fatura Próxima
          </span>
          <span className="font-bold text-slate-900 dark:text-white text-xs truncate block">
            {widgetData?.proximaFatura?.valor || 'R$ 0,00'}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            {widgetData?.proximaFatura?.diasRestantes != null ? `Vence em ${widgetData.proximaFatura.diasRestantes} dias` : 'Em dia'}
          </span>
        </div>

        <div className="bg-white/80 dark:bg-black/40 backdrop-blur-xs p-2.5 rounded-2xl border border-slate-200/50 dark:border-white/5">
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">
            Saúde Financeira
          </span>
          <span className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{widgetData?.percentGasto != null ? `${widgetData.percentGasto}% do limite` : 'Sob controle'}</span>
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Limite disponível
          </span>
        </div>

        <div className="hidden sm:block bg-white/80 dark:bg-black/40 backdrop-blur-xs p-2.5 rounded-2xl border border-slate-200/50 dark:border-white/5">
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">
            Atalho da Tela Inicial
          </span>
          <span className="font-bold text-slate-900 dark:text-white text-xs truncate block">
            PWA Shortcuts
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            <Zap size={10} strokeWidth={2.2} />
            <span>1-toque no celular</span>
          </span>
        </div>
      </div>
    </div>
  );
}
