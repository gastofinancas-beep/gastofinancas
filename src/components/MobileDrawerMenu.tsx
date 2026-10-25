import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft,
  LayoutDashboard, 
  Wallet,
  CreditCard, 
  Users, 
  Sparkles,
  Zap,
  Target,
  Moon, 
  Sun, 
  User as UserIcon, 
  LogOut, 
  HelpCircle, 
  Download,
  Car,
  CalendarClock
} from 'lucide-react';
import { UserProfile, MainTabType } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { supportUrl } from '../lib/support';

interface MobileDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  profile: UserProfile;
  userEmail?: string | null;
  onOpenProfile: () => void;
  onSignOut: () => void;
  onOpenAddExpense?: () => void;
  onOpenTutorial: () => void;
  onOpenExport: () => void;
}

export function MobileDrawerMenu({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  isDarkMode,
  onToggleDarkMode,
  profile,
  userEmail,
  onOpenProfile,
  onSignOut,
  onOpenTutorial,
  onOpenExport,
}: MobileDrawerMenuProps) {
  const handleSelectTab = (tab: MainTabType) => {
    onTabChange(tab);
    onClose();
  };

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'carteira' as const,
      label: 'Minha Carteira',
      icon: Wallet,
    },
    {
      id: 'metas' as const,
      label: 'Metas de Economia',
      icon: Target,
    },
    {
      id: 'fixos' as const,
      label: 'Salários e contas fixas',
      icon: CalendarClock,
    },
    {
      id: 'assinaturas' as const,
      label: 'Assinaturas',
      icon: Sparkles,
    },
    {
      id: 'meuuber' as const,
      label: 'Motorista App',
      icon: Car,
    },
    {
      id: 'cartoes' as const,
      label: 'Cartões',
      icon: CreditCard,
    },
    {
      id: 'pessoas' as const,
      label: 'Divisão de Gastos',
      icon: Users,
    },
  ];

  const displayName = profile?.nickname || profile?.name || userEmail?.split('@')[0] || 'Minha Conta';
  const displaySubtitle = profile?.occupation || userEmail || 'Configurações de Perfil';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Subtle Dim Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs"
          />

          {/* Drawer Panel: Flush to the left with rounded-r-[34px] corner */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              paddingTop: 'max(1.25rem, env(safe-area-inset-top, 0px))',
              paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
            }}
            className="relative w-[275px] sm:w-[305px] h-full bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-slate-100 rounded-r-[34px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] border-r border-black/[0.06] dark:border-white/[0.08] flex flex-col justify-between z-10 px-5 sm:px-6 overflow-hidden select-none"
          >
            {/* Top Container: Profile Header + Nav Items */}
            <div className="flex flex-col min-h-0 flex-1">
              
              {/* Profile Card Header */}
              <div className="flex items-center justify-between gap-3 pb-6 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onOpenProfile();
                    onClose();
                  }}
                  className="flex items-center gap-3 min-w-0 text-left cursor-pointer group flex-1"
                >
                  <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-[#2C2C2E] text-emerald-600 dark:text-emerald-400 border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center font-bold text-base shrink-0 overflow-hidden shadow-xs group-hover:scale-105 transition-transform">
                    {profile?.photoURL ? (
                      <img 
                        src={profile.photoURL} 
                        alt={displayName} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-sm font-bold">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate tracking-tight">
                      {displayName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-normal">
                      {displaySubtitle}
                    </p>
                  </div>
                </button>

                {/* Circular Collapse Toggle Button with Chevron in Emerald Brand Color */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-sm cursor-pointer shrink-0 transition-transform active:scale-90"
                  title="Fechar menu"
                  aria-label="Fechar menu"
                >
                  <ChevronLeft size={16} className="stroke-[2.5]" />
                </button>
              </div>

              {/* Main Navigation Items */}
              <div className="overflow-y-auto flex-1 pr-1 -mr-1 space-y-1.5 scrollbar-thin">
                <nav className="space-y-1.5" aria-label="Navegação principal">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id || (item.id === 'meuuber' && (activeTab === 'extra' || activeTab === 'meuuber'));
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectTab(item.id)}
                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-left ${
                          isActive
                            ? 'bg-emerald-500 text-white shadow-[0_4px_16px_rgba(16,185,129,0.25)] font-bold'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                        }`}
                      >
                        <Icon size={19} className={isActive ? 'stroke-[2.5] text-white' : 'stroke-[1.9] text-slate-500 dark:text-slate-400'} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                {/* Sub-section: Configurações & Ferramentas */}
                <div className="pt-3 mt-3 border-t border-black/[0.04] dark:border-white/[0.06] space-y-1">
                  {/* Theme Switcher */}
                  <button
                    type="button"
                    onClick={onToggleDarkMode}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer text-sm font-medium"
                  >
                    <div className="flex items-center gap-3.5">
                      {isDarkMode ? <Moon size={18} className="text-emerald-400 stroke-[1.9]" /> : <Sun size={18} className="text-amber-500 stroke-[1.9]" />}
                      <span>{isDarkMode ? 'Modo Escuro' : 'Modo Claro'}</span>
                    </div>

                    <div className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors ${
                      isDarkMode ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                    }`}>
                      <motion.div
                        layout
                        className="w-3.5 h-3.5 rounded-full bg-white shadow-xs"
                      />
                    </div>
                  </button>

                  {/* Profile Settings */}
                  <button
                    type="button"
                    onClick={() => {
                      onOpenProfile();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer text-sm font-medium"
                  >
                    <UserIcon size={18} className="stroke-[1.9] text-slate-500 dark:text-slate-400" />
                    <span>Configurações</span>
                  </button>

                  {/* Export Report */}
                  <button
                    type="button"
                    onClick={() => {
                      onOpenExport();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer text-sm font-medium"
                  >
                    <Download size={18} className="stroke-[1.9] text-slate-500 dark:text-slate-400" />
                    <span>Exportar Dados</span>
                  </button>

                  {/* User Tutorial Guide */}
                  <button
                    type="button"
                    onClick={() => {
                      onOpenTutorial();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer text-sm font-medium"
                  >
                    <HelpCircle size={18} className="stroke-[1.9] text-slate-500 dark:text-slate-400" />
                    <span>Ajuda & Tutorial</span>
                  </button>

                  {supportUrl && (
                    <a
                      href={supportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onClose}
                      className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer text-sm font-medium"
                    >
                      <HelpCircle size={18} className="stroke-[1.9] text-slate-500 dark:text-slate-400" />
                      <span>Falar com o suporte</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Row: Minimalist Logout Button */}
            <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.06] shrink-0">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-sm font-bold transition-all cursor-pointer"
              >
                <LogOut size={18} className="stroke-[2.2]" />
                <span>Logout</span>
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
