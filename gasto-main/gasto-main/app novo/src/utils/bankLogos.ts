import { allInstitutions, byIspb, logoCdnUrl, version, Institution } from 'logos-bancos-br';

export interface ResolvedBankLogo {
  ispb: string;
  name: string;
  shortName?: string;
  svgUrl?: string | null;
  pngUrl?: string | null;
  cdnSvgUrl?: string | null;
  cdnPngUrl?: string | null;
  tgentilSvgUrl?: string | null;
  brandColor?: string;
}

// Curated high-priority ISPB mappings for popular institutions
// (Sources 100% official from BCB / Open Finance & Tgentil/Bancos-em-SVG)
const POPULAR_ISPB_MAP: Record<string, { ispb: string; color: string; displayName: string; tgentilSlug?: string }> = {
  nubank: { ispb: '18236120', color: '#820AD1', displayName: 'Nubank', tgentilSlug: 'nubank' },
  nu: { ispb: '18236120', color: '#820AD1', displayName: 'Nubank', tgentilSlug: 'nubank' },
  itau: { ispb: '60394079', color: '#EC7000', displayName: 'Itaú', tgentilSlug: 'itau' },
  inter: { ispb: '00416968', color: '#FF7A00', displayName: 'Inter', tgentilSlug: 'banco-inter' },
  bradesco: { ispb: '60746948', color: '#CC092F', displayName: 'Bradesco', tgentilSlug: 'bradesco' },
  santander: { ispb: '90400888', color: '#EC0000', displayName: 'Santander', tgentilSlug: 'santander' },
  bb: { ispb: '00000000', color: '#003882', displayName: 'Banco do Brasil', tgentilSlug: 'banco-do-brasil' },
  'banco do brasil': { ispb: '00000000', color: '#003882', displayName: 'Banco do Brasil', tgentilSlug: 'banco-do-brasil' },
  brasil: { ispb: '00000000', color: '#003882', displayName: 'Banco do Brasil', tgentilSlug: 'banco-do-brasil' },
  caixa: { ispb: '00360305', color: '#005CA9', displayName: 'Caixa Econômica', tgentilSlug: 'caixa' },
  cef: { ispb: '00360305', color: '#005CA9', displayName: 'Caixa', tgentilSlug: 'caixa' },
  c6: { ispb: '31872495', color: '#181818', displayName: 'C6 Bank', tgentilSlug: 'c6-bank' },
  'c6 bank': { ispb: '31872495', color: '#181818', displayName: 'C6 Bank', tgentilSlug: 'c6-bank' },
  btg: { ispb: '30306294', color: '#0B1E36', displayName: 'BTG Pactual', tgentilSlug: 'btg-pactual' },
  'btg pactual': { ispb: '30306294', color: '#0B1E36', displayName: 'BTG Pactual', tgentilSlug: 'btg-pactual' },
  xp: { ispb: '02332886', color: '#000000', displayName: 'XP Investimentos', tgentilSlug: 'xp-investimentos' },
  'xp investimentos': { ispb: '02332886', color: '#000000', displayName: 'XP', tgentilSlug: 'xp-investimentos' },
  picpay: { ispb: '09516419', color: '#11C76F', displayName: 'PicPay', tgentilSlug: 'picpay' },
  pagbank: { ispb: '08561701', color: '#00B17D', displayName: 'PagBank', tgentilSlug: 'pagbank' },
  pagseguro: { ispb: '08561701', color: '#00B17D', displayName: 'PagSeguro', tgentilSlug: 'pagbank' },
  mercadopago: { ispb: '10573521', color: '#009EE3', displayName: 'Mercado Pago', tgentilSlug: 'mercado-pago' },
  'mercado pago': { ispb: '10573521', color: '#009EE3', displayName: 'Mercado Pago', tgentilSlug: 'mercado-pago' },
  neon: { ispb: '61723847', color: '#00E6FF', displayName: 'Neon', tgentilSlug: 'neon' },
  sicredi: { ispb: '01181521', color: '#006633', displayName: 'Sicredi', tgentilSlug: 'sicredi' },
  sicoob: { ispb: '02038232', color: '#003641', displayName: 'Sicoob', tgentilSlug: 'sicoob' },
  cresol: { ispb: '10398952', color: '#F37021', displayName: 'Cresol' },
  safra: { ispb: '58160789', color: '#0D1E32', displayName: 'Safra', tgentilSlug: 'safra' },
  pan: { ispb: '59285411', color: '#0080FF', displayName: 'Banco Pan', tgentilSlug: 'banco-pan' },
  bmg: { ispb: '61186680', color: '#FF5A00', displayName: 'BMG' },
  stone: { ispb: '16501555', color: '#00A868', displayName: 'Stone' },
  genial: { ispb: '45246410', color: '#001E62', displayName: 'Genial Investimentos' },
  asaas: { ispb: '19540550', color: '#0030B9', displayName: 'Asaas' },
  brb: { ispb: '00000208', color: '#0047BA', displayName: 'BRB' },
  unicred: { ispb: '00315557', color: '#004A36', displayName: 'Unicred' },
  ailos: { ispb: '05463212', color: '#003366', displayName: 'Ailos' },
};

// Clean string for fuzzy normalization
export function cleanBankSearchString(input?: string): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
}

// In-memory cache for fast repeated lookups
const logoCache = new Map<string, ResolvedBankLogo | null>();

/**
 * Resolves the official logo from logos-bancos-br by bank name, short name, COMPE or ISPB.
 */
export function getOfficialBankLogo(bankName?: string): ResolvedBankLogo | null {
  if (!bankName) return null;
  const rawKey = bankName.trim();
  if (logoCache.has(rawKey)) {
    return logoCache.get(rawKey) || null;
  }

  const clean = cleanBankSearchString(bankName);
  if (!clean || clean === 'dinheiro' || clean === 'outro' || clean === 'carteira') {
    logoCache.set(rawKey, null);
    return null;
  }

  // 1. Check direct curated alias keys
  for (const [key, mapping] of Object.entries(POPULAR_ISPB_MAP)) {
    const keyParts = key.split(' ');
    const isMatch = keyParts.every(part => clean.includes(part));
    if (isMatch) {
      const inst = byIspb(mapping.ispb);
      const ispb = mapping.ispb;
      const svgRelPath = inst?.logo?.svg;
      const pngRelPath = inst?.logo?.png;

      const result: ResolvedBankLogo = {
        ispb,
        name: mapping.displayName || inst?.shortName || inst?.name || bankName,
        shortName: inst?.shortName,
        svgUrl: svgRelPath ? `/logos-bancos-br/${svgRelPath.replace('logos/', '')}` : `/logos-bancos-br/svg/${ispb}.svg`,
        pngUrl: pngRelPath ? `/logos-bancos-br/${pngRelPath.replace('logos/', '')}` : `/logos-bancos-br/png/${ispb}.png`,
        cdnSvgUrl: logoCdnUrl(ispb, { format: 'svg' }) || `https://cdn.jsdelivr.net/npm/logos-bancos-br@${version}/logos/svg/${ispb}.svg`,
        cdnPngUrl: logoCdnUrl(ispb, { format: 'png' }) || `https://cdn.jsdelivr.net/npm/logos-bancos-br@${version}/logos/png/${ispb}.png`,
        tgentilSvgUrl: mapping.tgentilSlug ? `https://raw.githubusercontent.com/Tgentil/Bancos-em-SVG/master/${mapping.tgentilSlug}.svg` : null,
        brandColor: mapping.color,
      };

      logoCache.set(rawKey, result);
      return result;
    }
  }

  // 2. Dynamic lookup in logos-bancos-br's 1,000+ official institutions
  try {
    const all = allInstitutions();
    let found: Institution | undefined = undefined;

    // Check by ISPB if input contains digits
    const digits = bankName.replace(/\D/g, '');
    if (digits.length >= 7) {
      found = all.find(b => b.ispb === digits.padStart(8, '0'));
    }

    // Check by COMPE code (3-4 digits)
    if (!found && digits.length > 0 && digits.length <= 4) {
      found = all.find(b => b.compe === digits || b.compe4 === digits.padStart(4, '0'));
    }

    // Check by name or shortName
    if (!found) {
      found = all.find(b => {
        if (!b.logo) return false;
        const bName = cleanBankSearchString(b.name);
        const bShort = cleanBankSearchString(b.shortName || '');
        return (
          bName === clean ||
          bShort === clean ||
          bName.includes(clean) ||
          bShort.includes(clean) ||
          clean.includes(bShort)
        );
      });
    }

    if (found && found.logo) {
      const ispb = found.ispb;
      const svgRelPath = found.logo.svg;
      const pngRelPath = found.logo.png;

      const result: ResolvedBankLogo = {
        ispb,
        name: found.shortName || found.name,
        shortName: found.shortName,
        svgUrl: svgRelPath ? `/logos-bancos-br/${svgRelPath.replace('logos/', '')}` : `/logos-bancos-br/svg/${ispb}.svg`,
        pngUrl: pngRelPath ? `/logos-bancos-br/${pngRelPath.replace('logos/', '')}` : `/logos-bancos-br/png/${ispb}.png`,
        cdnSvgUrl: logoCdnUrl(ispb, { format: 'svg' }) || `https://cdn.jsdelivr.net/npm/logos-bancos-br@${version}/logos/svg/${ispb}.svg`,
        cdnPngUrl: logoCdnUrl(ispb, { format: 'png' }) || `https://cdn.jsdelivr.net/npm/logos-bancos-br@${version}/logos/png/${ispb}.png`,
      };

      logoCache.set(rawKey, result);
      return result;
    }
  } catch (err) {
    console.warn('Error resolving bank logo from logos-bancos-br:', err);
  }

  logoCache.set(rawKey, null);
  return null;
}
