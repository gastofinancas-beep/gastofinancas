import { BankCardPreset, CardColorVariant } from '../../data/bankCards/types';

export interface ComputedCardStyles {
  background: string;
  color: string;
  accent: string;
  borderColor: string;
  textureOverlay?: string;
  finishOverlay?: string;
}

/**
 * Computa o estilo visual do cartão a partir do preset e variante de cor opcional
 */
export function computeCardThemeStyles(
  preset: BankCardPreset,
  activeColorVariantId?: string
): ComputedCardStyles {
  const variant = activeColorVariantId
    ? preset.colorVariants?.find(v => v.id === activeColorVariantId)
    : undefined;

  const primary = variant?.primary || preset.colors.primary;
  const secondary = variant?.secondary || preset.colors.secondary || primary;
  const tertiary = variant?.tertiary || preset.colors.tertiary || primary;
  const text = variant?.text || preset.colors.text || '#FFFFFF';
  const accent = variant?.accent || preset.colors.accent || '#E5C07B';
  const finish = variant?.finish || preset.appearance.finish || 'matte';
  const texture = variant?.texture || preset.appearance.textureType || 'none';

  // Gradiente base realista em 135 graus
  let background = `linear-gradient(135deg, ${primary} 0%, ${secondary} 55%, ${tertiary} 100%)`;

  if (finish === 'carbon') {
    background = `radial-gradient(ellipse at top left, ${secondary} 0%, ${primary} 60%, ${tertiary} 100%)`;
  } else if (finish === 'iridescent') {
    background = `linear-gradient(125deg, ${primary} 0%, ${secondary} 40%, ${accent}25 70%, ${tertiary} 100%)`;
  }

  const borderColor = preset.appearance.borderColor || (text === '#FFFFFF' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)');

  return {
    background,
    color: text,
    accent,
    borderColor,
    textureOverlay: getTextureSvgPattern(texture),
    finishOverlay: getFinishOverlay(finish),
  };
}

function getTextureSvgPattern(texture: string): string | undefined {
  switch (texture) {
    case 'carbon-fiber':
      return `radial-gradient(black 15%, transparent 16%) 0 0,
        radial-gradient(black 15%, transparent 16%) 4px 4px,
        radial-gradient(rgba(255,255,255,.1) 15%, transparent 20%) 0 1px,
        radial-gradient(rgba(255,255,255,.1) 15%, transparent 20%) 4px 5px`;
    case 'dots':
      return `radial-gradient(rgba(255, 255, 255, 0.12) 1.5px, transparent 1.5px)`;
    case 'diagonal-stripes':
      return `repeating-linear-gradient(45deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 2px, transparent 2px, transparent 8px)`;
    case 'mesh':
      return `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`;
    case 'lines-minimal':
      return `repeating-linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 1px, transparent 1px, transparent 12px)`;
    case 'geometric':
      return `radial-gradient(circle at 100% 50%, transparent 20%, rgba(255,255,255,0.04) 21%, rgba(255,255,255,0.04) 34%, transparent 35%, transparent)`;
    case 'waves':
      return `radial-gradient(ellipse at 80% 0%, rgba(255,255,255,0.1) 0%, transparent 70%)`;
    default:
      return undefined;
  }
}

function getFinishOverlay(finish: string): string | undefined {
  switch (finish) {
    case 'metallic':
      return 'linear-gradient(105deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 45%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.05) 55%, rgba(255,255,255,0) 100%)';
    case 'carbon':
      return 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.4) 100%)';
    case 'iridescent':
      return 'linear-gradient(115deg, rgba(168,85,247,0.15) 0%, rgba(59,130,246,0.2) 30%, rgba(236,72,153,0.15) 70%, rgba(234,179,8,0.1) 100%)';
    case 'glossy':
      return 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.02) 60%, rgba(0,0,0,0.2) 100%)';
    default:
      return 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.15) 100%)';
  }
}
