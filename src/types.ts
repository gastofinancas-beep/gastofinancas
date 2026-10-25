export type ActiveTab = 'dashboard' | 'carteira' | 'cartoes' | 'caixinhas' | 'assinaturas' | 'metas' | 'divisao' | 'extra' | 'investimentos' | 'graficos' | 'meuuber';

export interface LocalAuthUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  providerData?: Array<{
    providerId: string;
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
    phoneNumber?: string | null;
  }>;
  isAnonymous?: boolean;
}

/** Regra de uma renda ou conta fixa. Cada mês vira um lançamento comum que carrega uma cópia da regra. */
export interface RecurrenceRule {
  id: string;
  kind: 'income' | 'expense';
  name: string;
  category: string;
  accountId?: string;
  parts: { day: number; amount: number }[]; // 1 ou 2 datas por mês
  startMonthYear: string;
  endMonthYear?: string; // último mês gerado
}

export interface ExpenseItem {
  id: string;
  description: string;
  category: string;
  amount: number;
  totalAmount?: number;
  type: 'unica' | 'parcelada' | 'fixa';
  cardId?: string;
  personId: string;
  totalInstallments?: number;
  currentInstallment?: number;
  startMonthYear: string; // e.g. "2026-08"
  endMonthYear?: string; // último mês cobrado (gastos fixos encerrados, ex.: assinatura pausada)
  date: string;
  notes?: string;
  paidByPerson?: boolean;
  paidDate?: string;
  recurrence?: RecurrenceRule; // conta fixa fora do cartão (gerada todo mês)
  recurrencePart?: number;
  accountId?: string;
  walletTxId?: string;
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
  accountId?: string;
  walletTxId?: string;
  recurrence?: RecurrenceRule; // salário/renda fixa (gerada todo mês)
  recurrencePart?: number;
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
  cardPhotoUrl?: string;
  visualStyle?: 'digital' | 'photo' | 'hybrid';
  textColor?: 'light' | 'dark';
  brand?: 'mastercard' | 'visa' | 'elo' | 'amex' | 'hipercard' | 'generic';
  cardDesignId?: string;
  colorVariant?: string;
  holderName?: string;
  expirationDate?: string;
  cvv?: string;
}

export interface Person {
  id: string;
  name: string;
  avatarBg: string;
  photoURL?: string;
  pixKey?: string;
  phone?: string;
  email?: string;
  cpf?: string;
  notes?: string;
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
  /** @deprecated Histórico migrado para subcoleção Firestore. Mantido apenas para leitura de dados legados. */
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

export type SubscriptionStatus = 'free' | 'trial' | 'active' | 'expired' | 'canceled';
export type SubscriptionPlanId = 'monthly' | 'annual' | 'lifetime' | 'free';

export interface UserSubscriptionInfo {
  status: SubscriptionStatus;
  planId?: SubscriptionPlanId;
  trialStartDate?: string;
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
  isTrialActive: boolean;
  daysRemainingInTrial: number;
  isPremium: boolean;
  customerId?: string;
}

export interface UserProfile {
  name?: string; // Nome completo
  nickname?: string; // Apelido / Como quer ser chamado
  email?: string; // E-mail pessoal / Google
  recoveryEmail?: string; // E-mail de recuperação e avisos críticos
  phone?: string; // WhatsApp / Telefone
  pixKey?: string; // Chave Pix
  pixKeyType?: 'cpf' | 'email' | 'telefone' | 'aleatoria';
  photoURL?: string; // URL ou Base64 da Foto
  photoSource?: 'google' | 'upload' | 'url' | 'preset';
  cpf?: string; // CPF ou Documento
  birthDate?: string; // Data de nascimento
  occupation?: string; // Profissão ou Atividade (ex: Motorista de App, etc.)
  bio?: string; // Meta pessoal ou biografia
  subscriptionStatus?: SubscriptionStatus;
  planId?: SubscriptionPlanId;
  trialStartDate?: string;
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
  customerId?: string;
  updatedAt?: string;
  // Novas Funcionalidades
  notificationsEnabled?: boolean;
  notifyCardBillsDue?: boolean; // Lembretes de faturas próximas a vencer (Push)
  notifyCardBillsEmail?: boolean; // Envio de avisos de faturas vencendo por e-mail (Firebase Cloud Functions)
  notifyInvestmentYields?: boolean; // Avisos de rendimentos em caixinhas
  notifyCardLimit?: boolean; // Avisos de limite do cartão e última parcela
  notifyBudgets?: boolean; // Avisos de orçamento por categoria
  notifyMonthSummary?: boolean; // Resumo no fim do mês
  pushSubscription?: string; // Web Push Subscription JSON
  appLockEnabled?: boolean;
  appLockPin?: string; // PIN em hash
  pinSetupSkipped?: boolean; // Se o usuário optou por pular na primeira entrada
  useBiometrics?: boolean;
  biometricCredentialRegistered?: boolean;
  biometricRegisteredAt?: string;
  biometricPhotoSample?: string;
  webauthnCredentialId?: string;
  budgets?: Record<string, number>; // Limites de gastos por categoria
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

export type MainTabType = 'dashboard' | 'carteira' | 'metas' | 'assinaturas' | 'extra' | 'freelancer' | 'pessoas' | 'cartoes' | 'investimentos' | 'meuuber' | 'fixos';

// ==========================================
// EXTRA & WORK PROFILE TYPES
// ==========================================
export type ExtraWorkType = 'motorista_app' | 'freelancer' | 'outro';

export interface ExtraProfileConfig {
  workType: ExtraWorkType | null;
  selectedApps: DriverAppType[];
  vehicleType?: 'carro_proprio' | 'carro_alugado' | 'moto' | 'bike' | 'outro';
  fuelType?: 'gasolina' | 'etanol' | 'gnv' | 'diesel' | 'eletrico' | 'outro';
  freelanceCategories?: FreelanceCategory[];
  dailyGoal?: number;
  weeklyGoal?: number;
  monthlyGoal?: number;
  defaultAccountId?: string;
  setupCompleted: boolean;
  lastCustomizedAt?: string;
}

// ==========================================
// FREELANCER & PROJETOS / SERVIÇOS TYPES
// ==========================================
export type FreelanceCategory = 
  | 'design' 
  | 'desenvolvimento' 
  | 'marketing' 
  | 'video' 
  | 'redacao' 
  | 'consultoria' 
  | 'fotografia' 
  | 'servicos' 
  | 'aulas' 
  | 'outros';

export type FreelanceExpenseCategory = 
  | 'ferramentas' 
  | 'software' 
  | 'transporte' 
  | 'alimentacao' 
  | 'material' 
  | 'taxas' 
  | 'subcontratacao' 
  | 'cursos' 
  | 'outros';

export type FreelanceStatus = 'recebido' | 'pendente' | 'em_andamento' | 'cancelado';

export interface FreelanceEntry {
  id: string;
  title: string; // Ex: "Criação de Identidade Visual", "Edição de Vídeo Reels"
  clientName?: string; // Ex: "Studio Alpha", "Dr. Marcos"
  category: FreelanceCategory;
  amount: number; // Valor recebido (ex: R$ 50,00)
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  status: FreelanceStatus;
  accountId?: string; // Conta bancária da Carteira onde entrou o dinheiro
  walletTxId?: string; // ID da transação espelhada na Minha Carteira
  syncToIncome?: boolean;
  notes?: string;
  createdAt?: string;
}

export interface FreelanceExpense {
  id: string;
  description: string; // Ex: "Assinatura de Ferramenta / Plugin", "Transporte / Combustível"
  category: FreelanceExpenseCategory;
  amount: number; // Valor da despesa (ex: R$ 40,00)
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  accountId?: string; // Conta bancária da Carteira de onde saiu o valor
  walletTxId?: string; // ID da transação espelhada na Minha Carteira
  freelanceEntryId?: string; // Se for gasto vinculado a um projeto específico
  notes?: string;
  createdAt?: string;
}

export interface FreelanceGoals {
  monthlyIncomeGoal: number; // Meta mensal de faturamento líquido (ex: R$ 3000)
}

// ==========================================
// WALLET & BANK ACCOUNTS (MINHA CARTEIRA) TYPES
// ==========================================
export type WalletAccountType = 'corrente' | 'pagamentos' | 'poupanca' | 'dinheiro' | 'investimento' | 'outros';

export interface WalletAccount {
  id: string;
  name: string; // Ex: "Nubank Principal", "Inter", "Dinheiro na Carteira"
  institution: string; // "Nubank", "Inter", "Itaú", "Bradesco", "Santander", "C6 Bank", "Mercado Pago", "PicPay", "Dinheiro", "Outro"
  accountType: WalletAccountType;
  initialBalance: number;
  currentBalance: number;
  color: string;
  gradient?: string;
  agency?: string;
  accountNumber?: string;
  pixKey?: string;
  isDefault?: boolean;
  includeInTotal: boolean; // Se entra na soma do saldo disponível global
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type WalletTransactionType = 
  | 'pix_out'              // Pix Enviado / Gasto Pix
  | 'pix_in'               // Pix Recebido
  | 'debito'               // Compra no Cartão de Débito
  | 'dinheiro_gasto'       // Gasto em Dinheiro Físico
  | 'deposito'             // Depósito / Salário / Crédito em Conta
  | 'transferencia_saida'  // Transferência entre contas próprias (Origem)
  | 'transferencia_entrada'// Transferência entre contas próprias (Destino)
  | 'ajuste';              // Ajuste Manual de Saldo / Conciliação

export type WalletCategory = 
  | 'alimentacao'
  | 'transporte'
  | 'mercado'
  | 'moradia'
  | 'lazer'
  | 'saude'
  | 'educacao'
  | 'compras'
  | 'servicos'
  | 'combustivel'
  | 'salario'
  | 'renda_extra'
  | 'transferencia'
  | 'ajuste'
  | 'outros';

export interface WalletTransaction {
  id: string;
  accountId?: string; // Conta bancária ou carteira vinculada (opcional)
  type: WalletTransactionType;
  amount: number; // Valor numérico positivo
  description: string;
  category: WalletCategory;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  payoutDate?: string; // YYYY-MM-DD Data prevista de compensação/repasse
  status?: 'efetivado' | 'futuro' | 'pendente'; // Status do lançamento
  driverTripId?: string; // Vínculo com a corrida/fechamento do motorista
  recipientOrPayer?: string; // Ex: "Padaria Bella", "Supermercado", "Lucas"
  pixKeyUsed?: string;
  toAccountId?: string; // Se for transferência
  fromAccountId?: string;
  notes?: string;
  createdAt: string;
}

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
export type DriverAppType = 'uber' | '99' | 'indrive' | 'ifood' | 'rappi' | 'lalamove' | 'blablacar' | 'particular' | 'outro';
export type DriverTripType = 'corrida' | 'viagem' | 'entrega' | 'fechamento_dia';
export type DriverExpenseCategory = 'combustivel' | 'alimentacao' | 'pedagio' | 'estacionamento' | 'manutencao' | 'lavagem' | 'aluguel_veiculo' | 'outros';

export interface DriverTrip {
  id: string;
  app: DriverAppType;
  type: DriverTripType;
  grossAmount: number; // Valor bruto faturado na plataforma
  feePercent?: number; // Ex: 25 (%)
  feeAmount?: number; // Ex: 12.50
  netAmount: number; // Valor líquido recebido
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  durationMinutes?: number; // Duração em minutos / Horas trabalhadas
  distanceKm?: number; // Quilômetros rodados
  tripsCount?: number; // Quantidade de corridas / entregas feitas no dia/app
  origin?: string;
  destination?: string;
  passengersCount?: number;
  accountId?: string; // Conta bancária da Carteira onde o dinheiro entrou
  walletTxId?: string; // ID da transação vinculada na Minha Carteira
  notes?: string;
  syncToIncome?: boolean; // Se deve espelhar no fluxo de rendas do mês
  payoutDate?: string; // YYYY-MM-DD Data prevista para o dinheiro cair na conta
  createdAt?: string;
}

export interface DriverExpense {
  id: string;
  category: DriverExpenseCategory;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  time?: string;
  appLinked?: DriverAppType | 'geral';
  accountId?: string; // Conta bancária da Carteira de onde o dinheiro saiu
  walletTxId?: string; // ID da transação de débito vinculada na Carteira
  notes?: string;
  liters?: number; // Para combustível
  fuelType?: 'gasolina' | 'etanol' | 'gnv' | 'diesel' | 'eletrico';
  createdAt?: string;
}

export interface DriverGoals {
  daily: number; // Ex: 300
  weekly: number; // Ex: 1800
  monthly: number; // Ex: 7000
}

// ==========================================
// UBER API & PARTNER INTEGRATION TYPES
// ==========================================
export type UberEnvironment = 'sandbox' | 'production';
export type UberConnectionStatus = 'disconnected' | 'configured' | 'pending_approval' | 'connected';

export interface UberConfig {
  clientId: string;
  clientSecret: string;
  environment: UberEnvironment;
  status: UberConnectionStatus;
  appName?: string;
  driverEmail?: string;
  driverName?: string;
  lastSyncAt?: string;
  autoSyncDaily?: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  approvedScopes?: string[];
  totalTripsSynced?: number;
  totalEarningsSynced?: number;
}

export interface UberSyncResult {
  success: boolean;
  tripsImported: number;
  totalGross: number;
  totalNet: number;
  totalFee: number;
  totalKm: number;
  message: string;
  syncDate: string;
}

// ==========================================
// SAVINGS & FINANCIAL GOALS TYPES
// ==========================================
export interface MonthlySavingsTarget {
  month: string; // e.g. "2026-09"
  targetExpenseLimit: number; // Limite de gastos do mês
  notes?: string;
}

export type GoalCategory = 'reserva' | 'viagem' | 'veiculo' | 'imovel' | 'eletronicos' | 'estudos' | 'outro';

export interface AccumulationGoal {
  id: string;
  title: string;
  targetAmount: number; // Valor total que quer juntar
  currentAmount: number; // Quanto já tem guardado
  startMonth: string; // Mês inicial (ex: "2026-09")
  targetMonthsCount: number; // Em quanto tempo (meses) quer esse valor
  category?: GoalCategory;
  icon?: string;
  color?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}



