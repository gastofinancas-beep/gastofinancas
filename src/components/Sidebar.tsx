import React from 'react';
import { GastoLogo } from './GastoLogo';
import { 
  Home,
  Wallet, 
  CreditCard, 
  Package, 
  Users, 
  Repeat, 
  Target, 
  Briefcase, 
  Plus, 
  Eye, 
  EyeOff, 
  Bell, 
  User as UserIcon, 
  ChevronRight,
  Sliders,
  Car
} from 'lucide-react';
import { MainTabType, UserProfile } from '../types';

interface SidebarProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onOpenProfile: () => void;
  onOpenNotifications?: () => void;
  userProfile?: UserProfile;
  isBalanceVisible: boolean;
  onToggleBalanceVisible: () => void;
  unreadNotificationsCount?: number;
}

export function Sidebar({
  activeTab,
  onTabChange,
  onOpenAddExpense,
  onOpenAddIncome,
  onOpenProfile,
  onOpenNotifications,
  userProfile,
  isBalanceVisible,
  onToggleBalanceVisible,
  unreadNotificationsCount = 0
}: SidebarProps) {
  const mainTabs = [
    { id: 'dashboard', label: 'Início & Resumo', icon: Home },
    { id: 'carteira', label: 'Carteira & Extrato', icon: Wallet },
    { id: 'cartoes', label: 'Cartões & Faturas', icon: CreditCard },
  ];

  const orgTabs = [
    { id: 'investimentos', label: 'Caixinhas & Cofres', icon: Package },
    { id: 'assinaturas', label: 'Assinaturas', icon: Repeat },
    { id: 'metas', label: 'Metas & Limites', icon: Target },
  ];

  const moduleTabs = [
    { id: 'pessoas', label: 'Divisão de Gastos', icon: Users },
    { id: 'extra', label: 'Renda Extra & Freelance', icon: Briefcase },
    { id: 'meuuber', label: 'Motorista de App', icon: Car },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-[#121214] border-r border-slate-200/80 dark:border-white/10 shrink-0 h-screen sticky top-0 overflow-y-auto pt-safe pb-safe px-4 py-5 select-none transition-colors z-20">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-2 mb-6">
        <div className="flex items-center gap-3">
          <GastoLogo size={36} className="shadow-md shadow-emerald-500/10" />
          <div>
            <h1 className="font-black text-xl tracking-tight text-slate-900 dark:text-white leading-none">
              Gastô<span className="text-emerald-500">?</span>
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mt-0.5">
              Finanças Pessoais
            </span>
          </div>
        </div>

        {/* Notifications & Eye toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleBalanceVisible}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
            title={isBalanceVisible ? "Ocultar saldos" : "Mostrar saldos"}
          >
            {isBalanceVisible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
            title="Notificações"
          >
            <Bell size={16} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button
          onClick={onOpenAddExpense}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus size={15} className="stroke-[2.5]" />
          <span>Novo Gasto</span>
        </button>
        <button
          onClick={onOpenAddIncome}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus size={15} className="stroke-[2.5]" />
          <span>Entrada</span>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 space-y-6">
        {/* Main Section */}
        <div>
          <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
            Visão Geral
          </span>
          <nav className="space-y-1">
            {mainTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id as MainTabType)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'} />
                    <span>{tab.label}</span>
                  </div>
                  {isActive && <ChevronRight size={14} className="text-emerald-500" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Organization Section */}
        <div>
          <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
            Organização
          </span>
          <nav className="space-y-1">
            {orgTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id as MainTabType)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'} />
                    <span>{tab.label}</span>
                  </div>
                  {isActive && <ChevronRight size={14} className="text-emerald-500" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Modules Section */}
        <div>
          <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
            Módulos Especiais
          </span>
          <nav className="space-y-1">
            {moduleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id as MainTabType)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'} />
                    <span>{tab.label}</span>
                  </div>
                  {isActive && <ChevronRight size={14} className="text-emerald-500" />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Profile Box */}
      <div className="mt-auto pt-4 border-t border-slate-200/80 dark:border-white/10">
        <button
          onClick={onOpenProfile}
          className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-sm shrink-0">
              {(userProfile?.nickname || userProfile?.name) ? (userProfile?.nickname || userProfile?.name)?.charAt(0).toUpperCase() : <UserIcon size={18} />}
            </div>
            <div className="truncate min-w-0">
              <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {userProfile?.nickname || userProfile?.name || 'Minha Conta'}
              </p>
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">
                {userProfile?.email || 'Acessar configurações'}
              </p>
            </div>
          </div>
          <Sliders size={16} className="text-slate-400 shrink-0" />
        </button>
      </div>
    </aside>
  );
}
