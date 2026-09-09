import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft,
  LayoutDashboard, 
  CreditCard, 
  Users, 
  PiggyBank, 
  TrendingUp,
  Car,
  Moon, 
  Sun, 
  User as UserIcon, 
  LogOut, 
  HelpCircle, 
  Download, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { UserProfile, MainTabType } from '../types';

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
  onOpenAddExpense: () => void;
  onOpenTutorial: () => void;
  onOpenExport: () => void;
  onResetData: () => void;
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
  onResetData,
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
      id: 'assinaturas' as const,
      label: 'Assinaturas',
      icon: Sparkles,
      badge: 'Ativas',
    },
    {
      id: 'meuuber' as const,
      label: 'MeuUber',
      icon: Car,
      badge: 'Novo',
    },
    {
      id: 'rendas' as const,
      label: 'Entradas & Balanço',
      icon: TrendingUp,
    },
    {
      id: 'cartoes' as const,
      label: 'Cartões',
      icon: CreditCard,
    },
    {
      id: 'pessoas' as const,
      label: 'Divisão',
      icon: Users,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Soft Blur Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
          />

          {/* Floating Card Sidebar inspired by reference */}
          <motion.div
            initial={{ x: '-100%', opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0.8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="relative my-3 ml-3 sm:my-4 sm:ml-4 w-[280px] sm:w-[300px] h-[calc(100dvh-1.5rem)] sm:h-[calc(100dvh-2rem)] bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-slate-100 rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.7)] border border-slate-200/80 dark:border-white/[0.1] flex flex-col justify-between z-10 p-5 overflow-hidden"
          >
            {/* Top Area: User Header & Collapse Button */}
            <div className="space-y-6">
              {/* Profile Card Header */}
              <div className="flex items-center justify-between gap-2.5 pb-2">
                <div 
                  onClick={() => {
                    onOpenProfile();
                    onClose();
                  }}
                  className="flex items-center gap-3 min-w-0 cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-white/10 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-white/10 flex items-center justify-center font-bold text-base shrink-0 overflow-hidden shadow-2xs group-hover:scale-105 transition-transform">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt={profile.nickname || 'Avatar'} className="w-full h-full object-cover" />
                    ) : profile?.nickname ? (
                      profile.nickname.charAt(0).toUpperCase()
                    ) : (
                      <UserIcon size={20} />
                    )}
                  </div>
                  
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate tracking-tight">
                      {profile?.nickname || 'Meu Perfil'}
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate font-medium">
                      {userEmail || 'Conta Ativa'}
                    </p>
                  </div>
                </div>

                {/* Circular Collapse Toggle Chevron */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-sm cursor-pointer shrink-0 transition-transform active:scale-90"
                  title="Recolher menu"
                  aria-label="Fechar menu"
                >
                  <ChevronLeft size={16} className="stroke-[2.5]" />
                </button>
              </div>

              {/* Main Navigation Items */}
              <nav className="space-y-1.5" aria-label="Menu principal">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold tracking-tight transition-all cursor-pointer select-none ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <Icon size={18} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Divider */}
              <div className="border-t border-slate-100 dark:border-white/[0.06] pt-4">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Opções
                </p>

                <div className="space-y-1">
                  {/* Dark Mode Switcher */}
                  <button
                    type="button"
                    onClick={onToggleDarkMode}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-white/5 transition-colors cursor-pointer text-xs font-medium"
                  >
                    <div className="flex items-center gap-3">
                      {isDarkMode ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-500" />}
                      <span>{isDarkMode ? 'Modo Escuro' : 'Modo Claro'}</span>
                    </div>

                    <div className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors ${
                      isDarkMode ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                    }`}>
                      <motion.div
                        layout
                        className="w-3.5 h-3.5 rounded-full bg-white shadow-xs"
                      />
                    </div>
                  </button>

                  {/* Profile Modal Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      onOpenProfile();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-white/5 transition-colors cursor-pointer text-xs font-medium"
                  >
                    <UserIcon size={16} className="text-slate-400" />
                    <span>Meu Perfil</span>
                  </button>

                  {/* Export Report */}
                  <button
                    type="button"
                    onClick={() => {
                      onOpenExport();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-white/5 transition-colors cursor-pointer text-xs font-medium"
                  >
                    <Download size={16} className="text-slate-400" />
                    <span>Exportar Relatório</span>
                  </button>

                  {/* Tutorial Guide */}
                  <button
                    type="button"
                    onClick={() => {
                      onOpenTutorial();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-white/5 transition-colors cursor-pointer text-xs font-medium"
                  >
                    <HelpCircle size={16} className="text-slate-400" />
                    <span>Guia do Usuário</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Section: Clean Logout Button */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut size={16} className="stroke-[2]" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

