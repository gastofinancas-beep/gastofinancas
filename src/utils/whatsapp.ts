/** Normaliza um telefone brasileiro para o formato internacional (55 + DDD + número). */
export function normalizeBrazilPhone(raw?: string | null): string | null {
  let digits = (raw || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('55') && digits.length >= 12) digits = digits.slice(2);
  digits = digits.replace(/^0+/, '');
  if (digits.length !== 10 && digits.length !== 11) return null;
  return `55${digits}`;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
