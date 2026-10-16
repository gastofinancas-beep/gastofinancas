import { 
  GoogleAuthProvider, 
  OAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  UserCredential,
  AuthProvider
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Signs in the user with Google.
 * On Web: Uses signInWithPopup with an automatic fallback to signInWithRedirect.
 * On Native (Capacitor): Future integration point for @capacitor-firebase/authentication.
 */
export async function signInWithGoogle(): Promise<UserCredential | null> {
  // NATIVE: In native Capacitor environment, use @capacitor-firebase/authentication:
  // import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
  // const result = await FirebaseAuthentication.signInWithGoogle();
  // return result;

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithProviderWeb(provider);
}

/**
 * Signs in the user with Apple.
 * On Web: Uses OAuthProvider('apple.com') with popup and redirect fallback.
 * On Native (Capacitor): Future integration point for @capacitor-firebase/authentication.
 */
export async function signInWithApple(): Promise<UserCredential | null> {
  // NATIVE: In native Capacitor environment, use @capacitor-firebase/authentication:
  // import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
  // const result = await FirebaseAuthentication.signInWithApple({
  //   scopes: ['email', 'name'],
  // });
  // return result;

  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  return signInWithProviderWeb(provider);
}

/**
 * Common web authentication handler using popup with redirect fallback.
 */
async function signInWithProviderWeb(provider: AuthProvider): Promise<UserCredential | null> {
  try {
    return await signInWithPopup(auth, provider);
  } catch (popupErr: any) {
    // If user closed the popup or cancelled the interaction, return null cleanly
    if (
      popupErr?.code === 'auth/popup-closed-by-user' ||
      popupErr?.code === 'auth/cancelled-popup-request'
    ) {
      return null;
    }

    // If popup was blocked by browser or environment restrictions, fallback to redirect
    if (
      popupErr?.code === 'auth/popup-blocked' ||
      popupErr?.code === 'popup-blocked' ||
      popupErr?.code === 'auth/operation-not-supported-in-this-environment' ||
      popupErr?.code === 'auth/auth-domain-config-required' ||
      popupErr?.message?.includes('popup')
    ) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_redirect_pending', '1');
      }
      await signInWithRedirect(auth, provider);
      return null;
    }

    throw popupErr;
  }
}

/**
 * Returns a friendly, human-readable error message in Portuguese for Firebase Auth errors,
 * specifically handling unconfigured/disabled providers (auth/operation-not-allowed).
 */
export function getFriendlyAuthErrorMessage(err: any, providerName?: 'google' | 'apple'): string {
  const code = err?.code || '';
  switch (code) {
    case 'auth/operation-not-allowed':
      if (providerName === 'apple') {
        return 'O login com a Apple não está habilitado no momento no Firebase. Ative o provedor Apple no console do Firebase ou acesse com e-mail e senha.';
      }
      if (providerName === 'google') {
        return 'O login com o Google não está habilitado no momento no Firebase. Ative o provedor Google no console do Firebase ou acesse com e-mail e senha.';
      }
      return 'Este método de autenticação não está habilitado no projeto do Firebase. Ative o provedor correspondente no console ou use e-mail e senha.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Usuário ou senha incorretos.';
    case 'auth/invalid-email':
      return 'E-mail ou usuário inválido. Verifique se digitou corretamente.';
    case 'auth/email-already-in-use':
      return 'Este usuário/e-mail já está cadastrado. Clique em "Entrar" para fazer login.';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas incorretas. Aguarde alguns instantes e tente novamente.';
    case 'auth/network-request-failed':
      return 'Falha de conexão. Verifique sua internet e tente novamente.';
    case 'auth/unauthorized-domain': {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'ambiente atual';
      return `O domínio atual (${currentHost}) não está na lista de domínios autorizados do Firebase.`;
    }
    case 'auth/popup-closed-by-user':
      return 'Janela de login fechada antes de concluir.';
    case 'auth/account-exists-with-different-credential':
      return 'Já existe uma conta cadastrada com este e-mail usando outro método de login.';
    case 'auth/cancelled-popup-request':
      return '';
    default:
      return err?.message || 'Não foi possível concluir a ação. Tente novamente.';
  }
}
