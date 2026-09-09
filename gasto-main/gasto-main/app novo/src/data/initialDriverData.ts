import { DriverTrip, DriverExpense, DriverGoals, DriverAppType } from '../types';

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
  outro: {
    name: 'Outro App',
    shortName: 'Outro',
    brandColor: '#8B5CF6',
    bgLight: 'bg-purple-600 text-white',
    bgDark: 'dark:bg-purple-500 dark:text-white',
    textColor: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-300 dark:border-purple-800/60',
    defaultFee: 15,
    tag: 'Particular / Outros'
  }
};

export const INITIAL_DRIVER_GOALS: DriverGoals = {
  daily: 300,
  weekly: 1800,
  monthly: 7500
};

export const INITIAL_DRIVER_TRIPS: DriverTrip[] = [
  {
    id: 'trip-1',
    app: 'uber',
    type: 'corrida',
    grossAmount: 48.00,
    feePercent: 25,
    feeAmount: 12.00,
    netAmount: 36.00,
    date: '2026-08-26',
    time: '08:15',
    durationMinutes: 28,
    distanceKm: 14.5,
    origin: 'Av. Paulista',
    destination: 'Aeroporto Congonhas',
    passengersCount: 1,
    notes: 'UberX horário de pico com dinâmica',
    syncToIncome: true
  },
  {
    id: 'trip-2',
    app: 'uber',
    type: 'corrida',
    grossAmount: 32.50,
    feePercent: 25,
    feeAmount: 8.12,
    netAmount: 24.38,
    date: '2026-08-26',
    time: '09:20',
    durationMinutes: 18,
    distanceKm: 8.2,
    origin: 'Moema',
    destination: 'Vila Olímpia',
    passengersCount: 1,
    syncToIncome: true
  },
  {
    id: 'trip-3',
    app: '99',
    type: 'corrida',
    grossAmount: 35.00,
    feePercent: 20,
    feeAmount: 7.00,
    netAmount: 28.00,
    date: '2026-08-26',
    time: '10:40',
    durationMinutes: 22,
    distanceKm: 9.8,
    origin: 'Pinheiros',
    destination: 'Shopping Eldorado',
    passengersCount: 2,
    notes: '99Pop voucher corrida rápida',
    syncToIncome: true
  },
  {
    id: 'trip-4',
    app: 'indrive',
    type: 'corrida',
    grossAmount: 42.00,
    feePercent: 10,
    feeAmount: 4.20,
    netAmount: 37.80,
    date: '2026-08-25',
    time: '14:10',
    durationMinutes: 25,
    distanceKm: 12.0,
    origin: 'Brooklin',
    destination: 'Centro',
    passengersCount: 1,
    notes: 'Oferta boa no inDrive',
    syncToIncome: true
  },
  {
    id: 'trip-5',
    app: 'blablacar',
    type: 'viagem',
    grossAmount: 160.00,
    feePercent: 0,
    feeAmount: 0.00,
    netAmount: 160.00,
    date: '2026-08-24',
    time: '18:00',
    durationMinutes: 110,
    distanceKm: 95.0,
    origin: 'São Paulo (SP)',
    destination: 'Campinas (SP)',
    passengersCount: 3,
    notes: '3 passageiros para Campinas',
    syncToIncome: true
  },
  {
    id: 'trip-6',
    app: 'uber',
    type: 'corrida',
    grossAmount: 65.00,
    feePercent: 25,
    feeAmount: 16.25,
    netAmount: 48.75,
    date: '2026-08-23',
    time: '21:30',
    durationMinutes: 35,
    distanceKm: 21.0,
    origin: 'Vila Madalena',
    destination: 'Tatuapé',
    passengersCount: 2,
    syncToIncome: true
  },
  {
    id: 'trip-7',
    app: '99',
    type: 'corrida',
    grossAmount: 28.00,
    feePercent: 20,
    feeAmount: 5.60,
    netAmount: 22.40,
    date: '2026-08-22',
    time: '11:00',
    durationMinutes: 15,
    distanceKm: 6.5,
    origin: 'Ipiranga',
    destination: 'Aclimação',
    syncToIncome: true
  }
];

export const INITIAL_DRIVER_EXPENSES: DriverExpense[] = [
  {
    id: 'd-exp-1',
    category: 'combustivel',
    description: 'Abastecimento Etanol Posto Shell',
    amount: 120.00,
    date: '2026-08-26',
    appLinked: 'geral',
    liters: 32.5,
    fuelType: 'etanol',
    notes: 'Tanque cheio para rodar no dia'
  },
  {
    id: 'd-exp-2',
    category: 'pedagio',
    description: 'Pedágio Rodovia dos Bandeirantes',
    amount: 21.60,
    date: '2026-08-24',
    appLinked: 'blablacar',
    notes: 'Viagem BlaBlaCar Campinas'
  },
  {
    id: 'd-exp-3',
    category: 'lavagem',
    description: 'Ducha e Aspiração Completa',
    amount: 35.00,
    date: '2026-08-23',
    appLinked: 'geral',
    notes: 'Carro limpo para a semana'
  },
  {
    id: 'd-exp-4',
    category: 'alimentacao',
    description: 'Lanche e Café na rua',
    amount: 22.50,
    date: '2026-08-25',
    appLinked: 'geral'
  }
];
