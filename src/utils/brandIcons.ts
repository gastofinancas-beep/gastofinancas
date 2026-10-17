import { BRAND_ICONS, BrandIcon } from '../data/brandIcons';
import { BRAND_DOMAINS } from '../data/brandDomains';

const SLUGS = Object.keys(BRAND_ICONS).sort((a, b) => b.length - a.length);

// Nomes alternativos digitados com frequência
const ALIASES: Record<string, string> = {
  gemini: 'googlegemini',
  copilot: 'githubcopilot',
  googleone: 'googledrive',
  nord: 'nordvpn',
  proton: 'protonvpn',
  paramount: 'paramountplus',
  nintendo: 'nintendoswitch',
  chatgpt: 'openai',
  gpt: 'openai',
  adobe: 'adobecreativecloud',
  psplus: 'playstation',
  ps5: 'playstation',
};

export interface ResolvedBrandIcon extends BrandIcon {
  luminance: number;
}

/** Procura o logo da marca pela chave do serviço ou pelo nome digitado (já normalizado, só a-z0-9). */
export function findBrandIcon(normalizedKey: string): ResolvedBrandIcon | null {
  if (!normalizedKey) return null;
  const aliasKey = Object.keys(ALIASES).find((a) => normalizedKey.includes(a));
  const slug = SLUGS.find((s) => normalizedKey === s || (s.length >= 4 && normalizedKey.includes(s))) || (aliasKey ? ALIASES[aliasKey] : undefined);
  if (!slug) return null;
  const icon = BRAND_ICONS[slug];
  const r = parseInt(icon.hex.slice(0, 2), 16);
  const g = parseInt(icon.hex.slice(2, 4), 16);
  const b = parseInt(icon.hex.slice(4, 6), 16);
  return { ...icon, luminance: (0.299 * r + 0.587 * g + 0.114 * b) / 255 };
}

/** Domínio do site da marca (para buscar o ícone oficial) quando não há logo embutido. */
export function findBrandDomain(normalizedKey: string): string | null {
  if (!normalizedKey) return null;
  const hit = Object.keys(BRAND_DOMAINS)
    .sort((a, b) => b.length - a.length)
    .find((k) => normalizedKey === k || (k.length >= 4 && normalizedKey.includes(k)));
  return hit ? BRAND_DOMAINS[hit] : null;
}
