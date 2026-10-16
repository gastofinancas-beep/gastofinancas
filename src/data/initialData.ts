import { CreditCard, ExpenseItem, IncomeItem, InvestmentBox, InvestmentFolder, Person } from '../types';

export const INITIAL_CARDS: CreditCard[] = [];

export const INITIAL_PEOPLE: Person[] = [
  {
    id: 'person-me',
    name: 'Meu Perfil',
    avatarBg: 'bg-emerald-600',
    pixKey: '',
    phone: '',
    isSelf: true,
  }
];

export const INITIAL_EXPENSES: ExpenseItem[] = [];

export const INITIAL_FOLDERS: InvestmentFolder[] = [];

export const INITIAL_BOXES: InvestmentBox[] = [];

export const INITIAL_INCOMES: IncomeItem[] = [];
