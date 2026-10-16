import { BankCardPreset } from './types';

export const WILL_CARDS: BankCardPreset[] = [
  {
    id: 'will-tradicional',
    bankId: 'will',
    bankName: 'Will Bank',
    name: 'Will Bank Tradicional',
    category: 'traditional',
    network: 'mastercard',
    colors: {
      primary: '#FFDE00',
      secondary: '#FFE838',
      tertiary: '#E6C800',
      text: '#171717',
      accent: '#000000',
    },
    appearance: {
      finish: 'matte',
      texture: false,
      gradient: true,
      reflection: true,
      chipColor: 'silver',
    },
    availability: {
      status: 'current',
      verifiedAt: '2026-09-01',
    },
    description: 'Cartão de crédito amarelo vibrante sem anuidade com aprovação descomplicada e controle pelo app.',
  },
  {
    id: 'will-black',
    bankId: 'will',
    bankName: 'Will Bank',
    name: 'Will Bank Mastercard Black',
    category: 'black',
    network: 'mastercard',
    colors: {
      primary: '#121214',
      secondary: '#202024',
      tertiary: '#0A0A0C',
      text: '#FFFFFF',
      accent: '#FFDE00',
    },
    appearance: {
      finish: 'carbon',
      texture: true,
      textureType: 'carbon-fiber',
      gradient: true,
      reflection: true,
      chipColor: 'black-gold',
      borderColor: 'rgba(255, 222, 0, 0.45)',
    },
    availability: {
      status: 'current',
      verifiedAt: '2026-09-01',
    },
    description: 'Mastercard Black do Will Bank com salas VIP em Guarulhos, cashback em compras e seguros de viagem.',
  },
];
