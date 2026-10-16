/**
 * Formata e mascara dados de cartão com segurança (LGPD / PCI-DSS compliance)
 */

export function formatCardNumber(
  number?: string,
  showSensitiveData = false
): string {
  if (!number) return '•••• •••• •••• ••••';

  const clean = String(number).replace(/\D/g, '');
  if (clean.length === 0) return '•••• •••• •••• ••••';

  if (!showSensitiveData) {
    const last4 = clean.slice(-4).padStart(4, '•');
    return `•••• •••• •••• ${last4}`;
  }

  // Se exibir completo, agrupa de 4 em 4
  const chunks = clean.match(/.{1,4}/g) || [];
  return chunks.join(' ').padEnd(19, ' ');
}

export function formatCardHolder(holder?: string): string {
  if (!holder || !holder.trim()) return 'SEU NOME AQUI';
  return holder.trim().toUpperCase();
}

export function formatExpiryDate(expiry?: string, month?: number | string, year?: number | string): string {
  if (expiry && expiry.includes('/')) {
    return expiry.trim();
  }
  if (month && year) {
    const m = String(month).padStart(2, '0');
    const y = String(year).slice(-2);
    return `${m}/${y}`;
  }
  return '12/29';
}

export function formatCvv(cvv?: string, showSensitiveData = false): string {
  if (!cvv) return '•••';
  if (!showSensitiveData) return '•••';
  return String(cvv).replace(/\D/g, '').slice(0, 4);
}
