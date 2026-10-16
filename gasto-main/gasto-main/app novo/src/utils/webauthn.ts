/**
 * WebAuthn (Web Authentication API) Utilities for Biometric Authentication (Face ID / Touch ID)
 * Supports registration (credentials.create) and authentication (credentials.get).
 */

// Converts ArrayBuffer to Base64URL string
export function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Converts Base64URL string back to Uint8Array
export function base64UrlToBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Checks if WebAuthn and Platform Authenticator (Face ID / Touch ID / Android Biometrics / Device PIN) are available.
 */
export async function isWebAuthnAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;

  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return !!available;
    }
    return !!window.navigator?.credentials;
  } catch {
    return false;
  }
}

export interface DeviceBiometricInfo {
  name: string;
  short: string;
  hasFace: boolean;
  hasTouch: boolean;
  platform: 'ios' | 'android' | 'desktop';
  description: string;
}

/**
 * Returns a friendly name for the biometric sensor tailored exclusively for mobile devices (Android & iPhone).
 */
export function getDeviceBiometricLabel(): DeviceBiometricInfo {
  if (typeof navigator === 'undefined') {
    return { 
      name: 'Face ID ou Código do Celular', 
      short: 'Face ID / PIN', 
      hasFace: true, 
      hasTouch: false,
      platform: 'ios',
      description: 'Usa o mesmo reconhecimento facial ou código do aparelho.' 
    };
  }

  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1 && /Macintosh|MacIntel/i.test(ua));
  const isAndroid = /Android/i.test(ua);

  if (isIOS) {
    return { 
      name: 'Face ID ou Código do iPhone', 
      short: 'Face ID', 
      hasFace: true, 
      hasTouch: false,
      platform: 'ios',
      description: 'Usa o mesmo Face ID ou código de desbloqueio do seu iPhone.' 
    };
  }
  if (isAndroid) {
    return { 
      name: 'Impressão Digital, Facial ou PIN do Celular', 
      short: 'Touch / Digital', 
      hasFace: false, 
      hasTouch: true,
      platform: 'android',
      description: 'Usa a mesma digital (Touch), desbloqueio facial ou PIN do seu celular Android.' 
    };
  }

  return { 
    name: 'Biometria ou PIN do Aparelho', 
    short: 'Biometria / PIN', 
    hasFace: true, 
    hasTouch: true,
    platform: 'desktop',
    description: 'Usa o sensor biométrico (Touch ID / Windows Hello) ou senha do seu aparelho.' 
  };
}

/**
 * Registers a new Biometric Credential on the current device using WebAuthn.
 */
export async function registerBiometricCredential(
  userEmail: string,
  userId: string,
  userName?: string
): Promise<{ credentialId: string; rawIdBase64: string } | null> {
  if (typeof window === 'undefined' || !window.navigator?.credentials) {
    throw new Error('Navegador não suporta Web Authentication (WebAuthn).');
  }

  // Generate a random 32-byte cryptographic challenge
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  // User ID buffer (must be Uint8Array)
  const encoder = new TextEncoder();
  const userIdBuffer = encoder.encode(userId || userEmail || 'gasto-user');

  const creationOptions: CredentialCreationOptions = {
    publicKey: {
      challenge,
      rp: {
        name: 'Gastô App',
      },
      user: {
        id: userIdBuffer,
        name: userEmail || 'usuario@gasto.app',
        displayName: userName || userEmail || 'Usuário Gastô',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256 (P-256 with SHA-256 - iOS / Android standard)
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Enforces device biometrics (Face ID, Touch ID, Fingerprint, Device PIN)
        userVerification: 'required',        // Requires Face ID / Touch ID / Device PIN verification
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    },
  };

  try {
    const credential = (await navigator.credentials.create(creationOptions)) as PublicKeyCredential | null;
    if (!credential) {
      throw new Error('Cadastro biométrico cancelado ou recusado.');
    }

    const rawIdBase64 = bufferToBase64Url(credential.rawId);
    return {
      credentialId: credential.id,
      rawIdBase64,
    };
  } catch (err: any) {
    console.warn('WebAuthn credential creation error:', err);
    throw err;
  }
}

/**
 * Authenticates the user with WebAuthn biometrics (Face ID / Touch ID / Device PIN).
 */
export async function authenticateWithBiometrics(
  registeredCredentialId?: string
): Promise<boolean> {
  if (typeof window === 'undefined' || !window.navigator?.credentials) {
    throw new Error('Navegador não suporta Web Authentication (WebAuthn).');
  }

  // Generate fresh challenge
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const allowCredentials: PublicKeyCredentialDescriptor[] = [];
  if (registeredCredentialId) {
    try {
      const bufferId = base64UrlToBuffer(registeredCredentialId);
      allowCredentials.push({
        id: bufferId,
        type: 'public-key',
      });
    } catch {
      // If parsing fails, allow standard resident key prompt
    }
  }

  const requestOptions: CredentialRequestOptions = {
    publicKey: {
      challenge,
      timeout: 60000,
      userVerification: 'required', // Demands Face ID / Biometrics / Device PIN verification
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    },
  };

  try {
    const assertion = (await navigator.credentials.get(requestOptions)) as PublicKeyCredential | null;
    if (assertion && assertion.id) {
      return true;
    }
    return false;
  } catch (err: any) {
    console.warn('WebAuthn authentication error:', err);
    throw err;
  }
}

/**
 * High-level helper to unlock with device credentials (Face ID / Face Unlock / Fingerprint / Device PIN).
 * If a credential exists, it verifies it. If no credential was registered yet, it registers one
 * using the device's native unlock, simultaneously verifying and saving the credential.
 */
export async function unlockWithDeviceSensor(options: {
  userEmail?: string;
  userId?: string;
  userName?: string;
  registeredCredentialId?: string;
  isEnrollment?: boolean;
}): Promise<{ success: boolean; newCredentialId?: string; error?: string; cancelled?: boolean }> {
  try {
    const available = await isWebAuthnAvailable();
    if (!available) {
      return {
        success: false,
        error: 'O sensor de biometria / PIN não está disponível neste navegador ou dispositivo.',
      };
    }

    // A. ENROLLMENT MODE: Explicitly registering native device biometric (Face ID / Touch ID / Device PIN)
    if (options.isEnrollment) {
      try {
        const regResult = await registerBiometricCredential(
          options.userEmail || 'usuario@gasto.app',
          options.userId || options.userEmail || 'gasto-user',
          options.userName || 'Usuário Gastô'
        );

        if (regResult?.credentialId) {
          return {
            success: true,
            newCredentialId: regResult.credentialId,
          };
        }
      } catch (regErr: any) {
        if (regErr?.name === 'NotAllowedError' || regErr?.name === 'AbortError') {
          return { success: false, cancelled: true, error: 'Ativação cancelada no celular.' };
        }
        return {
          success: false,
          error: regErr?.message || 'Não foi possível ativar o sensor do aparelho.',
        };
      }
    }

    // B. AUTHENTICATION MODE: Verify existing biometric / passcode
    // 1. If we have a registered credential, attempt direct verification
    if (options.registeredCredentialId) {
      try {
        const verified = await authenticateWithBiometrics(options.registeredCredentialId);
        if (verified) {
          return { success: true };
        }
      } catch (authErr: any) {
        // If user cancelled, don't fallback to create
        if (authErr?.name === 'NotAllowedError' || authErr?.name === 'AbortError') {
          return { success: false, cancelled: true, error: 'Desbloqueio biométrico cancelado.' };
        }
        console.warn('Attempting device credential fallback after failed auth:', authErr);
      }
    }

    // 2. Try discoverable authentication (Passkey style resident key)
    try {
      const verified = await authenticateWithBiometrics();
      if (verified) {
        return { success: true };
      }
    } catch (discErr: any) {
      if (discErr?.name === 'NotAllowedError' || discErr?.name === 'AbortError') {
        return { success: false, cancelled: true, error: 'Desbloqueio cancelado.' };
      }
    }

    // 3. Fallback: If no credential was ever registered, register one directly
    const regResult = await registerBiometricCredential(
      options.userEmail || 'usuario@gasto.app',
      options.userId || options.userEmail || 'gasto-user',
      options.userName || 'Usuário Gastô'
    );

    if (regResult?.credentialId) {
      return {
        success: true,
        newCredentialId: regResult.credentialId,
      };
    }

    return {
      success: false,
      error: 'Não foi possível validar o desbloqueio facial ou PIN do celular.',
    };
  } catch (err: any) {
    if (err?.name === 'NotAllowedError' || err?.name === 'AbortError') {
      return { success: false, cancelled: true, error: 'Desbloqueio biométrico cancelado.' };
    }
    return {
      success: false,
      error: err?.message || 'Falha na autenticação biométrica do aparelho.',
    };
  }
}
