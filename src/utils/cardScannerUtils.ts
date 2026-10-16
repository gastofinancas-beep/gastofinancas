/**
 * Utilitário de Processamento de Imagem e Extração de Cores para Escaneamento de Cartão
 */

export interface ScannedCardAnalysis {
  photoDataUrl: string;
  dominantColor: string;
  secondaryColor: string;
  gradient: string;
  textColor: 'light' | 'dark';
  suggestedBank: string;
  suggestedName: string;
  suggestedBrand: 'mastercard' | 'visa' | 'elo' | 'amex' | 'hipercard' | 'generic';
  detectedDigits?: string;
}

// Proporção oficial de cartões de crédito (ISO/IEC 7810 ID-1: 85.60 mm × 53.98 mm)
export const CARD_ASPECT_RATIO = 85.6 / 53.98; // ~1.58577

interface BankPaletteProfile {
  bank: string;
  defaultName: string;
  brand: 'mastercard' | 'visa' | 'elo' | 'amex' | 'hipercard';
  check: (r: number, g: number, b: number, h: number, s: number, l: number) => boolean;
}

// Perfis de cores dos principais bancos brasileiros para reconhecimento óptico rápido
const BANK_COLOR_PROFILES: BankPaletteProfile[] = [
  {
    bank: 'Nubank',
    defaultName: 'Nubank Roxinho',
    brand: 'mastercard',
    check: (r, g, b, h, s, l) => (h >= 260 && h <= 300) && s > 0.35 && l > 0.15 && l < 0.75, // Roxo
  },
  {
    bank: 'Inter',
    defaultName: 'Banco Inter Laranja',
    brand: 'mastercard',
    check: (r, g, b, h, s, l) => (h >= 15 && h <= 40) && s > 0.55 && l > 0.35 && l < 0.70, // Laranja
  },
  {
    bank: 'Itaú',
    defaultName: 'Itaú Mastercard',
    brand: 'mastercard',
    check: (r, g, b, h, s, l) => ((h >= 20 && h <= 45) && s > 0.6) || (h >= 210 && h <= 240 && s > 0.5 && l < 0.4), // Laranja Itaú ou Azul
  },
  {
    bank: 'Santander',
    defaultName: 'Santander SX',
    brand: 'visa',
    check: (r, g, b, h, s, l) => (h <= 10 || h >= 350) && s > 0.55 && l > 0.30 && l < 0.65, // Vermelho vivo
  },
  {
    bank: 'Bradesco',
    defaultName: 'Bradesco Elo',
    brand: 'elo',
    check: (r, g, b, h, s, l) => (h >= 340 && h <= 360) && s > 0.50 && l > 0.25 && l < 0.55, // Vermelho carmim
  },
  {
    bank: 'Banco do Brasil',
    defaultName: 'Ourocard BB',
    brand: 'visa',
    check: (r, g, b, h, s, l) => (h >= 205 && h <= 235) && s > 0.40 && l > 0.15 && l < 0.50, // Azul BB
  },
  {
    bank: 'Caixa',
    defaultName: 'Caixa Sim',
    brand: 'elo',
    check: (r, g, b, h, s, l) => (h >= 195 && h <= 215) && s > 0.45 && l > 0.25 && l < 0.60, // Azul Caixa
  },
  {
    bank: 'PicPay',
    defaultName: 'PicPay Card',
    brand: 'mastercard',
    check: (r, g, b, h, s, l) => (h >= 135 && h <= 165) && s > 0.40 && l > 0.25 && l < 0.70, // Verde PicPay
  },
  {
    bank: 'PagBank',
    defaultName: 'PagBank Visa',
    brand: 'visa',
    check: (r, g, b, h, s, l) => (h >= 140 && h <= 170) && s > 0.45 && l > 0.20 && l < 0.55, // Verde PagBank
  },
  {
    bank: 'Mercado Pago',
    defaultName: 'Mercado Pago Visa',
    brand: 'visa',
    check: (r, g, b, h, s, l) => (h >= 190 && h <= 210) && s > 0.60 && l > 0.35 && l < 0.65, // Azul Celeste
  },
  {
    bank: 'Neon',
    defaultName: 'Neon Visa',
    brand: 'visa',
    check: (r, g, b, h, s, l) => (h >= 180 && h <= 200) && s > 0.60 && l > 0.40, // Ciano Elétrico
  },
  {
    bank: 'C6 Bank',
    defaultName: 'C6 Carbon Black',
    brand: 'mastercard',
    check: (r, g, b, h, s, l) => l < 0.22 && s < 0.25, // Grafite/Preto Carbon
  },
  {
    bank: 'XP',
    defaultName: 'XP Visa Infinite',
    brand: 'visa',
    check: (r, g, b, h, s, l) => l < 0.15, // Preto absoluto
  },
  {
    bank: 'BTG Pactual',
    defaultName: 'BTG Pactual Black',
    brand: 'mastercard',
    check: (r, g, b, h, s, l) => (h >= 210 && h <= 230) && l < 0.25 && s > 0.30, // Azul Marinho Profundo
  },
];

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return [h, s, l];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Ajusta levemente a luminosidade de uma cor hex
 */
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00ff) + percent;
  let b = (num & 0x0000ff) + percent;

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return rgbToHex(r, g, b);
}

/**
 * Processa a imagem recortada do cartão, ajusta perspectiva/proporção e extrai a paleta de cores
 */
export async function analyzeCardFromCanvas(
  sourceCanvas: HTMLCanvasElement
): Promise<ScannedCardAnalysis> {
  const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Não foi possível obter o contexto 2D da imagem.');
  }

  const { width, height } = sourceCanvas;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Amostragem de cores em grade distribuída (excluindo bordas externas extremas onde há reflexo)
  const samplePoints: { r: number; g: number; b: number; weight: number }[] = [];
  const startX = Math.round(width * 0.08);
  const endX = Math.round(width * 0.92);
  const startY = Math.round(height * 0.08);
  const endY = Math.round(height * 0.92);

  const stepX = Math.max(1, Math.floor((endX - startX) / 30));
  const stepY = Math.max(1, Math.floor((endY - startY) / 20));

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let count = 0;

  // Amostragem setorizada para gradiente
  let topR = 0, topG = 0, topB = 0, topCount = 0;
  let bottomR = 0, bottomG = 0, bottomB = 0, bottomCount = 0;

  for (let y = startY; y < endY; y += stepY) {
    for (let x = startX; x < endX; x += stepX) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (a > 150) {
        totalR += r;
        totalG += g;
        totalB += b;
        count++;

        if (y < height * 0.45) {
          topR += r;
          topG += g;
          topB += b;
          topCount++;
        } else if (y > height * 0.55) {
          bottomR += r;
          bottomG += g;
          bottomB += b;
          bottomCount++;
        }

        samplePoints.push({ r, g, b, weight: 1 });
      }
    }
  }

  const avgR = count > 0 ? Math.round(totalR / count) : 30;
  const avgG = count > 0 ? Math.round(totalG / count) : 30;
  const avgB = count > 0 ? Math.round(totalB / count) : 40;

  const avgTopR = topCount > 0 ? Math.round(topR / topCount) : avgR;
  const avgTopG = topCount > 0 ? Math.round(topG / topCount) : avgG;
  const avgTopB = topCount > 0 ? Math.round(topB / topCount) : avgB;

  const avgBottomR = bottomCount > 0 ? Math.round(bottomR / bottomCount) : avgR;
  const avgBottomG = bottomCount > 0 ? Math.round(bottomG / bottomCount) : avgG;
  const avgBottomB = bottomCount > 0 ? Math.round(bottomB / bottomCount) : avgB;

  const dominantColor = rgbToHex(avgR, avgG, avgB);
  const color1 = rgbToHex(avgTopR, avgTopG, avgTopB);
  const color2 = rgbToHex(avgBottomR, avgBottomG, avgBottomB);

  // Calcula luminância percebida para determinar se o texto deve ser branco ou grafite escuro
  // Fórmula WCAG Y = 0.299*R + 0.587*G + 0.114*B
  const luminance = (0.299 * avgR + 0.587 * avgG + 0.114 * avgB);
  const textColor: 'light' | 'dark' = luminance > 145 ? 'dark' : 'light';

  // 2. Tenta casar com o banco correspondente
  const [h, s, l] = rgbToHsl(avgR, avgG, avgB);
  let matchedBank = 'Outro';
  let suggestedName = 'Cartão de Crédito';
  let suggestedBrand: 'mastercard' | 'visa' | 'elo' | 'amex' | 'hipercard' | 'generic' = 'mastercard';

  for (const profile of BANK_COLOR_PROFILES) {
    if (profile.check(avgR, avgG, avgB, h, s, l)) {
      matchedBank = profile.bank;
      suggestedName = profile.defaultName;
      suggestedBrand = profile.brand;
      break;
    }
  }

  // Gera o gradiente visual customizado
  const secondaryColor = adjustBrightness(color2, textColor === 'light' ? -25 : 25);
  const midColor = adjustBrightness(dominantColor, 10);
  const gradient = `from-[${color1}] via-[${midColor}] to-[${secondaryColor}]`;

  // Gera uma imagem otimizada em Base64 para exibição ultrarrápida
  const photoDataUrl = sourceCanvas.toDataURL('image/jpeg', 0.88);

  return {
    photoDataUrl,
    dominantColor,
    secondaryColor,
    gradient,
    textColor,
    suggestedBank: matchedBank,
    suggestedName,
    suggestedBrand,
  };
}

/**
 * Recorta do vídeo ou imagem a área exata do cartão com resolução padrão HD (800x504)
 */
export function cropCardFromSource(
  source: HTMLVideoElement | HTMLImageElement,
  cropArea: { x: number; y: number; width: number; height: number }
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  // Resolução nítida para cartões de crédito
  canvas.width = 800;
  canvas.height = 504;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Falha ao instanciar canvas de recorte.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    source,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas;
}
