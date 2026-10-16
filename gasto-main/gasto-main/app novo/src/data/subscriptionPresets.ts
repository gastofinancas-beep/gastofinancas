import { SubscriptionItem, SubscriptionCategory } from '../types';

export interface ServicePreset {
  serviceKey: string;
  name: string;
  category: SubscriptionCategory;
  defaultAmount: number;
  color: string;
  description: string;
  suggestedBillingDay: number;
}

export const POPULAR_SUBSCRIPTION_PRESETS: ServicePreset[] = [
  {
    serviceKey: 'spotify',
    name: 'Spotify Premium',
    category: 'musica',
    defaultAmount: 11.90,
    color: '#1DB954',
    description: 'Música e podcasts sem anúncios',
    suggestedBillingDay: 5,
  },
  {
    serviceKey: 'chatgpt',
    name: 'ChatGPT Plus',
    category: 'ia',
    defaultAmount: 104.90,
    color: '#10A37F',
    description: 'Acesso ao GPT-4o e modelos avançados da OpenAI',
    suggestedBillingDay: 17,
  },
  {
    serviceKey: 'netflix',
    name: 'Netflix',
    category: 'streaming',
    defaultAmount: 39.90,
    color: '#E50914',
    description: 'Filmes, séries e produções originais',
    suggestedBillingDay: 12,
  },
  {
    serviceKey: 'apple',
    name: 'Apple One / iCloud',
    category: 'nuvem',
    defaultAmount: 34.90,
    color: '#000000',
    description: 'Armazenamento iCloud, Apple Music e TV+',
    suggestedBillingDay: 15,
  },
  {
    serviceKey: 'globoplay',
    name: 'Globoplay',
    category: 'streaming',
    defaultAmount: 9.90,
    color: '#FB0140',
    description: 'Novelas, séries e canais ao vivo',
    suggestedBillingDay: 20,
  },
  {
    serviceKey: 'playstation',
    name: 'PlayStation Plus',
    category: 'jogos',
    defaultAmount: 9.90,
    color: '#00439C',
    description: 'Multijogador online e catálogo mensal',
    suggestedBillingDay: 8,
  },
  {
    serviceKey: 'amazon',
    name: 'Amazon Prime',
    category: 'streaming',
    defaultAmount: 9.90,
    color: '#00A8E1',
    description: 'Frete grátis, Prime Video e Prime Music',
    suggestedBillingDay: 10,
  },
  {
    serviceKey: 'adobe',
    name: 'Adobe Creative Cloud',
    category: 'produtividade',
    defaultAmount: 86.70,
    color: '#FF0000',
    description: 'Photoshop, Illustrator, Premiere e ferramentas de design',
    suggestedBillingDay: 25,
  },
  {
    serviceKey: 'youtube',
    name: 'YouTube Premium',
    category: 'streaming',
    defaultAmount: 24.90,
    color: '#FF0000',
    description: 'Vídeos sem anúncios e YouTube Music em segundo plano',
    suggestedBillingDay: 14,
  },
  {
    serviceKey: 'disney',
    name: 'Disney+',
    category: 'streaming',
    defaultAmount: 43.90,
    color: '#113CCF',
    description: 'Disney, Pixar, Marvel, Star Wars e ESPN',
    suggestedBillingDay: 18,
  },
  {
    serviceKey: 'max',
    name: 'Max (HBO)',
    category: 'streaming',
    defaultAmount: 29.90,
    color: '#002BE7',
    description: 'HBO, Warner Bros, Discovery e Champions League',
    suggestedBillingDay: 22,
  },
  {
    serviceKey: 'xbox',
    name: 'Xbox Game Pass Ultimate',
    category: 'jogos',
    defaultAmount: 49.99,
    color: '#107C10',
    description: 'Centenas de jogos no console, PC e nuvem',
    suggestedBillingDay: 28,
  },
  {
    serviceKey: 'canva',
    name: 'Canva Pro',
    category: 'produtividade',
    defaultAmount: 34.90,
    color: '#00C4CC',
    description: 'Templates premium, removedor de fundo e kits de marca',
    suggestedBillingDay: 3,
  },
  {
    serviceKey: 'duolingo',
    name: 'Duolingo Super',
    category: 'educacao',
    defaultAmount: 14.90,
    color: '#58CC02',
    description: 'Vidas infinitas e lições sem interrupções',
    suggestedBillingDay: 7,
  }
];

export const INITIAL_SUBSCRIPTIONS: SubscriptionItem[] = [];
