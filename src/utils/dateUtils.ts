export function toLocalISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayLocalISO(): string {
  return toLocalISODate(new Date());
}

export function toLocalMonth(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function currentMonthLocal(): string {
  return toLocalMonth(new Date());
}

export function parseLocalISO(iso: string): Date {
  const clean = (iso || '').split('T')[0];
  const parts = clean.split('-');
  const year = parseInt(parts[0], 10) || new Date().getFullYear();
  const month = parseInt(parts[1], 10) || 1;
  const day = parseInt(parts[2], 10) || 1;
  return new Date(year, month - 1, day);
}

export function addDaysLocal(iso: string, days: number): string {
  const d = parseLocalISO(iso);
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
}
