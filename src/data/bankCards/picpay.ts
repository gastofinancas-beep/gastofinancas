import { BankCardPreset } from './types';

export const PICPAY_CARDS: BankCardPreset[] = [
  {
    id: 'picpay-gold',
    bankId: 'picpay',
    bankName: 'PicPay',
    name: 'PicPay Card Mastercard Gold',
    category: 'gold',
    network: 'mastercard',
    colors: {
      primary: '#11C76F',
      secondary: '#1CE883',
      tertiary: '#0B8A4D',
      text: '#FFFFFF',
      accent: '#E6FFFA',
    },
    appearance: {
      finish: 'matte',
      texture: true,
      textureType: 'geometric',
      gradient: true,
      reflection: true,
      chipColor: 'gold',
    },
    availability: {
      status: 'current',
      verifiedAt: '2026-09-01',
    },
    description: 'Cartão de crédito internacional sem anuidade com cashback de até 5% em compras pelo PicPay Shop.',
  },
  {
    id: 'picpay-black',
    bankId: 'picpay',
    bankName: 'PicPay',
    name: 'PicPay Card Mastercard Black',
    category: 'black',
    network: 'mastercard',
    colors: {
      primary: '#121315',
      secondary: '#202227',
      tertiary: '#090A0B',
      text: '#FFFFFF',
      accent: '#11C76F',
    },
    appearance: {
      finish: 'carbon',
      texture: true,
      textureType: 'carbon-fiber',
      gradient: true,
      reflection: true,
      chipColor: 'black-gold',
      borderColor: 'rgba(17, 199, 111, 0.5)',
    },
    availability: {
      status: 'current',
      verifiedAt: '2026-09-01',
    },
    description: 'Até 1.2% de cashback na fatura, salas VIP Mastercard Black em Guarulhos e isenção com gastos a partir de R$ 5.000 ou R$ 50 mil em investimentos.',
  },
];
