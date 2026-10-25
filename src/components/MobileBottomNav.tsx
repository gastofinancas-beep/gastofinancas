import React, { useState } from 'react';
import { 
  Home,
  Wallet, 
  CreditCard, 
  Grid3x3, 
  Plus, 
  X, 
  TrendingDown, 
  TrendingUp, 
  ArrowLeftRight, 
  Car, 
  Bell, 
  TrendingUp as ChartIcon, 
  Users, 
  User as UserIcon,
  Sparkles,
  Target,
  CalendarClock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MainTabType } from '../types';

interface MobileBottomNavProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  onOpenAddExpense: () => void;
  onOpenAddIncome?: () => void;
  onOpenAddWalletTransaction?: () => void;
  onOpenProfile?: () => void;
}

export function MobileBottomNav({
  activeTab,
  onTabChange,
  onOpenAddExpense,
  onOpenAddIncome,
  onOpenAddWalletTransaction,
  onOpenProfile,
}: MobileBottomNavProps) {
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  const handleSelectSpeedAction = (action: () => void) => {
    setIsSpeedDialOpen(false);
    action();
  };

  return (
    <>
      {/* Backdrop for Speed Dial */}
      <AnimatePresence>
        {isSpeedDialOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSpeedDialOpen(false)}
            className="lg:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs"
          />
        )}
      </AnimatePresence>

      {/* Speed Dial Menu items */}
      <AnimatePresence>
        {isSpeedDialOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="lg:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 w-11/12 max-w-xs p-3 bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] border border-black/[0.06] dark:border-white/[0.08]"
          >
            <div className="flex items-center justify-between px-2 pt-1 pb-1 border-b border-black/[0.04] dark:border-white/[0.06]">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-emerald-500" />
                <span>Ação Rápida</span>
              </span>
              <button
                type="button"
                onClick={() => setIsSpeedDialOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleSelectSpeedAction(onOpenAddExpense)}
              className="flex items-center gap-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                <TrendingDown size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold">Registrar Nova Despesa</p>
                <p className="text-[10px] opacity-80">Gasto no cartão ou à vista</p>
              </div>
            </button>

            {onOpenAddIncome && (
              <button
                type="button"
                onClick={() => handleSelectSpeedAction(onOpenAddIncome)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold">Registrar Nova Receita</p>
                  <p className="text-[10px] opacity-80">Salário, freela ou ganho extra</p>
                </div>
              </button>
            )}

            {onOpenAddWalletTransaction && (
              <button
                type="button"
                onClick={() => handleSelectSpeedAction(onOpenAddWalletTransaction)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-700 dark:bg-slate-600 text-white flex items-center justify-center shrink-0">
                  <ArrowLeftRight size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold">Transferência / Depósito</p>
                  <p className="text-[10px] opacity-80">Movimentar saldo entre contas</p>
                </div>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* "Mais" Bottom Sheet Grid */}
      <AnimatePresence>
        {isMoreSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreSheetOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-[#1C1C1E] rounded-t-3xl p-5 border-t border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.12)] max-h-[85vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Menu de Módulos</h3>
                  <p className="text-xs text-slate-400">Acesse todas as ferramentas do Gastô</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMoreSheetOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-white/10 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Grid 2x3 */}
              <div className="grid grid-cols-2 gap-3 pb-6">
                <button
                  type="button"
                  onClick={() => { setIsMoreSheetOpen(false); onTabChange('meuuber'); }}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                    activeTab === 'meuuber' || activeTab === 'extra'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'border-black/[0.06] dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Car size={24} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Motorista App</p>
                    <p className="text-[10px] text-slate-400">Uber, 99, inDrive</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setIsMoreSheetOpen(false); onTabChange('fixos'); }}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                    activeTab === 'fixos'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'border-black/[0.06] dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CalendarClock size={24} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Fixos</p>
                    <p className="text-[10px] text-slate-400">Salário & contas</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setIsMoreSheetOpen(false); onTabChange('assinaturas'); }}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                    activeTab === 'assinaturas'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'border-black/[0.06] dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Bell size={24} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Assinaturas</p>
                    <p className="text-[10px] text-slate-400">Streaming & Contas</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setIsMoreSheetOpen(false); onTabChange('investimentos'); }}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                    activeTab === 'investimentos'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'border-black/[0.06] dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ChartIcon size={24} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Investimentos</p>
                    <p className="text-[10px] text-slate-400">Caixinhas & Metas</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setIsMoreSheetOpen(false); onTabChange('metas'); }}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                    activeTab === 'metas'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'border-black/[0.06] dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Target size={24} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Metas de Economia</p>
                    <p className="text-[10px] text-slate-400">Teto & Poupança</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setIsMoreSheetOpen(false); onTabChange('pessoas'); }}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                    activeTab === 'pessoas'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'border-black/[0.06] dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Users size={24} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Divisão & Pessoas</p>
                    <p className="text-[10px] text-slate-400">Rateio de despesas</p>
                  </div>
                </button>

                {onOpenProfile && (
                  <button
                    type="button"
                    onClick={() => { setIsMoreSheetOpen(false); onOpenProfile(); }}
                    className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <UserIcon size={24} className="stroke-[2.2]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Meu Perfil</p>
                      <p className="text-[10px] text-slate-400">Dados & Chave Pix</p>
                    </div>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modern Menu Bar with Green Squircle Badge */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40">
        <div className="w-full bg-white dark:bg-[#1C1C1E] pb-[max(6px,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.25)] border-t border-black/[0.06] dark:border-white/[0.08]">
          <nav 
            id="mobile-docked-navbar"
            aria-label="Navegação inferior"
            className="w-full max-w-md mx-auto grid grid-cols-5 items-center h-[68px] px-2"
          >
            {/* 1. Início Tab */}
            <button
              type="button"
              id="mobile-nav-dashboard"
              onClick={() => onTabChange('dashboard')}
              className="relative flex flex-col items-center justify-center py-1 cursor-pointer select-none active:scale-95 transition-transform"
            >
              <div className="relative w-11 h-8 flex items-center justify-center">
                {activeTab === 'dashboard' && (
                  <motion.div 
                    layoutId="activeNavSquircle"
                    className="absolute inset-0 bg-emerald-500 rounded-[10px] shadow-[0_2px_8px_rgba(16,185,129,0.35)]" 
                    transition={{ type: 'spring', stiffness: 460, damping: 32 }}
                  />
                )}
                <Home 
                  size={19} 
                  className={`relative z-10 transition-colors ${
                    activeTab === 'dashboard' 
                      ? 'text-white stroke-[2.2]' 
                      : 'text-slate-400 dark:text-slate-500 stroke-[1.8]'
                  }`} 
                />
              </div>
              <span className={`text-[11px] tracking-tight mt-1 leading-none transition-colors ${
                activeTab === 'dashboard' 
                  ? 'font-bold text-slate-900 dark:text-white' 
                  : 'font-medium text-slate-400 dark:text-slate-500'
              }`}>
                Início
              </span>
            </button>

            {/* 2. Carteira Tab */}
            <button
              type="button"
              id="mobile-nav-carteira"
              onClick={() => onTabChange('carteira')}
              className="relative flex flex-col items-center justify-center py-1 cursor-pointer select-none active:scale-95 transition-transform"
            >
              <div className="relative w-11 h-8 flex items-center justify-center">
                {activeTab === 'carteira' && (
                  <motion.div 
                    layoutId="activeNavSquircle"
                    className="absolute inset-0 bg-emerald-500 rounded-[10px] shadow-[0_2px_8px_rgba(16,185,129,0.35)]" 
                    transition={{ type: 'spring', stiffness: 460, damping: 32 }}
                  />
                )}
                <Wallet 
                  size={19} 
                  className={`relative z-10 transition-colors ${
                    activeTab === 'carteira' 
                      ? 'text-white stroke-[2.2]' 
                      : 'text-slate-400 dark:text-slate-500 stroke-[1.8]'
                  }`} 
                />
              </div>
              <span className={`text-[11px] tracking-tight mt-1 leading-none transition-colors ${
                activeTab === 'carteira' 
                  ? 'font-bold text-slate-900 dark:text-white' 
                  : 'font-medium text-slate-400 dark:text-slate-500'
              }`}>
                Carteira
              </span>
            </button>

            {/* 3. Botão Novo (+) */}
            <button
              type="button"
              id="mobile-nav-add-expense"
              data-tour="add-expense"
              onClick={() => setIsSpeedDialOpen(!isSpeedDialOpen)}
              className="relative flex flex-col items-center justify-center py-1 cursor-pointer select-none active:scale-95 transition-transform"
              title="Adicionar Despesa / Ações Rápidas"
              aria-label="Adicionar despesa"
            >
              <div className="relative w-11 h-8 flex items-center justify-center">
                {isSpeedDialOpen && (
                  <motion.div 
                    layoutId="activeNavSquircle"
                    className="absolute inset-0 bg-emerald-500 rounded-[10px] shadow-[0_2px_8px_rgba(16,185,129,0.35)]" 
                    transition={{ type: 'spring', stiffness: 460, damping: 32 }}
                  />
                )}
                {isSpeedDialOpen ? (
                  <X size={18} className="relative z-10 text-white stroke-[2.4]" />
                ) : (
                  <Plus size={20} className="relative z-10 text-slate-400 dark:text-slate-500 stroke-[2.0]" />
                )}
              </div>
              <span className={`text-[11px] tracking-tight mt-1 leading-none transition-colors ${
                isSpeedDialOpen 
                  ? 'font-bold text-slate-900 dark:text-white' 
                  : 'font-medium text-slate-400 dark:text-slate-500'
              }`}>
                Novo
              </span>
            </button>

            {/* 4. Cartões Tab */}
            <button
              type="button"
              id="mobile-nav-cartoes"
              data-tour="nav-cartoes"
              onClick={() => onTabChange('cartoes')}
              className="relative flex flex-col items-center justify-center py-1 cursor-pointer select-none active:scale-95 transition-transform"
            >
              <div className="relative w-11 h-8 flex items-center justify-center">
                {activeTab === 'cartoes' && (
                  <motion.div 
                    layoutId="activeNavSquircle"
                    className="absolute inset-0 bg-emerald-500 rounded-[10px] shadow-[0_2px_8px_rgba(16,185,129,0.35)]" 
                    transition={{ type: 'spring', stiffness: 460, damping: 32 }}
                  />
                )}
                <CreditCard 
                  size={19} 
                  className={`relative z-10 transition-colors ${
                    activeTab === 'cartoes' 
                      ? 'text-white stroke-[2.2]' 
                      : 'text-slate-400 dark:text-slate-500 stroke-[1.8]'
                  }`} 
                />
              </div>
              <span className={`text-[11px] tracking-tight mt-1 leading-none transition-colors ${
                activeTab === 'cartoes' 
                  ? 'font-bold text-slate-900 dark:text-white' 
                  : 'font-medium text-slate-400 dark:text-slate-500'
              }`}>
                Cartões
              </span>
            </button>

            {/* 5. Mais Tab */}
            <button
              type="button"
              id="mobile-nav-more"
              data-tour="nav-more"
              onClick={() => setIsMoreSheetOpen(true)}
              className="relative flex flex-col items-center justify-center py-1 cursor-pointer select-none active:scale-95 transition-transform"
            >
              <div className="relative w-11 h-8 flex items-center justify-center">
                {(['meuuber', 'freelancer', 'fixos', 'assinaturas', 'investimentos', 'pessoas', 'metas'].includes(activeTab) || isMoreSheetOpen) && (
                  <motion.div 
                    layoutId="activeNavSquircle"
                    className="absolute inset-0 bg-emerald-500 rounded-[10px] shadow-[0_2px_8px_rgba(16,185,129,0.35)]" 
                    transition={{ type: 'spring', stiffness: 460, damping: 32 }}
                  />
                )}
                <Grid3x3 
                  size={19} 
                  className={`relative z-10 transition-colors ${
                    (['meuuber', 'freelancer', 'fixos', 'assinaturas', 'investimentos', 'pessoas', 'metas'].includes(activeTab) || isMoreSheetOpen)
                      ? 'text-white stroke-[2.2]' 
                      : 'text-slate-400 dark:text-slate-500 stroke-[1.8]'
                  }`} 
                />
              </div>
              <span className={`text-[11px] tracking-tight mt-1 leading-none transition-colors ${
                (['meuuber', 'freelancer', 'fixos', 'assinaturas', 'investimentos', 'pessoas', 'metas'].includes(activeTab) || isMoreSheetOpen)
                  ? 'font-bold text-slate-900 dark:text-white' 
                  : 'font-medium text-slate-400 dark:text-slate-500'
              }`}>
                Mais
              </span>
            </button>

          </nav>
        </div>
      </div>
    </>
  );
}
