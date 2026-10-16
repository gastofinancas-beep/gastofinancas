import React, { useState, useMemo, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, User, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { sanitizeForFirestore } from './lib/sanitizeFirestore';
import { AuthView, LocalAuthUser } from './components/AuthView';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { GastoLogo } from './components/GastoLogo';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AddExpenseModal } from './components/AddExpenseModal';
import { AddIncomeModal } from './components/AddIncomeModal';
import { AddPersonModal } from './components/AddPersonModal';
import { AddCardModal } from './components/AddCardModal';
import { AddInvestmentFolderModal } from './components/AddInvestmentFolderModal';
import { AddInvestmentBoxModal } from './components/AddInvestmentBoxModal';
import { DepositWithdrawModal } from './components/DepositWithdrawModal';
import { ExportModal } from './components/ExportModal';
import { migrateBoxHistoryIfNeeded } from './lib/investmentHistory';
import { ConfirmDialogModal } from './components/ConfirmDialogModal';
import { OnboardingTutorialModal } from './components/OnboardingTutorialModal';
import { ProfileModal } from './components/ProfileModal';
import { AddFreelanceEntryModal } from './components/AddFreelanceEntryModal';
import { AddFreelanceExpenseModal } from './components/AddFreelanceExpenseModal';
import { FreelanceGoalsModal } from './components/FreelanceGoalsModal';
import { AddSubscriptionModal } from './components/AddSubscriptionModal';
import { AddWalletAccountModal } from './components/AddWalletAccountModal';
import { AddWalletTransactionModal } from './components/AddWalletTransactionModal';
import { TransactionSuccessModal, TransactionSuccessData } from './components/TransactionSuccessModal';
import confetti from 'canvas-confetti';
import { playSuccessChime } from './utils/soundEffects';
import { OfflineBanner } from './components/OfflineBanner';
import { LegalTermsModal } from './components/LegalTermsModal';
import { DeleteAccountModal } from './components/DeleteAccountModal';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { triggerHaptic } from './utils/haptics';

import { DashboardSkeleton } from './components/DashboardSkeleton';
import { PullToRefresh } from './components/PullToRefresh';
import { LockScreen } from './components/LockScreen';
import { PinSetupModal } from './components/PinSetupModal';
import { ErrorBoundary } from './components/ErrorBoundary';

// Code-split dynamic views for instant initial load
const ChartsDashboard = lazy(() => import('./components/ChartsDashboard').then(m => ({ default: m.ChartsDashboard })));
const PeopleSplitView = lazy(() => import('./components/PeopleSplitView').then(m => ({ default: m.PeopleSplitView })));
const CardsView = lazy(() => import('./components/CardsView').then(m => ({ default: m.CardsView })));
const InvestmentsView = lazy(() => import('./components/InvestmentsView').then(m => ({ default: m.InvestmentsView })));
const SubscriptionsView = lazy(() => import('./components/SubscriptionsView').then(m => ({ default: m.SubscriptionsView })));
const WalletView = lazy(() => import('./components/WalletView').then(m => ({ default: m.WalletView })));
const ExtraView = lazy(() => import('./components/ExtraView').then(m => ({ default: m.ExtraView })));
const SavingsGoalsView = lazy(() => import('./components/SavingsGoalsView').then(m => ({ default: m.SavingsGoalsView })));

function ViewLoadingFallback() {
  return (
    <div className="w-full py-24 flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-3 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
      <p className="text-xs text-slate-400 font-medium">Carregando painel...</p>
    </div>
  );
}

import { 
  ExpenseItem, 
  IncomeItem,
  CreditCard, 
  Person, 
  InvestmentFolder, 
  InvestmentBox,
  CardBillPayment,
  UserProfile,
  MainTabType,
  SubscriptionItem,
  DriverTrip,
  DriverExpense,
  DriverGoals,
  ExtraProfileConfig,
  FreelanceEntry,
  FreelanceExpense,
  FreelanceGoals,
  WalletAccount,
  WalletTransaction,
  WalletCategory,
  MonthlySavingsTarget,
  AccumulationGoal
} from './types';
import { 
  INITIAL_EXPENSES, 
  INITIAL_INCOMES,
  INITIAL_CARDS, 
  INITIAL_PEOPLE, 
  INITIAL_FOLDERS, 
  INITIAL_BOXES 
} from './data/initialData';
import {
  INITIAL_MONTHLY_TARGETS,
  INITIAL_ACCUMULATION_GOALS
} from './data/initialSavingsGoalsData';
import {
  INITIAL_SUBSCRIPTIONS,
  ServicePreset
} from './data/subscriptionPresets';
import {
  INITIAL_DRIVER_TRIPS,
  INITIAL_DRIVER_EXPENSES,
  INITIAL_DRIVER_GOALS,
  INITIAL_EXTRA_PROFILE,
  APP_CONFIGS
} from './data/initialDriverData';
import {
  INITIAL_FREELANCE_ENTRIES,
  INITIAL_FREELANCE_EXPENSES,
  INITIAL_FREELANCE_GOALS
} from './data/initialFreelanceData';
import {
  INITIAL_WALLET_ACCOUNTS,
  INITIAL_WALLET_TRANSACTIONS
} from './data/initialWalletData';
import { 
  calculateMonthSummary, 
  getActiveExpensesForMonth,
  addMonths,
  formatCurrency 
} from './utils/financeCalculations';
import {
  checkAndTriggerUpcomingBillNotifications,
  checkAndTriggerInvestmentYieldNotifications
} from './utils/notifications';
import { todayLocalISO } from './utils/dateUtils';

const STORAGE_KEYS = {
  EXPENSES: 'financas_expenses_v2',
  INCOMES: 'financas_incomes_v2',
  CARDS: 'financas_cards_v2',
  PEOPLE: 'financas_people_v2',
  FOLDERS: 'financas_inv_folders_v2',
  BOXES: 'financas_inv_boxes_v2',
  PAID_BILLS: 'financas_paid_bills_v1',
  DARK_MODE: 'financas_dark_mode_v1',
  PROFILE: 'financas_profile_v1',
  LOCAL_USER: 'financas_local_user_v1',
  DRIVER_TRIPS: 'financas_driver_trips_v1',
  DRIVER_EXPENSES: 'financas_driver_expenses_v1',
  DRIVER_GOALS: 'financas_driver_goals_v1',
  DRIVER_INTRO_SEEN: 'financas_driver_intro_seen_v1',
  EXTRA_PROFILE: 'financas_extra_profile_v1',
  FREELANCE_ENTRIES: 'financas_freelance_entries_v1',
  FREELANCE_EXPENSES: 'financas_freelance_expenses_v1',
  FREELANCE_GOALS: 'financas_freelance_goals_v1',
  SUBSCRIPTIONS: 'financas_subscriptions_v1',
  WALLET_ACCOUNTS: 'financas_wallet_accounts_v1',
  WALLET_TRANSACTIONS: 'financas_wallet_transactions_v1',
  MONTHLY_TARGETS: 'financas_monthly_savings_targets_v1',
  ACCUMULATION_GOALS: 'financas_accumulation_goals_v1',
};

type AppUser = User | LocalAuthUser;

function loadCachedState<T>(key: string, fallback: T): T {
  try {
    const savedUserStr = localStorage.getItem(STORAGE_KEYS.LOCAL_USER);
    if (savedUserStr) {
      try {
        const user = JSON.parse(savedUserStr);
        if (user?.uid) {
          const userSpecific = localStorage.getItem(`user_${user.uid}_${key}`);
          if (userSpecific !== null) return JSON.parse(userSpecific);
        }
      } catch {
        // ignore parse error
      }
    }
    const globalSaved = localStorage.getItem(key);
    if (globalSaved !== null) return JSON.parse(globalSaved);
  } catch (e) {
    console.error(`Error loading cached ${key}:`, e);
  }
  return fallback;
}

export default function App() {
  // Auth state - instant local-first resolution
  const initialCachedUser: AppUser | null = useMemo(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOCAL_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.uid?.startsWith('usr_google')) {
          localStorage.removeItem(STORAGE_KEYS.LOCAL_USER);
          return null;
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error loading initial cached auth:', e);
      try {
        localStorage.removeItem(STORAGE_KEYS.LOCAL_USER);
      } catch (err) {
        console.error(err);
      }
    }
    return null;
  }, []);

  const [currentUser, setCurrentUser] = useState<AppUser | null>(initialCachedUser);
  // If user session exists locally, never delay with a full-screen loading spinner
  const [authLoading, setAuthLoading] = useState<boolean>(!initialCachedUser);
  // Instant Render: Render dashboard in 0ms if cached user exists, then sync in background
  const [dataLoadedFromCloud, setDataLoadedFromCloud] = useState<boolean>(Boolean(initialCachedUser));
  const isInitialLoadRef = useRef(true);
  const loadedUidRef = useRef<string | null>(initialCachedUser ? (initialCachedUser as any).uid : null);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
      if (saved !== null) {
        return saved === 'true';
      }
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(isDarkMode));
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error('Error saving dark mode', e);
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Auth Listener with fallback safety timeout
  useEffect(() => {
    const authTimeout = setTimeout(() => {
      setAuthLoading(false);
    }, 400);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(authTimeout);
      if (user) {
        setCurrentUser(user);
        try {
          const userObj: LocalAuthUser = {
            uid: user.uid,
            email: user.email || undefined,
            displayName: user.displayName || undefined,
            photoURL: user.photoURL || undefined,
          };
          localStorage.setItem(STORAGE_KEYS.LOCAL_USER, JSON.stringify(userObj));
        } catch (e) {
          console.error('Error caching auth session to localStorage:', e);
        }
      } else {
        const saved = localStorage.getItem(STORAGE_KEYS.LOCAL_USER);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed?.uid?.startsWith('usr_google') || !auth.currentUser || auth.currentUser.uid !== parsed?.uid) {
              localStorage.removeItem(STORAGE_KEYS.LOCAL_USER);
            }
          } catch (e) {
            console.error('Error cleaning invalid local session:', e);
            localStorage.removeItem(STORAGE_KEYS.LOCAL_USER);
          }
        }
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => {
      clearTimeout(authTimeout);
      unsubscribe();
    };
  }, []);

  const handleLocalLogin = (user: LocalAuthUser) => {
    if (user?.uid?.startsWith('usr_google')) {
      try {
        localStorage.removeItem(STORAGE_KEYS.LOCAL_USER);
      } catch (e) {
        console.error('Error clearing invalid session:', e);
      }
      setCurrentUser(null);
      return;
    }
    if (!auth.currentUser || auth.currentUser.uid !== user?.uid) {
      try {
        localStorage.removeItem(STORAGE_KEYS.LOCAL_USER);
      } catch (e) {
        console.error('Error clearing mismatched session:', e);
      }
      return;
    }
    setCurrentUser(user);
    setDataLoadedFromCloud(true);
    try {
      localStorage.setItem(STORAGE_KEYS.LOCAL_USER, JSON.stringify(user));
    } catch (e) {
      console.error('Error saving local user session:', e);
    }
  };

  // Current active month in view (automatic real-time current month)
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [activeTab, setActiveTab] = useState<MainTabType>('dashboard');

  const MASTER_ACCOUNT_EMAIL = import.meta.env.VITE_MASTER_EMAIL ?? '';

  // Persistence State - Instant Hydration from Cache
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => loadCachedState(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES));
  const [incomes, setIncomes] = useState<IncomeItem[]>(() => loadCachedState(STORAGE_KEYS.INCOMES, INITIAL_INCOMES));
  const [cards, setCards] = useState<CreditCard[]>(() => {
    const savedCards = loadCachedState<CreditCard[]>(STORAGE_KEYS.CARDS, INITIAL_CARDS);
    return savedCards.map((c: CreditCard) => {
      if (c.id === 'card-nubank') return { ...c, dueDay: 15, closingDay: 8 };
      if (c.id === 'card-itau') return { ...c, dueDay: 8, closingDay: 1 };
      if (c.id === 'card-mercadopago') return { ...c, dueDay: 17, closingDay: 10 };
      return c;
    });
  });
  const [newlyAddedCardId, setNewlyAddedCardId] = useState<string | null>(null);
  const [people, setPeople] = useState<Person[]>(() => loadCachedState(STORAGE_KEYS.PEOPLE, INITIAL_PEOPLE));
  const [folders, setFolders] = useState<InvestmentFolder[]>(() => loadCachedState(STORAGE_KEYS.FOLDERS, INITIAL_FOLDERS));
  const [boxes, setBoxes] = useState<InvestmentBox[]>(() => {
    const parsed = loadCachedState<InvestmentBox[]>(STORAGE_KEYS.BOXES, INITIAL_BOXES);
    if (Array.isArray(parsed)) {
      return parsed.filter(b => !b.id.startsWith('box-nu-reserva') && !b.id.startsWith('box-tesouro') && !b.id.startsWith('box-viagem') && !b.id.startsWith('box-passeios') && !b.id.startsWith('box-carro') && !b.id.startsWith('box-notebook') && !b.id.startsWith('box-fiis') && !b.id.startsWith('box-acoes'));
    }
    return INITIAL_BOXES;
  });
  const [paidBills, setPaidBills] = useState<CardBillPayment[]>(() => loadCachedState(STORAGE_KEYS.PAID_BILLS, []));
  const [driverTrips, setDriverTrips] = useState<DriverTrip[]>(() => loadCachedState(STORAGE_KEYS.DRIVER_TRIPS, INITIAL_DRIVER_TRIPS));
  const [driverExpenses, setDriverExpenses] = useState<DriverExpense[]>(() => loadCachedState(STORAGE_KEYS.DRIVER_EXPENSES, INITIAL_DRIVER_EXPENSES));
  const [driverGoals, setDriverGoals] = useState<DriverGoals>(() => loadCachedState(STORAGE_KEYS.DRIVER_GOALS, INITIAL_DRIVER_GOALS));
  const [extraProfile, setExtraProfile] = useState<ExtraProfileConfig>(() => loadCachedState(STORAGE_KEYS.EXTRA_PROFILE, INITIAL_EXTRA_PROFILE));
  const [freelanceEntries, setFreelanceEntries] = useState<FreelanceEntry[]>(() => loadCachedState(STORAGE_KEYS.FREELANCE_ENTRIES, INITIAL_FREELANCE_ENTRIES));
  const [freelanceExpenses, setFreelanceExpenses] = useState<FreelanceExpense[]>(() => loadCachedState(STORAGE_KEYS.FREELANCE_EXPENSES, INITIAL_FREELANCE_EXPENSES));
  const [freelanceGoals, setFreelanceGoals] = useState<FreelanceGoals>(() => loadCachedState(STORAGE_KEYS.FREELANCE_GOALS, INITIAL_FREELANCE_GOALS));

  const [isAddFreelanceEntryOpen, setIsAddFreelanceEntryOpen] = useState(false);
  const [editingFreelanceEntry, setEditingFreelanceEntry] = useState<FreelanceEntry | null>(null);
  const [isAddFreelanceExpenseOpen, setIsAddFreelanceExpenseOpen] = useState(false);
  const [editingFreelanceExpense, setEditingFreelanceExpense] = useState<FreelanceExpense | null>(null);
  const [isFreelanceGoalsOpen, setIsFreelanceGoalsOpen] = useState(false);

  // Subscriptions State
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(() => loadCachedState(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS));

  const [isAddSubscriptionOpen, setIsAddSubscriptionOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<SubscriptionItem | null>(null);

  // Wallet / Bank Accounts & Balances State
  const [walletAccounts, setWalletAccounts] = useState<WalletAccount[]>(() => loadCachedState(STORAGE_KEYS.WALLET_ACCOUNTS, INITIAL_WALLET_ACCOUNTS));
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(() => loadCachedState(STORAGE_KEYS.WALLET_TRANSACTIONS, INITIAL_WALLET_TRANSACTIONS));

  const [isAddWalletAccountOpen, setIsAddWalletAccountOpen] = useState(false);
  const [editingWalletAccount, setEditingWalletAccount] = useState<WalletAccount | null>(null);
  const [isAddWalletTransactionOpen, setIsAddWalletTransactionOpen] = useState(false);
  const [walletTransactionMode, setWalletTransactionMode] = useState<'expense' | 'income' | 'transfer' | 'adjust'>('expense');
  const [walletPreselectedAccountId, setWalletPreselectedAccountId] = useState<string | undefined>(undefined);

  // Savings & Financial Goals State
  const [monthlyTargets, setMonthlyTargets] = useState<Record<string, MonthlySavingsTarget>>(() => {
    const cached = loadCachedState<Record<string, MonthlySavingsTarget>>(STORAGE_KEYS.MONTHLY_TARGETS, INITIAL_MONTHLY_TARGETS);
    return (cached && typeof cached === 'object') ? cached : {};
  });
  const [accumulationGoals, setAccumulationGoals] = useState<AccumulationGoal[]>(() => {
    const cached = loadCachedState<AccumulationGoal[]>(STORAGE_KEYS.ACCUMULATION_GOALS, INITIAL_ACCUMULATION_GOALS);
    if (Array.isArray(cached)) {
      return cached.filter(g => g.id !== 'goal-reserva' && g.id !== 'goal-viagem');
    }
    return [];
  });

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadCachedState(STORAGE_KEYS.PROFILE, {}));

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLegalTermsOpen, setIsLegalTermsOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const isOnline = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // App Lock & PIN Setup State: only lock if user explicitly configured and enabled appLock in profile
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const cachedProfile = loadCachedState<UserProfile>(STORAGE_KEYS.PROFILE, {});
      if (cachedProfile.appLockEnabled && (cachedProfile.appLockPin || cachedProfile.useBiometrics)) {
        return true;
      }
    } catch {
      // fallback
    }
    return false;
  });
  const [isPinSetupOpen, setIsPinSetupOpen] = useState(false);
  const lastActiveRef = useRef<number>(Date.now());

  useEffect(() => {
    // Only lock if appLockEnabled is true and credentials exist
    if (dataLoadedFromCloud && currentUser && loadedUidRef.current === currentUser.uid) {
      if (userProfile.appLockEnabled && (userProfile.appLockPin || userProfile.useBiometrics)) {
        setIsLocked(true);
      }
    }
  }, [dataLoadedFromCloud, userProfile.appLockEnabled, userProfile.useBiometrics, userProfile.appLockPin, currentUser]);

  const handleCompletePinSetup = (hashedPin: string, useBiometrics?: boolean, photoSample?: string, credentialId?: string) => {
    if (currentUser?.uid) {
      localStorage.setItem(`gasto_pin_skipped_${currentUser.uid}`, 'false');
    }
    const email = currentUser?.email || userProfile.email;
    if (email) {
      localStorage.setItem(`gasto_app_pin_${email}`, hashedPin);
    } else {
      localStorage.setItem('gasto_app_pin', hashedPin);
    }

    const updatedProfile: UserProfile = {
      ...userProfile,
      appLockEnabled: true,
      appLockPin: hashedPin,
      pinSetupSkipped: false,
      useBiometrics: useBiometrics !== undefined ? useBiometrics : true,
      biometricCredentialRegistered: useBiometrics !== false,
      biometricRegisteredAt: useBiometrics !== false ? new Date().toISOString() : undefined,
      biometricPhotoSample: photoSample || userProfile.biometricPhotoSample,
      webauthnCredentialId: credentialId || userProfile.webauthnCredentialId,
    };
    setUserProfile(updatedProfile);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updatedProfile));
    handleSaveProfile(updatedProfile, false).catch((err) => {
      console.warn('Background save profile pin notice:', err);
    });
  };

  const handleSkipPinSetup = () => {
    // 1. Immediately close modal and disable re-prompt
    setIsPinSetupOpen(false);

    // 2. Immediately mark as skipped in local storage (both per-uid and global fallback)
    if (currentUser?.uid) {
      localStorage.setItem(`gasto_pin_skipped_${currentUser.uid}`, 'true');
    }
    localStorage.setItem('gasto_pin_skipped_global', 'true');

    // 3. Update memory state immediately
    const updatedProfile: UserProfile = {
      ...userProfile,
      pinSetupSkipped: true,
    };
    setUserProfile(updatedProfile);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updatedProfile));

    // 4. Save to Firestore in background without blocking UI
    handleSaveProfile(updatedProfile, false).catch((err) => {
      console.warn('Background skip profile save notice:', err);
    });
  };

  const handleUpdatePinFromLock = async (newHashedPin: string) => {
    const email = currentUser?.email || userProfile.email;
    if (email) {
      localStorage.setItem(`gasto_app_pin_${email}`, newHashedPin);
    } else {
      localStorage.setItem('gasto_app_pin', newHashedPin);
    }

    const updatedProfile: UserProfile = {
      ...userProfile,
      appLockEnabled: true,
      appLockPin: newHashedPin,
    };
    setUserProfile(updatedProfile);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updatedProfile));
    await handleSaveProfile(updatedProfile, false);
  };

  // Immediate lock on minimize / app switch (PWA / Mobile / Desktop)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isLockConfigured = Boolean(
        userProfile.appLockEnabled || 
        userProfile.useBiometrics || 
        userProfile.appLockPin
      );

      if (document.hidden) {
        lastActiveRef.current = Date.now();
        if (isLockConfigured) {
          setIsLocked(true);
        }
      } else {
        if (isLockConfigured) {
          setIsLocked(true);
        }
      }
    };

    const handlePageHide = () => {
      const isLockConfigured = Boolean(
        userProfile.appLockEnabled || 
        userProfile.useBiometrics || 
        userProfile.appLockPin
      );
      if (isLockConfigured) {
        setIsLocked(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [userProfile.appLockEnabled, userProfile.useBiometrics, userProfile.appLockPin]);

  // Onboarding Tutorial State
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // Handle PWA shortcut actions (?action=new_expense or ?tab=cards)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');
      const tabParam = urlParams.get('tab');
      if (tabParam === 'cards' || tabParam === 'cartoes') {
        setActiveTab('cartoes');
      } else if (tabParam === 'investments' || tabParam === 'investimentos') {
        setActiveTab('investimentos');
      }
      if (action === 'new_expense') {
        handleOpenAddExpenseWithDefaults();
      }
      if (action || tabParam) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {
      // ignore
    }
  }, []);

  // Global swipe-to-back gesture handler
  const globalTouchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [globalSwipeOffset, setGlobalSwipeOffset] = useState<number>(0);
  const [isGlobalSwiping, setIsGlobalSwiping] = useState(false);

  const handleGlobalTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const clientX = e.touches[0].clientX;
    if (clientX > 55) return;

    globalTouchStartRef.current = {
      x: clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  };

  const handleGlobalTouchMove = (e: React.TouchEvent) => {
    if (!globalTouchStartRef.current || e.touches.length !== 1) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - globalTouchStartRef.current.x;
    const deltaY = currentY - globalTouchStartRef.current.y;

    if (deltaX > 12 && deltaX > Math.abs(deltaY) * 1.2) {
      setIsGlobalSwiping(true);
      const maxDrag = typeof window !== 'undefined' ? window.innerWidth : 400;
      const damped = Math.min(maxDrag * 0.75, deltaX);
      setGlobalSwipeOffset(damped);
    }
  };

  const handleGlobalTouchEnd = (e: React.TouchEvent) => {
    if (!globalTouchStartRef.current) {
      setGlobalSwipeOffset(0);
      setIsGlobalSwiping(false);
      return;
    }

    const currentX = e.changedTouches[0]?.clientX ?? 0;
    const currentY = e.changedTouches[0]?.clientY ?? 0;
    const deltaX = currentX - globalTouchStartRef.current.x;
    const deltaY = currentY - globalTouchStartRef.current.y;
    const duration = Date.now() - globalTouchStartRef.current.time;
    const isQuickFlick = deltaX > 45 && duration < 280 && deltaX > Math.abs(deltaY);
    const isPassedThreshold = deltaX > 80;

    if (isQuickFlick || isPassedThreshold) {
      triggerHaptic(12);
      if (isAddExpenseOpen) setIsAddExpenseOpen(false);
      else if (isAddIncomeOpen) setIsAddIncomeOpen(false);
      else if (isAddSubscriptionOpen) setIsAddSubscriptionOpen(false);
      else if (isAddPersonOpen) setIsAddPersonOpen(false);
      else if (isAddCardOpen) setIsAddCardOpen(false);
      else if (isAddFolderOpen) setIsAddFolderOpen(false);
      else if (isAddBoxOpen) setIsAddBoxOpen(false);
      else if (isDepositWithdrawOpen) setIsDepositWithdrawOpen(false);
      else if (isExportOpen) setIsExportOpen(false);
      else if (isLegalTermsOpen) setIsLegalTermsOpen(false);
      else if (isDeleteAccountModalOpen) setIsDeleteAccountModalOpen(false);
      else if (isTutorialOpen) setIsTutorialOpen(false);
      else if (isProfileModalOpen) setIsProfileModalOpen(false);
      else if (isAddWalletAccountOpen) setIsAddWalletAccountOpen(false);
      else if (isAddWalletTransactionOpen) setIsAddWalletTransactionOpen(false);
      else if (isAddFreelanceEntryOpen) setIsAddFreelanceEntryOpen(false);
      else if (isAddFreelanceExpenseOpen) setIsAddFreelanceExpenseOpen(false);
      else if (isFreelanceGoalsOpen) setIsFreelanceGoalsOpen(false);
      else if (activeTab !== 'dashboard') {
        handleTabChange('dashboard');
      }
    }

    setGlobalSwipeOffset(0);
    setIsGlobalSwiping(false);
    globalTouchStartRef.current = null;
  };
  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('gasto_balance_visible');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const handleToggleBalance = () => {
    setIsBalanceVisible(prev => {
      const next = !prev;
      try {
        localStorage.setItem('gasto_balance_visible', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const isApplyingRemoteUpdateRef = useRef(false);
  const latestSyncPayloadRef = useRef<any>(null);
  const syncTimeoutRef = useRef<any>(null);

  // Instant write to Firestore with retry and sanitize
  const flushSyncToFirestore = async (overridePayload?: any) => {
    if (!currentUser) return;
    const targetUid = currentUser.uid;
    const payload = overridePayload || latestSyncPayloadRef.current;
    if (!payload) return;

    try {
      const userDocRef = doc(db, 'users', targetUid);
      await setDoc(userDocRef, sanitizeForFirestore({
        ...payload,
        updatedAt: new Date().toISOString(),
      }), { merge: true });
      setIsSyncing(false);
      setLastSyncedAt(new Date());
    } catch (err) {
      console.warn('Firestore direct sync notice:', err);
      setIsSyncing(false);
    }
  };

  // Setup Real-time Firestore Sync & Local Storage Hydration
  useEffect(() => {
    if (!currentUser) {
      setDataLoadedFromCloud(false);
      loadedUidRef.current = null;
      setIsLocked(false);
      setIsPinSetupOpen(false);
      return;
    }

    const targetUid = currentUser.uid;
    const isMaster = currentUser.email?.toLowerCase() === MASTER_ACCOUNT_EMAIL.toLowerCase();
    const userKeyPrefix = `user_${targetUid}_`;

    const authUser = auth.currentUser || ('providerData' in currentUser ? currentUser : null);
    const gName = authUser?.displayName || authUser?.providerData?.[0]?.displayName || currentUser?.displayName;
    const gEmail = authUser?.email || authUser?.providerData?.[0]?.email || currentUser?.email;
    const gPhoto = authUser?.photoURL || authUser?.providerData?.[0]?.photoURL || currentUser?.photoURL;
    const gPhone = authUser?.phoneNumber || authUser?.providerData?.[0]?.phoneNumber || ('phoneNumber' in currentUser ? (currentUser as { phoneNumber?: string }).phoneNumber : undefined);

    const initialProf: UserProfile = {
      name: gName || undefined,
      nickname: gName || undefined,
      email: gEmail || undefined,
      photoURL: gPhoto || undefined,
      photoSource: gPhoto ? 'google' : undefined,
      phone: gPhone || undefined,
    };

    // 1. FAST PATH: Instant local hydration (0ms delay) from localStorage if present
    let hasLocalData = false;
    try {
      const cachedProfileStr = localStorage.getItem(userKeyPrefix + STORAGE_KEYS.PROFILE);
      const cachedExpensesStr = localStorage.getItem(userKeyPrefix + STORAGE_KEYS.EXPENSES);
      if (cachedProfileStr !== null || cachedExpensesStr !== null) {
        hasLocalData = true;
        if (cachedExpensesStr) setExpenses(JSON.parse(cachedExpensesStr));
        const cIncomes = localStorage.getItem(userKeyPrefix + STORAGE_KEYS.INCOMES);
        if (cIncomes) setIncomes(JSON.parse(cIncomes));
        const cCards = localStorage.getItem(userKeyPrefix + STORAGE_KEYS.CARDS);
        if (cCards) setCards(JSON.parse(cCards));
        const cPeople = localStorage.getItem(userKeyPrefix + STORAGE_KEYS.PEOPLE);
        if (cPeople) setPeople(JSON.parse(cPeople));
        const cFolders = localStorage.getItem(userKeyPrefix + STORAGE_KEYS.FOLDERS);
        if (cFolders) setFolders(JSON.parse(cFolders));
        const cBoxes = localStorage.getItem(userKeyPrefix + STORAGE_KEYS.BOXES);
        if (cBoxes) setBoxes(JSON.parse(cBoxes));
        const cPaidBills = localStorage.getItem(userKeyPrefix + STORAGE_KEYS.PAID_BILLS);
        if (cPaidBills) setPaidBills(JSON.parse(cPaidBills));
        const cSubs = localStorage.getItem(userKeyPrefix + STORAGE_KEYS.SUBSCRIPTIONS);
        if (cSubs) setSubscriptions(JSON.parse(cSubs));
        const cDriverTrips = localStorage.getItem(userKeyPrefix + STORAGE_KEYS.DRIVER_TRIPS);
        if (cDriverTrips) setDriverTrips(JSON.parse(cDriverTrips));
        const cDriverExp = localStorage.getItem(userKeyPrefix + STORAGE_KEYS.DRIVER_EXPENSES);
        if (cDriverExp) setDriverExpenses(JSON.parse(cDriverExp));
        const cDriverGoals = localStorage.getItem(userKeyPrefix + STORAGE_KEYS.DRIVER_GOALS);
        if (cDriverGoals) setDriverGoals(JSON.parse(cDriverGoals));
        const cExtra = localStorage.getItem(userKeyPrefix + STORAGE_KEYS.EXTRA_PROFILE);
        if (cExtra) setExtraProfile(JSON.parse(cExtra));
        const cFreelanceEntries = localStorage.getItem(userKeyPrefix + STORAGE_KEYS.FREELANCE_ENTRIES);
        if (cFreelanceEntries) setFreelanceEntries(JSON.parse(cFreelanceEntries));
        const cFreelanceExp = localStorage.getItem(userKeyPrefix + STORAGE_KEYS.FREELANCE_EXPENSES);
        if (cFreelanceExp) setFreelanceExpenses(JSON.parse(cFreelanceExp));
        const cFreelanceGoals = localStorage.getItem(userKeyPrefix + STORAGE_KEYS.FREELANCE_GOALS);
        if (cFreelanceGoals) setFreelanceGoals(JSON.parse(cFreelanceGoals));
        const cWalletAccounts = localStorage.getItem(userKeyPrefix + STORAGE_KEYS.WALLET_ACCOUNTS);
        if (cWalletAccounts) setWalletAccounts(JSON.parse(cWalletAccounts));
        const cWalletTx = localStorage.getItem(userKeyPrefix + STORAGE_KEYS.WALLET_TRANSACTIONS);
        if (cWalletTx) setWalletTransactions(JSON.parse(cWalletTx));
        const cMonthlyTargets = localStorage.getItem(userKeyPrefix + STORAGE_KEYS.MONTHLY_TARGETS);
        if (cMonthlyTargets) {
          try { setMonthlyTargets(JSON.parse(cMonthlyTargets)); } catch {}
        }
        const cAccGoals = localStorage.getItem(userKeyPrefix + STORAGE_KEYS.ACCUMULATION_GOALS);
        if (cAccGoals) {
          try {
            const parsed = JSON.parse(cAccGoals);
            if (Array.isArray(parsed)) {
              setAccumulationGoals(parsed.filter((g: AccumulationGoal) => g.id !== 'goal-reserva' && g.id !== 'goal-viagem'));
            }
          } catch {}
        }
        if (cachedProfileStr) {
          setUserProfile(JSON.parse(cachedProfileStr));
        } else {
          setUserProfile(initialProf);
        }

        loadedUidRef.current = targetUid;
        setDataLoadedFromCloud(true);
        isInitialLoadRef.current = false;
      }
    } catch (e) {
      console.warn('Local cache hydration notice:', e);
    }

    // 2. REAL-TIME FIRESTORE SUBSCRIPTION: Seamless sync between Browser, PWA & Multiple Tabs
    let isMounted = true;
    const userDocRef = doc(db, 'users', targetUid);

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (!isMounted) return;

      if (docSnap.exists()) {
        const data = docSnap.data();
        isApplyingRemoteUpdateRef.current = true;

        if (Array.isArray(data.expenses)) {
          setExpenses(data.expenses);
          try { localStorage.setItem(userKeyPrefix + STORAGE_KEYS.EXPENSES, JSON.stringify(data.expenses)); } catch {}
        }
        if (Array.isArray(data.incomes)) {
          setIncomes(data.incomes);
          try { localStorage.setItem(userKeyPrefix + STORAGE_KEYS.INCOMES, JSON.stringify(data.incomes)); } catch {}
        }
        if (Array.isArray(data.cards)) {
          setCards(data.cards);
          try { localStorage.setItem(userKeyPrefix + STORAGE_KEYS.CARDS, JSON.stringify(data.cards)); } catch {}
        }
        if (Array.isArray(data.people)) {
          setPeople(data.people);
          try { localStorage.setItem(userKeyPrefix + STORAGE_KEYS.PEOPLE, JSON.stringify(data.people)); } catch {}
        }
        if (Array.isArray(data.folders)) {
          setFolders(data.folders);
          try { localStorage.setItem(userKeyPrefix + STORAGE_KEYS.FOLDERS, JSON.stringify(data.folders)); } catch {}
        }
        if (Array.isArray(data.boxes)) {
          const rawBoxes: InvestmentBox[] = data.boxes;
          const cleanedBoxes = rawBoxes.filter(b => !b.id.startsWith('box-nu-reserva') && !b.id.startsWith('box-tesouro') && !b.id.startsWith('box-viagem') && !b.id.startsWith('box-passeios') && !b.id.startsWith('box-carro') && !b.id.startsWith('box-notebook') && !b.id.startsWith('box-fiis') && !b.id.startsWith('box-acoes'));
          setBoxes(cleanedBoxes);
          try { localStorage.setItem(userKeyPrefix + STORAGE_KEYS.BOXES, JSON.stringify(cleanedBoxes)); } catch {}
        }
        if (Array.isArray(data.paidBills)) {
          setPaidBills(data.paidBills);
          try { localStorage.setItem(userKeyPrefix + STORAGE_KEYS.PAID_BILLS, JSON.stringify(data.paidBills)); } catch {}
        }
        if (Array.isArray(data.subscriptions)) {
          setSubscriptions(data.subscriptions);
          try { localStorage.setItem(userKeyPrefix + STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(data.subscriptions)); } catch {}
        }
        if (Array.isArray(data.driverTrips)) {
          setDriverTrips(data.driverTrips);
          try { localStorage.setItem(userKeyPrefix + STORAGE_KEYS.DRIVER_TRIPS, JSON.stringify(data.driverTrips)); } catch {}
        }
        if (Array.isArray(data.driverExpenses)) {
          setDriverExpenses(data.driverExpenses);
          try { localStorage.setItem(userKeyPrefix + STORAGE_KEYS.DRIVER_EXPENSES, JSON.stringify(data.driverExpenses)); } catch {}
        }
        if (data.driverGoals) {
          setDriverGoals(data.driverGoals);
          try { localStorage.setItem(userKeyPrefix + STORAGE_KEYS.DRIVER_GOALS, JSON.stringify(data.driverGoals)); } catch {}
        }
        if (data.extraProfile) {
          setExtraProfile(data.extraProfile);
          try { localStorage.setItem(userKeyPrefix + STORAGE_KEYS.EXTRA_PROFILE, JSON.stringify(data.extraProfile)); } catch {}
        }
        if (Array.isArray(data.freelanceEntries)) {
          setFreelanceEntries(data.freelanceEntries);
          try { localStorage.setItem(userKeyPrefix + STORAGE_KEYS.FREELANCE_ENTRIES, JSON.stringify(data.freelanceEntries)); } catch {}
        }
        if (Array.isArray(data.freelanceExpenses)) {
          setFreelanceExpenses(data.freelanceExpenses);
          try { localStorage.setItem(userKeyPrefix + STORAGE_KEYS.FREELANCE_EXPENSES, JSON.stringify(data.freelanceExpenses)); } catch {}
        }
        if (data.freelanceGoals) {
          setFreelanceGoals(data.freelanceGoals);
          try { localStorage.setItem(userKeyPrefix + STORAGE_KEYS.FREELANCE_GOALS, JSON.stringify(data.freelanceGoals)); } catch {}
        }
        if (Array.isArray(data.walletAccounts)) {
          setWalletAccounts(data.walletAccounts);
          try { localStorage.setItem(userKeyPrefix + STORAGE_KEYS.WALLET_ACCOUNTS, JSON.stringify(data.walletAccounts)); } catch {}
        }
        if (Array.isArray(data.walletTransactions)) {
          setWalletTransactions(data.walletTransactions);
          try { localStorage.setItem(userKeyPrefix + STORAGE_KEYS.WALLET_TRANSACTIONS, JSON.stringify(data.walletTransactions)); } catch {}
        }
        if (data.monthlyTargets && typeof data.monthlyTargets === 'object') {
          setMonthlyTargets(data.monthlyTargets);
          try {
            localStorage.setItem(userKeyPrefix + STORAGE_KEYS.MONTHLY_TARGETS, JSON.stringify(data.monthlyTargets));
            localStorage.setItem(STORAGE_KEYS.MONTHLY_TARGETS, JSON.stringify(data.monthlyTargets));
          } catch {}
        }
        if (Array.isArray(data.accumulationGoals)) {
          const cleanedGoals = data.accumulationGoals.filter((g: AccumulationGoal) => g.id !== 'goal-reserva' && g.id !== 'goal-viagem');
          setAccumulationGoals(cleanedGoals);
          try {
            localStorage.setItem(userKeyPrefix + STORAGE_KEYS.ACCUMULATION_GOALS, JSON.stringify(cleanedGoals));
            localStorage.setItem(STORAGE_KEYS.ACCUMULATION_GOALS, JSON.stringify(cleanedGoals));
          } catch {}
        }

        if (data.profile) {
          const isPlaceholderName = data.profile.name === 'Usuário Google';
          const isPlaceholderEmail = data.profile.email === 'usuario.google@gmail.com';

          const resolvedName = (!isPlaceholderName && data.profile.name) ? data.profile.name : (gName || data.profile.name || undefined);
          const resolvedNickname = (!isPlaceholderName && data.profile.nickname) ? data.profile.nickname : (gName || data.profile.nickname || undefined);
          const resolvedEmail = (!isPlaceholderEmail && data.profile.email) ? data.profile.email : (gEmail || data.profile.email || undefined);
          const resolvedPhoto = data.profile.photoURL || gPhoto || undefined;

          const isSkippedLocal = localStorage.getItem(`gasto_pin_skipped_${targetUid}`) === 'true' || localStorage.getItem('gasto_pin_skipped_global') === 'true';

          const mergedProfile: UserProfile = {
            name: resolvedName,
            nickname: resolvedNickname,
            email: resolvedEmail,
            photoURL: resolvedPhoto,
            photoSource: data.profile.photoSource || (resolvedPhoto ? 'google' : undefined),
            phone: data.profile.phone || gPhone || undefined,
            ...data.profile,
            pinSetupSkipped: (data.profile && typeof data.profile.pinSetupSkipped === 'boolean') ? data.profile.pinSetupSkipped : (isSkippedLocal || false),
            ...(isPlaceholderName && gName ? { name: gName, nickname: gName } : {}),
            ...(isPlaceholderEmail && gEmail ? { email: gEmail } : {}),
          };
          setUserProfile(mergedProfile);
          try { localStorage.setItem(userKeyPrefix + STORAGE_KEYS.PROFILE, JSON.stringify(mergedProfile)); } catch {}
        }

        loadedUidRef.current = targetUid;
        setDataLoadedFromCloud(true);
        isInitialLoadRef.current = false;
        setTimeout(() => { isApplyingRemoteUpdateRef.current = false; }, 150);
      } else if (!docSnap.exists() && !docSnap.metadata.fromCache) {
        // First time initialization in Firestore
        const defaultSelfName = gName ? `Meu (${gName})` : 'Meu';
        const initialPeople: Person[] = [
          { id: 'person-me', name: defaultSelfName, avatarBg: 'bg-emerald-600', isSelf: true }
        ];
        const initialFolders: InvestmentFolder[] = [
          { id: 'folder-reserva', name: 'Reserva de Emergência', color: '#10B981', icon: 'shield', description: 'Segurança financeira' },
          { id: 'folder-sonhos', name: 'Metas & Sonhos', color: '#3B82F6', icon: 'sparkles', description: 'Conquistas futuras' }
        ];
        const initialExp = isMaster ? INITIAL_EXPENSES : [];
        const initialInc = isMaster ? INITIAL_INCOMES : [];
        const initialCds = isMaster ? INITIAL_CARDS : [];
        const initialBxs = isMaster ? INITIAL_BOXES : [];

        setExpenses(initialExp);
        setIncomes(initialInc);
        setCards(initialCds);
        setPeople(isMaster ? INITIAL_PEOPLE : initialPeople);
        setFolders(initialFolders);
        setBoxes(initialBxs);
        setPaidBills([]);
        setSubscriptions(INITIAL_SUBSCRIPTIONS);
        setDriverTrips(INITIAL_DRIVER_TRIPS);
        setDriverExpenses(INITIAL_DRIVER_EXPENSES);
        setDriverGoals(INITIAL_DRIVER_GOALS);
        setExtraProfile(INITIAL_EXTRA_PROFILE);
        setFreelanceEntries(INITIAL_FREELANCE_ENTRIES);
        setFreelanceExpenses(INITIAL_FREELANCE_EXPENSES);
        setFreelanceGoals(INITIAL_FREELANCE_GOALS);
        setWalletAccounts(INITIAL_WALLET_ACCOUNTS);
        setWalletTransactions(INITIAL_WALLET_TRANSACTIONS);
        setMonthlyTargets(INITIAL_MONTHLY_TARGETS);
        setAccumulationGoals(INITIAL_ACCUMULATION_GOALS);
        setUserProfile(initialProf);
        try { localStorage.setItem(userKeyPrefix + STORAGE_KEYS.PROFILE, JSON.stringify(initialProf)); } catch {}

        if (!isMaster) {
          setIsTutorialOpen(true);
        }

        setDoc(userDocRef, sanitizeForFirestore({
          expenses: initialExp,
          incomes: initialInc,
          cards: initialCds,
          people: isMaster ? INITIAL_PEOPLE : initialPeople,
          folders: initialFolders,
          boxes: initialBxs,
          paidBills: [],
          subscriptions: INITIAL_SUBSCRIPTIONS,
          driverTrips: INITIAL_DRIVER_TRIPS,
          driverExpenses: INITIAL_DRIVER_EXPENSES,
          driverGoals: INITIAL_DRIVER_GOALS,
          extraProfile: INITIAL_EXTRA_PROFILE,
          freelanceEntries: INITIAL_FREELANCE_ENTRIES,
          freelanceExpenses: INITIAL_FREELANCE_EXPENSES,
          freelanceGoals: INITIAL_FREELANCE_GOALS,
          walletAccounts: INITIAL_WALLET_ACCOUNTS,
          walletTransactions: INITIAL_WALLET_TRANSACTIONS,
          monthlyTargets: INITIAL_MONTHLY_TARGETS,
          accumulationGoals: INITIAL_ACCUMULATION_GOALS,
          profile: initialProf,
          updatedAt: new Date().toISOString(),
        }), { merge: true }).catch(err => console.warn('Background setDoc notice:', err));

        loadedUidRef.current = targetUid;
        setDataLoadedFromCloud(true);
        isInitialLoadRef.current = false;
      }
    }, (error) => {
      console.warn('Firestore real-time subscription notice:', error);
      if (hasLocalData && isMounted) {
        loadedUidRef.current = targetUid;
        setDataLoadedFromCloud(true);
        isInitialLoadRef.current = false;
      } else {
        getDoc(userDocRef).then((docSnap) => {
          if (docSnap.exists() && isMounted) {
            const data = docSnap.data();
            if (Array.isArray(data.expenses)) setExpenses(data.expenses);
            if (Array.isArray(data.incomes)) setIncomes(data.incomes);
            if (Array.isArray(data.cards)) setCards(data.cards);
            if (Array.isArray(data.people)) setPeople(data.people);
            if (Array.isArray(data.folders)) setFolders(data.folders);
            if (Array.isArray(data.boxes)) setBoxes(data.boxes);
            if (data.profile) setUserProfile(data.profile);
            if (Array.isArray(data.accumulationGoals)) {
              const cleanedGoals = data.accumulationGoals.filter((g: AccumulationGoal) => g.id !== 'goal-reserva' && g.id !== 'goal-viagem');
              setAccumulationGoals(cleanedGoals);
            }
            if (data.monthlyTargets && typeof data.monthlyTargets === 'object') {
              setMonthlyTargets(data.monthlyTargets);
            }
            loadedUidRef.current = targetUid;
            setDataLoadedFromCloud(true);
            isInitialLoadRef.current = false;
          }
        }).catch(() => {});
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [currentUser]);

  // Migração automática de histórico legado de caixinhas para subcoleção Firestore
  useEffect(() => {
    if (!dataLoadedFromCloud || !currentUser?.uid) return;
    
    // Migra histórico de caixinhas que ainda têm dados no campo legado
    boxes.forEach(box => {
      if (box.history && box.history.length > 0) {
        migrateBoxHistoryIfNeeded(currentUser.uid, box.id, box.history)
          .catch(err => console.warn('Migration notice:', err));
      }
    });
  }, [dataLoadedFromCloud, currentUser?.uid]);

  // Sync to Firestore & localStorage when data changes
  useEffect(() => {
    if (!currentUser || !dataLoadedFromCloud || loadedUidRef.current !== currentUser.uid || isApplyingRemoteUpdateRef.current) {
      return;
    }

    const userKeyPrefix = `user_${currentUser.uid}_`;
    try {
      localStorage.setItem(userKeyPrefix + STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
      localStorage.setItem(userKeyPrefix + STORAGE_KEYS.INCOMES, JSON.stringify(incomes));
      localStorage.setItem(userKeyPrefix + STORAGE_KEYS.BOXES, JSON.stringify(boxes));
      localStorage.setItem(userKeyPrefix + STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
      localStorage.setItem(userKeyPrefix + STORAGE_KEYS.PAID_BILLS, JSON.stringify(paidBills));
      localStorage.setItem(userKeyPrefix + STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
      localStorage.setItem(userKeyPrefix + STORAGE_KEYS.DRIVER_TRIPS, JSON.stringify(driverTrips));
      localStorage.setItem(userKeyPrefix + STORAGE_KEYS.DRIVER_EXPENSES, JSON.stringify(driverExpenses));
      localStorage.setItem(userKeyPrefix + STORAGE_KEYS.DRIVER_GOALS, JSON.stringify(driverGoals));
      localStorage.setItem(userKeyPrefix + STORAGE_KEYS.EXTRA_PROFILE, JSON.stringify(extraProfile));
      localStorage.setItem(userKeyPrefix + STORAGE_KEYS.FREELANCE_ENTRIES, JSON.stringify(freelanceEntries));
      localStorage.setItem(userKeyPrefix + STORAGE_KEYS.FREELANCE_EXPENSES, JSON.stringify(freelanceExpenses));
      localStorage.setItem(userKeyPrefix + STORAGE_KEYS.FREELANCE_GOALS, JSON.stringify(freelanceGoals));
      localStorage.setItem(userKeyPrefix + STORAGE_KEYS.WALLET_ACCOUNTS, JSON.stringify(walletAccounts));
      localStorage.setItem(userKeyPrefix + STORAGE_KEYS.WALLET_TRANSACTIONS, JSON.stringify(walletTransactions));
      localStorage.setItem(userKeyPrefix + STORAGE_KEYS.MONTHLY_TARGETS, JSON.stringify(monthlyTargets));
      localStorage.setItem(userKeyPrefix + STORAGE_KEYS.ACCUMULATION_GOALS, JSON.stringify(accumulationGoals));
      localStorage.setItem(userKeyPrefix + STORAGE_KEYS.CARDS, JSON.stringify(cards));
      localStorage.setItem(userKeyPrefix + STORAGE_KEYS.PEOPLE, JSON.stringify(people));
    } catch (storageErr) {
      console.warn('LocalStorage write notice (quota or restricted):', storageErr);
    }

    const boxesWithoutHistory = boxes.map(({ history: _history, ...box }) => box);
    const syncPayload = {
      expenses,
      incomes,
      cards,
      people,
      folders,
      boxes: boxesWithoutHistory,
      paidBills,
      subscriptions,
      driverTrips,
      driverExpenses,
      driverGoals,
      extraProfile,
      freelanceEntries,
      freelanceExpenses,
      freelanceGoals,
      walletAccounts,
      walletTransactions,
      monthlyTargets,
      accumulationGoals,
    };
    latestSyncPayloadRef.current = syncPayload;

    setIsSyncing(true);

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, sanitizeForFirestore({
          ...syncPayload,
          updatedAt: new Date().toISOString(),
        }), { merge: true });

        setIsSyncing(false);
        setLastSyncedAt(new Date());
      } catch (e) {
        console.warn('Firestore sync notice:', e);
        setIsSyncing(false);
      }
    }, 1500);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [expenses, incomes, cards, people, folders, boxes, paidBills, subscriptions,
      driverTrips, driverExpenses, driverGoals, extraProfile, freelanceEntries,
      freelanceExpenses, freelanceGoals, walletAccounts, walletTransactions,
      monthlyTargets, accumulationGoals, currentUser, dataLoadedFromCloud]);

  // Flush pending changes to Firestore immediately on exit, tab close, or app minimize
  useEffect(() => {
    const handleFlush = () => {
      if (latestSyncPayloadRef.current && currentUser) {
        flushSyncToFirestore();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleFlush();
      }
    };

    window.addEventListener('beforeunload', handleFlush);
    window.addEventListener('pagehide', handleFlush);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleFlush);
      window.removeEventListener('pagehide', handleFlush);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser]);

  const handleManualRefresh = async () => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.expenses)) setExpenses(data.expenses);
        if (Array.isArray(data.incomes)) setIncomes(data.incomes);
        if (Array.isArray(data.cards)) setCards(data.cards);
        if (Array.isArray(data.people)) setPeople(data.people);
        if (Array.isArray(data.folders)) setFolders(data.folders);
        if (Array.isArray(data.boxes)) {
          const rawBoxes: InvestmentBox[] = data.boxes;
          const cleanedBoxes = rawBoxes.filter(b => !b.id.startsWith('box-nu-reserva') && !b.id.startsWith('box-tesouro') && !b.id.startsWith('box-viagem') && !b.id.startsWith('box-passeios') && !b.id.startsWith('box-carro') && !b.id.startsWith('box-notebook') && !b.id.startsWith('box-fiis') && !b.id.startsWith('box-acoes'));
          setBoxes(cleanedBoxes);
        }
        if (Array.isArray(data.accumulationGoals)) {
          const cleanedGoals = data.accumulationGoals.filter((g: AccumulationGoal) => g.id !== 'goal-reserva' && g.id !== 'goal-viagem');
          setAccumulationGoals(cleanedGoals);
        }
        if (data.monthlyTargets && typeof data.monthlyTargets === 'object') {
          setMonthlyTargets(data.monthlyTargets);
        }
      }
    } catch (e) {
      console.warn('Manual refresh notice:', e);
    }
  };

  // Modal States
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [defaultPersonId, setDefaultPersonId] = useState<string | undefined>(undefined);
  const [defaultCardId, setDefaultCardId] = useState<string | undefined>(undefined);

  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Investment Modals State
  const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<InvestmentFolder | null>(null);

  const [isAddBoxOpen, setIsAddBoxOpen] = useState(false);
  const [editingBox, setEditingBox] = useState<InvestmentBox | null>(null);
  const [defaultFolderIdForBox, setDefaultFolderIdForBox] = useState<string | undefined>(undefined);

  const [isDepositWithdrawOpen, setIsDepositWithdrawOpen] = useState(false);
  const [selectedBoxForDeposit, setSelectedBoxForDeposit] = useState<InvestmentBox | null>(null);
  const [depositModalType, setDepositModalType] = useState<'deposit' | 'withdraw'>('deposit');

  // Unified Custom Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    icon?: 'trash' | 'warning' | 'reset';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Inject 'overflow-hidden' class into body when confirmDialog.isOpen is true to prevent page scrolling
  useEffect(() => {
    if (confirmDialog.isOpen) {
      document.body.classList.add('overflow-hidden');
      return () => {
        document.body.classList.remove('overflow-hidden');
      };
    }
  }, [confirmDialog.isOpen]);

  // Automated background evaluation for Push Notifications (Bill Due Reminders & Investment Yields)
  useEffect(() => {
    if (!currentUser || userProfile.notificationsEnabled === false) return;
    const isPushGranted = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
    const isEmailEnabled = Boolean(userProfile.notifyCardBillsEmail && (userProfile.recoveryEmail || userProfile.email));
    if (!isPushGranted && !isEmailEnabled) return;

    const runNotificationChecks = async () => {
      try {
        if (userProfile.notifyCardBillsDue !== false && cards.length > 0) {
          await checkAndTriggerUpcomingBillNotifications(cards, expenses, currentMonth, paidBills, { profile: userProfile });
        }
        if (userProfile.notifyInvestmentYields !== false && boxes.length > 0) {
          await checkAndTriggerInvestmentYieldNotifications(boxes);
        }
      } catch (err) {
        console.warn('Silent notification check error:', err);
      }
    };

    // Run after initial hydration (2.5s delay to keep boot snappy)
    const bootTimer = setTimeout(runNotificationChecks, 2500);

    // Also run when user returns to app (visibilitychange)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        runNotificationChecks();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(bootTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [
    currentUser,
    userProfile.notificationsEnabled,
    userProfile.notifyCardBillsDue,
    userProfile.notifyInvestmentYields,
    cards,
    expenses,
    currentMonth,
    paidBills,
    boxes
  ]);

  // Handle clicks from Service Worker Push Notifications (navigating to relevant tab)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICKED') {
        const notifData = event.data.data || {};
        if (notifData.type === 'card_bill') {
          setActiveTab('cartoes');
        } else if (notifData.type === 'investment_yield') {
          setActiveTab('investimentos');
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSwMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSwMessage);
    };
  }, []);

  // Synchronize Subscriptions with Expenses array so active subscriptions automatically reflect in total expenses, cards bills, and monthly summaries
  useEffect(() => {
    if (!dataLoadedFromCloud && currentUser) return;

    setExpenses(prevExpenses => {
      const activeSubExpenseMap = new Map<string, ExpenseItem>();

      subscriptions.forEach(sub => {
        if (!sub.active) return; // Inactive/paused subscriptions do not generate active expenses

        const expId = `exp-sub-${sub.id}`;

        let monthlyAmount = sub.amount || 0;
        if (sub.billingCycle === 'anual') {
          monthlyAmount = Math.round((sub.amount / 12) * 100) / 100;
        } else if (sub.billingCycle === 'semanal') {
          monthlyAmount = Math.round((sub.amount * 4.33) * 100) / 100;
        }

        const billingDayStr = String(sub.billingDay || 10).padStart(2, '0');
        const expDate = `${currentMonth}-${billingDayStr}`;
        const targetCardId = sub.cardId || cards[0]?.id || '';
        const targetPersonId = sub.personId || people.find(p => p.isSelf)?.id || people[0]?.id || 'person-me';

        const existingExp = prevExpenses.find(e => e.id === expId);
        const startMonthYear = sub.startDate ? sub.startDate.substring(0, 7) : (existingExp?.startMonthYear || currentMonth);

        const subExpenseItem: ExpenseItem = {
          id: expId,
          description: sub.name,
          category: sub.category || 'outros',
          amount: monthlyAmount,
          type: 'fixa',
          cardId: targetCardId,
          personId: targetPersonId,
          startMonthYear: startMonthYear,
          date: expDate,
          notes: sub.notes || `Assinatura recorrente (dia ${sub.billingDay || 10})`,
          paidByPerson: false,
        };

        activeSubExpenseMap.set(expId, subExpenseItem);
      });

      let hasChanges = false;

      // 1. Remove sub-expenses whose subscriptions are inactive or deleted
      const updatedExpenses = prevExpenses.filter(e => {
        if (e.id.startsWith('exp-sub-')) {
          if (!activeSubExpenseMap.has(e.id)) {
            hasChanges = true;
            return false;
          }
        }
        return true;
      });

      // 2. Update existing sub-expenses if properties changed
      const finalExpenses = updatedExpenses.map(e => {
        if (e.id.startsWith('exp-sub-') && activeSubExpenseMap.has(e.id)) {
          const newItem = activeSubExpenseMap.get(e.id)!;
          activeSubExpenseMap.delete(e.id); // mark as processed

          if (
            e.amount !== newItem.amount ||
            e.description !== newItem.description ||
            e.category !== newItem.category ||
            e.cardId !== newItem.cardId ||
            e.personId !== newItem.personId ||
            e.date !== newItem.date ||
            e.notes !== newItem.notes
          ) {
            hasChanges = true;
            return newItem;
          }
        }
        return e;
      });

      // 3. Add brand new subscription expenses
      const newItems = Array.from(activeSubExpenseMap.values());
      if (newItems.length > 0) {
        hasChanges = true;
        finalExpenses.unshift(...newItems);
      }

      return hasChanges ? finalExpenses : prevExpenses;
    });
  }, [subscriptions, cards, people, currentMonth, dataLoadedFromCloud, currentUser]);

  // Active month calculations
  const activeExpenses = useMemo(() => {
    return getActiveExpensesForMonth(expenses, currentMonth);
  }, [expenses, currentMonth]);

  const summary = useMemo(() => {
    return calculateMonthSummary(expenses, currentMonth);
  }, [expenses, currentMonth]);

  // Handlers: Expense
  const [isSuccessReceiptOpen, setIsSuccessReceiptOpen] = useState(false);
  const [successReceiptData, setSuccessReceiptData] = useState<TransactionSuccessData | null>(null);

  const handleSaveExpense = (expenseData: Partial<ExpenseItem>) => {
    if (expenseData.id) {
      setExpenses(prev => prev.map(exp => exp.id === expenseData.id ? { ...exp, ...expenseData } as ExpenseItem : exp));
      setActiveTab('dashboard');
    } else {
      const newExp: ExpenseItem = {
        id: `exp-${crypto.randomUUID()}`,
        description: expenseData.description || 'Novo Gasto',
        category: expenseData.category || 'outros',
        amount: expenseData.amount || 0,
        totalAmount: expenseData.totalAmount,
        type: expenseData.type || 'unica',
        cardId: expenseData.cardId || cards[0]?.id || '',
        personId: expenseData.personId || people[0]?.id || '',
        totalInstallments: expenseData.totalInstallments,
        currentInstallment: expenseData.currentInstallment || 1,
        startMonthYear: expenseData.startMonthYear || currentMonth,
        date: expenseData.date || `${currentMonth}-01`,
        notes: expenseData.notes,
        paidByPerson: expenseData.paidByPerson || false,
      };
      setExpenses(prev => [newExp, ...prev]);
      setActiveTab('dashboard');

      const cardName = cards.find(c => c.id === newExp.cardId)?.name || 'Cartão';
      const personName = people.find(p => p.id === newExp.personId)?.name;
      const installmentsText = newExp.type === 'parcelada' && newExp.totalInstallments
        ? `${newExp.totalInstallments}x de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(newExp.amount)}`
        : undefined;

      setSuccessReceiptData({
        id: newExp.id,
        type: 'despesa',
        title: 'Despesa Registrada!',
        subtitle: 'Seu gasto foi registrado com sucesso!',
        amount: newExp.totalAmount || newExp.amount,
        from: cardName,
        to: newExp.description + (personName ? ` (${personName})` : ''),
        category: newExp.category,
        installments: installmentsText,
      });
      setIsSuccessReceiptOpen(true);
    }
  };

  const handleEditExpense = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setIsAddExpenseOpen(true);
  };

  const handleDeleteExpense = (id: string) => {
    const itemToDelete = expenses.find(e => e.id === id);
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Gasto',
      description: itemToDelete 
        ? `Tem certeza que deseja excluir "${itemToDelete.description}"? Essa ação não pode ser desfeita.`
        : 'Tem certeza que deseja excluir este lançamento?',
      confirmText: 'Excluir Lançamento',
      cancelText: 'Voltar',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => {
        setExpenses(prev => prev.filter(e => e.id !== id));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleToggleExpensePaid = (id: string) => {
    setExpenses(prev => prev.map(exp => {
      if (exp.id === id) {
        const nextPaid = !exp.paidByPerson;
        return {
          ...exp,
          paidByPerson: nextPaid,
          paidDate: nextPaid ? new Date().toISOString() : undefined,
        };
      }
      return exp;
    }));
  };

  const handleMarkAllPersonExpensesPaid = (personId: string, month: string) => {
    const personObj = people.find(p => p.id === personId);
    setConfirmDialog({
      isOpen: true,
      title: 'Confirmar Pagamento Total',
      description: `Deseja marcar todas as compras pendentes de ${personObj?.name || 'esta pessoa'} em ${month} como quitadas?`,
      confirmText: 'Marcar como Pagas',
      cancelText: 'Cancelar',
      variant: 'info',
      icon: 'warning',
      onConfirm: () => {
        setExpenses(prev => prev.map(exp => {
          if (exp.personId === personId) {
            return {
              ...exp,
              paidByPerson: true,
              paidDate: new Date().toISOString(),
            };
          }
          return exp;
        }));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Handlers: Person
  const handleSavePerson = (personData: Partial<Person>) => {
    if (personData.id) {
      setPeople(prev => prev.map(p => p.id === personData.id ? { ...p, ...personData } as Person : p));
    } else {
      const newPerson: Person = {
        id: `person-${crypto.randomUUID()}`,
        name: personData.name || 'Nova Pessoa',
        avatarBg: personData.avatarBg || 'bg-slate-500',
        photoURL: personData.photoURL,
        pixKey: personData.pixKey,
        phone: personData.phone,
        email: personData.email,
        cpf: personData.cpf,
        notes: personData.notes,
      };
      setPeople(prev => [...prev, newPerson]);
    }
  };

  const handleDeletePerson = (personId: string) => {
    const personObj = people.find(p => p.id === personId);
    if (personObj?.isSelf) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Pessoa',
      description: `Deseja excluir "${personObj?.name || ''}" da divisão de contas? As compras associadas a ela permanecerão no seu histórico e serão transferidas para o Titular (Você).`,
      confirmText: 'Excluir Pessoa',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => {
        const selfPerson = people.find(p => p.isSelf) || people[0];
        if (selfPerson) {
          setExpenses(prev => prev.map(exp => exp.personId === personId ? { ...exp, personId: selfPerson.id } : exp));
        }
        setPeople(prev => prev.filter(p => p.id !== personId));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Handlers: Card
  const handleSaveCard = (cardData: Partial<CreditCard>) => {
    if (cardData.id) {
      setCards(prev => prev.map(c => c.id === cardData.id ? { ...c, ...cardData } as CreditCard : c));
      triggerHaptic(12);
    } else {
      const newCard: CreditCard = {
        id: `card-${crypto.randomUUID()}`,
        name: cardData.name || 'Novo Cartão',
        bank: cardData.bank || 'Banco',
        lastDigits: cardData.lastDigits,
        color: cardData.color || '#3b82f6',
        gradient: cardData.gradient || 'from-blue-600 to-indigo-900',
        limit: cardData.limit || 1000,
        closingDay: cardData.closingDay || 15,
        dueDay: cardData.dueDay || 22,
        cardPhotoUrl: cardData.cardPhotoUrl,
        visualStyle: cardData.visualStyle,
        textColor: cardData.textColor,
        brand: cardData.brand,
        cardDesignId: cardData.cardDesignId,
        colorVariant: cardData.colorVariant,
        holderName: cardData.holderName,
        expirationDate: cardData.expirationDate,
        cvv: cardData.cvv,
      };
      setCards(prev => [...prev, newCard]);
      setNewlyAddedCardId(newCard.id);
      setActiveTab('cartoes');
      triggerHaptic(20);
      playSuccessChime();
      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'],
          disableForReducedMotion: true,
        });
      } catch {
        // Safe fallback if window/canvas is unavailable
      }

      // Mantém o realce celebrativo do novo cartão por 7 segundos
      setTimeout(() => {
        setNewlyAddedCardId(null);
      }, 7000);
    }
  };

  const handleEditCard = (card: CreditCard) => {
    setEditingCard(card);
    setIsAddCardOpen(true);
  };

  const handleOpenAddCard = (preset?: Partial<CreditCard>) => {
    setEditingCard(preset ? (preset as CreditCard) : null);
    setIsAddCardOpen(true);
  };

  const handleDeleteCard = (cardId: string) => {
    const cardObj = cards.find(c => c.id === cardId);
    const relatedExpensesCount = expenses.filter(e => e.cardId === cardId).length;
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Cartão de Crédito',
      description: `Tem certeza que deseja excluir o cartão "${cardObj?.name || 'este cartão'}"? ${
        relatedExpensesCount > 0 
          ? `As ${relatedExpensesCount} despesas vinculadas a ele serão desvinculadas e mantidas no seu histórico de gastos.` 
          : 'Ele será removido da sua lista de cartões.'
      }`,
      confirmText: 'Excluir Cartão',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => {
        setCards(prev => prev.filter(c => c.id !== cardId));
        setExpenses(prev => prev.map(e => e.cardId === cardId ? { ...e, cardId: undefined } : e));
        setPaidBills(prev => prev.filter(p => p.cardId !== cardId));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Handlers: Investment Folder
  const handleSaveFolder = (folderData: Partial<InvestmentFolder>) => {
    if (folderData.id) {
      setFolders(prev => prev.map(f => f.id === folderData.id ? { ...f, ...folderData } as InvestmentFolder : f));
    } else {
      const newFolder: InvestmentFolder = {
        id: `folder-${crypto.randomUUID()}`,
        name: folderData.name || 'Nova Pasta',
        color: folderData.color || '#10b981',
        icon: folderData.icon || 'Folder',
        description: folderData.description,
      };
      setFolders(prev => [...prev, newFolder]);
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    const folderObj = folders.find(f => f.id === folderId);
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Pasta de Caixinhas',
      description: `Deseja excluir a pasta "${folderObj?.name || ''}"? As caixinhas dentro dela serão movidas para a pasta geral.`,
      confirmText: 'Excluir Pasta',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => {
        setFolders(prev => prev.filter(f => f.id !== folderId));
        setBoxes(prev => prev.map(b => b.folderId === folderId ? { ...b, folderId: 'default' } : b));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Handlers: Investment Box
  const handleSaveBox = (boxData: Partial<InvestmentBox>) => {
    if (boxData.id) {
      setBoxes(prev => prev.map(b => b.id === boxData.id ? { ...b, ...boxData, updatedAt: new Date().toISOString() } as InvestmentBox : b));
    } else {
      const newBox: InvestmentBox = {
        id: `box-${crypto.randomUUID()}`,
        folderId: boxData.folderId || 'default',
        title: boxData.title || 'Nova Caixinha',
        currentBalance: boxData.currentBalance || 0,
        targetAmount: boxData.targetAmount,
        monthlyYieldPercent: boxData.monthlyYieldPercent || 1.0,
        yieldDescription: boxData.yieldDescription || '100% CDI',
        institution: boxData.institution || 'Nubank',
        color: boxData.color || '#10b981',
        icon: boxData.icon || 'PiggyBank',
        notes: boxData.notes,
        history: boxData.currentBalance && boxData.currentBalance > 0 ? [{
          id: `tx-${crypto.randomUUID()}`,
          type: 'deposit',
          amount: boxData.currentBalance,
          date: todayLocalISO(),
          notes: 'Saldo inicial',
        }] : [],
        updatedAt: new Date().toISOString(),
      };
      setBoxes(prev => [...prev, newBox]);
    }
  };

  const handleDeleteBox = (boxId: string) => {
    const boxObj = boxes.find(b => b.id === boxId);
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Caixinha',
      description: `Tem certeza que deseja excluir "${boxObj?.title || ''}" e todo seu histórico de rendimentos?`,
      confirmText: 'Excluir Caixinha',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => {
        setBoxes(prev => prev.filter(b => b.id !== boxId));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleDepositWithdraw = (boxId: string, amount: number, mode: 'deposit' | 'withdraw', _notes?: string) => {
    setBoxes(prev => prev.map(box => {
      if (box.id === boxId) {
        const newBalance = mode === 'deposit' 
          ? box.currentBalance + amount 
          : Math.max(0, box.currentBalance - amount);

        return {
          ...box,
          currentBalance: newBalance,
          updatedAt: new Date().toISOString(),
        };
      }
      return box;
    }));

    const targetBox = boxes.find(b => b.id === boxId);
    setSuccessReceiptData({
      id: `box-${crypto.randomUUID()}`,
      type: mode === 'deposit' ? 'receita' : 'despesa',
      title: mode === 'deposit' ? 'Aporte Concluído!' : 'Resgate Concluído!',
      subtitle: mode === 'deposit' ? 'Seu aporte na caixinha foi salvo!' : 'Seu resgate foi registrado!',
      amount,
      from: mode === 'deposit' ? 'Conta Corrente' : (targetBox?.title || 'Caixinha'),
      to: mode === 'deposit' ? (targetBox?.title || 'Caixinha') : 'Saldo Disponível',
      category: 'Investimento',
    });
    setIsSuccessReceiptOpen(true);
  };

  const handleOpenDepositModal = (box: InvestmentBox) => {
    setSelectedBoxForDeposit(box);
    setDepositModalType('deposit');
    setIsDepositWithdrawOpen(true);
  };

  const handleOpenWithdrawModal = (box: InvestmentBox) => {
    setSelectedBoxForDeposit(box);
    setDepositModalType('withdraw');
    setIsDepositWithdrawOpen(true);
  };

  const handleOpenAddBoxForFolder = (folderId?: string) => {
    setEditingBox(null);
    setDefaultFolderIdForBox(folderId);
    setIsAddBoxOpen(true);
  };

  // Card Bill Payment & Invoice Closing Logic
  const handlePayBill = (
    card: CreditCard,
    amount: number,
    monthYear: string,
    paymentType: 'full' | 'partial' = 'full',
    interestAmount = 0,
    rolledOverDebt = 0,
    nextMonth = addMonths(monthYear, 1)
  ) => {
    const isPartial = paymentType === 'partial';
    setConfirmDialog({
      isOpen: true,
      title: isPartial ? 'Confirmar Pagamento Parcial (Rotativo)' : 'Confirmar Pagamento Integral da Fatura',
      description: isPartial
        ? `Pagamento parcial de R$ ${amount.toFixed(2)} registrado para o cartão "${card.name}". O saldo remanescente com juros de R$ ${rolledOverDebt.toFixed(2)} será transferido para a fatura de ${nextMonth}.`
        : `Deseja marcar a fatura do cartão "${card.name}" do mês ${monthYear} no valor de R$ ${amount.toFixed(2)} como PAGA?`,
      confirmText: 'Confirmar Pagamento',
      cancelText: 'Cancelar',
      variant: 'info',
      icon: 'reset',
      onConfirm: () => {
        setPaidBills(prev => {
          const filtered = prev.filter(p => !(p.cardId === card.id && p.monthYear === monthYear));
          return [
            ...filtered,
            {
              id: `bill-pay-${crypto.randomUUID()}`,
              cardId: card.id,
              monthYear,
              amount,
              paidDate: new Date().toISOString(),
            }
          ];
        });

        // If partial payment with rolled-over debt, add adjustment expense to next month
        if (isPartial && rolledOverDebt > 0) {
          const rolloverExpense: ExpenseItem = {
            id: `rollover-${crypto.randomUUID()}`,
            description: `🔄 Saldo Rolado & Juros (${card.name})`,
            amount: rolledOverDebt,
            date: `${nextMonth}-10`,
            startMonthYear: nextMonth,
            category: 'outros',
            type: 'unica',
            cardId: card.id,
            personId: people.find(p => p.isSelf)?.id || people[0]?.id || '1',
            notes: `Juros de rotativo simulados (Juros: R$ ${interestAmount.toFixed(2)})`,
          };
          setExpenses(prev => [rolloverExpense, ...prev]);
        }

        setConfirmDialog(prev => ({ ...prev, isOpen: false }));

        setSuccessReceiptData({
          id: `pay-${crypto.randomUUID()}`,
          type: 'fatura',
          title: isPartial ? 'Fatura Parcial Paga!' : 'Fatura Paga com Sucesso!',
          subtitle: `A fatura do ${card.name} foi liquidada!`,
          amount,
          from: 'Conta de Pagamento',
          to: `Fatura ${card.name} (${monthYear})`,
          category: 'Fatura de Cartão',
        });
        setIsSuccessReceiptOpen(true);
      },
    });
  };

  const handleUnpayBill = (cardId: string, monthYear: string) => {
    setPaidBills(prev => prev.filter(p => !(p.cardId === cardId && p.monthYear === monthYear)));
  };

  const handleAdvanceToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  // Quick Open Modal with defaults
  const handleOpenAddExpenseWithDefaults = (personId?: string, cardId?: string) => {
    setEditingExpense(null);
    setDefaultPersonId(personId);
    setDefaultCardId(cardId);
    setIsAddExpenseOpen(true);
  };

  // Helper to ensure target wallet account exists for Driver / Extra / Income synchronization
  const resolveTargetWalletAccountId = (specifiedAccountId?: string): string => {
    if (specifiedAccountId && walletAccounts.some(a => a.id === specifiedAccountId)) {
      return specifiedAccountId;
    }
    if (extraProfile.defaultAccountId && walletAccounts.some(a => a.id === extraProfile.defaultAccountId)) {
      return extraProfile.defaultAccountId;
    }
    const defaultAcc = walletAccounts.find(a => a.isDefault);
    if (defaultAcc) return defaultAcc.id;
    if (walletAccounts.length > 0) return walletAccounts[0].id;

    // Return empty if no account has been created yet by the user
    return '';
  };

  // Handlers: Income & Cash Flow
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeItem | null>(null);

  const handleSaveIncome = (incomeData: Partial<IncomeItem>) => {
    const isReceived = incomeData.received ?? true;
    const targetAccountId = resolveTargetWalletAccountId(incomeData.accountId);
    const amount = Number(incomeData.amount) || 0;
    const desc = incomeData.description?.trim() || 'Nova Entrada';
    const txCategory: WalletCategory = 
      incomeData.category === 'salario' 
        ? 'salario' 
        : 'renda_extra';

    if (incomeData.id) {
      const existing = incomes.find(i => i.id === incomeData.id);
      if (existing) {
        const wasReceived = existing.received;
        const nowReceived = isReceived;
        const oldAccId = existing.accountId || targetAccountId;
        const newAccId = targetAccountId;
        const oldAmount = Number(existing.amount) || 0;
        const newAmount = amount;

        // Reconcile wallet accounts balance
        setWalletAccounts(prev => prev.map(acc => {
          let bal = acc.currentBalance;
          if (wasReceived && acc.id === oldAccId) {
            bal -= oldAmount;
          }
          if (nowReceived && acc.id === newAccId) {
            bal += newAmount;
          }
          return { ...acc, currentBalance: bal };
        }));

        // Reconcile linked wallet transaction
        if (existing.walletTxId) {
          if (nowReceived) {
            setWalletTransactions(prev => prev.map(tx => {
              if (tx.id === existing.walletTxId) {
                return {
                  ...tx,
                  accountId: newAccId,
                  amount: newAmount,
                  description: desc,
                  category: txCategory,
                  date: incomeData.date || existing.date,
                };
              }
              return tx;
            }));
          } else {
            setWalletTransactions(prev => prev.filter(tx => tx.id !== existing.walletTxId));
          }
        } else if (nowReceived && targetAccountId) {
          const newTxId = `wtx-inc-${crypto.randomUUID()}`;
          const newTx: WalletTransaction = {
            id: newTxId,
            accountId: targetAccountId,
            type: 'deposito',
            amount: newAmount,
            description: desc,
            category: txCategory,
            date: incomeData.date || existing.date,
            createdAt: new Date().toISOString(),
          };
          setWalletTransactions(prev => [newTx, ...prev]);
          incomeData.walletTxId = newTxId;
        }
      }

      setIncomes(prev => prev.map(inc => inc.id === incomeData.id ? { 
        ...inc, 
        ...incomeData, 
        amount,
        description: desc,
        accountId: targetAccountId,
        received: isReceived,
        receivedDate: isReceived ? (incomeData.receivedDate || inc.receivedDate || todayLocalISO()) : undefined,
      } as IncomeItem : inc));
    } else {
      const newIncId = `inc-${crypto.randomUUID()}`;
      const newTxId = `wtx-inc-${crypto.randomUUID()}`;

      if (isReceived && targetAccountId) {
        const newWalletTx: WalletTransaction = {
          id: newTxId,
          accountId: targetAccountId,
          type: 'deposito',
          amount,
          description: desc,
          category: txCategory,
          date: incomeData.date || `${currentMonth}-05`,
          createdAt: new Date().toISOString(),
        };

        setWalletTransactions(prev => [newWalletTx, ...prev]);
        setWalletAccounts(prev => prev.map(acc => 
          acc.id === targetAccountId 
            ? { ...acc, currentBalance: acc.currentBalance + amount } 
            : acc
        ));
      }

      const newInc: IncomeItem = {
        id: newIncId,
        description: desc,
        amount,
        category: incomeData.category || 'salario',
        type: incomeData.type || 'fixa',
        monthYear: incomeData.monthYear || (incomeData.date ? incomeData.date.substring(0, 7) : currentMonth),
        date: incomeData.date || `${currentMonth}-05`,
        received: isReceived,
        receivedDate: isReceived ? (incomeData.receivedDate || incomeData.date || todayLocalISO()) : undefined,
        notes: incomeData.notes,
        accountId: targetAccountId,
        walletTxId: (isReceived && targetAccountId) ? newTxId : undefined,
      };
      setIncomes(prev => [newInc, ...prev]);

      const targetAccountName = walletAccounts.find(a => a.id === targetAccountId)?.name || 'Carteira';

      setSuccessReceiptData({
        id: newInc.id,
        type: 'receita',
        title: 'Receita Registrada!',
        subtitle: isReceived ? `Creditado em ${targetAccountName}` : 'Previsto para recebimento',
        amount: newInc.amount,
        from: 'Origem de Renda',
        to: targetAccountName,
        category: newInc.category,
      });
      setIsSuccessReceiptOpen(true);
    }
  };

  const handleEditIncome = (income: IncomeItem) => {
    setEditingIncome(income);
    setIsAddIncomeOpen(true);
  };

  const handleDeleteIncome = (id: string) => {
    const incToDelete = incomes.find(i => i.id === id);
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Entrada',
      description: incToDelete
        ? `Tem certeza que deseja excluir "${incToDelete.description}"? Essa ação não pode ser desfeita.`
        : 'Tem certeza que deseja excluir esta entrada?',
      confirmText: 'Excluir Entrada',
      cancelText: 'Voltar',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => {
        if (incToDelete) {
          if (incToDelete.received && incToDelete.accountId) {
            setWalletAccounts(prev => prev.map(a => a.id === incToDelete.accountId ? { ...a, currentBalance: a.currentBalance - incToDelete.amount } : a));
          }
          if (incToDelete.walletTxId) {
            setWalletTransactions(prev => prev.filter(tx => tx.id !== incToDelete.walletTxId));
          }
        }
        setIncomes(prev => prev.filter(i => i.id !== id));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleToggleIncomeReceived = (id: string) => {
    setIncomes(prev => prev.map(inc => {
      if (inc.id === id) {
        const nextReceived = !inc.received;
        const targetAccId = resolveTargetWalletAccountId(inc.accountId);
        const delta = nextReceived ? inc.amount : -inc.amount;

        setWalletAccounts(accs => accs.map(a => a.id === targetAccId ? { ...a, currentBalance: a.currentBalance + delta } : a));

        if (nextReceived && !inc.walletTxId) {
          const newTxId = `wtx-inc-${crypto.randomUUID()}`;
          const newTx: WalletTransaction = {
            id: newTxId,
            accountId: targetAccId,
            type: 'deposito',
            amount: inc.amount,
            description: inc.description,
            category: inc.category === 'salario' ? 'salario' : 'renda_extra',
            date: inc.date,
            createdAt: new Date().toISOString(),
          };
          setWalletTransactions(txs => [newTx, ...txs]);
          return {
            ...inc,
            received: nextReceived,
            receivedDate: todayLocalISO(),
            accountId: targetAccId,
            walletTxId: newTxId,
          };
        } else if (!nextReceived && inc.walletTxId) {
          setWalletTransactions(txs => txs.filter(tx => tx.id !== inc.walletTxId));
          return {
            ...inc,
            received: nextReceived,
            receivedDate: undefined,
            walletTxId: undefined,
          };
        }

        return {
          ...inc,
          received: nextReceived,
          receivedDate: nextReceived ? todayLocalISO() : undefined,
        };
      }
      return inc;
    }));
  };

  // Driver / Renda Extra Handlers (With Real-Time Wallet Balance Sync)
  const handleSaveDriverTrip = (tripData: Omit<DriverTrip, 'id'>, editId?: string) => {
    const net = tripData.netAmount || tripData.grossAmount;
    const targetAccountId = resolveTargetWalletAccountId(tripData.accountId);

    if (editId) {
      const oldTrip = driverTrips.find(t => t.id === editId);
      if (oldTrip) {
        const oldNet = oldTrip.netAmount || oldTrip.grossAmount;
        const oldAccId = oldTrip.accountId || targetAccountId;
        // Revert old account balance
        if (oldAccId) {
          setWalletAccounts(prev => prev.map(a => a.id === oldAccId ? { ...a, currentBalance: a.currentBalance - oldNet } : a));
        }
        // Apply new account balance
        if (targetAccountId) {
          setWalletAccounts(prev => prev.map(a => a.id === targetAccountId ? { ...a, currentBalance: a.currentBalance + net } : a));
        }

        // Update linked wallet transaction
        if (oldTrip.walletTxId) {
          setWalletTransactions(prev => prev.map(tx => {
            if (tx.id === oldTrip.walletTxId) {
              return {
                ...tx,
                accountId: targetAccountId,
                amount: net,
                description: `Ganho ${tripData.app.toUpperCase()}: ${tripData.notes || 'Corrida/Entrega'}`,
                date: tripData.date,
                time: tripData.time,
                notes: tripData.notes,
              };
            }
            return tx;
          }));
        }
      }

      setDriverTrips(prev => prev.map(t => t.id === editId ? { ...tripData, id: editId, accountId: targetAccountId, walletTxId: t.walletTxId } : t));
    } else {
      const newTripId = `trip-${crypto.randomUUID()}`;
      const newTxId = `wtx-dtrip-${crypto.randomUUID()}`;
      const payoutDate = tripData.payoutDate || tripData.date;
      const todayStr = todayLocalISO();
      const isFuture = !!(payoutDate && payoutDate > todayStr);

      // Create linked wallet transaction & update account balance
      const newWalletTx: WalletTransaction = {
        id: newTxId,
        accountId: targetAccountId,
        type: 'deposito',
        amount: net,
        description: `Ganho ${tripData.app.toUpperCase()}: ${tripData.notes || 'Corrida/Entrega'}`,
        category: 'renda_extra',
        date: payoutDate,
        payoutDate: payoutDate,
        status: isFuture ? 'futuro' : 'efetivado',
        driverTripId: newTripId,
        time: tripData.time,
        recipientOrPayer: APP_CONFIGS[tripData.app]?.name || tripData.app,
        notes: isFuture ? `Repasse previsto para ${payoutDate}` : tripData.notes,
        createdAt: new Date().toISOString(),
      };

      setWalletTransactions(prev => [newWalletTx, ...prev]);
      if (!isFuture && targetAccountId) {
        setWalletAccounts(prev => prev.map(a => a.id === targetAccountId ? { ...a, currentBalance: a.currentBalance + net } : a));
      }

      const newTrip: DriverTrip = {
        ...tripData,
        id: newTripId,
        accountId: targetAccountId,
        walletTxId: newTxId,
        payoutDate: payoutDate,
      };
      setDriverTrips(prev => [newTrip, ...prev]);

      // If synced to incomes, also create an income entry
      if (tripData.syncToIncome) {
        const newInc: IncomeItem = {
          id: `inc-uber-${crypto.randomUUID()}`,
          description: `Renda Extra: ${tripData.app.toUpperCase()} - ${tripData.origin || 'Ganho App'}`,
          amount: net,
          category: 'freelance',
          type: 'unica',
          monthYear: tripData.date.substring(0, 7),
          date: tripData.date,
          received: !isFuture,
          receivedDate: !isFuture ? tripData.date : undefined,
          notes: isFuture ? `Repasse previsto para ${payoutDate}` : `Lançado via Módulo Extra`
        };
        setIncomes(prev => [newInc, ...prev]);
      }
    }
  };

  const handleDeleteDriverTrip = (tripId: string) => {
    const trip = driverTrips.find(t => t.id === tripId);
    if (!trip) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Ganho de App',
      description: `Deseja excluir o ganho de ${formatCurrency(trip.netAmount || trip.grossAmount)} (${trip.app.toUpperCase()})? O valor será estornado do saldo da sua carteira sincronizada.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => {
        const net = trip.netAmount || trip.grossAmount;
        const accId = trip.accountId || (walletAccounts.length > 0 ? walletAccounts[0].id : undefined);
        const linkedTx = walletTransactions.find(tx => tx.id === trip.walletTxId);
        const isFuture = linkedTx?.status === 'futuro';

        // Only decrement account balance if transaction was already cleared (not future)
        if (accId && !isFuture) {
          setWalletAccounts(prev => prev.map(a => a.id === accId ? { ...a, currentBalance: a.currentBalance - net } : a));
        }
        if (trip.walletTxId) {
          setWalletTransactions(prev => prev.filter(tx => tx.id !== trip.walletTxId));
        }

        setDriverTrips(prev => prev.filter(t => t.id !== tripId));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleSaveDriverExpense = (expenseData: Omit<DriverExpense, 'id'>, editId?: string) => {
    const targetAccountId = resolveTargetWalletAccountId(expenseData.accountId);

    if (editId) {
      const oldExp = driverExpenses.find(e => e.id === editId);
      if (oldExp) {
        const oldAccId = oldExp.accountId || targetAccountId;
        // Revert old account balance
        if (oldAccId) {
          setWalletAccounts(prev => prev.map(a => a.id === oldAccId ? { ...a, currentBalance: a.currentBalance + oldExp.amount } : a));
        }
        // Apply new account balance
        if (targetAccountId) {
          setWalletAccounts(prev => prev.map(a => a.id === targetAccountId ? { ...a, currentBalance: a.currentBalance - expenseData.amount } : a));
        }

        // Update linked wallet transaction
        if (oldExp.walletTxId) {
          setWalletTransactions(prev => prev.map(tx => {
            if (tx.id === oldExp.walletTxId) {
              return {
                ...tx,
                accountId: targetAccountId,
                amount: expenseData.amount,
                description: `Despesa Extra (${expenseData.category}): ${expenseData.description}`,
                date: expenseData.date,
                time: expenseData.time,
                notes: expenseData.notes,
              };
            }
            return tx;
          }));
        }
      }

      setDriverExpenses(prev => prev.map(e => e.id === editId ? { ...expenseData, id: editId, accountId: targetAccountId, walletTxId: e.walletTxId } : e));
    } else {
      const newExpId = `dexp-${crypto.randomUUID()}`;
      const newTxId = `wtx-dexp-${crypto.randomUUID()}`;

      const newWalletTx: WalletTransaction = {
        id: newTxId,
        accountId: targetAccountId,
        type: 'debito',
        amount: expenseData.amount,
        description: `Despesa Extra (${expenseData.category}): ${expenseData.description}`,
        category: 'transporte',
        date: expenseData.date,
        time: expenseData.time,
        notes: expenseData.notes,
        createdAt: new Date().toISOString(),
      };

      setWalletTransactions(prev => [newWalletTx, ...prev]);
      setWalletAccounts(prev => prev.map(a => a.id === targetAccountId ? { ...a, currentBalance: a.currentBalance - expenseData.amount } : a));

      const newExpense: DriverExpense = {
        ...expenseData,
        id: newExpId,
        accountId: targetAccountId,
        walletTxId: newTxId,
      };
      setDriverExpenses(prev => [newExpense, ...prev]);
    }
  };

  const handleDeleteDriverExpense = (expenseId: string) => {
    const exp = driverExpenses.find(e => e.id === expenseId);
    if (!exp) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Despesa Operacional',
      description: `Deseja excluir a despesa "${exp.description}" (${formatCurrency(exp.amount)})? O valor será creditado de volta na sua conta sincronizada.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => {
        const accId = exp.accountId || (walletAccounts.length > 0 ? walletAccounts[0].id : undefined);
        if (accId) {
          setWalletAccounts(prev => prev.map(a => a.id === accId ? { ...a, currentBalance: a.currentBalance + exp.amount } : a));
        }
        if (exp.walletTxId) {
          setWalletTransactions(prev => prev.filter(tx => tx.id !== exp.walletTxId));
        }

        setDriverExpenses(prev => prev.filter(e => e.id !== expenseId));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleSaveDriverGoals = (newGoals: DriverGoals) => {
    setDriverGoals(newGoals);
  };

  const handleSaveDriverShift = (
    shiftTrips: Omit<DriverTrip, 'id' | 'createdAt'>[],
    shiftExpenses: Omit<DriverExpense, 'id' | 'createdAt'>[]
  ) => {
    const newTrips: DriverTrip[] = [];
    const newExpenses: DriverExpense[] = [];
    const newWalletTxs: WalletTransaction[] = [];
    const accountDeltas: Record<string, number> = {};
    const todayStr = todayLocalISO();

    shiftTrips.forEach(t => {
      const tripId = `trip-${crypto.randomUUID()}`;
      const txId = `wtx-dtrip-${crypto.randomUUID()}`;
      const net = t.netAmount || t.grossAmount;
      const targetAccId = resolveTargetWalletAccountId(t.accountId);
      const payoutDate = t.payoutDate || t.date;
      const isFuture = !!(payoutDate && payoutDate > todayStr);

      newWalletTxs.push({
        id: txId,
        accountId: targetAccId,
        type: 'deposito',
        amount: net,
        description: `Ganho ${t.app.toUpperCase()}: Fechamento do dia`,
        category: 'renda_extra',
        date: payoutDate,
        payoutDate: payoutDate,
        status: isFuture ? 'futuro' : 'efetivado',
        driverTripId: tripId,
        time: t.time,
        recipientOrPayer: APP_CONFIGS[t.app]?.name || t.app,
        notes: isFuture ? `Repasse previsto para ${payoutDate}` : (t.notes || 'Fechamento de turno'),
        createdAt: new Date().toISOString(),
      });
      
      // If it's not a future payout (already deposited today), increment the cleared account balance
      if (!isFuture) {
        accountDeltas[targetAccId] = (accountDeltas[targetAccId] || 0) + net;
      }

      newTrips.push({
        ...t,
        id: tripId,
        accountId: targetAccId,
        walletTxId: txId,
        payoutDate: payoutDate,
      });
    });

    shiftExpenses.forEach(e => {
      const expId = `dexp-${crypto.randomUUID()}`;
      const txId = `wtx-dexp-${crypto.randomUUID()}`;
      const targetAccId = resolveTargetWalletAccountId(e.accountId);

      newWalletTxs.push({
        id: txId,
        accountId: targetAccId,
        type: 'debito',
        amount: e.amount,
        description: `Gasto Operacional: ${e.description}`,
        category: 'transporte',
        date: e.date,
        time: e.time,
        notes: e.notes,
        createdAt: new Date().toISOString(),
      });
      accountDeltas[targetAccId] = (accountDeltas[targetAccId] || 0) - e.amount;

      newExpenses.push({
        ...e,
        id: expId,
        accountId: targetAccId,
        walletTxId: txId,
      });
    });

    if (newTrips.length > 0) {
      setDriverTrips(prev => [...newTrips, ...prev]);
    }
    if (newExpenses.length > 0) {
      setDriverExpenses(prev => [...newExpenses, ...prev]);
    }
    if (newWalletTxs.length > 0) {
      setWalletTransactions(prev => [...newWalletTxs, ...prev]);
      setWalletAccounts(prev => prev.map(a => {
        const delta = accountDeltas[a.id];
        return delta ? { ...a, currentBalance: a.currentBalance + delta } : a;
      }));
    }

    const totalEarnings = shiftTrips.reduce((acc, t) => acc + (t.netAmount || t.grossAmount), 0);
    if (totalEarnings > 0) {
      setSuccessReceiptData({
        id: `driver-${crypto.randomUUID()}`,
        type: 'motorista',
        title: 'Turno Registrado!',
        subtitle: 'Seus ganhos e corridas foram salvos!',
        amount: totalEarnings,
        from: 'Apps de Corrida',
        to: 'Ganhos do Turno',
        category: 'Renda Extra',
      });
      setIsSuccessReceiptOpen(true);
    }
  };

  // Confirmação de recebimento de lançamento futuro na carteira (Uber/99 que caiu na conta)
  const handleConfirmFutureTransaction = (txId: string) => {
    setWalletTransactions(prev => prev.map(tx => {
      if (tx.id === txId) {
        const targetAccId = tx.accountId;
        if (targetAccId && tx.status === 'futuro') {
          setWalletAccounts(accs => accs.map(a => a.id === targetAccId ? { ...a, currentBalance: a.currentBalance + tx.amount } : a));
        }
        return {
          ...tx,
          status: 'efetivado',
          date: todayLocalISO()
        };
      }
      return tx;
    }));
  };

  // Função de Reconciliação do Motorista de App com a Carteira
  // Garante que o saldo transferido/ganhos de 'motorista de app' seja adicionado corretamente à conta corrente selecionada e reflita imediatamente no total da carteira
  const reconcileDriverWalletBalance = useCallback((preferredAccountId?: string) => {
    setWalletAccounts(prevAccounts => {
      let accounts = [...prevAccounts];
      if (accounts.length === 0) {
        return prevAccounts;
      }

      const defaultAccId = preferredAccountId && accounts.some(a => a.id === preferredAccountId)
        ? preferredAccountId
        : (extraProfile.defaultAccountId && accounts.some(a => a.id === extraProfile.defaultAccountId))
          ? extraProfile.defaultAccountId
          : (accounts.find(a => a.isDefault || a.accountType === 'corrente')?.id || accounts[0].id);

      setWalletTransactions(prevTxs => {
        const existingTxMap = new Map<string, WalletTransaction>(prevTxs.map(tx => [tx.id, tx]));
        const newTxs: WalletTransaction[] = [];

        setDriverTrips(prevTrips => {
          let tripsModified = false;
          const updatedTrips = prevTrips.map(trip => {
            const targetAccId = (trip.accountId && accounts.some(a => a.id === trip.accountId))
              ? trip.accountId
              : defaultAccId;

            const net = trip.netAmount || trip.grossAmount || 0;
            const expectedTxId = trip.walletTxId || `wtx-dtrip-recon-${trip.id}`;

            if (!existingTxMap.has(expectedTxId)) {
              const newTx: WalletTransaction = {
                id: expectedTxId,
                accountId: targetAccId,
                type: 'deposito',
                amount: net,
                description: `Ganho ${trip.app.toUpperCase()}: ${trip.notes || 'Corrida/Entrega'}`,
                category: 'renda_extra',
                date: trip.date,
                time: trip.time,
                recipientOrPayer: APP_CONFIGS[trip.app]?.name || trip.app,
                notes: trip.notes,
                createdAt: new Date().toISOString(),
              };
              newTxs.push(newTx);
              existingTxMap.set(expectedTxId, newTx);
              tripsModified = true;
              return {
                ...trip,
                accountId: targetAccId,
                walletTxId: expectedTxId,
              };
            }

            if (trip.accountId !== targetAccId || trip.walletTxId !== expectedTxId) {
              tripsModified = true;
              return {
                ...trip,
                accountId: targetAccId,
                walletTxId: expectedTxId,
              };
            }
            return trip;
          });

          return tripsModified ? updatedTrips : prevTrips;
        });

        setDriverExpenses(prevExps => {
          let expsModified = false;
          const updatedExps = prevExps.map(exp => {
            const targetAccId = (exp.accountId && accounts.some(a => a.id === exp.accountId))
              ? exp.accountId
              : defaultAccId;

            const expectedTxId = exp.walletTxId || `wtx-dexp-recon-${exp.id}`;

            if (!existingTxMap.has(expectedTxId)) {
              const newTx: WalletTransaction = {
                id: expectedTxId,
                accountId: targetAccId,
                type: 'debito',
                amount: exp.amount,
                description: `Despesa Operacional (${exp.category}): ${exp.description}`,
                category: 'transporte',
                date: exp.date,
                time: exp.time,
                notes: exp.notes,
                createdAt: new Date().toISOString(),
              };
              newTxs.push(newTx);
              existingTxMap.set(expectedTxId, newTx);
              expsModified = true;
              return {
                ...exp,
                accountId: targetAccId,
                walletTxId: expectedTxId,
              };
            }

            if (exp.accountId !== targetAccId || exp.walletTxId !== expectedTxId) {
              expsModified = true;
              return {
                ...exp,
                accountId: targetAccId,
                walletTxId: expectedTxId,
              };
            }
            return exp;
          });

          return expsModified ? updatedExps : prevExps;
        });

        const allTransactions = newTxs.length > 0 ? [...newTxs, ...prevTxs] : prevTxs;

        // Recalcula os saldos com precisão imediata para refletir no total da carteira
        const recalculatedAccounts = accounts.map(acc => {
          const accTxs = allTransactions.filter(tx => tx.accountId === acc.id);
          const balanceFromTxs = accTxs.reduce((sum, tx) => {
            if (['pix_in', 'deposito', 'transferencia_entrada'].includes(tx.type)) return sum + tx.amount;
            if (['pix_out', 'debito', 'dinheiro_gasto', 'transferencia_saida'].includes(tx.type)) return sum - tx.amount;
            if (tx.type === 'ajuste') return sum + tx.amount;
            return sum;
          }, 0);

          return {
            ...acc,
            includeInTotal: true,
            currentBalance: Math.round((acc.initialBalance + balanceFromTxs) * 100) / 100,
          };
        });

        setTimeout(() => {
          setWalletAccounts(recalculatedAccounts);
        }, 0);

        return allTransactions;
      });

      return accounts;
    });
  }, [extraProfile.defaultAccountId]);

  // Executa a reconciliação automática sempre que os dados são carregados da nuvem ou inicializados
  useEffect(() => {
    if (!dataLoadedFromCloud) return;
    if (driverTrips.length > 0 || walletAccounts.length > 0) {
      reconcileDriverWalletBalance();
    }
  }, [dataLoadedFromCloud, driverTrips.length, walletAccounts.length, reconcileDriverWalletBalance]);

  // Freelancer & Projetos Handlers (With Real-Time Wallet Balance Sync)
  const handleSaveFreelanceEntry = (entryData: Omit<FreelanceEntry, 'id'>, editId?: string) => {
    if (editId) {
      const oldEntry = freelanceEntries.find(e => e.id === editId);
      if (oldEntry) {
        // Revert old account balance
        if (oldEntry.accountId) {
          setWalletAccounts(prev => prev.map(a => a.id === oldEntry.accountId ? { ...a, currentBalance: a.currentBalance - oldEntry.amount } : a));
        }
        // Apply new account balance
        if (entryData.accountId) {
          setWalletAccounts(prev => prev.map(a => a.id === entryData.accountId ? { ...a, currentBalance: a.currentBalance + entryData.amount } : a));
        }

        // Update linked wallet transaction
        if (oldEntry.walletTxId) {
          setWalletTransactions(prev => prev.map(tx => {
            if (tx.id === oldEntry.walletTxId) {
              return {
                ...tx,
                accountId: entryData.accountId || tx.accountId,
                amount: entryData.amount,
                description: `Freela: ${entryData.title}${entryData.clientName ? ` (${entryData.clientName})` : ''}`,
                date: entryData.date,
                time: entryData.time,
                recipientOrPayer: entryData.clientName || 'Cliente Freela',
                notes: entryData.notes,
              };
            }
            return tx;
          }));
        }
      }

      setFreelanceEntries(prev => prev.map(e => e.id === editId ? { ...entryData, id: editId, walletTxId: e.walletTxId } : e));
    } else {
      const newEntryId = `fe-${crypto.randomUUID()}`;
      const newTxId = `wtx-fe-${crypto.randomUUID()}`;

      // Create linked wallet transaction & update account balance
      if (entryData.accountId) {
        const newWalletTx: WalletTransaction = {
          id: newTxId,
          accountId: entryData.accountId,
          type: 'deposito',
          amount: entryData.amount,
          description: `Freela: ${entryData.title}${entryData.clientName ? ` (${entryData.clientName})` : ''}`,
          category: 'renda_extra',
          date: entryData.date,
          time: entryData.time,
          recipientOrPayer: entryData.clientName || 'Cliente Freela',
          notes: entryData.notes,
          createdAt: new Date().toISOString(),
        };

        setWalletTransactions(prev => [newWalletTx, ...prev]);
        setWalletAccounts(prev => prev.map(a => a.id === entryData.accountId ? { ...a, currentBalance: a.currentBalance + entryData.amount } : a));
      }

      const newEntry: FreelanceEntry = {
        ...entryData,
        id: newEntryId,
        walletTxId: entryData.accountId ? newTxId : undefined,
      };

      setFreelanceEntries(prev => [newEntry, ...prev]);

      setSuccessReceiptData({
        id: newEntryId,
        type: 'freelance',
        title: 'Freelance Registrado!',
        subtitle: 'Seu projeto foi salvo com sucesso!',
        amount: entryData.amount,
        from: entryData.clientName || 'Cliente',
        to: entryData.title,
        category: 'Freelance',
      });
      setIsSuccessReceiptOpen(true);

      // If sync to general incomes is requested
      if (entryData.syncToIncome) {
        const newInc: IncomeItem = {
          id: `inc-freela-${crypto.randomUUID()}`,
          description: `Freela: ${entryData.title}${entryData.clientName ? ` (${entryData.clientName})` : ''}`,
          amount: entryData.amount,
          category: 'freelance',
          type: 'unica',
          monthYear: entryData.date.substring(0, 7),
          date: entryData.date,
          received: entryData.status === 'recebido',
          receivedDate: entryData.status === 'recebido' ? entryData.date : undefined,
          notes: `Lançado via Módulo Freelancer (${entryData.category})`
        };
        setIncomes(prev => [newInc, ...prev]);
      }
    }
  };

  const handleDeleteFreelanceEntry = (entryId: string) => {
    const entry = freelanceEntries.find(e => e.id === entryId);
    if (!entry) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Entrada Freelance',
      description: `Deseja excluir a entrada "${entry.title}" (${formatCurrency(entry.amount)})? O valor será estornado do saldo da sua carteira sincronizada.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => {
        // Revert wallet balance & remove wallet tx
        if (entry.accountId) {
          setWalletAccounts(prev => prev.map(a => a.id === entry.accountId ? { ...a, currentBalance: a.currentBalance - entry.amount } : a));
        }
        if (entry.walletTxId) {
          setWalletTransactions(prev => prev.filter(tx => tx.id !== entry.walletTxId));
        }

        setFreelanceEntries(prev => prev.filter(e => e.id !== entryId));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleSaveFreelanceExpense = (expenseData: Omit<FreelanceExpense, 'id'>, editId?: string) => {
    if (editId) {
      const oldExp = freelanceExpenses.find(e => e.id === editId);
      if (oldExp) {
        // Revert old account balance
        if (oldExp.accountId) {
          setWalletAccounts(prev => prev.map(a => a.id === oldExp.accountId ? { ...a, currentBalance: a.currentBalance + oldExp.amount } : a));
        }
        // Apply new account balance
        if (expenseData.accountId) {
          setWalletAccounts(prev => prev.map(a => a.id === expenseData.accountId ? { ...a, currentBalance: a.currentBalance - expenseData.amount } : a));
        }

        // Update linked wallet transaction
        if (oldExp.walletTxId) {
          setWalletTransactions(prev => prev.map(tx => {
            if (tx.id === oldExp.walletTxId) {
              return {
                ...tx,
                accountId: expenseData.accountId || tx.accountId,
                amount: expenseData.amount,
                description: `Despesa Freela: ${expenseData.description}`,
                date: expenseData.date,
                time: expenseData.time,
                notes: expenseData.notes,
              };
            }
            return tx;
          }));
        }
      }

      setFreelanceExpenses(prev => prev.map(e => e.id === editId ? { ...expenseData, id: editId, walletTxId: e.walletTxId } : e));
    } else {
      const newExpId = `fexp-${crypto.randomUUID()}`;
      const newTxId = `wtx-fexp-${crypto.randomUUID()}`;

      // Deduct from wallet account & record transaction
      if (expenseData.accountId) {
        const newWalletTx: WalletTransaction = {
          id: newTxId,
          accountId: expenseData.accountId,
          type: 'debito',
          amount: expenseData.amount,
          description: `Despesa Freela: ${expenseData.description}`,
          category: 'servicos',
          date: expenseData.date,
          time: expenseData.time,
          notes: expenseData.notes,
          createdAt: new Date().toISOString(),
        };

        setWalletTransactions(prev => [newWalletTx, ...prev]);
        setWalletAccounts(prev => prev.map(a => a.id === expenseData.accountId ? { ...a, currentBalance: a.currentBalance - expenseData.amount } : a));
      }

      const newExpense: FreelanceExpense = {
        ...expenseData,
        id: newExpId,
        walletTxId: expenseData.accountId ? newTxId : undefined,
      };

      setFreelanceExpenses(prev => [newExpense, ...prev]);
    }
  };

  const handleDeleteFreelanceExpense = (expenseId: string) => {
    const exp = freelanceExpenses.find(e => e.id === expenseId);
    if (!exp) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Despesa Freelance',
      description: `Deseja excluir a despesa "${exp.description}" (${formatCurrency(exp.amount)})? O valor será creditado de volta na sua conta sincronizada.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => {
        // Revert wallet balance & remove wallet tx
        if (exp.accountId) {
          setWalletAccounts(prev => prev.map(a => a.id === exp.accountId ? { ...a, currentBalance: a.currentBalance + exp.amount } : a));
        }
        if (exp.walletTxId) {
          setWalletTransactions(prev => prev.filter(tx => tx.id !== exp.walletTxId));
        }

        setFreelanceExpenses(prev => prev.filter(e => e.id !== expenseId));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleSaveFreelanceGoals = (newGoals: FreelanceGoals) => {
    setFreelanceGoals(newGoals);
  };

  const handleSaveFreelanceShift = (
    entriesToSave: Omit<FreelanceEntry, 'id'>[],
    expensesToSave: Omit<FreelanceExpense, 'id'>[]
  ) => {
    const newEntries: FreelanceEntry[] = [];
    const newExpenses: FreelanceExpense[] = [];
    const newWalletTxs: WalletTransaction[] = [];
    const newIncomes: IncomeItem[] = [];
    const accountDeltas: Record<string, number> = {};

    entriesToSave.forEach(entryData => {
      const entryId = `fe-${crypto.randomUUID()}`;
      const txId = `wtx-fe-${crypto.randomUUID()}`;

      if (entryData.accountId) {
        newWalletTxs.push({
          id: txId,
          accountId: entryData.accountId,
          type: 'deposito',
          amount: entryData.amount,
          description: `Freela: ${entryData.title}${entryData.clientName ? ` (${entryData.clientName})` : ''}`,
          category: 'renda_extra',
          date: entryData.date,
          time: entryData.time,
          recipientOrPayer: entryData.clientName || 'Cliente Freela',
          notes: entryData.notes,
          createdAt: new Date().toISOString(),
        });
        accountDeltas[entryData.accountId] = (accountDeltas[entryData.accountId] || 0) + entryData.amount;
      }

      newEntries.push({
        ...entryData,
        id: entryId,
        walletTxId: entryData.accountId ? txId : undefined,
      });

      if (entryData.syncToIncome) {
        newIncomes.push({
          id: `inc-freela-${crypto.randomUUID()}`,
          description: `Freela: ${entryData.title}${entryData.clientName ? ` (${entryData.clientName})` : ''}`,
          amount: entryData.amount,
          category: 'freelance',
          type: 'unica',
          monthYear: entryData.date.substring(0, 7),
          date: entryData.date,
          received: entryData.status === 'recebido',
          receivedDate: entryData.status === 'recebido' ? entryData.date : undefined,
          notes: `Lançado via Fechamento Rápido Freelancer (${entryData.category})`
        });
      }
    });

    expensesToSave.forEach(expenseData => {
      const expId = `fexp-${crypto.randomUUID()}`;
      const txId = `wtx-fexp-${crypto.randomUUID()}`;

      if (expenseData.accountId) {
        newWalletTxs.push({
          id: txId,
          accountId: expenseData.accountId,
          type: 'debito',
          amount: expenseData.amount,
          description: `Despesa Freela: ${expenseData.description}`,
          category: 'servicos',
          date: expenseData.date,
          time: expenseData.time,
          notes: expenseData.notes,
          createdAt: new Date().toISOString(),
        });
        accountDeltas[expenseData.accountId] = (accountDeltas[expenseData.accountId] || 0) - expenseData.amount;
      }

      newExpenses.push({
        ...expenseData,
        id: expId,
        walletTxId: expenseData.accountId ? txId : undefined,
      });
    });

    if (newEntries.length > 0) {
      setFreelanceEntries(prev => [...newEntries, ...prev]);
    }
    if (newExpenses.length > 0) {
      setFreelanceExpenses(prev => [...newExpenses, ...prev]);
    }
    if (newIncomes.length > 0) {
      setIncomes(prev => [...newIncomes, ...prev]);
    }
    if (newWalletTxs.length > 0) {
      setWalletTransactions(prev => [...newWalletTxs, ...prev]);
      setWalletAccounts(prev => prev.map(a => {
        const delta = accountDeltas[a.id];
        return delta ? { ...a, currentBalance: a.currentBalance + delta } : a;
      }));
    }
  };

  // Subscription Handlers
  const handleSaveSubscription = (subData: Partial<SubscriptionItem>) => {
    if (subData.id) {
      setSubscriptions(prev => prev.map(s => s.id === subData.id ? { ...s, ...subData } as SubscriptionItem : s));
    } else {
      const newSub: SubscriptionItem = {
        id: `sub-${crypto.randomUUID()}`,
        name: subData.name || 'Nova Assinatura',
        serviceKey: subData.serviceKey || subData.name?.toLowerCase() || 'custom',
        amount: subData.amount || 0,
        category: subData.category || 'streaming',
        billingCycle: subData.billingCycle || 'mensal',
        billingDay: subData.billingDay || 10,
        cardId: subData.cardId,
        personId: subData.personId,
        active: subData.active ?? true,
        autoRenew: subData.autoRenew ?? true,
        color: subData.color,
        notes: subData.notes,
      };
      setSubscriptions(prev => [newSub, ...prev]);

      setSuccessReceiptData({
        id: newSub.id,
        type: 'assinatura',
        title: 'Assinatura Adicionada!',
        subtitle: 'Sua assinatura foi vinculada com sucesso!',
        amount: newSub.amount,
        from: 'Serviço Recorrente',
        to: newSub.name,
        category: newSub.category,
      });
      setIsSuccessReceiptOpen(true);
    }
  };

  const handleDeleteSubscription = (id: string) => {
    const subToDelete = subscriptions.find(s => s.id === id);
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Assinatura',
      description: subToDelete 
        ? `Deseja remover a assinatura "${subToDelete.name}" (${formatCurrency(subToDelete.amount)}/${subToDelete.billingCycle}) do seu monitoramento?`
        : 'Deseja remover esta assinatura?',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => {
        setSubscriptions(prev => prev.filter(s => s.id !== id));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleToggleSubscriptionActive = (id: string) => {
    setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const handleQuickAddPreset = (preset: ServicePreset) => {
    const defaultCard = cards[0]?.id;
    const defaultPerson = people.find(p => p.isSelf)?.id || people[0]?.id;
    const newSub: SubscriptionItem = {
      id: `sub-${crypto.randomUUID()}`,
      name: preset.name,
      serviceKey: preset.serviceKey,
      amount: preset.defaultAmount,
      category: preset.category,
      billingCycle: 'mensal',
      billingDay: preset.suggestedBillingDay || 10,
      cardId: defaultCard,
      personId: defaultPerson,
      active: true,
      autoRenew: true,
      color: preset.color,
      notes: preset.description,
    };
    setSubscriptions(prev => [newSub, ...prev]);
  };

  const handleEditSubscription = (sub: SubscriptionItem) => {
    setEditingSubscription(sub);
    setIsAddSubscriptionOpen(true);
  };

  // Wallet Handlers
  const handleSaveWalletAccount = (accData: Partial<WalletAccount>) => {
    if (accData.id) {
      setWalletAccounts(prev => prev.map(a => a.id === accData.id ? { ...a, ...accData } as WalletAccount : a));
    } else {
      const newAcc: WalletAccount = {
        id: `acc-${crypto.randomUUID()}`,
        name: accData.name || 'Nova Conta',
        institution: accData.institution || 'Nubank',
        accountType: accData.accountType || 'corrente',
        initialBalance: accData.initialBalance || 0,
        currentBalance: accData.initialBalance || 0,
        color: accData.color || '#8A05BE',
        pixKey: accData.pixKey,
        isDefault: accData.isDefault || false,
        includeInTotal: accData.includeInTotal ?? true,
        createdAt: new Date().toISOString(),
      };
      if (newAcc.isDefault) {
        setWalletAccounts(prev => [...prev.map(a => ({ ...a, isDefault: false })), newAcc]);
      } else {
        setWalletAccounts(prev => [...prev, newAcc]);
      }
    }
  };

  const handleDeleteWalletAccount = (id: string) => {
    const acc = walletAccounts.find(a => a.id === id);
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Conta Bancária',
      description: acc 
        ? `Tem certeza que deseja excluir a conta "${acc.name}"? As movimentações associadas a ela permanecerão no extrato histórico.`
        : 'Tem certeza que deseja excluir esta conta?',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => {
        setWalletAccounts(prev => prev.filter(a => a.id !== id));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleAddWalletTransaction = (
    txData: Omit<WalletTransaction, 'id' | 'createdAt'>,
    transferData?: { toAccountId: string }
  ) => {
    let resolvedAccountId = txData.accountId;
    const isExit = ['pix_out', 'debito', 'dinheiro_gasto', 'transferencia_saida'].includes(txData.type);

    // If there are no accounts yet, auto-create a default "Carteira Principal"
    if (walletAccounts.length === 0) {
      const defaultAcc: WalletAccount = {
        id: `acc-default-${crypto.randomUUID()}`,
        name: 'Carteira Principal',
        institution: 'Outro',
        accountType: 'corrente',
        initialBalance: isExit ? -txData.amount : txData.amount,
        currentBalance: isExit ? -txData.amount : txData.amount,
        color: 'emerald',
        includeInTotal: true,
        createdAt: new Date().toISOString(),
      };
      resolvedAccountId = defaultAcc.id;
      setWalletAccounts([defaultAcc]);
    } else if (!resolvedAccountId && walletAccounts.length > 0) {
      resolvedAccountId = walletAccounts.find(a => a.isDefault)?.id || walletAccounts[0].id;
    }

    const newTxId = `wtx-${crypto.randomUUID()}`;
    const newTx: WalletTransaction = {
      ...txData,
      accountId: resolvedAccountId,
      id: newTxId,
      createdAt: new Date().toISOString(),
    };

    // If it's a transfer between own accounts
    if (txData.type === 'transferencia_saida' && transferData?.toAccountId && resolvedAccountId) {
      const incomingTx: WalletTransaction = {
        id: `wtx-${crypto.randomUUID()}`,
        accountId: transferData.toAccountId,
        type: 'transferencia_entrada',
        amount: txData.amount,
        description: `Transferência recebida de ${walletAccounts.find(a => a.id === resolvedAccountId)?.name || 'conta'}`,
        category: 'transferencia',
        date: txData.date,
        time: txData.time,
        recipientOrPayer: walletAccounts.find(a => a.id === resolvedAccountId)?.name,
        fromAccountId: resolvedAccountId,
        createdAt: new Date().toISOString(),
      };

      setWalletTransactions(prev => [newTx, incomingTx, ...prev]);

      // Deduct from source and credit to destination
      setWalletAccounts(prev => prev.map(acc => {
        if (acc.id === resolvedAccountId) {
          return { ...acc, currentBalance: acc.currentBalance - txData.amount };
        }
        if (acc.id === transferData.toAccountId) {
          return { ...acc, currentBalance: acc.currentBalance + txData.amount };
        }
        return acc;
      }));

      const sourceName = walletAccounts.find(a => a.id === resolvedAccountId)?.name || 'Conta Origem';
      const destName = walletAccounts.find(a => a.id === transferData.toAccountId)?.name || 'Conta Destino';
      setSuccessReceiptData({
        id: newTxId,
        type: 'transferencia',
        title: 'Transferência Concluída!',
        subtitle: 'Transferência entre contas realizada!',
        amount: txData.amount,
        from: sourceName,
        to: destName,
        category: 'Transferência',
      });
      setIsSuccessReceiptOpen(true);
      return;
    }

    // Standard transaction (expense or income)
    setWalletTransactions(prev => [newTx, ...prev]);

    // Update account balance if account is linked
    if (resolvedAccountId && walletAccounts.length > 0) {
      setWalletAccounts(prev => prev.map(acc => {
        if (acc.id === resolvedAccountId) {
          const newBal = isExit 
            ? acc.currentBalance - txData.amount
            : acc.currentBalance + txData.amount;
          return { ...acc, currentBalance: newBal };
        }
        return acc;
      }));
    }

    const accName = walletAccounts.find(a => a.id === resolvedAccountId)?.name || 'Carteira';
    setSuccessReceiptData({
      id: newTxId,
      type: isExit ? 'despesa' : 'receita',
      title: isExit ? 'Pagamento Registrado!' : 'Depósito Confirmado!',
      subtitle: isExit ? 'Sua saída foi registrada com sucesso!' : 'Sua entrada foi creditada com sucesso!',
      amount: txData.amount,
      from: isExit ? accName : (txData.recipientOrPayer || 'Origem'),
      to: isExit ? (txData.recipientOrPayer || txData.description) : accName,
      category: txData.category,
    });
    setIsSuccessReceiptOpen(true);
  };

  const handleAdjustWalletBalance = (accountId: string, newBalance: number, notes?: string) => {
    const acc = walletAccounts.find(a => a.id === accountId);
    if (!acc) return;
    const diff = newBalance - acc.currentBalance;

    const newTx: WalletTransaction = {
      id: `wtx-${crypto.randomUUID()}`,
      accountId,
      type: 'ajuste',
      amount: Math.abs(diff),
      description: diff >= 0 ? `Ajuste positivo de saldo (+${formatCurrency(diff)})` : `Ajuste negativo de saldo (-${formatCurrency(Math.abs(diff))})`,
      category: 'ajuste',
      date: todayLocalISO(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    };

    setWalletTransactions(prev => [newTx, ...prev]);
    setWalletAccounts(prev => prev.map(a => a.id === accountId ? { ...a, currentBalance: newBalance } : a));
  };

  const handleDeleteWalletTransaction = (id: string) => {
    const tx = walletTransactions.find(t => t.id === id);
    if (!tx) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Movimentação',
      description: `Deseja excluir a movimentação "${tx.description}" (${formatCurrency(tx.amount)})? O saldo da conta será recalculado automaticamente.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => {
        // Revert balance
        const isExit = ['pix_out', 'debito', 'dinheiro_gasto', 'transferencia_saida'].includes(tx.type);
        const isEntry = ['pix_in', 'deposito', 'transferencia_entrada'].includes(tx.type);

        if (isExit) {
          setWalletAccounts(prev => prev.map(a => a.id === tx.accountId ? { ...a, currentBalance: a.currentBalance + tx.amount } : a));
        } else if (isEntry) {
          setWalletAccounts(prev => prev.map(a => a.id === tx.accountId ? { ...a, currentBalance: a.currentBalance - tx.amount } : a));
        }

        setWalletTransactions(prev => prev.filter(t => t.id !== id));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Savings Goals Handlers
  const handleSaveMonthlyTarget = async (target: MonthlySavingsTarget) => {
    const updated = {
      ...monthlyTargets,
      [target.month]: target,
    };
    setMonthlyTargets(updated);

    if (currentUser?.uid) {
      const userKeyPrefix = `user_${currentUser.uid}_`;
      try {
        localStorage.setItem(userKeyPrefix + STORAGE_KEYS.MONTHLY_TARGETS, JSON.stringify(updated));
        localStorage.setItem(STORAGE_KEYS.MONTHLY_TARGETS, JSON.stringify(updated));
      } catch {}

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, sanitizeForFirestore({
          monthlyTargets: updated,
          updatedAt: new Date().toISOString(),
        }), { merge: true });
      } catch (err) {
        console.warn('Error saving monthly target to Firestore:', err);
      }
    }
  };

  const handleDeleteMonthlyTarget = async (month: string) => {
    const copy = { ...monthlyTargets };
    delete copy[month];
    setMonthlyTargets(copy);

    if (currentUser?.uid) {
      const userKeyPrefix = `user_${currentUser.uid}_`;
      try {
        localStorage.setItem(userKeyPrefix + STORAGE_KEYS.MONTHLY_TARGETS, JSON.stringify(copy));
        localStorage.setItem(STORAGE_KEYS.MONTHLY_TARGETS, JSON.stringify(copy));
      } catch {}

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, sanitizeForFirestore({
          monthlyTargets: copy,
          updatedAt: new Date().toISOString(),
        }), { merge: true });
      } catch (err) {
        console.warn('Error deleting monthly target from Firestore:', err);
      }
    }
  };

  const handleSaveAccumulationGoal = async (goal: AccumulationGoal) => {
    let updated: AccumulationGoal[];
    const index = accumulationGoals.findIndex(g => g.id === goal.id);
    if (index >= 0) {
      const copy = [...accumulationGoals];
      copy[index] = goal;
      updated = copy;
    } else {
      updated = [goal, ...accumulationGoals];
    }
    setAccumulationGoals(updated);

    if (currentUser?.uid) {
      const userKeyPrefix = `user_${currentUser.uid}_`;
      try {
        localStorage.setItem(userKeyPrefix + STORAGE_KEYS.ACCUMULATION_GOALS, JSON.stringify(updated));
        localStorage.setItem(STORAGE_KEYS.ACCUMULATION_GOALS, JSON.stringify(updated));
      } catch {}

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, sanitizeForFirestore({
          accumulationGoals: updated,
          updatedAt: new Date().toISOString(),
        }), { merge: true });
      } catch (err) {
        console.warn('Error saving goal to Firestore:', err);
      }
    }
  };

  const handleDeleteAccumulationGoal = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Meta de Poupança',
      description: 'Tem certeza que deseja excluir esta meta? Seu progresso registrado será perdido.',
      confirmText: 'Excluir Meta',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'trash',
      onConfirm: async () => {
        const updated = accumulationGoals.filter(g => g.id !== id);
        setAccumulationGoals(updated);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));

        if (currentUser?.uid) {
          const userKeyPrefix = `user_${currentUser.uid}_`;
          try {
            localStorage.setItem(userKeyPrefix + STORAGE_KEYS.ACCUMULATION_GOALS, JSON.stringify(updated));
            localStorage.setItem(STORAGE_KEYS.ACCUMULATION_GOALS, JSON.stringify(updated));
          } catch {}

          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, sanitizeForFirestore({
              accumulationGoals: updated,
              updatedAt: new Date().toISOString(),
            }), { merge: true });
          } catch (err) {
            console.warn('Error deleting goal from Firestore:', err);
          }
        }
      },
    });
  };

  const handleTabChange = (tab: MainTabType) => {
    setActiveTab(tab);
  };

  const handleSaveProfile = async (updatedProfile: UserProfile, syncWithPersonMe: boolean) => {
    setUserProfile(updatedProfile);
    const userKeyPrefix = currentUser ? `user_${currentUser.uid}_` : '';
    try {
      localStorage.setItem(userKeyPrefix + STORAGE_KEYS.PROFILE, JSON.stringify(updatedProfile));
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updatedProfile));
    } catch (storageErr) {
      console.warn('LocalStorage save profile notice:', storageErr);
    }

    if (currentUser) {
      const isFirebaseAuth = Boolean(auth.currentUser && auth.currentUser.uid === currentUser.uid);
      if (isFirebaseAuth && 'providerId' in currentUser) {
        try {
          await updateProfile(currentUser as User, {
            displayName: updatedProfile.nickname,
            photoURL: updatedProfile.photoURL || null,
          });
        } catch (e) {
          console.warn('Could not update Firebase Auth profile:', e);
        }
      }

      if (isFirebaseAuth) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          // Remover campos sensíveis de segurança local antes de enviar ao Firestore
          const { appLockPin: _pin, ...profileForCloud } = updatedProfile;
          await setDoc(userDocRef, sanitizeForFirestore({
            profile: profileForCloud,
            updatedAt: new Date().toISOString(),
          }), { merge: true });
        } catch (e) {
          console.warn('Firestore profile save notice:', e);
        }
      }
    }

    if (syncWithPersonMe) {
      setPeople(prev => prev.map(p => {
        if (p.isSelf || p.id === 'person-me') {
          const preferredName = updatedProfile.nickname || updatedProfile.name || 'Meu';
          return {
            ...p,
            name: preferredName.startsWith('Meu') ? preferredName : `Meu (${preferredName})`,
            phone: updatedProfile.phone || p.phone,
            pixKey: updatedProfile.pixKey || p.pixKey,
            photoURL: updatedProfile.photoURL || p.photoURL,
            email: updatedProfile.email || p.email,
            cpf: updatedProfile.cpf || p.cpf,
          };
        }
        return p;
      }));
    }
  };

  const handleWipeData = async () => {
    if (!currentUser) return;
    try {
      const isFirebaseAuth = Boolean(auth.currentUser && auth.currentUser.uid === currentUser.uid);
      if (isFirebaseAuth) {
        const path = `users/${currentUser.uid}`;
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDoc(userDocRef, sanitizeForFirestore({
            expenses: INITIAL_EXPENSES,
            incomes: INITIAL_INCOMES,
            cards: INITIAL_CARDS,
            people: INITIAL_PEOPLE,
            folders: INITIAL_FOLDERS,
            boxes: INITIAL_BOXES,
            paidBills: [],
            subscriptions: INITIAL_SUBSCRIPTIONS,
            driverTrips: INITIAL_DRIVER_TRIPS,
            driverExpenses: INITIAL_DRIVER_EXPENSES,
            driverGoals: INITIAL_DRIVER_GOALS,
            extraProfile: INITIAL_EXTRA_PROFILE,
            freelanceEntries: INITIAL_FREELANCE_ENTRIES,
            freelanceExpenses: INITIAL_FREELANCE_EXPENSES,
            freelanceGoals: INITIAL_FREELANCE_GOALS,
            walletAccounts: INITIAL_WALLET_ACCOUNTS,
            walletTransactions: INITIAL_WALLET_TRANSACTIONS,
            profile: {
              name: currentUser.displayName || undefined,
              nickname: currentUser.displayName || undefined,
              email: currentUser.email || undefined,
              photoURL: currentUser.photoURL || undefined,
              photoSource: currentUser.photoURL ? 'google' : undefined,
              phone: 'phoneNumber' in currentUser ? (currentUser as { phoneNumber?: string }).phoneNumber : undefined,
            }
          }));
        } catch (err: unknown) {
          const firestoreErr = err as { code?: string; message?: string };
          if (firestoreErr?.code === 'permission-denied' || firestoreErr?.message?.includes('permissions')) {
            handleFirestoreError(err, OperationType.WRITE, path);
          } else {
            throw err;
          }
        }
      }

      // Clear local storage
      const userKeyPrefix = `user_${currentUser.uid}_`;
      (Object.keys(STORAGE_KEYS) as Array<keyof typeof STORAGE_KEYS>).forEach(key => {
        const k = STORAGE_KEYS[key];
        localStorage.removeItem(userKeyPrefix + k);
        localStorage.removeItem(k);
      });

      // Reset local react state
      setExpenses(INITIAL_EXPENSES);
      setIncomes(INITIAL_INCOMES);
      setCards(INITIAL_CARDS);
      setPeople(INITIAL_PEOPLE);
      setFolders(INITIAL_FOLDERS);
      setBoxes(INITIAL_BOXES);
      setPaidBills([]);
      setSubscriptions(INITIAL_SUBSCRIPTIONS);
      setDriverTrips(INITIAL_DRIVER_TRIPS);
      setDriverExpenses(INITIAL_DRIVER_EXPENSES);
      setDriverGoals(INITIAL_DRIVER_GOALS);
      setExtraProfile(INITIAL_EXTRA_PROFILE);
      setFreelanceEntries(INITIAL_FREELANCE_ENTRIES);
      setFreelanceExpenses(INITIAL_FREELANCE_EXPENSES);
      setFreelanceGoals(INITIAL_FREELANCE_GOALS);
      setWalletAccounts(INITIAL_WALLET_ACCOUNTS);
      setWalletTransactions(INITIAL_WALLET_TRANSACTIONS);

      window.location.reload();
    } catch (e) {
      console.error('Error wiping data:', e);
    }
  };

  const handleSignOut = async () => {
    setDataLoadedFromCloud(false);
    loadedUidRef.current = null;
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Error signing out:', e);
    }
    try {
      localStorage.removeItem(STORAGE_KEYS.LOCAL_USER);
    } catch (e) {
      console.error('Error clearing local user session:', e);
    }

    setExpenses([]);
    setIncomes([]);
    setCards([]);
    setPeople(INITIAL_PEOPLE);
    setFolders(INITIAL_FOLDERS);
    setBoxes([]);
    setPaidBills([]);
    setSubscriptions(INITIAL_SUBSCRIPTIONS);
    setDriverTrips(INITIAL_DRIVER_TRIPS);
    setDriverExpenses(INITIAL_DRIVER_EXPENSES);
    setDriverGoals(INITIAL_DRIVER_GOALS);
    setExtraProfile(INITIAL_EXTRA_PROFILE);
    setFreelanceEntries(INITIAL_FREELANCE_ENTRIES);
    setFreelanceExpenses(INITIAL_FREELANCE_EXPENSES);
    setFreelanceGoals(INITIAL_FREELANCE_GOALS);
    setWalletAccounts(INITIAL_WALLET_ACCOUNTS);
    setWalletTransactions(INITIAL_WALLET_TRANSACTIONS);
    setUserProfile({});
    setCurrentUser(null);
  };

  const handleAccountDeleted = async () => {
    setDataLoadedFromCloud(false);
    loadedUidRef.current = null;
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Error signing out after LGPD deletion:', e);
    }

    setExpenses([]);
    setIncomes([]);
    setCards([]);
    setPeople(INITIAL_PEOPLE);
    setFolders(INITIAL_FOLDERS);
    setBoxes([]);
    setPaidBills([]);
    setSubscriptions(INITIAL_SUBSCRIPTIONS);
    setDriverTrips(INITIAL_DRIVER_TRIPS);
    setDriverExpenses(INITIAL_DRIVER_EXPENSES);
    setDriverGoals(INITIAL_DRIVER_GOALS);
    setExtraProfile(INITIAL_EXTRA_PROFILE);
    setFreelanceEntries(INITIAL_FREELANCE_ENTRIES);
    setFreelanceExpenses(INITIAL_FREELANCE_EXPENSES);
    setFreelanceGoals(INITIAL_FREELANCE_GOALS);
    setWalletAccounts(INITIAL_WALLET_ACCOUNTS);
    setWalletTransactions(INITIAL_WALLET_TRANSACTIONS);
    setUserProfile({});
    setIsDeleteAccountModalOpen(false);
    setIsProfileModalOpen(false);
    setCurrentUser(null);
  };

  // Quick auth check loading spinner if auth is pending
  if (authLoading) {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center ${isDarkMode ? 'bg-[#000000]' : 'bg-white'}`}>
        <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Show Login/Signup Screen if not authenticated
  if (!currentUser) {
    return <AuthView onLocalLogin={handleLocalLogin} isDarkMode={isDarkMode} />;
  }

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-clip ${isDarkMode ? 'dark bg-[#000000] text-slate-100' : 'bg-[#F7F8FA] text-slate-900'} font-sans antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-200`}>
      {isLocked && (
        <LockScreen 
          userProfile={userProfile} 
          userEmail={currentUser.isAnonymous ? undefined : currentUser.email || userProfile.email}
          onUnlock={() => setIsLocked(false)} 
          onUpdatePin={handleUpdatePinFromLock}
          onSignOut={handleSignOut}
          onSaveProfile={(profile) => handleSaveProfile(profile, false)}
        />
      )}
      {isPinSetupOpen && (
        <PinSetupModal
          isOpen={isPinSetupOpen}
          userEmail={currentUser.isAnonymous ? undefined : currentUser.email || userProfile.email}
          onComplete={handleCompletePinSetup}
          onSkip={handleSkipPinSetup}
        />
      )}
      {/* Main app chrome and content (hidden while full-screen PIN Setup or Lock Screen is active) */}
      {!isLocked && !isPinSetupOpen && (
        <div 
          onTouchStart={handleGlobalTouchStart}
          onTouchMove={handleGlobalTouchMove}
          onTouchEnd={handleGlobalTouchEnd}
          style={{
            transform: globalSwipeOffset > 0 ? `translateX(${globalSwipeOffset}px)` : undefined,
            transition: globalSwipeOffset > 0 ? (isGlobalSwiping ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)') : undefined,
          }}
          className="flex flex-col lg:flex-row min-h-screen w-full relative"
        >
          {globalSwipeOffset > 20 && (
            <div className="fixed top-0 bottom-0 left-0 w-2 bg-emerald-500/50 z-50 pointer-events-none flex items-center justify-center">
              <div className="w-1.5 h-16 bg-emerald-600 rounded-full shadow-lg" />
            </div>
          )}
          {/* Desktop Sidebar Column */}
          <Sidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onOpenAddExpense={() => handleOpenAddExpenseWithDefaults()}
            onOpenAddIncome={() => {
              setEditingIncome(null);
              setIsAddIncomeOpen(true);
            }}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            userProfile={userProfile}
            isBalanceVisible={isBalanceVisible}
            onToggleBalanceVisible={() => setIsBalanceVisible(!isBalanceVisible)}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <OfflineBanner isOnline={isOnline} />
            {/* Header with month navigation, auth info & tab switching */}
            <Header
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              summary={summary}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onOpenAddExpense={() => handleOpenAddExpenseWithDefaults()}
              onOpenExport={() => setIsExportOpen(true)}
              isDarkMode={isDarkMode}
              onToggleDarkMode={toggleDarkMode}
              userEmail={currentUser.isAnonymous ? 'Visitante' : currentUser.email}
              profile={userProfile}
              onOpenProfile={() => setIsProfileModalOpen(true)}
              onSignOut={handleSignOut}
              onOpenTutorial={() => setIsTutorialOpen(true)}
              cards={cards}
              subscriptions={subscriptions}
              expenses={expenses}
              isSyncing={isSyncing}
              lastSyncedAt={lastSyncedAt}
              isOnline={isOnline}
            />

            {/* Main Content Area (extra bottom padding on mobile for MobileBottomNav) */}
            <main className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-10">
        <PullToRefresh onRefresh={handleManualRefresh}>
          {!dataLoadedFromCloud ? (
            <DashboardSkeleton />
          ) : (
          <ErrorBoundary>
            <Suspense fallback={<ViewLoadingFallback />}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 14, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.995 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full"
                >
            {activeTab === 'dashboard' && (
            <ChartsDashboard
              currentMonth={currentMonth}
              summary={summary}
              expenses={expenses}
              incomes={incomes}
              accumulationGoals={accumulationGoals}
              onSaveAccumulationGoal={handleSaveAccumulationGoal}
              cards={cards}
              people={people}
              paidBills={paidBills}
              onNavigateToTab={handleTabChange}
              onSelectMonth={setCurrentMonth}
              isDarkMode={isDarkMode}
              onOpenTutorial={() => setIsTutorialOpen(true)}
              onOpenAddExpense={() => handleOpenAddExpenseWithDefaults()}
              onOpenAddIncome={() => {
                setEditingIncome(null);
                setIsAddIncomeOpen(true);
              }}
              onPayBill={handlePayBill}
              onNextMonth={handleAdvanceToNextMonth}
              isBalanceVisible={isBalanceVisible}
              onToggleBalance={handleToggleBalance}
              walletAccounts={walletAccounts}
              walletTransactions={walletTransactions}
              investmentBoxes={boxes}
              subscriptions={subscriptions}
              driverTrips={driverTrips}
              driverExpenses={driverExpenses}
              driverGoals={driverGoals}
              extraProfile={extraProfile}
              freelanceEntries={freelanceEntries}
              freelanceExpenses={freelanceExpenses}
              freelanceGoals={freelanceGoals}
              userProfile={userProfile}
              onOpenProfile={() => setIsProfileModalOpen(true)}
              onSaveProfile={(prof) => handleSaveProfile(prof, false)}
              onOpenAddWalletTransaction={(mode, accountId) => {
                setWalletTransactionMode(mode || 'expense');
                setWalletPreselectedAccountId(accountId);
                setIsAddWalletTransactionOpen(true);
              }}
            />
          )}

          {activeTab === 'assinaturas' && (
            <SubscriptionsView
              subscriptions={subscriptions}
              cards={cards}
              people={people}
              onOpenAddSubscription={() => {
                setEditingSubscription(null);
                setIsAddSubscriptionOpen(true);
              }}
              onEditSubscription={handleEditSubscription}
              onDeleteSubscription={handleDeleteSubscription}
              onToggleSubscriptionActive={handleToggleSubscriptionActive}
              onQuickAddPreset={handleQuickAddPreset}
            />
          )}

          {(activeTab === 'extra' || activeTab === 'freelancer' || activeTab === 'meuuber') && (
            <ExtraView
              config={{
                ...extraProfile,
                workType: activeTab === 'freelancer' ? 'freelancer' : activeTab === 'meuuber' ? 'motorista_app' : (extraProfile.workType || 'motorista_app')
              }}
              onSaveConfig={(newConfig) => setExtraProfile(newConfig)}
              driverTrips={driverTrips}
              driverExpenses={driverExpenses}
              driverGoals={driverGoals}
              onAddDriverTrip={handleSaveDriverTrip}
              onDeleteDriverTrip={handleDeleteDriverTrip}
              onAddDriverExpense={handleSaveDriverExpense}
              onDeleteDriverExpense={handleDeleteDriverExpense}
              onSaveDriverGoals={handleSaveDriverGoals}
              onSaveDriverShift={handleSaveDriverShift}
              freelanceEntries={freelanceEntries}
              freelanceExpenses={freelanceExpenses}
              freelanceGoals={freelanceGoals}
              onOpenAddFreelanceEntry={() => {
                setEditingFreelanceEntry(null);
                setIsAddFreelanceEntryOpen(true);
              }}
              onOpenEditFreelanceEntry={(entry) => {
                setEditingFreelanceEntry(entry);
                setIsAddFreelanceEntryOpen(true);
              }}
              onDeleteFreelanceEntry={handleDeleteFreelanceEntry}
              onOpenAddFreelanceExpense={() => {
                setEditingFreelanceExpense(null);
                setIsAddFreelanceExpenseOpen(true);
              }}
              onOpenEditFreelanceExpense={(expense) => {
                setEditingFreelanceExpense(expense);
                setIsAddFreelanceExpenseOpen(true);
              }}
              onDeleteFreelanceExpense={handleDeleteFreelanceExpense}
              onOpenFreelanceGoals={() => setIsFreelanceGoalsOpen(true)}
              onSaveFreelanceShift={handleSaveFreelanceShift}
              accounts={walletAccounts}
              currentMonth={currentMonth}
              userEmail={currentUser.isAnonymous ? 'Visitante' : (currentUser.email || undefined)}
              onNavigateToWallet={() => handleTabChange('carteira')}
            />
          )}

          {activeTab === 'cartoes' && (
            <CardsView
              cards={cards}
              people={people}
              activeExpenses={activeExpenses}
              currentMonth={currentMonth}
              paidBills={paidBills}
              onOpenAddCard={handleOpenAddCard}
              onEditCard={handleEditCard}
              onDeleteCard={handleDeleteCard}
              onOpenAddExpenseForCard={(cardId) => handleOpenAddExpenseWithDefaults(undefined, cardId)}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
              onPayBill={handlePayBill}
              onUnpayBill={handleUnpayBill}
              newlyAddedCardId={newlyAddedCardId}
            />
          )}

          {activeTab === 'pessoas' && (
            <PeopleSplitView
              people={people}
              cards={cards}
              activeExpenses={activeExpenses}
              currentMonth={currentMonth}
              userProfile={userProfile}
              onToggleExpensePaid={handleToggleExpensePaid}
              onMarkAllPersonExpensesPaid={handleMarkAllPersonExpensesPaid}
              onOpenAddPerson={() => {
                setEditingPerson(null);
                setIsAddPersonOpen(true);
              }}
              onEditPerson={(person) => {
                setEditingPerson(person);
                setIsAddPersonOpen(true);
              }}
              onDeletePerson={handleDeletePerson}
              onOpenAddExpenseForPerson={(personId) => handleOpenAddExpenseWithDefaults(personId, undefined)}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeTab === 'investimentos' && (
            <InvestmentsView
              folders={folders}
              boxes={boxes}
              onOpenAddFolder={() => {
                setEditingFolder(null);
                setIsAddFolderOpen(true);
              }}
              onEditFolder={(folder) => {
                setEditingFolder(folder);
                setIsAddFolderOpen(true);
              }}
              onDeleteFolder={handleDeleteFolder}
              onOpenAddBox={handleOpenAddBoxForFolder}
              onEditBox={(box) => {
                setEditingBox(box);
                setIsAddBoxOpen(true);
              }}
              onDeleteBox={handleDeleteBox}
              onOpenDeposit={handleOpenDepositModal}
              onOpenWithdraw={handleOpenWithdrawModal}
            />
          )}

          {activeTab === 'carteira' && (
            <WalletView
              accounts={walletAccounts}
              transactions={walletTransactions}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              onOpenAddAccount={() => {
                setEditingWalletAccount(null);
                setIsAddWalletAccountOpen(true);
              }}
              onOpenEditAccount={(account) => {
                setEditingWalletAccount(account);
                setIsAddWalletAccountOpen(true);
              }}
              onDeleteAccount={handleDeleteWalletAccount}
              onOpenAddTransaction={(initialMode, accountId) => {
                setWalletTransactionMode(initialMode || 'expense');
                setWalletPreselectedAccountId(accountId);
                setIsAddWalletTransactionOpen(true);
              }}
              onDeleteTransaction={handleDeleteWalletTransaction}
              creditCards={cards}
              monthSummary={summary}
              isBalanceVisible={isBalanceVisible}
              onToggleBalance={handleToggleBalance}
              onConfirmFutureTransaction={handleConfirmFutureTransaction}
            />
          )}

          {activeTab === 'metas' && (
            <SavingsGoalsView
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              summary={summary}
              incomes={incomes}
              expenses={expenses}
              monthlyTargets={monthlyTargets}
              onSaveMonthlyTarget={handleSaveMonthlyTarget}
              onDeleteMonthlyTarget={handleDeleteMonthlyTarget}
              accumulationGoals={accumulationGoals}
              onSaveAccumulationGoal={handleSaveAccumulationGoal}
              onDeleteAccumulationGoal={handleDeleteAccumulationGoal}
              isBalanceVisible={isBalanceVisible}
            />
          )}
                </motion.div>
              </AnimatePresence>
        </Suspense>
        </ErrorBoundary>
        )}
        </PullToRefresh>

        {/* Strategic Brand Footer */}
        <footer className="hidden sm:flex mt-8 pt-6 pb-6 border-t border-slate-200/60 dark:border-slate-800/80 flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <GastoLogo size={28} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                <span>Gastô</span>
                <span className="text-emerald-600 dark:text-emerald-400">?</span>
                <span className="text-xs font-normal text-slate-500 text-slate-500 dark:text-slate-400 ml-1.5">v2.0</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Controle financeiro inteligente de cartões & divisão de gastos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Conexão protegida (HTTPS) • Só você acessa seus dados</span>
            <span>•</span>
            <button 
              type="button" 
              onClick={() => setIsTutorialOpen(true)}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium"
            >
              Guia & Tutorial
            </button>
          </div>
        </footer>
      </main>

      {/* Mobile Bottom Navigation Bar (Visible on mobile screens, hidden in MeuUber view to show dedicated driver FAB) */}
      {activeTab !== 'meuuber' && (
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onOpenAddExpense={() => handleOpenAddExpenseWithDefaults()}
          onOpenAddIncome={() => {
            setEditingIncome(null);
            setIsAddIncomeOpen(true);
          }}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />
      )}
          </div>
        </div>
      )}

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        editingExpense={editingExpense}
        cards={cards}
        people={people}
        currentMonth={currentMonth}
        defaultPersonId={defaultPersonId}
        defaultCardId={defaultCardId}
      />

      <AddSubscriptionModal
        isOpen={isAddSubscriptionOpen}
        onClose={() => {
          setIsAddSubscriptionOpen(false);
          setEditingSubscription(null);
        }}
        onSave={handleSaveSubscription}
        editingSubscription={editingSubscription}
        cards={cards}
        people={people}
      />

      <AddIncomeModal
        isOpen={isAddIncomeOpen}
        onClose={() => {
          setIsAddIncomeOpen(false);
          setEditingIncome(null);
        }}
        onSave={handleSaveIncome}
        editingIncome={editingIncome}
        currentMonth={currentMonth}
        accounts={walletAccounts}
      />

      <AddPersonModal
        isOpen={isAddPersonOpen}
        onClose={() => {
          setIsAddPersonOpen(false);
          setEditingPerson(null);
        }}
        onSave={handleSavePerson}
        editingPerson={editingPerson}
      />

      <AddCardModal
        isOpen={isAddCardOpen}
        onClose={() => {
          setIsAddCardOpen(false);
          setEditingCard(null);
        }}
        onSave={handleSaveCard}
        editingCard={editingCard}
        onDelete={handleDeleteCard}
      />

      <AddInvestmentFolderModal
        isOpen={isAddFolderOpen}
        onClose={() => {
          setIsAddFolderOpen(false);
          setEditingFolder(null);
        }}
        onSaveFolder={handleSaveFolder}
        folderToEdit={editingFolder}
      />

      <AddInvestmentBoxModal
        isOpen={isAddBoxOpen}
        onClose={() => {
          setIsAddBoxOpen(false);
          setEditingBox(null);
          setDefaultFolderIdForBox(undefined);
        }}
        onSaveBox={handleSaveBox}
        folders={folders}
        boxToEdit={editingBox}
        defaultFolderId={defaultFolderIdForBox}
      />

      <DepositWithdrawModal
        isOpen={isDepositWithdrawOpen}
        onClose={() => {
          setIsDepositWithdrawOpen(false);
          setSelectedBoxForDeposit(null);
        }}
        box={selectedBoxForDeposit}
        mode={depositModalType}
        onConfirm={handleDepositWithdraw}
        userId={currentUser?.uid ?? ''}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        expenses={expenses}
        activeExpenses={activeExpenses}
        cards={cards}
        people={people}
        currentMonth={currentMonth}
        summary={summary}
        walletAccounts={walletAccounts}
        walletTransactions={walletTransactions}
        boxes={boxes}
        folders={folders}
        driverTrips={driverTrips}
        driverExpenses={driverExpenses}
        freelanceEntries={freelanceEntries}
        freelanceExpenses={freelanceExpenses}
        subscriptions={subscriptions}
      />

      <LegalTermsModal
        isOpen={isLegalTermsOpen}
        onClose={() => setIsLegalTermsOpen(false)}
        onOpenDeleteAccount={() => setIsDeleteAccountModalOpen(true)}
      />

      <ConfirmDialogModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
        icon={confirmDialog.icon}
      />

      {/* Interactive Onboarding Tutorial Modal */}
      <OnboardingTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onOpenAddCard={() => {
          setIsTutorialOpen(false);
          setIsAddCardOpen(true);
        }}
        onOpenAddPerson={() => {
          setIsTutorialOpen(false);
          setIsAddPersonOpen(true);
        }}
        onOpenAddExpense={() => {
          setIsTutorialOpen(false);
          handleOpenAddExpenseWithDefaults();
        }}
        onOpenAddWalletAccount={() => {
          setIsTutorialOpen(false);
          setIsAddWalletAccountOpen(true);
        }}
      />

      {/* User Profile Settings Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userEmail={currentUser.isAnonymous ? 'Visitante' : currentUser.email}
        currentUser={currentUser}
        profile={userProfile}
        people={people}
        cards={cards}
        expenses={expenses}
        boxes={boxes}
        paidBills={paidBills}
        currentMonth={currentMonth}
        onSaveProfile={handleSaveProfile}
        onSignOut={handleSignOut}
        onOpenLegalTerms={() => setIsLegalTermsOpen(true)}
        onOpenPinSetup={() => setIsPinSetupOpen(true)}
        onOpenDeleteAccount={() => setIsDeleteAccountModalOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* LGPD Delete Account and Data Modal */}
      <DeleteAccountModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        currentUser={currentUser}
        userEmail={currentUser.isAnonymous ? 'Visitante' : currentUser.email}
        boxes={boxes}
        onOpenExport={() => setIsExportOpen(true)}
        onAccountDeleted={handleAccountDeleted}
      />

      {/* Wallet Modals */}
      <AddWalletAccountModal
        isOpen={isAddWalletAccountOpen}
        onClose={() => {
          setIsAddWalletAccountOpen(false);
          setEditingWalletAccount(null);
        }}
        onSave={handleSaveWalletAccount}
        onDelete={handleDeleteWalletAccount}
        editingAccount={editingWalletAccount}
      />

      <AddWalletTransactionModal
        isOpen={isAddWalletTransactionOpen}
        onClose={() => {
          setIsAddWalletTransactionOpen(false);
          setWalletPreselectedAccountId(undefined);
        }}
        accounts={walletAccounts}
        onAddTransaction={handleAddWalletTransaction}
        onAdjustBalance={handleAdjustWalletBalance}
        preselectedAccountId={walletPreselectedAccountId}
        initialMode={walletTransactionMode}
      />

      {/* Freelance Modals */}
      <AddFreelanceEntryModal
        isOpen={isAddFreelanceEntryOpen}
        onClose={() => {
          setIsAddFreelanceEntryOpen(false);
          setEditingFreelanceEntry(null);
        }}
        onSave={handleSaveFreelanceEntry}
        editingEntry={editingFreelanceEntry}
        currentMonth={currentMonth}
        accounts={walletAccounts}
      />

      <AddFreelanceExpenseModal
        isOpen={isAddFreelanceExpenseOpen}
        onClose={() => {
          setIsAddFreelanceExpenseOpen(false);
          setEditingFreelanceExpense(null);
        }}
        onSave={handleSaveFreelanceExpense}
        editingExpense={editingFreelanceExpense}
        currentMonth={currentMonth}
        accounts={walletAccounts}
      />

      <FreelanceGoalsModal
        isOpen={isFreelanceGoalsOpen}
        onClose={() => setIsFreelanceGoalsOpen(false)}
        goals={freelanceGoals}
        onSave={handleSaveFreelanceGoals}
      />

      {/* Transaction Confirmation Receipt Modal */}
      <TransactionSuccessModal
        isOpen={isSuccessReceiptOpen}
        onClose={() => {
          setIsSuccessReceiptOpen(false);
          setSuccessReceiptData(null);
        }}
        data={successReceiptData}
      />
    </div>
  );
}
