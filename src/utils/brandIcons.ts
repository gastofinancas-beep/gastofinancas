import { BRAND_ICONS, BrandIcon } from '../data/brandIcons';

const SLUGS = Object.keys(BRAND_ICONS).sort((a, b) => b.length - a.length);

export interface ResolvedBrandIcon extends BrandIcon {
  luminance: number;
}

/** Procura o logo da marca pela chave do serviço ou pelo nome digitado (já normalizado, só a-z0-9). */
export function findBrandIcon(normalizedKey: string): ResolvedBrandIcon | null {
  if (!normalizedKey) return null;
  const slug = SLUGS.find((s) => normalizedKey === s || (s.length >= 5 && normalizedKey.includes(s)));
  if (!slug) return null;
  const icon = BRAND_ICONS[slug];
  const r = parseInt(icon.hex.slice(0, 2), 16);
  const g = parseInt(icon.hex.slice(2, 4), 16);
  const b = parseInt(icon.hex.slice(4, 6), 16);
  return { ...icon, luminance: (0.299 * r + 0.587 * g + 0.114 * b) / 255 };
}
