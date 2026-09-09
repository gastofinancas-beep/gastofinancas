import React, { useState } from 'react';
import { 
  Plus, 
  Download, 
  RotateCcw, 
  Moon, 
  Sun, 
  User as UserIcon, 
  LogOut, 
  HelpCircle,
  Menu
} from 'lucide-react';
import { GastoLogo } from './GastoLogo';
import { MobileDrawerMenu } from './MobileDrawerMenu';
import { MonthSummary, UserProfile, MainTabType } from '../types';

interface HeaderProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  summary: MonthSummary;
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  onOpenAddExpense: () => void;
  onOpenExport: () => void;
  onResetData: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  userEmail?: string | null;
  profile: UserProfile;
  onOpenProfile: () => void;
  onSignOut: () => void;
  onOpenTutorial: () => void;
}

export function Header({
  activeTab,
  onTabChange,
  onOpenAddExpense,
  onOpenExport,
  onResetData,
  isDarkMode,
  onToggleDarkMode,
  profile,
  userEmail,
  onOpenProfile,
  onSignOut,
  onOpenTutorial,
}: HeaderProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#000000]/80 backdrop-blur-xl border-b border-slate-200/70 dark:border-white/[0.08] shadow-[0_1px_8px_rgba(0,0,0,0.03)] w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            
            {/* Left Area: Drawer Trigger & Brand Logo */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Hamburger Drawer Button */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="p-1.5 -ml-1 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                title="Abrir menu lateral"
                aria-label="Menu"
              >
                <Menu size={21} className="stroke-[2.2]" />
              </button>

              {/* Brand Logo & Name */}
              <div 
                className="flex items-center gap-2 cursor-pointer select-none" 
                onClick={() => onTabChange('dashboard')}
              >
                <GastoLogo size={26} />
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  Gastô<span className="text-emerald-500">?</span>
                </span>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-white/[0.06] p-1 rounded-full border border-slate-200/60 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => onTabChange('dashboard')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                  activeTab === 'dashboard'
                    ? 'bg-white dark:bg-[#1C1C1E] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Início
              </button>
              <button
                type="button"
                onClick={() => onTabChange('assinaturas')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                  activeTab === 'assinaturas'
                    ? 'bg-white dark:bg-[#1C1C1E] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Assinaturas</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </button>
              <button
                type="button"
                onClick={() => onTabChange('meuuber')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                  activeTab === 'meuuber'
                    ? 'bg-white dark:bg-[#1C1C1E] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>MeuUber</span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange('cartoes')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                  activeTab === 'cartoes'
                    ? 'bg-white dark:bg-[#1C1C1E] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Cartões
              </button>
              <button
                type="button"
                onClick={() => onTabChange('pessoas')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                  activeTab === 'pessoas'
                    ? 'bg-white dark:bg-[#1C1C1E] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Divisão
              </button>
              <button
                type="button"
                onClick={() => onTabChange('rendas')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                  activeTab === 'rendas'
                    ? 'bg-white dark:bg-[#1C1C1E] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Balanço
              </button>
            </nav>

            {/* Right Action Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Add Expense Button */}
              <button
                type="button"
                onClick={onOpenAddExpense}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white p-1.5 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer"
                title="Adicionar Gasto"
              >
                <Plus size={16} className="stroke-[2.5]" />
                <span className="hidden sm:inline">Novo</span>
              </button>

              {/* Desktop Only Tools */}
              <button
                type="button"
                onClick={onOpenTutorial}
                title="Guia & Tutorial"
                className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors hidden md:flex cursor-pointer"
              >
                <HelpCircle size={17} />
              </button>

              <button
                type="button"
                onClick={onOpenExport}
                title="Exportar dados"
                className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors hidden md:flex cursor-pointer"
              >
                <Download size={17} />
              </button>

              {/* Dark Mode toggle */}
              <button
                type="button"
                onClick={onToggleDarkMode}
                title={isDarkMode ? 'Modo claro' : 'Modo escuro'}
                className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                {isDarkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
              </button>

              {/* Profile Avatar / Trigger */}
              <button
                type="button"
                onClick={onOpenProfile}
                title="Meu Perfil"
                className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-emerald-500/30 transition-all cursor-pointer"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-200 dark:bg-white/15 text-slate-800 dark:text-slate-200 border border-slate-300/80 dark:border-white/10 flex items-center justify-center font-bold text-xs">
                  {profile?.nickname ? profile.nickname.charAt(0).toUpperCase() : <UserIcon size={14} />}
                </div>
              </button>

              {/* Desktop Logout Button */}
              <button
                type="button"
                onClick={onSignOut}
                title="Sair da Conta"
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors hidden md:flex cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Slide-out Mobile Drawer Menu */}
      <MobileDrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        onTabChange={onTabChange}
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
        profile={profile}
        userEmail={userEmail}
        onOpenProfile={onOpenProfile}
        onSignOut={onSignOut}
        onOpenAddExpense={onOpenAddExpense}
        onOpenTutorial={onOpenTutorial}
        onOpenExport={onOpenExport}
        onResetData={onResetData}
      />
    </>
  );
}
