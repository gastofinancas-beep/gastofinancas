export interface ExpenseItem {
  id: string;
  description: string;
  category: string;
  amount: number;
  totalAmount?: number;
  type: 'unica' | 'parcelada' | 'fixa';
  cardId: string;
  personId: string;
  totalInstallments?: number;
  currentInstallment?: number;
  startMonthYear: string; // e.g. "2026-08"
  date: string;
  notes?: string;
  paidByPerson?: boolean;
  paidDate?: string;
}

export type IncomeCategory = 'salario' | 'freelance' | 'investimentos' | 'beneficios' | 'vendas' | 'outros';

export interface IncomeItem {
  id: string;
  description: string;
  amount: number;
  category: IncomeCategory;
  type: 'fixa' | 'unica'; // 'fixa' repete todo mês, 'unica' ganho pontual do mês
  monthYear: string; // e.g. "2026-08"
  date: string; // e.g. "2026-08-05"
  received: boolean;
  receivedDate?: string;
  notes?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  lastDigits?: string;
  color: string;
  gradient?: string;
  limit: number;
  closingDay: number;
  dueDay: number;
}

export interface Person {
  id: string;
  name: string;
  avatarBg: string;
  pixKey?: string;
  phone?: string;
  isSelf?: boolean;
}

export interface InvestmentFolder {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
}

export interface InvestmentBoxHistory {
  id: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  date: string;
  notes?: string;
}

export interface InvestmentBox {
  id: string;
  folderId: string;
  title: string;
  currentBalance: number;
  targetAmount?: number;
  monthlyYieldPercent: number;
  yieldDescription?: string;
  institution?: string;
  color: string;
  icon: string;
  notes?: string;
  history?: InvestmentBoxHistory[];
  updatedAt?: string;
}

export interface CardBillPayment {
  id: string;
  cardId: string;
  monthYear: string;
  amount: number;
  paidDate: string;
}

export interface UserProfile {
  nickname?: string;
  phone?: string;
  pixKey?: string;
  photoURL?: string;
}

export interface MonthSummary {
  totalMonth: number;
  totalFixed: number;
  totalInstallments: number;
  totalSingle: number;
  totalPaid: number;
  totalPending: number;
  totalSelf: number;
  totalOthers: number;
}

export type CashFlowSummary = {
  totalIncome: number;
  totalIncomeReceived: number;
  totalIncomePending: number;
  totalExpense: number;
  netBalance: number;
  savingsRate: number; // percentual de economia do que ganhou (0 a 100)
  status: 'positive' | 'negative' | 'neutral';
};

export type MainTabType = 'dashboard' | 'assinaturas' | 'pessoas' | 'cartoes' | 'investimentos' | 'rendas' | 'meuuber';

// ==========================================
// SUBSCRIPTIONS (ASSINATURAS RECORRENTES) TYPES
// ==========================================
export type SubscriptionCategory = 
  | 'streaming' 
  | 'musica' 
  | 'ia' 
  | 'produtividade' 
  | 'jogos' 
  | 'nuvem' 
  | 'saude' 
  | 'educacao' 
  | 'outros';

export type SubscriptionBillingCycle = 'mensal' | 'anual' | 'semanal';

export interface SubscriptionItem {
  id: string;
  name: string;
  serviceKey?: string; // 'spotify', 'chatgpt', 'netflix', 'apple', 'globoplay', 'playstation', 'amazon', 'adobe', 'youtube', 'disney', 'max', 'xbox', 'canva', 'custom', etc.
  amount: number;
  category: SubscriptionCategory;
  billingCycle: SubscriptionBillingCycle;
  billingDay: number; // 1 to 31
  cardId?: string; // Linked credit card ID
  personId?: string; // Linked Person ID
  active: boolean; // Ativa ou Pausada
  autoRenew?: boolean;
  color?: string; // Accent/Brand color
  icon?: string;
  notes?: string;
  startDate?: string;
  website?: string;
}

// ==========================================
// DRIVER (MEU UBER / MOTORISTA DE APP) TYPES
// ==========================================
export type DriverAppType = 'uber' | '99' | 'indrive' | 'blablacar' | 'outro';
export type DriverTripType = 'corrida' | 'viagem';
export type DriverExpenseCategory = 'combustivel' | 'pedagio' | 'estacionamento' | 'manutencao' | 'lavagem' | 'alimentacao' | 'outros';

export interface DriverTrip {
  id: string;
  app: DriverAppType;
  type: DriverTripType;
  grossAmount: number; // Valor bruto da corrida
  feePercent: number; // Ex: 25 (%)
  feeAmount: number; // Ex: 12.50
  netAmount: number; // Ex: 37.50
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  durationMinutes?: number; // Duração em minutos
  distanceKm?: number; // Quilômetros rodados
  origin?: string;
  destination?: string;
  passengersCount?: number;
  notes?: string;
  syncToIncome?: boolean; // Se deve espelhar no fluxo de rendas do mês
}

export interface DriverExpense {
  id: string;
  category: DriverExpenseCategory;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  appLinked?: DriverAppType | 'geral';
  notes?: string;
  liters?: number; // Para combustível
  fuelType?: 'gasolina' | 'etanol' | 'gnv' | 'diesel' | 'eletrico';
}

export interface DriverGoals {
  daily: number; // Ex: 300
  weekly: number; // Ex: 1800
  monthly: number; // Ex: 7000
}

