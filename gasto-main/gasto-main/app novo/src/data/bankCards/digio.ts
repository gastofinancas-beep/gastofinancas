import { BankCardPreset } from './types';

export const DIGIO_CARDS: BankCardPreset[] = [
  {
    id: 'digio-gold',
    bankId: 'digio',
    bankName: 'Digio',
    name: 'Digio Gold Visa',
    category: 'gold',
    network: 'visa',
    colors: {
      primary: '#0B2341',
      secondary: '#133D73',
      tertiary: '#061324',
      text: '#FFFFFF',
      accent: '#00D1FF',
    },
    appearance: {
      finish: 'matte',
      texture: true,
      textureType: 'geometric',
      gradient: true,
      reflection: true,
      chipColor: 'gold',
      borderColor: 'rgba(0, 209, 255, 0.4)',
    },
    availability: {
      status: 'current',
      verifiedAt: '2026-09-01',
    },
    description: 'Cartão de crédito internacional sem anuidade com programa DigioClub e cashback no DigioLoja.',
  },
  {
    id: 'digio-one',
    bankId: 'digio',
    bankName: 'Digio',
    name: 'Digio One Visa Signature',
    category: 'signature',
    network: 'visa',
    colors: {
      primary: '#111215',
      secondary: '#202227',
      tertiary: '#090A0C',
      text: '#FFFFFF',
      accent: '#E5C07B',
    },
    appearance: {
      finish: 'metallic',
      texture: true,
      textureType: 'lines-minimal',
      gradient: true,
      reflection: true,
      chipColor: 'gold',
      borderColor: 'rgba(229, 192, 123, 0.5)',
    },
    availability: {
      status: 'current',
      verifiedAt: '2026-09-01',
    },
    description: '1.5 pontos Livelo por dólar gasto, acesso a salas VIP DragonPass e assistência de emergência médica global.',
  },
];
