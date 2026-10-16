import { WalletAccount, WalletTransaction } from '../types';

export interface BankPreset {
  id: string;
  name: string;
  institution: string;
  color: string;
  gradient: string;
  accountType: 'corrente' | 'pagamentos' | 'poupanca' | 'dinheiro' | 'investimento' | 'outros';
}

export const BANK_PRESETS: BankPreset[] = [
  {
    id: 'nubank',
    name: 'Nubank (NuConta)',
    institution: 'Nubank',
    color: '#820AD1',
    gradient: 'from-purple-900 via-purple-700 to-indigo-900',
    accountType: 'pagamentos',
  },
  {
    id: 'inter',
    name: 'Banco Inter',
    institution: 'Inter',
    color: '#FF7A00',
    gradient: 'from-orange-700 via-orange-500 to-amber-900',
    accountType: 'corrente',
  },
  {
    id: 'itau',
    name: 'Itaú Unibanco',
    institution: 'Itaú',
    color: '#EC7000',
    gradient: 'from-blue-900 via-amber-700 to-orange-600',
    accountType: 'corrente',
  },
  {
    id: 'bradesco',
    name: 'Bradesco',
    institution: 'Bradesco',
    color: '#CC092F',
    gradient: 'from-red-900 via-red-700 to-rose-900',
    accountType: 'corrente',
  },
  {
    id: 'santander',
    name: 'Santander',
    institution: 'Santander',
    color: '#EC0000',
    gradient: 'from-red-900 via-red-600 to-neutral-900',
    accountType: 'corrente',
  },
  {
    id: 'c6',
    name: 'C6 Bank',
    institution: 'C6 Bank',
    color: '#242424',
    gradient: 'from-[#1C1C1E] via-stone-800 to-neutral-900',
    accountType: 'corrente',
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    institution: 'Mercado Pago',
    color: '#00A650',
    gradient: 'from-sky-700 via-blue-600 to-teal-800',
    accountType: 'pagamentos',
  },
  {
    id: 'picpay',
    name: 'PicPay',
    institution: 'PicPay',
    color: '#11C76F',
    gradient: 'from-emerald-800 via-green-600 to-teal-900',
    accountType: 'pagamentos',
  },
  {
    id: 'bb',
    name: 'Banco do Brasil',
    institution: 'Banco do Brasil',
    color: '#003882',
    gradient: 'from-blue-900 via-blue-700 to-yellow-600',
    accountType: 'corrente',
  },
  {
    id: 'caixa',
    name: 'Caixa Econômica',
    institution: 'Caixa',
    color: '#005CA9',
    gradient: 'from-blue-900 via-sky-700 to-blue-950',
    accountType: 'poupanca',
  },
  {
    id: 'dinheiro',
    name: 'Carteira Física (Dinheiro)',
    institution: 'Dinheiro',
    color: '#10B981',
    gradient: 'from-emerald-800 via-teal-700 to-emerald-950',
    accountType: 'dinheiro',
  },
];

export const INITIAL_WALLET_ACCOUNTS: WalletAccount[] = [];

export const INITIAL_WALLET_TRANSACTIONS: WalletTransaction[] = [];
