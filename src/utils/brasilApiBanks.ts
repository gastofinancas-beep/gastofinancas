/**
 * Serviço de Integração com BrasilAPI (https://brasilapi.com.br/api/banks/v1)
 * com fallback para logos-bancos-br e catálogo offline resiliente.
 */

export interface BrasilApiBank {
  ispb: string;
  name: string;
  code: number | null;
  fullName: string;
}

let cachedBanks: BrasilApiBank[] | null = null;
let isFetching = false;
let fetchPromise: Promise<BrasilApiBank[]> | null = null;

/**
 * Busca a lista oficial de todas as instituições financeiras da BrasilAPI
 * com cache em memória e localStorage para performance instantânea.
 */
export async function fetchBrasilApiBanks(): Promise<BrasilApiBank[]> {
  if (cachedBanks && cachedBanks.length > 0) {
    return cachedBanks;
  }

  // Tenta carregar do localStorage (cache de 7 dias)
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('gasto_brasilapi_banks_cache');
      const savedAt = localStorage.getItem('gasto_brasilapi_banks_time');
      if (saved && savedAt) {
        const ageHours = (Date.now() - parseInt(savedAt, 10)) / (1000 * 60 * 60);
        if (ageHours < 24 * 7) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            cachedBanks = parsed;
            return parsed;
          }
        }
      }
    } catch {
      // Ignora erro de leitura do storage
    }
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch('https://brasilapi.com.br/api/banks/v1', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data: BrasilApiBank[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Ordena por bancos com código primeiro, depois alfabético
          const sorted = data.sort((a, b) => {
            const nameA = a.name || a.fullName || '';
            const nameB = b.name || b.fullName || '';
            return nameA.localeCompare(nameB);
          });
          cachedBanks = sorted;

          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('gasto_brasilapi_banks_cache', JSON.stringify(sorted));
              localStorage.setItem('gasto_brasilapi_banks_time', String(Date.now()));
            }
          } catch {
            // storage full
          }

          return sorted;
        }
      }
    } catch (err) {
      console.warn('BrasilAPI indisponível ou offline. Usando catálogo integrado.', err);
    } finally {
      fetchPromise = null;
    }

    return cachedBanks || [];
  })();

  return fetchPromise;
}
