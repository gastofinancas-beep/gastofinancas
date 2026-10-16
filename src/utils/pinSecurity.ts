function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function hashPin(pin: string): Promise<string> {
  const trimmed = String(pin).trim();
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Não foi possível proteger o PIN neste navegador.');
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(trimmed),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 210000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  return `pbkdf2$210000$${toHex(salt)}$${toHex(derived)}`;
}

export async function verifyPinHash(inputPin: string, storedHash?: string | null): Promise<boolean> {
  if (!storedHash || !inputPin) {
    return false;
  }

  const cleanInput = String(inputPin).trim();
  const cleanStored = String(storedHash).trim();

  if (!cleanInput || !cleanStored) {
    return false;
  }

  if (cleanStored.startsWith('pbkdf2$')) {
    const parts = cleanStored.split('$');
    if (parts.length !== 4) {
      return false;
    }
    const iterations = parseInt(parts[1], 10);
    const saltHex = parts[2];
    const targetHashHex = parts[3];

    if (isNaN(iterations) || !saltHex || !targetHashHex) {
      return false;
    }

    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new Error('Não foi possível proteger o PIN neste navegador.');
    }

    const salt = fromHex(saltHex);
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(cleanInput),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const derived = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    const computedHex = toHex(derived);
    return constantTimeEqual(computedHex.toLowerCase(), targetHashHex.toLowerCase());
  }

  if (cleanStored.length === 64 && /^[0-9a-f]{64}$/i.test(cleanStored)) {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(cleanInput));
      const computedHex = toHex(hashBuffer);
      return constantTimeEqual(computedHex.toLowerCase(), cleanStored.toLowerCase());
    }
  }

  if (cleanStored.startsWith('fallback_')) {
    let fallback = 0;
    for (let i = 0; i < cleanInput.length; i++) {
      const char = cleanInput.charCodeAt(i);
      fallback = ((fallback << 5) - fallback) + char;
      fallback |= 0;
    }
    const fallbackStr = 'fallback_' + Math.abs(fallback).toString(16);
    return constantTimeEqual(fallbackStr, cleanStored);
  }

  return false;
}

export function needsPinRehash(stored?: string | null): boolean {
  if (!stored) {
    return true;
  }
  return !String(stored).trim().startsWith('pbkdf2$');
}
