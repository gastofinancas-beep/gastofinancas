import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Download, 
  RotateCcw, 
  User as UserIcon, 
  LogOut, 
  HelpCircle, 
  Menu,
  Bell,
  Sparkles
} from 'lucide-react';
import { GastoLogo } from './GastoLogo';
import { MobileDrawerMenu } from './MobileDrawerMenu';
import { NotificationsModal } from './NotificationsModal';
import { getCardBillTotal, getNextDue, isCardBillPaid } from '../utils/billReminders';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { MonthSummary, UserProfile, MainTabType, CreditCard, SubscriptionItem, ExpenseItem, CardBillPayment } from '../types';

interface HeaderProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  summary: MonthSummary;
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  onOpenAddExpense: () => void;
  onOpenExport: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  userEmail?: string | null;
  profile: UserProfile;
  onOpenProfile: () => void;
  onSignOut: () => void;
  onOpenTutorial: () => void;
  cards?: CreditCard[];
  subscriptions?: SubscriptionItem[];
  expenses?: ExpenseItem[];
  paidBills?: CardBillPayment[];
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  isOnline: boolean;
}

export function Header({
  currentMonth,
  activeTab,
  onTabChange,
  onOpenAddExpense,
  onOpenExport,
  isDarkMode,
  onToggleDarkMode,
  profile,
  userEmail,
  onOpenProfile,
  onSignOut,
  onOpenTutorial,
  cards = [],
  subscriptions = [],
  expenses = [],
  paidBills = [],
  isSyncing,
  lastSyncedAt,
  isOnline,
}: HeaderProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Avisos que realmente pedem atenção: fatura aberta com valor (vencida ou em até 3 dias) e assinaturas de hoje/amanhã.
  const alertIds = useMemo(() => {
    const ids: string[] = [];
    const today = new Date();
    cards.forEach(card => {
      const { billMonth, daysDiff } = getNextDue(card.dueDay || 15, today, 3);
      if (daysDiff > 3 || isCardBillPaid(card, paidBills, billMonth)) return;
      if (getCardBillTotal(card, expenses, billMonth) <= 0) return;
      ids.push(`c${card.id}`);
    });
    subscriptions.forEach(sub => {
      if (!sub.active) return;
      const { daysDiff } = getNextDue(sub.billingDay, today, 0);
      if (daysDiff === 0 || daysDiff === 1) ids.push(`s${sub.id}`);
    });
    return ids;
  }, [cards, subscriptions, expenses, paidBills]);

  // O ponto some depois que a pessoa abre os avisos e só volta quando surgir um aviso novo.
  const alertSignature = `${new Date().toDateString()}|${alertIds.join(',')}`;
  const [seenSignature, setSeenSignature] = useState<string | null>(() => {
    try { return localStorage.getItem('gasto_avisos_vistos'); } catch { return null; }
  });
  const hasNewAlerts = alertIds.length > 0 && seenSignature !== alertSignature;

  const openNotifications = () => {
    setShowNotifications(true);
    setSeenSignature(alertSignature);
    try { localStorage.setItem('gasto_avisos_vistos', alertSignature); } catch { /* ignora */ }
  };

  return (
    <>
      <header 
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        className="sticky top-0 z-40 pt-safe bg-white/95 dark:bg-[#000000]/95 backdrop-blur-xl border-b border-slate-200/70 dark:border-white/[0.08] shadow-[0_1px_8px_rgba(0,0,0,0.03)] w-full shrink-0 transition-colors"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 min-h-[56px] gap-2">
            
            {/* Left Area: Drawer Trigger & Brand Logo */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Hamburger Drawer Button */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="w-11 h-11 -ml-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                title="Abrir menu lateral"
                aria-label="Menu"
              >
                <Menu size={21} className="stroke-[2.2]" />
              </button>

              {/* Brand Logo & Name */}
              <div 
                className="flex items-center gap-2.5 cursor-pointer select-none group" 
                onClick={() => onTabChange('dashboard')}
              >
                <GastoLogo size={32} className="group-hover:scale-105 group-active:scale-95 transition-transform" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2.5">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white leading-tight">
                    Gastô<span className="text-emerald-500">?</span>
                  </span>
                  <div className="mt-0.5 sm:mt-0">
                    <SyncStatusIndicator
                      isSyncing={isSyncing}
                      lastSyncedAt={lastSyncedAt}
                      isOnline={isOnline}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-white/[0.06] p-1 rounded-full border border-slate-200/60 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => onTabChange('dashboard')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-500 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Início
              </button>
              <button
                type="button"
                onClick={() => onTabChange('carteira')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                  activeTab === 'carteira'
                    ? 'bg-emerald-500 text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Carteira</span>
                <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'carteira' ? 'bg-white' : 'bg-emerald-500'}`} />
              </button>
              <button
                type="button"
                onClick={() => onTabChange('metas')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                  activeTab === 'metas'
                    ? 'bg-emerald-500 text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Metas</span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange('assinaturas')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                  activeTab === 'assinaturas'
                    ? 'bg-emerald-500 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Assinaturas</span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange('meuuber')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                  activeTab === 'extra' || activeTab === 'freelancer' || activeTab === 'meuuber'
                    ? 'bg-emerald-500 text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Motorista App</span>
                <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'extra' || activeTab === 'freelancer' || activeTab === 'meuuber' ? 'bg-white' : 'bg-amber-500'}`} />
              </button>
              <button
                type="button"
                onClick={() => onTabChange('cartoes')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                  activeTab === 'cartoes'
                    ? 'bg-emerald-500 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Cartões
              </button>
              <button
                type="button"
                onClick={() => onTabChange('investimentos')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                  activeTab === 'investimentos'
                    ? 'bg-emerald-500 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Investimentos
              </button>
              <button
                type="button"
                onClick={() => onTabChange('pessoas')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                  activeTab === 'pessoas'
                    ? 'bg-emerald-500 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Divisão
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
                className="w-11 h-11 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors hidden md:flex cursor-pointer"
              >
                <HelpCircle size={17} />
              </button>

              <button
                type="button"
                onClick={onOpenExport}
                title="Exportar dados"
                className="w-11 h-11 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors hidden md:flex cursor-pointer"
              >
                <Download size={17} />
              </button>

              {/* Notification Bell (ao lado da foto de perfil) */}
              <button
                type="button"
                id="header-notification-bell-btn"
                onClick={openNotifications}
                title="Lembretes & Notificações"
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer relative"
                aria-label="Lembretes & Notificações"
              >
                <Bell size={18} className="stroke-[2.2]" />
                {hasNewAlerts && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-black" />
                )}
              </button>

              {/* Profile Avatar / Trigger */}
              <button
                type="button"
                onClick={onOpenProfile}
                title="Meu Perfil"
                className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-white/15 text-slate-800 dark:text-slate-200 border border-slate-300/80 dark:border-white/10 flex items-center justify-center font-bold text-xs">
                  {profile?.photoURL ? (
                    <img 
                      src={profile.photoURL} 
                      alt={profile.nickname || profile.name || 'Avatar'} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  ) : profile?.nickname || profile?.name ? (
                    (profile.nickname || profile.name)!.charAt(0).toUpperCase()
                  ) : (
                    <UserIcon size={14} />
                  )}
                </div>
              </button>

              {/* Desktop Logout Button */}
              <button
                type="button"
                onClick={onSignOut}
                title="Sair da Conta"
                className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors hidden md:flex cursor-pointer"
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
      />
      {/* Full-screen Reminders & Notifications Modal */}
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        cards={cards}
        subscriptions={subscriptions}
        expenses={expenses}
        paidBills={paidBills}
        onTabChange={onTabChange}
        onOpenProfile={onOpenProfile}
      />
    </>
  );
}
