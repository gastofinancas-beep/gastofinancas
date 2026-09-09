import React from 'react';
import { LayoutDashboard, CreditCard, Users, TrendingUp, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { MainTabType } from '../types';

interface MobileBottomNavProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  onOpenAddExpense: () => void;
}

export function MobileBottomNav({
  activeTab,
  onTabChange,
  onOpenAddExpense,
}: MobileBottomNavProps) {
  return (
    <div className="md:hidden fixed bottom-3 sm:bottom-4 inset-x-0 z-40 px-3 flex justify-center pointer-events-none">
      <nav 
        id="mobile-floating-navbar"
        aria-label="Navegação mobile"
        className="pointer-events-auto w-full max-w-md bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.12] rounded-3xl sm:rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] px-2 py-1.5 transition-all duration-300"
      >
        <div className="grid grid-cols-5 items-center">
          
          {/* Dashboard Tab */}
          <button
            type="button"
            id="mobile-nav-dashboard"
            onClick={() => onTabChange('dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-95 ${
              activeTab === 'dashboard'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-emerald-50 dark:bg-emerald-950/60 shadow-2xs' : ''}`}>
              <LayoutDashboard size={20} className={activeTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Início</span>
          </button>

          {/* Cartões Tab */}
          <button
            type="button"
            id="mobile-nav-cartoes"
            onClick={() => onTabChange('cartoes')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-95 ${
              activeTab === 'cartoes'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === 'cartoes' ? 'bg-emerald-50 dark:bg-emerald-950/60 shadow-2xs' : ''}`}>
              <CreditCard size={20} className={activeTab === 'cartoes' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Cartões</span>
          </button>

          {/* Floating Central Plus (+) Button */}
          <div className="flex items-center justify-center -my-3">
            <motion.button
              type="button"
              id="mobile-nav-add-expense"
              onClick={onOpenAddExpense}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 border-[3px] border-white dark:border-[#1C1C1E] cursor-pointer transition-colors"
              title="Novo gasto"
              aria-label="Adicionar novo gasto"
            >
              <Plus size={24} className="stroke-[2.8]" />
            </motion.button>
          </div>

          {/* Divisão Tab */}
          <button
            type="button"
            id="mobile-nav-pessoas"
            onClick={() => onTabChange('pessoas')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-95 ${
              activeTab === 'pessoas'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === 'pessoas' ? 'bg-emerald-50 dark:bg-emerald-950/60 shadow-2xs' : ''}`}>
              <Users size={20} className={activeTab === 'pessoas' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Divisão</span>
          </button>

          {/* Balanço / Entradas Tab */}
          <button
            type="button"
            id="mobile-nav-rendas"
            onClick={() => onTabChange('rendas')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-95 ${
              activeTab === 'rendas'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === 'rendas' ? 'bg-emerald-50 dark:bg-emerald-950/60 shadow-2xs' : ''}`}>
              <TrendingUp size={20} className={activeTab === 'rendas' ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Balanço</span>
          </button>

        </div>
      </nav>
    </div>
  );
}

