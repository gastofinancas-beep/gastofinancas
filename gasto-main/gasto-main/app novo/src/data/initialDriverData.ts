import { DriverTrip, DriverExpense, DriverGoals, DriverAppType, ExtraProfileConfig } from '../types';

export const APP_CONFIGS: Record<DriverAppType, {
  name: string;
  shortName: string;
  brandColor: string;
  bgLight: string;
  bgDark: string;
  textColor: string;
  borderColor: string;
  defaultFee: number; // Porcentagem padrão
  tag: string;
}> = {
  uber: {
    name: 'Uber',
    shortName: 'Uber',
    brandColor: '#000000',
    bgLight: 'bg-slate-900 text-white',
    bgDark: 'dark:bg-white dark:text-slate-950',
    textColor: 'text-slate-950 dark:text-white',
    borderColor: 'border-slate-300 dark:border-slate-700',
    defaultFee: 25,
    tag: 'UberX / Comfort / Black'
  },
  '99': {
    name: '99 App',
    shortName: '99',
    brandColor: '#F59E0B',
    bgLight: 'bg-amber-500 text-slate-950',
    bgDark: 'dark:bg-amber-400 dark:text-slate-950',
    textColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-300 dark:border-amber-800/60',
    defaultFee: 20,
    tag: '99Pop / Plus / Taxi'
  },
  indrive: {
    name: 'inDrive',
    shortName: 'inDrive',
    brandColor: '#10B981',
    bgLight: 'bg-emerald-600 text-white',
    bgDark: 'dark:bg-emerald-500 dark:text-slate-950',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-300 dark:border-emerald-800/60',
    defaultFee: 10,
    tag: 'Preço Negociado'
  },
  blablacar: {
    name: 'BlaBlaCar',
    shortName: 'BlaBlaCar',
    brandColor: '#0284C7',
    bgLight: 'bg-sky-600 text-white',
    bgDark: 'dark:bg-sky-500 dark:text-white',
    textColor: 'text-sky-600 dark:text-sky-400',
    borderColor: 'border-sky-300 dark:border-sky-800/60',
    defaultFee: 0,
    tag: 'Carona / Viagem'
  },
  ifood: {
    name: 'iFood Entregas',
    shortName: 'iFood',
    brandColor: '#EA1D2C',
    bgLight: 'bg-red-600 text-white',
    bgDark: 'dark:bg-red-500 dark:text-white',
    textColor: 'text-red-600 dark:text-red-400',
    borderColor: 'border-red-300 dark:border-red-800/60',
    defaultFee: 0,
    tag: 'Delivery / Alimentação'
  },
  rappi: {
    name: 'Rappi Entregador',
    shortName: 'Rappi',
    brandColor: '#FF441F',
    bgLight: 'bg-orange-500 text-white',
    bgDark: 'dark:bg-orange-400 dark:text-white',
    textColor: 'text-orange-600 dark:text-orange-400',
    borderColor: 'border-orange-300 dark:border-orange-800/60',
    defaultFee: 0,
    tag: 'Delivery & Express'
  },
  lalamove: {
    name: 'Lalamove',
    shortName: 'Lalamove',
    brandColor: '#FF6B00',
    bgLight: 'bg-amber-600 text-white',
    bgDark: 'dark:bg-amber-500 dark:text-white',
    textColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-300 dark:border-amber-800/60',
    defaultFee: 15,
    tag: 'Fretes & Carretos'
  },
  particular: {
    name: 'Particular / Direto',
    shortName: 'Particular',
    brandColor: '#2563EB',
    bgLight: 'bg-blue-600 text-white',
    bgDark: 'dark:bg-blue-500 dark:text-white',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-300 dark:border-blue-800/60',
    defaultFee: 0,
    tag: 'Sem Taxas / 100% Seu'
  },
  outro: {
    name: 'Outro App',
    shortName: 'Outro',
    brandColor: '#8B5CF6',
    bgLight: 'bg-purple-600 text-white',
    bgDark: 'dark:bg-purple-500 dark:text-white',
    textColor: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-300 dark:border-purple-800/60',
    defaultFee: 15,
    tag: 'Outras Plataformas'
  }
};

export const INITIAL_DRIVER_GOALS: DriverGoals = {
  daily: 300,
  weekly: 1800,
  monthly: 7500
};

export const INITIAL_EXTRA_PROFILE: ExtraProfileConfig = {
  workType: 'motorista_app',
  selectedApps: ['uber', '99', 'indrive'],
  vehicleType: 'carro_proprio',
  fuelType: 'gasolina',
  dailyGoal: 250,
  monthlyGoal: 6000,
  setupCompleted: true,
  lastCustomizedAt: '2026-08-27T00:00:00Z'
};

export const INITIAL_DRIVER_TRIPS: DriverTrip[] = [];

export const INITIAL_DRIVER_EXPENSES: DriverExpense[] = [];
