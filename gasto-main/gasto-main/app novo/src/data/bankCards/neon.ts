import { BankCardPreset } from './types';

export const NEON_CARDS: BankCardPreset[] = [
  {
    id: 'neon-tradicional',
    bankId: 'neon',
    bankName: 'Neon',
    name: 'Neon Tradicional Visa',
    category: 'traditional',
    network: 'visa',
    colors: {
      primary: '#00E6FF',
      secondary: '#00B4D8',
      tertiary: '#0077B6',
      text: '#041B2D',
      accent: '#03045E',
    },
    appearance: {
      finish: 'iridescent',
      texture: true,
      textureType: 'waves',
      gradient: true,
      reflection: true,
      chipColor: 'silver',
    },
    availability: {
      status: 'current',
      verifiedAt: '2026-09-01',
    },
    description: 'Cartão de crédito internacional Neon sem anuidade, visual neon translúcido e programa de cashback de 0.5%.',
  },
  {
    id: 'neon-platinum',
    bankId: 'neon',
    bankName: 'Neon',
    name: 'Neon Visa Platinum',
    category: 'platinum',
    network: 'visa',
    colors: {
      primary: '#0A2540',
      secondary: '#133966',
      tertiary: '#051321',
      text: '#FFFFFF',
      accent: '#00E6FF',
    },
    appearance: {
      finish: 'metallic',
      texture: true,
      textureType: 'lines-minimal',
      gradient: true,
      reflection: true,
      chipColor: 'silver',
      borderColor: 'rgba(0, 230, 255, 0.45)',
    },
    availability: {
      status: 'current',
      verifiedAt: '2026-09-01',
    },
    description: 'Benefícios Platinum com seguro de viagem, proteção contra roubo e cashback especial.',
  },
];
