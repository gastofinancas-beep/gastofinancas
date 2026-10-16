import { BankCardPreset } from './types';

export const MERCADOPAGO_CARDS: BankCardPreset[] = [
  {
    id: 'mercadopago-gold',
    bankId: 'mercadopago',
    bankName: 'Mercado Pago',
    name: 'Mercado Pago Visa Gold',
    category: 'gold',
    network: 'visa',
    colors: {
      primary: '#009EE3',
      secondary: '#1DBBFC',
      tertiary: '#0070A3',
      text: '#FFFFFF',
      accent: '#FFE600',
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
    description: 'Cartão oficial do Mercado Livre e Mercado Pago sem anuidade, com até 18x sem juros no Mercado Livre e dobro de Meli Dólares.',
  },
  {
    id: 'mercadopago-black',
    bankId: 'mercadopago',
    bankName: 'Mercado Pago',
    name: 'Mercado Pago Visa Platinum',
    category: 'platinum',
    network: 'visa',
    colors: {
      primary: '#0D1B2A',
      secondary: '#1B263B',
      tertiary: '#060D15',
      text: '#FFFFFF',
      accent: '#009EE3',
    },
    appearance: {
      finish: 'metallic',
      texture: true,
      textureType: 'mesh',
      gradient: true,
      reflection: true,
      chipColor: 'silver',
      borderColor: 'rgba(0, 158, 227, 0.45)',
    },
    availability: {
      status: 'current',
      verifiedAt: '2026-09-01',
    },
    description: 'Benefícios premium para compradores assíduos do Mercado Livre com cashback elevado em Meli Dólares.',
  },
];
