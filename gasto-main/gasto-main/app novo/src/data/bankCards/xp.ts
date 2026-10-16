import { BankCardPreset } from './types';

export const XP_CARDS: BankCardPreset[] = [
  {
    id: 'xp-visa-infinite',
    bankId: 'xp',
    bankName: 'XP',
    name: 'XP Visa Infinite',
    category: 'infinite',
    network: 'visa',
    colors: {
      primary: '#111113',
      secondary: '#1F1F24',
      tertiary: '#080809',
      text: '#FFFFFF',
      accent: '#E5C07B',
    },
    appearance: {
      finish: 'carbon',
      texture: true,
      textureType: 'geometric',
      gradient: true,
      reflection: true,
      chipColor: 'gold',
      borderColor: 'rgba(229, 192, 123, 0.45)',
    },
    availability: {
      status: 'current',
      verifiedAt: '2026-09-01',
    },
    description: 'Investback de 1% que vai direto para um fundo exclusivo com rendimento, 4 acessos DragonPass a salas VIP e anuidade zero a partir de R$ 50 mil investidos.',
  },
  {
    id: 'xp-visa-infinite-one',
    bankId: 'xp',
    bankName: 'XP',
    name: 'XP Visa Infinite Categoria One',
    category: 'infinite',
    network: 'visa',
    colors: {
      primary: '#1A1A1E',
      secondary: '#2B2B33',
      tertiary: '#0E0E11',
      text: '#FFFFFF',
      accent: '#94A3B8',
    },
    appearance: {
      finish: 'metallic',
      texture: true,
      textureType: 'lines-minimal',
      gradient: true,
      reflection: true,
      chipColor: 'silver',
      borderColor: 'rgba(148, 163, 184, 0.4)',
    },
    availability: {
      status: 'current',
      verifiedAt: '2026-09-01',
    },
    description: 'Versão para investidores a partir de R$ 5 mil investidos na XP, com Investback e 2 acessos gratuitos anuais a salas VIP.',
  },
];
