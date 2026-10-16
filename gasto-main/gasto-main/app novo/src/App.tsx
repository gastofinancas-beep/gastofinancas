import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, User, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { sanitizeForFirestore } from './lib/sanitizeFirestore';
import { AuthView, LocalAuthUser } from './components/AuthView';
import { Header } from './components/Header';
import { GastoLogo } from './components/GastoLogo';
import { ChartsDashboard } from './components/ChartsDashboard';
import { PeopleSplitView } from './components/PeopleSplitView';
import { CardsView } from './components/CardsView';
import { InvestmentsView } from './components/InvestmentsView';
import { CashFlowView } from './components/CashFlowView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AddExpenseModal } from './components/AddExpenseModal';
import { AddIncomeModal } from './components/AddIncomeModal';
import { AddPersonModal } from './components/AddPersonModal';
import { AddCardModal } from './components/AddCardModal';
import { AddInvestmentFolderModal } from './components/AddInvestmentFolderModal';
import { AddInvestmentBoxModal } from './components/AddInvestmentBoxModal';
import { DepositWithdrawModal } from './components/DepositWithdrawModal';
import { ExportModal } from './components/ExportModal';
import { ConfirmDialogModal } from './components/ConfirmDialogModal';
import { OnboardingTutorialModal } from './components/OnboardingTutorialModal';
import { ProfileModal } from './components/ProfileModal';
import { DriverView } from './components/DriverView';
import { SubscriptionsView } from './components/SubscriptionsView';
import { AddSubscriptionModal } from './components/AddSubscriptionModal';

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
  DriverGoals
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
  INITIAL_SUBSCRIPTIONS,
  ServicePreset
} from './data/subscriptionPresets';
import {
  INITIAL_DRIVER_TRIPS,
  INITIAL_DRIVER_EXPENSES,
  INITIAL_DRIVER_GOALS
} from './data/initialDriverData';
import { 
  calculateMonthSummary, 
  getActiveExpensesForMonth,
  addMonths,
  formatCurrency,
  localDateString,
  currentMonthYear
} from './utils/financeCalculations';

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
  SUBSCRIPTIONS: 'financas_subscriptions_v1',
};

type AppUser = User | LocalAuthUser;

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOCAL_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoadedFromCloud, setDataLoadedFromCloud] = useState(false);
  const isInitialLoadRef = useRef(true);

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

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          localStorage.removeItem(STORAGE_KEYS.LOCAL_USER);
        } catch (e) {}
      } else {
        const saved = localStorage.getItem(STORAGE_KEYS.LOCAL_USER);
        if (saved) {
          try {
            setCurrentUser(JSON.parse(saved));
          } catch (e) {
            setCurrentUser(null);
          }
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLocalLogin = (user: LocalAuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEYS.LOCAL_USER, JSON.stringify(user));
    } catch (e) {
      console.error('Error saving local user session:', e);
    }
  };

  // Current active month in view (default: current month)
  const [currentMonth, setCurrentMonth] = useState<string>(() => currentMonthYear());
  const [activeTab, setActiveTab] = useState<MainTabType>('dashboard');

  const MASTER_ACCOUNT_EMAIL = 'pedrootavio10k@gmail.com';

  // Persistence State
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading expenses', e);
    }
    return INITIAL_EXPENSES;
  });

  const [incomes, setIncomes] = useState<IncomeItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INCOMES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading incomes', e);
    }
    return INITIAL_INCOMES;
  });

  const [cards, setCards] = useState<CreditCard[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CARDS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading cards', e);
    }
    return INITIAL_CARDS;
  });

  const [people, setPeople] = useState<Person[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PEOPLE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading people', e);
    }
    return INITIAL_PEOPLE;
  });

  const [folders, setFolders] = useState<InvestmentFolder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FOLDERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading investment folders', e);
    }
    return INITIAL_FOLDERS;
  });

  const [boxes, setBoxes] = useState<InvestmentBox[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOXES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(b => !b.id.startsWith('box-nu-reserva') && !b.id.startsWith('box-tesouro') && !b.id.startsWith('box-viagem') && !b.id.startsWith('box-passeios') && !b.id.startsWith('box-carro') && !b.id.startsWith('box-notebook') && !b.id.startsWith('box-fiis') && !b.id.startsWith('box-acoes'));
        }
      }
    } catch (e) {
      console.error('Error loading investment boxes', e);
    }
    return INITIAL_BOXES;
  });

  // Paid Credit Card Bills history
  const [paidBills, setPaidBills] = useState<CardBillPayment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAID_BILLS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading paid bills', e);
    }
    return [];
  });

  // Driver / MeuUber State
  const [driverTrips, setDriverTrips] = useState<DriverTrip[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DRIVER_TRIPS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading driver trips', e);
    }
    return INITIAL_DRIVER_TRIPS;
  });

  const [driverExpenses, setDriverExpenses] = useState<DriverExpense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DRIVER_EXPENSES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading driver expenses', e);
    }
    return INITIAL_DRIVER_EXPENSES;
  });

  const [driverGoals, setDriverGoals] = useState<DriverGoals>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DRIVER_GOALS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading driver goals', e);
    }
    return INITIAL_DRIVER_GOALS;
  });

  // Subscriptions State
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading subscriptions', e);
    }
    return INITIAL_SUBSCRIPTIONS;
  });

  const [isAddSubscriptionOpen, setIsAddSubscriptionOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<SubscriptionItem | null>(null);

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading user profile', e);
    }
    return {};
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Onboarding Tutorial State
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // Load user data from Firestore when logged in
  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;
    // Bloqueia o salvamento na nuvem até a carga terminar com sucesso
    isInitialLoadRef.current = true;
    setDataLoadedFromCloud(false);
    const loadUserData = async () => {
      let loadedOk = false;
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        const isMaster = currentUser.email?.toLowerCase() === MASTER_ACCOUNT_EMAIL.toLowerCase();

        if (docSnap.exists() && isMounted) {
          const data = docSnap.data();
          setExpenses(data.expenses || []);
          setIncomes(data.incomes || []);
          setCards(data.cards || []);
          setPeople(data.people || []);
          setFolders(data.folders || []);
          const rawBoxes: InvestmentBox[] = data.boxes || [];
          const cleanedBoxes = rawBoxes.filter(b => !b.id.startsWith('box-nu-reserva') && !b.id.startsWith('box-tesouro') && !b.id.startsWith('box-viagem') && !b.id.startsWith('box-passeios') && !b.id.startsWith('box-carro') && !b.id.startsWith('box-notebook') && !b.id.startsWith('box-fiis') && !b.id.startsWith('box-acoes'));
          setBoxes(cleanedBoxes);
          setPaidBills(data.paidBills || []);
          if (data.subscriptions) setSubscriptions(data.subscriptions);
          if (data.driverTrips) setDriverTrips(data.driverTrips);
          if (data.driverExpenses) setDriverExpenses(data.driverExpenses);
          if (data.driverGoals) setDriverGoals(data.driverGoals);

          if (data.profile) {
            setUserProfile(data.profile);
            localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data.profile));
          } else if (currentUser.displayName || currentUser.photoURL) {
            const initialProf: UserProfile = {
              nickname: currentUser.displayName || undefined,
              photoURL: currentUser.photoURL || undefined,
            };
            setUserProfile(initialProf);
            localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(initialProf));
          }
        } else if (isMounted) {
          if (isMaster) {
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
              updatedAt: new Date().toISOString(),
            }), { merge: true });
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
          } else {
            const defaultSelfName = currentUser.displayName ? `Meu (${currentUser.displayName})` : 'Meu';
            const initialPeople: Person[] = [
              { id: 'person-me', name: defaultSelfName, avatarBg: 'bg-emerald-600', isSelf: true }
            ];
            const initialFolders: InvestmentFolder[] = [
              { id: 'folder-reserva', name: 'Reserva de Emergência', color: '#10B981', icon: 'shield', description: 'Segurança financeira' },
              { id: 'folder-sonhos', name: 'Metas & Sonhos', color: '#3B82F6', icon: 'sparkles', description: 'Conquistas futuras' }
            ];
            const emptyExpenses: ExpenseItem[] = [];
            const emptyIncomes: IncomeItem[] = [];
            const emptyCards: CreditCard[] = [];
            const emptyBoxes: InvestmentBox[] = [];
            const emptyPaidBills: CardBillPayment[] = [];

            await setDoc(userDocRef, sanitizeForFirestore({
              expenses: emptyExpenses,
              incomes: emptyIncomes,
              cards: emptyCards,
              people: initialPeople,
              folders: initialFolders,
              boxes: emptyBoxes,
              paidBills: emptyPaidBills,
              subscriptions: INITIAL_SUBSCRIPTIONS,
              driverTrips: INITIAL_DRIVER_TRIPS,
              driverExpenses: INITIAL_DRIVER_EXPENSES,
              driverGoals: INITIAL_DRIVER_GOALS,
              updatedAt: new Date().toISOString(),
            }), { merge: true });

            setExpenses(emptyExpenses);
            setIncomes(emptyIncomes);
            setCards(emptyCards);
            setPeople(initialPeople);
            setFolders(initialFolders);
            setBoxes(emptyBoxes);
            setPaidBills(emptyPaidBills);
            setSubscriptions(INITIAL_SUBSCRIPTIONS);
            setDriverTrips(INITIAL_DRIVER_TRIPS);
            setDriverExpenses(INITIAL_DRIVER_EXPENSES);
            setDriverGoals(INITIAL_DRIVER_GOALS);

            setIsTutorialOpen(true);
          }
        }
        loadedOk = true;
      } catch (err) {
        // Se a carga falhar, não sincroniza: evita sobrescrever os dados da nuvem com dados locais
        console.error('Error loading data from Firestore:', err);
      } finally {
        if (isMounted && loadedOk) {
          setDataLoadedFromCloud(true);
          isInitialLoadRef.current = false;
        }
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Sync to Firestore & localStorage when data changes
  useEffect(() => {
    const userKeyPrefix = currentUser ? `user_${currentUser.uid}_` : '';
    localStorage.setItem(userKeyPrefix + STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(incomes));
    localStorage.setItem(STORAGE_KEYS.BOXES, JSON.stringify(boxes));
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
    localStorage.setItem(STORAGE_KEYS.PAID_BILLS, JSON.stringify(paidBills));
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
    localStorage.setItem(STORAGE_KEYS.DRIVER_TRIPS, JSON.stringify(driverTrips));
    localStorage.setItem(STORAGE_KEYS.DRIVER_EXPENSES, JSON.stringify(driverExpenses));
    localStorage.setItem(STORAGE_KEYS.DRIVER_GOALS, JSON.stringify(driverGoals));

    if (currentUser && dataLoadedFromCloud && !isInitialLoadRef.current) {
      const timeoutId = setTimeout(async () => {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDoc(userDocRef, sanitizeForFirestore({
            expenses,
            incomes,
            cards,
            people,
            folders,
            boxes,
            paidBills,
            subscriptions,
            driverTrips,
            driverExpenses,
            driverGoals,
            updatedAt: new Date().toISOString(),
          }), { merge: true });
        } catch (e) {
          console.error('Error syncing to Firestore:', e);
        }
      }, 600);

      return () => clearTimeout(timeoutId);
    }
  }, [expenses, incomes, cards, people, folders, boxes, paidBills, subscriptions, driverTrips, driverExpenses, driverGoals, currentUser, dataLoadedFromCloud]);

  // Modal States
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [defaultPersonId, setDefaultPersonId] = useState<string | undefined>(undefined);
  const [defaultCardId, setDefaultCardId] = useState<string | undefined>(undefined);

  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
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

  // Active month calculations
  const activeExpenses = useMemo(() => {
    return getActiveExpensesForMonth(expenses, currentMonth);
  }, [expenses, currentMonth]);

  const summary = useMemo(() => {
    return calculateMonthSummary(expenses, currentMonth);
  }, [expenses, currentMonth]);

  // Handlers: Expense
  const handleSaveExpense = (expenseData: Partial<ExpenseItem>) => {
    if (expenseData.id) {
      setExpenses(prev => prev.map(exp => exp.id === expenseData.id ? { ...exp, ...expenseData } as ExpenseItem : exp));
    } else {
      const newExp: ExpenseItem = {
        id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
        const activeIds = new Set(getActiveExpensesForMonth(expenses, month).map(a => a.expense.id));
        setExpenses(prev => prev.map(exp => {
          if (exp.personId === personId && activeIds.has(exp.id)) {
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
        id: `person-${Date.now()}`,
        name: personData.name || 'Nova Pessoa',
        avatarBg: personData.avatarBg || 'bg-slate-500',
        pixKey: personData.pixKey,
        phone: personData.phone,
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
    const newCard: CreditCard = {
      id: `card-${Date.now()}`,
      name: cardData.name || 'Novo Cartão',
      bank: cardData.bank || 'Banco',
      lastDigits: cardData.lastDigits,
      color: cardData.color || '#3b82f6',
      gradient: cardData.gradient || 'from-blue-600 to-indigo-900',
      limit: cardData.limit || 1000,
      closingDay: cardData.closingDay || 15,
      dueDay: cardData.dueDay || 22,
    };
    setCards(prev => [...prev, newCard]);
  };

  // Handlers: Investment Folder
  const handleSaveFolder = (folderData: Partial<InvestmentFolder>) => {
    if (folderData.id) {
      setFolders(prev => prev.map(f => f.id === folderData.id ? { ...f, ...folderData } as InvestmentFolder : f));
    } else {
      const newFolder: InvestmentFolder = {
        id: `folder-${Date.now()}`,
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
        id: `box-${Date.now()}`,
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
          id: `tx-${Date.now()}`,
          type: 'deposit',
          amount: boxData.currentBalance,
          date: localDateString(),
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

  const handleDepositWithdraw = (boxId: string, amount: number, mode: 'deposit' | 'withdraw', notes?: string) => {
    setBoxes(prev => prev.map(box => {
      if (box.id === boxId) {
        const newBalance = mode === 'deposit' 
          ? box.currentBalance + amount 
          : Math.max(0, box.currentBalance - amount);

        const newTx = {
          id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          type: mode,
          amount,
          date: localDateString(),
          notes: notes || (mode === 'deposit' ? 'Aporte manual' : 'Resgate manual'),
        };

        return {
          ...box,
          currentBalance: newBalance,
          history: [newTx, ...(box.history || [])],
          updatedAt: new Date().toISOString(),
        };
      }
      return box;
    }));
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
  const handlePayBill = (card: CreditCard, amount: number, monthYear: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Confirmar Pagamento da Fatura',
      description: `Deseja marcar a fatura do cartão "${card.name}" do mês ${monthYear} no valor de R$ ${amount.toFixed(2)} como PAGA? O saldo devedor deste mês será zerado e você poderá avançar para a próxima fatura.`,
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
              id: `bill-pay-${Date.now()}`,
              cardId: card.id,
              monthYear,
              amount,
              paidDate: new Date().toISOString(),
            }
          ];
        });

        const activeThisMonth = getActiveExpensesForMonth(expenses, monthYear);
        const cardExpensesInMonth = activeThisMonth.filter(i => i.expense.cardId === card.id);
        const cardExpenseIds = new Set(cardExpensesInMonth.map(i => i.expense.id));

        setExpenses(prev => prev.map(exp => {
          if (cardExpenseIds.has(exp.id)) {
            return {
              ...exp,
              paidByPerson: true,
              paidDate: localDateString(),
            };
          }
          return exp;
        }));

        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleUnpayBill = (cardId: string, monthYear: string) => {
    setPaidBills(prev => prev.filter(p => !(p.cardId === cardId && p.monthYear === monthYear)));
  };

  const handleAdvanceToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  // Reset to starter data
  const handleResetData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Restaurar Dados Iniciais',
      description: 'Deseja restaurar as faturas, entradas e caixinhas para os dados padrão? Todas as informações personalizadas adicionadas nesta conta serão redefinidas.',
      confirmText: 'Restaurar Dados',
      cancelText: 'Cancelar',
      variant: 'warning',
      icon: 'reset',
      onConfirm: () => {
        setExpenses(INITIAL_EXPENSES);
        setIncomes(INITIAL_INCOMES);
        setCards(INITIAL_CARDS);
        setPeople(INITIAL_PEOPLE);
        setFolders(INITIAL_FOLDERS);
        setBoxes(INITIAL_BOXES);
        setSubscriptions(INITIAL_SUBSCRIPTIONS);
        setDriverTrips(INITIAL_DRIVER_TRIPS);
        setDriverExpenses(INITIAL_DRIVER_EXPENSES);
        setDriverGoals(INITIAL_DRIVER_GOALS);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Quick Open Modal with defaults
  const handleOpenAddExpenseWithDefaults = (personId?: string, cardId?: string) => {
    setEditingExpense(null);
    setDefaultPersonId(personId);
    setDefaultCardId(cardId);
    setIsAddExpenseOpen(true);
  };

  // Handlers: Income & Cash Flow
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeItem | null>(null);

  const handleSaveIncome = (incomeData: Partial<IncomeItem>) => {
    if (incomeData.id) {
      setIncomes(prev => prev.map(inc => inc.id === incomeData.id ? { ...inc, ...incomeData } as IncomeItem : inc));
    } else {
      const newInc: IncomeItem = {
        id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        description: incomeData.description || 'Nova Entrada',
        amount: incomeData.amount || 0,
        category: incomeData.category || 'salario',
        type: incomeData.type || 'fixa',
        monthYear: incomeData.monthYear || currentMonth,
        date: incomeData.date || `${currentMonth}-05`,
        received: incomeData.received ?? true,
        receivedDate: incomeData.receivedDate,
        notes: incomeData.notes,
      };
      setIncomes(prev => [newInc, ...prev]);
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
        setIncomes(prev => prev.filter(i => i.id !== id));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleToggleIncomeReceived = (id: string) => {
    setIncomes(prev => prev.map(inc => {
      if (inc.id === id) {
        const nextReceived = !inc.received;
        return {
          ...inc,
          received: nextReceived,
          receivedDate: nextReceived ? localDateString() : undefined,
        };
      }
      return inc;
    }));
  };

  // Driver / MeuUber Handlers
  const handleSaveDriverTrip = (tripData: Omit<DriverTrip, 'id'>, editId?: string) => {
    if (editId) {
      setDriverTrips(prev => prev.map(t => t.id === editId ? { ...tripData, id: editId } : t));
    } else {
      const newTrip: DriverTrip = {
        ...tripData,
        id: `trip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      };
      setDriverTrips(prev => [newTrip, ...prev]);

      // If synced to incomes, also create an income entry
      if (tripData.syncToIncome) {
        const newInc: IncomeItem = {
          id: `inc-uber-${Date.now()}`,
          description: `Corrida ${tripData.app.toUpperCase()} - ${tripData.origin || 'Origem'} / ${tripData.destination || 'Destino'}`,
          amount: tripData.netAmount,
          category: 'freelance',
          type: 'unica',
          monthYear: tripData.date.substring(0, 7),
          date: tripData.date,
          received: true,
          receivedDate: tripData.date,
          notes: `Lançado via MeuUber (${tripData.distanceKm ? tripData.distanceKm + 'km' : ''})`
        };
        setIncomes(prev => [newInc, ...prev]);
      }
    }
  };

  const handleDeleteDriverTrip = (tripId: string) => {
    setDriverTrips(prev => prev.filter(t => t.id !== tripId));
  };

  const handleSaveDriverExpense = (expenseData: Omit<DriverExpense, 'id'>, editId?: string) => {
    if (editId) {
      setDriverExpenses(prev => prev.map(e => e.id === editId ? { ...expenseData, id: editId } : e));
    } else {
      const newExpense: DriverExpense = {
        ...expenseData,
        id: `dexp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      };
      setDriverExpenses(prev => [newExpense, ...prev]);
    }
  };

  const handleDeleteDriverExpense = (expenseId: string) => {
    setDriverExpenses(prev => prev.filter(e => e.id !== expenseId));
  };

  const handleSaveDriverGoals = (newGoals: DriverGoals) => {
    setDriverGoals(newGoals);
  };

  // Subscription Handlers
  const handleSaveSubscription = (subData: Partial<SubscriptionItem>) => {
    if (subData.id) {
      setSubscriptions(prev => prev.map(s => s.id === subData.id ? { ...s, ...subData } as SubscriptionItem : s));
    } else {
      const newSub: SubscriptionItem = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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

  const handleTabChange = (tab: MainTabType) => {
    setActiveTab(tab);
  };

  const handleSaveProfile = async (updatedProfile: UserProfile, syncWithPersonMe: boolean) => {
    setUserProfile(updatedProfile);
    const userKeyPrefix = currentUser ? `user_${currentUser.uid}_` : '';
    localStorage.setItem(userKeyPrefix + STORAGE_KEYS.PROFILE, JSON.stringify(updatedProfile));
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updatedProfile));

    if (currentUser) {
      if ('providerId' in currentUser) {
        try {
          await updateProfile(currentUser as User, {
            displayName: updatedProfile.nickname,
            photoURL: updatedProfile.photoURL || null,
          });
        } catch (e) {
          console.warn('Could not update Firebase Auth profile:', e);
        }
      }

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, sanitizeForFirestore({
          profile: updatedProfile,
          updatedAt: new Date().toISOString(),
        }), { merge: true });
      } catch (e) {
        console.error('Error saving profile to Firestore:', e);
      }
    }

    if (syncWithPersonMe && updatedProfile.nickname) {
      setPeople(prev => prev.map(p => {
        if (p.isSelf || p.id === 'person-me') {
          return {
            ...p,
            name: `Meu (${updatedProfile.nickname})`,
            phone: updatedProfile.phone || p.phone,
            pixKey: updatedProfile.pixKey || p.pixKey,
          };
        }
        return p;
      }));
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Error signing out:', e);
    }
    try {
      localStorage.removeItem(STORAGE_KEYS.LOCAL_USER);
    } catch (e) {}
    setCurrentUser(null);
  };

  // Show loading spinner while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Carregando Finanças...</p>
        </div>
      </div>
    );
  }

  // Show Login/Signup Screen if not authenticated
  if (!currentUser) {
    return <AuthView onLocalLogin={handleLocalLogin} />;
  }

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden ${isDarkMode ? 'dark bg-[#000000] text-slate-100' : 'bg-[#F2F2F7] text-slate-900'} font-sans antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-200`}>
      {/* Sticky Header with month navigation, auth info & tab switching */}
      <Header
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        summary={summary}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenAddExpense={() => handleOpenAddExpenseWithDefaults()}
        onOpenExport={() => setIsExportOpen(true)}
        onResetData={handleResetData}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        userEmail={currentUser.isAnonymous ? 'Visitante' : currentUser.email}
        profile={userProfile}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />

      {/* Main Content Area (extra bottom padding on mobile for MobileBottomNav) */}
      <main className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-10">
        {activeTab === 'dashboard' && (
          <ChartsDashboard
            currentMonth={currentMonth}
            summary={summary}
            expenses={expenses}
            cards={cards}
            people={people}
            paidBills={paidBills}
            onNavigateToTab={handleTabChange}
            onSelectMonth={setCurrentMonth}
            isDarkMode={isDarkMode}
            onOpenTutorial={() => setIsTutorialOpen(true)}
            onOpenAddExpense={() => handleOpenAddExpenseWithDefaults()}
            onPayBill={handlePayBill}
            onNextMonth={handleAdvanceToNextMonth}
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

        {activeTab === 'meuuber' && (
          <DriverView
            trips={driverTrips}
            expenses={driverExpenses}
            goals={driverGoals}
            onAddTrip={handleSaveDriverTrip}
            onDeleteTrip={handleDeleteDriverTrip}
            onAddExpense={handleSaveDriverExpense}
            onDeleteExpense={handleDeleteDriverExpense}
            onSaveGoals={handleSaveDriverGoals}
            currentMonth={currentMonth}
          />
        )}

        {activeTab === 'rendas' && (
          <CashFlowView
            incomes={incomes}
            expenses={expenses}
            currentMonth={currentMonth}
            onSelectMonth={setCurrentMonth}
            onOpenAddIncome={() => {
              setEditingIncome(null);
              setIsAddIncomeOpen(true);
            }}
            onEditIncome={handleEditIncome}
            onDeleteIncome={handleDeleteIncome}
            onToggleIncomeReceived={handleToggleIncomeReceived}
            onNavigateToTab={handleTabChange}
          />
        )}

        {activeTab === 'cartoes' && (
          <CardsView
            cards={cards}
            people={people}
            activeExpenses={activeExpenses}
            currentMonth={currentMonth}
            paidBills={paidBills}
            onOpenAddCard={() => setIsAddCardOpen(true)}
            onOpenAddExpenseForCard={(cardId) => handleOpenAddExpenseWithDefaults(undefined, cardId)}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
            onTogglePaid={handleToggleExpensePaid}
            onPayBill={handlePayBill}
            onUnpayBill={handleUnpayBill}
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

        {/* Strategic Brand Footer */}
        <footer className="hidden sm:flex mt-8 pt-6 pb-6 border-t border-slate-200/80 dark:border-slate-800/80 flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <GastoLogo size={24} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                <span>Gastô</span>
                <span className="text-emerald-600 dark:text-emerald-400">?</span>
                
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                Controle financeiro inteligente de cartões & divisão de gastos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
            <span>Seus dados ficam protegidos por login</span>
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
        />
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
        onClose={() => setIsAddCardOpen(false)}
        onSave={handleSaveCard}
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
      />

      {/* User Profile Settings Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userEmail={currentUser.isAnonymous ? 'Visitante' : currentUser.email}
        profile={userProfile}
        people={people}
        onSaveProfile={handleSaveProfile}
        onSignOut={handleSignOut}
      />
    </div>
  );
}
