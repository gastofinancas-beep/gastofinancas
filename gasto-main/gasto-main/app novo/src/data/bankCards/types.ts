export type CardCategory =
  | 'traditional'
  | 'gold'
  | 'platinum'
  | 'black'
  | 'infinite'
  | 'signature'
  | 'premium'
  | 'co-branded'
  | 'business';

export type CardNetwork = 'mastercard' | 'visa' | 'elo' | 'amex' | 'hipercard';

export type CardFinish =
  | 'matte'
  | 'metallic'
  | 'glossy'
  | 'carbon'
  | 'frosted'
  | 'iridescent'
  | 'gradient'
  | 'wood-dark';

export type CardTexture =
  | 'none'
  | 'dots'
  | 'diagonal-stripes'
  | 'carbon-fiber'
  | 'mesh'
  | 'waves'
  | 'circuit'
  | 'geometric'
  | 'lines-minimal'
  | 'sunburst';

export interface CardColorVariant {
  id: string;
  name: string;
  primary: string;
  secondary?: string;
  tertiary?: string;
  accent?: string;
  text: string;
  finish?: CardFinish;
  texture?: CardTexture;
}

export interface BankCardPreset {
  id: string;
  bankId: string;
  bankName: string;
  name: string;
  category: CardCategory;
  network: CardNetwork;
  colors: {
    primary: string;
    secondary?: string;
    tertiary?: string;
    text: string;
    accent?: string;
  };
  appearance: {
    finish: CardFinish;
    texture?: boolean;
    textureType?: CardTexture;
    gradient?: boolean;
    reflection?: boolean;
    borderColor?: string;
    chipColor?: 'gold' | 'silver' | 'black-gold';
    customBackgroundCss?: string;
  };
  colorVariants?: CardColorVariant[];
  logos?: {
    bank?: string;
    network?: string;
  };
  layout?: {
    orientation?: 'horizontal' | 'vertical';
    contactlessPosition?: 'top-right' | 'near-chip' | 'bottom-right';
  };
  availability: {
    status: 'current' | 'legacy';
    verifiedAt: string;
  };
  description?: string;
}

export interface BankCardFilterOptions {
  bankId?: string;
  category?: CardCategory | 'all';
  network?: CardNetwork | 'all';
  status?: 'current' | 'legacy' | 'all';
  searchQuery?: string;
}
