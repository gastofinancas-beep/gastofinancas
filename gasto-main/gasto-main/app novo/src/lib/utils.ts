export function cn(...classes: (string | undefined | null | false | Record<string, boolean>)[]) {
  return classes
    .flatMap(c => {
      if (!c) return [];
      if (typeof c === 'object') {
        return Object.entries(c).filter(([_, v]) => Boolean(v)).map(([k]) => k);
      }
      return [c];
    })
    .join(' ');
}
