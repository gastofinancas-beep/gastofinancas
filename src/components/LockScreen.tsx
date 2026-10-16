import React, { useState, useEffect, useRef } from 'react';
import { 
  Delete, 
  ShieldCheck, 
  Mail, 
  Check, 
  LogOut,
  ChevronLeft,
  ArrowRight,
  Lock,
  KeyRound,
  ScanFace,
  Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  reauthenticateWithPopup, 
  reauthenticateWithCredential, 
  GoogleAuthProvider, 
  EmailAuthProvider 
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserProfile } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { verifyPinHash, hashPin, needsPinRehash } from '../utils/pinSecurity';
import { isWebAuthnAvailable, getDeviceBiometricLabel, unlockWithDeviceSensor } from '../utils/webauthn';
import { GastoLogo } from './GastoLogo';

interface LockScreenProps {
  userProfile: UserProfile | null;
  userEmail?: string;
  onUnlock: () => void;
  onUpdatePin?: (newHashedPin: string) => Promise<void>;
  onSignOut?: () => void;
  onSaveProfile?: (profile: UserProfile) => Promise<void>;
}

type LockViewMode = 'enter-pin' | 'forgot-pin-options' | 'set-new-pin' | 'confirm-new-pin' | 'reset-success';

const KEYPAD_LETTERS: Record<string, string> = {
  '1': '',
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
  '0': '+',
};

export const LockScreen: React.FC<LockScreenProps> = ({ 
  userProfile, 
  userEmail, 
  onUnlock, 
  onUpdatePin,
  onSignOut,
  onSaveProfile
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [viewMode, setViewMode] = useState<LockViewMode>('enter-pin');

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isBiometricAuthenticating, setIsBiometricAuthenticating] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState(() => getDeviceBiometricLabel());
  const [biometricError, setBiometricError] = useState<string | null>(null);
  const hasAutoPromptedRef = useRef(false);

  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [isReauthenticating, setIsReauthenticating] = useState(false);

  const [lockRemainingSeconds, setLockRemainingSeconds] = useState(0);

  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');

  const displayEmail = userEmail || userProfile?.email || '';
  const displayName = userProfile?.nickname || userProfile?.name?.split(' ')[0] || '';
  const photoURL = userProfile?.photoURL;

  const failStorageKey = `gasto_pin_fail_${displayEmail || auth.currentUser?.uid || 'default'}`;

  const getFailData = (key: string): { count: number; lockedUntil: number } => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.count === 'number' && typeof parsed?.lockedUntil === 'number') {
          return parsed;
        }
      }
    } catch (err: unknown) {
      console.warn('Fail data load notice:', err);
    }
    return { count: 0, lockedUntil: 0 };
  };

  const saveFailData = (key: string, data: { count: number; lockedUntil: number }) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err: unknown) {
      console.warn('Fail data save notice:', err);
    }
  };

  const clearFailData = (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (err: unknown) {
      console.warn('Fail data clear notice:', err);
    }
  };

  const formatCountdown = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  useEffect(() => {
    const checkLock = () => {
      const data = getFailData(failStorageKey);
      const now = Date.now();
      if (data.lockedUntil > now) {
        const remaining = Math.ceil((data.lockedUntil - now) / 1000);
        setLockRemainingSeconds(remaining);
      } else {
        setLockRemainingSeconds(0);
      }
    };

    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, [failStorageKey]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const available = await isWebAuthnAvailable();
        if (isMounted) {
          setBiometricAvailable(available);
          const label = getDeviceBiometricLabel();
          setBiometricLabel(label);

          if (available && userProfile?.useBiometrics !== false && !hasAutoPromptedRef.current) {
            hasAutoPromptedRef.current = true;
            const timer = setTimeout(() => {
              if (isMounted) {
                handleBiometricUnlock();
              }
            }, 350);
            return () => clearTimeout(timer);
          }
        }
      } catch (err: unknown) {
        console.warn('WebAuthn check error:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleBiometricUnlock = async () => {
    if (isBiometricAuthenticating) return;
    triggerHaptic(10);
    setIsBiometricAuthenticating(true);
    setBiometricError(null);
    setErrorMessage('');

    try {
      const result = await unlockWithDeviceSensor({
        userEmail: displayEmail,
        userId: displayEmail,
        userName: displayName,
        registeredCredentialId: userProfile?.webauthnCredentialId,
      });

      if (result.success) {
        setBiometricSuccess(true);
        triggerHaptic(25);

        if (result.newCredentialId && onSaveProfile && userProfile) {
          onSaveProfile({
            ...userProfile,
            useBiometrics: true,
            biometricCredentialRegistered: true,
            webauthnCredentialId: result.newCredentialId,
          }).catch((err: unknown) => console.warn('Could not save new credential in background:', err));
        }

        setTimeout(() => {
          onUnlock();
        }, 320);
      } else if (result.cancelled) {
        setIsBiometricAuthenticating(false);
      } else {
        setIsBiometricAuthenticating(false);
        setBiometricError(result.error || 'Falha ao validar biometria / PIN do celular.');
      }
    } catch (err: unknown) {
      console.warn('Biometric unlock exception:', err);
      setIsBiometricAuthenticating(false);
      setBiometricError('Falha no desbloqueio biométrico.');
    }
  };

  const getStoredPin = (): string | null => {
    if (userProfile?.appLockPin && typeof userProfile.appLockPin === 'string' && userProfile.appLockPin.trim()) {
      return userProfile.appLockPin.trim();
    }
    try {
      if (displayEmail) {
        const localByEmail = localStorage.getItem(`gasto_app_pin_${displayEmail}`);
        if (localByEmail && localByEmail.trim()) return localByEmail.trim();
        return null;
      }
      const localGlobal = localStorage.getItem('gasto_app_pin');
      if (localGlobal && localGlobal.trim()) return localGlobal.trim();
    } catch (err: unknown) {
      console.warn('PIN storage read notice:', err);
    }
    return null;
  };

  const verifyInputPin = async (inputPin: string) => {
    if (lockRemainingSeconds > 0) return;

    const storedPin = getStoredPin();

    if (!storedPin) {
      triggerHaptic(30);
      setError(true);
      if (biometricAvailable) {
        setErrorMessage(`Protegido por ${biometricLabel.short}. Use o sensor do celular para desbloquear.`);
        handleBiometricUnlock();
      } else {
        setErrorMessage('Nenhum PIN cadastrado. Crie seu novo PIN de 6 dígitos.');
        setTimeout(() => {
          setViewMode('set-new-pin');
          setPin('');
          setNewPin('');
          setConfirmNewPin('');
        }, 1200);
      }
      setTimeout(() => {
        setPin('');
      }, 800);
      return;
    }

    try {
      const isValid = await verifyPinHash(inputPin, storedPin);
      if (isValid) {
        if (needsPinRehash(storedPin)) {
          try {
            const newHash = await hashPin(inputPin);
            if (displayEmail) {
              localStorage.setItem(`gasto_app_pin_${displayEmail}`, newHash);
            } else {
              localStorage.setItem('gasto_app_pin', newHash);
            }
            if (onUpdatePin) {
              await onUpdatePin(newHash);
            }
          } catch (rehashErr: unknown) {
            console.warn('PIN transparent migration notice:', rehashErr);
          }
        }

        clearFailData(failStorageKey);
        setLockRemainingSeconds(0);
        triggerHaptic(22);
        setError(false);
        onUnlock();
      } else {
        triggerHaptic(30);
        setError(true);

        const currentData = getFailData(failStorageKey);
        const newCount = currentData.count + 1;
        let lockDurationMs = 0;
        if (newCount === 5) lockDurationMs = 30 * 1000;
        else if (newCount === 6) lockDurationMs = 60 * 1000;
        else if (newCount === 7) lockDurationMs = 5 * 60 * 1000;
        else if (newCount >= 8) lockDurationMs = 15 * 60 * 1000;

        const lockedUntil = lockDurationMs > 0 ? Date.now() + lockDurationMs : 0;
        saveFailData(failStorageKey, { count: newCount, lockedUntil });

        if (lockDurationMs > 0) {
          const remainingSecs = Math.ceil(lockDurationMs / 1000);
          setLockRemainingSeconds(remainingSecs);
          setErrorMessage('');
        } else {
          setErrorMessage('PIN incorreto. Tente novamente.');
        }

        setTimeout(() => {
          setPin('');
        }, 500);
      }
    } catch (err: unknown) {
      triggerHaptic(30);
      setError(true);
      setErrorMessage('Não foi possível proteger o PIN neste navegador.');
      setTimeout(() => {
        setPin('');
      }, 500);
    }
  };

  const handleKeyPress = (digit: string) => {
    if (viewMode === 'enter-pin' && lockRemainingSeconds > 0) {
      return;
    }
    triggerHaptic(8);

    if (viewMode === 'enter-pin') {
      if (pin.length < 6) {
        const newPinVal = pin + digit;
        setPin(newPinVal);
        setError(false);
        setErrorMessage('');
        
        if (newPinVal.length === 6) {
          verifyInputPin(newPinVal);
        }
      }
    } else if (viewMode === 'set-new-pin') {
      if (newPin.length < 6) {
        const next = newPin + digit;
        setNewPin(next);
        if (next.length === 6) {
          setTimeout(() => {
            setViewMode('confirm-new-pin');
            setConfirmNewPin('');
          }, 200);
        }
      }
    } else if (viewMode === 'confirm-new-pin') {
      if (confirmNewPin.length < 6) {
        const next = confirmNewPin + digit;
        setConfirmNewPin(next);
        if (next.length === 6) {
          if (next === newPin) {
            triggerHaptic(20);
            handleSaveNewPin(next);
          } else {
            triggerHaptic(30);
            setError(true);
            setErrorMessage('Os PINs não coincidem. Tente novamente.');
            setTimeout(() => {
              setConfirmNewPin('');
            }, 600);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    triggerHaptic(8);
    setError(false);
    setErrorMessage('');

    if (viewMode === 'enter-pin') {
      setPin(prev => prev.slice(0, -1));
    } else if (viewMode === 'set-new-pin') {
      setNewPin(prev => prev.slice(0, -1));
    } else if (viewMode === 'confirm-new-pin') {
      setConfirmNewPin(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    triggerHaptic(8);
    setError(false);
    setErrorMessage('');
    if (viewMode === 'enter-pin') setPin('');
    else if (viewMode === 'set-new-pin') setNewPin('');
    else if (viewMode === 'confirm-new-pin') setConfirmNewPin('');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === 'enter-pin' && lockRemainingSeconds > 0) {
        return;
      }
      if (viewMode === 'enter-pin' || viewMode === 'set-new-pin' || viewMode === 'confirm-new-pin') {
        if (/^[0-9]$/.test(e.key)) {
          handleKeyPress(e.key);
        } else if (e.key === 'Backspace') {
          handleDelete();
        } else if (e.key === 'Escape') {
          handleClear();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, pin, newPin, confirmNewPin, lockRemainingSeconds]);

  const handleGoogleReauth = async () => {
    triggerHaptic(12);
    setReauthError(null);
    setPasswordError(null);
    if (!auth.currentUser) {
      setReauthError('Entre novamente na sua conta para redefinir o PIN.');
      return;
    }
    setIsReauthenticating(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await reauthenticateWithPopup(auth.currentUser, provider);
      if (result.user.uid === auth.currentUser.uid) {
        triggerHaptic(20);
        setViewMode('set-new-pin');
        setNewPin('');
        setConfirmNewPin('');
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/network-request-failed') {
        setReauthError('Sem conexão. Conecte-se para redefinir o PIN.');
      } else if (code === 'auth/too-many-requests') {
        setReauthError('Muitas tentativas. Aguarde alguns minutos.');
      } else {
        console.warn('Google re-auth cancel/error:', err);
      }
    } finally {
      setIsReauthenticating(false);
    }
  };

  const handlePasswordReauth = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic(10);
    setPasswordError(null);
    setReauthError(null);

    if (!auth.currentUser || !auth.currentUser.email) {
      setPasswordError('Entre novamente na sua conta para redefinir o PIN.');
      return;
    }

    if (!password) {
      setPasswordError('Digite sua senha.');
      return;
    }

    setIsReauthenticating(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      triggerHaptic(20);
      setViewMode('set-new-pin');
      setNewPin('');
      setConfirmNewPin('');
      setPassword('');
    } catch (err: unknown) {
      triggerHaptic(30);
      const code = (err as { code?: string })?.code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPasswordError('Senha incorreta.');
      } else if (code === 'auth/too-many-requests') {
        setPasswordError('Muitas tentativas. Aguarde alguns minutos.');
      } else if (code === 'auth/network-request-failed') {
        setPasswordError('Sem conexão. Conecte-se para redefinir o PIN.');
      } else {
        setPasswordError('Senha incorreta.');
      }
    } finally {
      setIsReauthenticating(false);
    }
  };

  const handleSaveNewPin = async (newDigits: string) => {
    try {
      const hashed = await hashPin(newDigits);
      if (displayEmail) {
        localStorage.setItem(`gasto_app_pin_${displayEmail}`, hashed);
      } else {
        localStorage.setItem('gasto_app_pin', hashed);
      }
      if (onUpdatePin) {
        await onUpdatePin(hashed);
      }
      clearFailData(failStorageKey);
      setLockRemainingSeconds(0);
      setViewMode('reset-success');
    } catch (err: unknown) {
      console.warn('Save new PIN notice:', err);
      setError(true);
      setErrorMessage('Não foi possível proteger o PIN neste navegador.');
    }
  };

  const isGoogleUser = auth.currentUser?.providerData?.some(p => p.providerId === 'google.com') ?? false;
  const isPasswordUser = auth.currentUser?.providerData?.some(p => p.providerId === 'password') ?? (!isGoogleUser && !!auth.currentUser?.email);

  const currentDisplayPin = 
    viewMode === 'enter-pin' ? pin : 
    viewMode === 'set-new-pin' ? newPin : 
    confirmNewPin;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#F8FAF9] dark:bg-[#0E1110] flex flex-col items-center justify-between p-4 sm:p-6 select-none overflow-y-auto font-sans text-slate-900 dark:text-white antialiased transition-colors duration-300">
      <header className="w-full flex items-center justify-between pt-1 max-w-sm sm:max-w-md z-10">
        {viewMode !== 'enter-pin' && viewMode !== 'reset-success' ? (
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => {
              triggerHaptic(8);
              setViewMode('enter-pin');
              setPin('');
              setError(false);
              setPassword('');
              setPasswordError(null);
              setReauthError(null);
            }}
            className="w-10 h-10 rounded-xl bg-white dark:bg-[#1C1C1E]/90 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] hover:border-emerald-500/50 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="Voltar ao PIN"
          >
            <ChevronLeft size={20} />
          </motion.button>
        ) : (
          <div className="flex items-center gap-2.5">
            <GastoLogo size={38} />
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                Gastô<span className="text-emerald-500 dark:text-emerald-400">?</span>
              </span>
              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400/90 tracking-wider">
                SEGURANÇA
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 px-3 py-1 rounded-xl border border-emerald-500/25 shadow-2xs">
            <ShieldCheck size={13} className="text-emerald-500 dark:text-emerald-400" />
            <span>PROTEGIDO</span>
          </div>

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-white/[0.08] transition-all cursor-pointer shadow-2xs"
              title="Sair da conta"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      {viewMode === 'enter-pin' && (
        <main className="w-full max-w-sm sm:max-w-md flex-1 flex flex-col items-center justify-between py-3 sm:py-5 my-auto z-10">
          <div className="flex flex-col items-center text-center space-y-2.5 pt-1 w-full">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="relative"
            >
              {photoURL ? (
                <div className="relative">
                  <div className="w-19 h-19 sm:w-21 sm:h-21 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-xs bg-slate-100 dark:bg-[#2C2C2E]">
                    <img 
                      src={photoURL} 
                      alt={displayName || 'Perfil'} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6.5 h-6.5 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs border-2 border-white dark:border-[#090A09]">
                    <Lock size={12} className="stroke-[2.5]" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="w-19 h-19 sm:w-21 sm:h-21 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                    <KeyRound size={34} className="stroke-[2.2]" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6.5 h-6.5 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs border-2 border-white dark:border-[#090A09]">
                    <Lock size={12} className="stroke-[2.5]" />
                  </div>
                </div>
              )}
            </motion.div>

            <div>
              <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-white">
                {displayName ? `Olá, ${displayName}` : 'Digite seu PIN'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Insira seu código de segurança para acessar
              </p>
            </div>

            {displayEmail ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-lg border border-slate-200/60 dark:border-white/[0.08] bg-white/80 dark:bg-[#1C1C1E]/80 text-xs font-medium text-slate-600 dark:text-slate-400 shadow-2xs max-w-[240px] truncate">
                <span className="truncate">{displayEmail}</span>
              </div>
            ) : null}

            <motion.div 
              animate={error ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="flex items-center justify-center gap-2.5 pt-2 pb-1 w-full max-w-[320px]"
            >
              {[...Array(6)].map((_, i) => {
                const isFilled = i < pin.length;
                const isCurrent = i === pin.length;
                return (
                  <motion.div 
                    key={i}
                    initial={false}
                    animate={isFilled ? { scale: [1.05, 1] } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 450, damping: 20 }}
                    className={`relative w-10 sm:w-11 h-13 rounded-xl border flex items-center justify-center transition-all duration-200 ${
                      error
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600'
                        : isFilled
                        ? 'border-emerald-500/80 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                        : isCurrent
                        ? 'border-emerald-500 dark:border-emerald-400 bg-white dark:bg-[#1C1C1E] ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-white/[0.08] bg-white/70 dark:bg-[#1C1C1E]/60'
                    }`} 
                  >
                    {isFilled ? (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2.5 h-2.5 rounded-sm bg-emerald-500 dark:bg-emerald-400"
                      />
                    ) : isCurrent ? (
                      <div className="w-1.5 h-4 rounded-full bg-emerald-500/60 dark:bg-emerald-400/60 animate-pulse" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-[#3A3A3C]" />
                    )}
                  </motion.div>
                );
              })}
            </motion.div>

            <div className="pt-1 min-h-8 flex items-center justify-center">
              {biometricSuccess ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/25"
                >
                  <Check size={14} className="stroke-[3]" />
                  <span>Autenticado com sucesso!</span>
                </motion.div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  id="btn-biometric-unlock-banner"
                  onClick={handleBiometricUnlock}
                  disabled={isBiometricAuthenticating}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                    isBiometricAuthenticating
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
                      : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                  }`}
                  title={biometricLabel.name}
                >
                  {biometricLabel.hasFace ? (
                    <ScanFace size={16} className={`text-emerald-600 dark:text-emerald-400 ${isBiometricAuthenticating ? 'animate-pulse' : ''}`} />
                  ) : (
                    <Fingerprint size={16} className={`text-emerald-600 dark:text-emerald-400 ${isBiometricAuthenticating ? 'animate-pulse' : ''}`} />
                  )}
                  <span>
                    {isBiometricAuthenticating
                      ? 'Aguardando sensor...'
                      : `Desbloquear com ${biometricLabel.short}`}
                  </span>
                </motion.button>
              )}
            </div>

            <div className="min-h-5 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {lockRemainingSeconds > 0 ? (
                  <motion.p 
                    key="lockout"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-rose-600 dark:text-rose-400 text-xs font-semibold text-center px-4"
                  >
                    Muitas tentativas. Tente novamente em {formatCountdown(lockRemainingSeconds)}.
                  </motion.p>
                ) : errorMessage ? (
                  <motion.p 
                    key="err"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-rose-600 dark:text-rose-400 text-xs font-semibold text-center px-4"
                  >
                    {errorMessage}
                  </motion.p>
                ) : biometricError ? (
                  <motion.p 
                    key="bio"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-amber-600 dark:text-amber-400 text-[11px] font-medium text-center px-4"
                  >
                    {biometricError}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[320px] w-full z-10 py-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <motion.button
                key={num}
                whileTap={{ scale: lockRemainingSeconds > 0 ? 1 : 0.94 }}
                onClick={() => handleKeyPress(num.toString())}
                disabled={lockRemainingSeconds > 0}
                className="h-14 sm:h-15 rounded-2xl bg-white dark:bg-[#1C1C1E]/90 border border-slate-200/60 dark:border-white/[0.08]/90 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 hover:bg-slate-50 dark:hover:bg-white/[0.04]/80 active:bg-emerald-500/10 dark:active:bg-emerald-500/15 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center transition-all shadow-xs cursor-pointer group select-none relative overflow-hidden"
              >
                <span className="text-xl sm:text-2xl font-bold leading-none tracking-tight">{num}</span>
                {KEYPAD_LETTERS[num.toString()] && (
                  <span className="text-[9px] font-extrabold tracking-widest text-slate-400 dark:text-slate-500 uppercase mt-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {KEYPAD_LETTERS[num.toString()]}
                  </span>
                )}
              </motion.button>
            ))}

            {pin.length === 0 ? (
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={handleBiometricUnlock}
                disabled={isBiometricAuthenticating}
                className="h-14 sm:h-15 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-500/30 dark:border-emerald-500/30 hover:border-emerald-500/60 text-emerald-700 dark:text-emerald-400 flex flex-col items-center justify-center transition-all shadow-xs cursor-pointer select-none active:scale-95"
                title={biometricLabel.name}
              >
                {biometricLabel.hasFace ? (
                  <ScanFace size={22} className={`stroke-[2.2] ${isBiometricAuthenticating ? 'animate-pulse' : ''}`} />
                ) : (
                  <Fingerprint size={22} className={`stroke-[2.2] ${isBiometricAuthenticating ? 'animate-pulse' : ''}`} />
                )}
                <span className="text-[8px] font-extrabold uppercase mt-1 text-center tracking-tight leading-none px-1">
                  {isBiometricAuthenticating ? 'Aguarde...' : biometricLabel.short}
                </span>
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: lockRemainingSeconds > 0 ? 1 : 0.94 }}
                onClick={handleClear}
                disabled={lockRemainingSeconds > 0}
                className="h-14 sm:h-15 rounded-2xl bg-white/70 dark:bg-[#1C1C1E]/50 border border-slate-200/60 dark:border-white/[0.08]/80 hover:border-emerald-500/30 dark:hover:border-white/[0.14] disabled:opacity-40 disabled:cursor-not-allowed text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex flex-col items-center justify-center transition-all shadow-xs cursor-pointer select-none"
                title="Limpar PIN"
              >
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">C</span>
                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5">Limpar</span>
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: lockRemainingSeconds > 0 ? 1 : 0.94 }}
              onClick={() => handleKeyPress('0')}
              disabled={lockRemainingSeconds > 0}
              className="h-14 sm:h-15 rounded-2xl bg-white dark:bg-[#1C1C1E]/90 border border-slate-200/60 dark:border-white/[0.08]/90 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 hover:bg-slate-50 dark:hover:bg-white/[0.04]/80 active:bg-emerald-500/10 dark:active:bg-emerald-500/15 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center transition-all shadow-xs cursor-pointer group select-none relative overflow-hidden"
            >
              <span className="text-xl sm:text-2xl font-bold leading-none tracking-tight">0</span>
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase mt-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">+</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: lockRemainingSeconds > 0 ? 1 : 0.94 }}
              onClick={handleDelete}
              disabled={lockRemainingSeconds > 0}
              className="h-14 sm:h-15 rounded-2xl bg-white/70 dark:bg-[#1C1C1E]/50 border border-slate-200/60 dark:border-white/[0.08]/80 hover:border-rose-300 dark:hover:border-rose-900/50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex flex-col items-center justify-center active:bg-rose-50 dark:active:bg-rose-950/40 transition-all shadow-xs cursor-pointer select-none"
              title="Apagar dígito"
            >
              <Delete size={20} className="stroke-[2.2]" />
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5">Apagar</span>
            </motion.button>
          </div>

          <div className="pt-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              id="btn-forget-pin"
              onClick={() => {
                triggerHaptic(10);
                setPassword('');
                setPasswordError(null);
                setReauthError(null);
                setViewMode('forgot-pin-options');
              }}
              className="px-5 py-2 rounded-xl border border-slate-200/60 dark:border-white/[0.08] hover:border-emerald-500/40 bg-white/80 dark:bg-[#1C1C1E]/80 text-xs font-bold text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 shadow-2xs transition-all cursor-pointer"
            >
              Esqueci meu PIN
            </motion.button>
          </div>
        </main>
      )}

      {viewMode === 'forgot-pin-options' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="w-full max-w-sm sm:max-w-md flex-1 flex flex-col items-center justify-center text-center space-y-6 py-6 z-10 my-auto"
        >
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Mail size={36} className="stroke-[2.2]" />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Recuperar seu PIN
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
              Confirme que é você para criar um novo PIN.
            </p>

            {displayEmail ? (
              <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.08] text-emerald-600 dark:text-emerald-400 text-xs font-bold shadow-2xs">
                <Mail size={13} />
                <span>{displayEmail}</span>
              </div>
            ) : null}
          </div>

          {!auth.currentUser ? (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto font-medium">
              Entre novamente na sua conta para redefinir o PIN.
            </p>
          ) : (
            <div className="w-full space-y-4">
              {isPasswordUser && (
                <form onSubmit={handlePasswordReauth} className="w-full space-y-3">
                  <div className="space-y-1">
                    <input
                      type="password"
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError(null);
                      }}
                      className="w-full py-3 px-4 text-center text-base font-medium rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 dark:text-white transition-all shadow-xs"
                    />
                    {passwordError && (
                      <p className="text-xs text-rose-500 font-semibold">{passwordError}</p>
                    )}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!password || isReauthenticating}
                    className="w-full py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Confirmar</span>
                    <ArrowRight size={16} />
                  </motion.button>
                </form>
              )}

              {isGoogleUser && (
                <div className="w-full pt-1">
                  <button
                    type="button"
                    onClick={handleGoogleReauth}
                    disabled={isReauthenticating}
                    className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] hover:border-emerald-500/50 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>Continuar com Google</span>
                  </button>
                  {reauthError && (
                    <p className="text-xs text-rose-500 font-semibold mt-2">{reauthError}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {(viewMode === 'set-new-pin' || viewMode === 'confirm-new-pin') && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="w-full max-w-sm sm:max-w-md flex-1 flex flex-col items-center justify-between py-4 sm:py-5 my-auto z-10"
        >
          <div className="flex flex-col items-center text-center space-y-2.5 pt-1 w-full">
            <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-white">
              {viewMode === 'set-new-pin' ? 'Novo PIN' : 'Confirmar Novo PIN'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              {viewMode === 'set-new-pin'
                ? 'Digite um novo código de 6 números para redefinir o acesso.'
                : 'Digite novamente os 6 números do novo PIN.'}
            </p>

            {displayEmail ? (
              <div className="inline-flex items-center px-3.5 py-1 rounded-lg border border-slate-200/60 dark:border-white/[0.08] bg-white/80 dark:bg-[#1C1C1E]/80 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-2xs">
                <span className="truncate">{displayEmail}</span>
              </div>
            ) : null}

            <motion.div 
              animate={error ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
              transition={{ duration: 0.35 }}
              className="flex items-center justify-center gap-2.5 pt-3 pb-1 w-full max-w-[320px]"
            >
              {[...Array(6)].map((_, i) => {
                const isFilled = i < currentDisplayPin.length;
                const isCurrent = i === currentDisplayPin.length;
                return (
                  <motion.div 
                    key={i}
                    initial={false}
                    animate={isFilled ? { scale: [1.05, 1] } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 450, damping: 20 }}
                    className={`relative w-10 sm:w-11 h-13 rounded-xl border flex items-center justify-center transition-all duration-200 ${
                      error
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600'
                        : isFilled
                        ? 'border-emerald-500/80 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                        : isCurrent
                        ? 'border-emerald-500 dark:border-emerald-400 bg-white dark:bg-[#1C1C1E] ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-white/[0.08] bg-white/70 dark:bg-[#1C1C1E]/60'
                    }`} 
                  >
                    {isFilled ? (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2.5 h-2.5 rounded-sm bg-emerald-500 dark:bg-emerald-400"
                      />
                    ) : isCurrent ? (
                      <div className="w-1.5 h-4 rounded-full bg-emerald-500/60 dark:bg-emerald-400/60 animate-pulse" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-[#3A3A3C]" />
                    )}
                  </motion.div>
                );
              })}
            </motion.div>

            <div className="h-5 flex items-center justify-center">
              <AnimatePresence>
                {errorMessage && (
                  <motion.p 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-rose-600 dark:text-rose-400 text-xs font-semibold"
                  >
                    {errorMessage}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[320px] w-full z-10 py-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <motion.button
                key={num}
                whileTap={{ scale: 0.94 }}
                onClick={() => handleKeyPress(num.toString())}
                className="h-14 sm:h-15 rounded-2xl bg-white dark:bg-[#1C1C1E]/90 border border-slate-200/60 dark:border-white/[0.08]/90 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 hover:bg-slate-50 dark:hover:bg-white/[0.04]/80 active:bg-emerald-500/10 dark:active:bg-emerald-500/15 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center transition-all shadow-xs cursor-pointer group select-none relative overflow-hidden"
              >
                <span className="text-xl sm:text-2xl font-bold leading-none tracking-tight">{num}</span>
                {KEYPAD_LETTERS[num.toString()] && (
                  <span className="text-[9px] font-extrabold tracking-widest text-slate-400 dark:text-slate-500 uppercase mt-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {KEYPAD_LETTERS[num.toString()]}
                  </span>
                )}
              </motion.button>
            ))}

            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={handleClear}
              className="h-14 sm:h-15 rounded-2xl bg-white/70 dark:bg-[#1C1C1E]/50 border border-slate-200/60 dark:border-white/[0.08]/80 hover:border-emerald-500/30 dark:hover:border-white/[0.14] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex flex-col items-center justify-center transition-all shadow-xs cursor-pointer select-none"
              title="Limpar PIN"
            >
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">C</span>
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5">Limpar</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => handleKeyPress('0')}
              className="h-14 sm:h-15 rounded-2xl bg-white dark:bg-[#1C1C1E]/90 border border-slate-200/60 dark:border-white/[0.08]/90 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 hover:bg-slate-50 dark:hover:bg-white/[0.04]/80 active:bg-emerald-500/10 dark:active:bg-emerald-500/15 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center transition-all shadow-xs cursor-pointer group select-none relative overflow-hidden"
            >
              <span className="text-xl sm:text-2xl font-bold leading-none tracking-tight">0</span>
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase mt-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">+</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={handleDelete}
              className="h-14 sm:h-15 rounded-2xl bg-white/70 dark:bg-[#1C1C1E]/50 border border-slate-200/60 dark:border-white/[0.08]/80 hover:border-rose-300 dark:hover:border-rose-900/50 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex flex-col items-center justify-center active:bg-rose-50 dark:active:bg-rose-950/40 transition-all shadow-xs cursor-pointer select-none"
              title="Apagar dígito"
            >
              <Delete size={20} className="stroke-[2.2]" />
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5">Apagar</span>
            </motion.button>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(8);
                setViewMode('enter-pin');
              }}
              className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer shadow-2xs transition-colors"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      {viewMode === 'reset-success' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm sm:max-w-md flex-1 flex flex-col items-center justify-center text-center space-y-6 py-6 my-auto z-10"
        >
          <div className="relative">
            <div className="w-22 h-22 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.5)] border-2 border-emerald-400">
              <Check size={44} className="stroke-[3.5]" />
            </div>
            <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400/40 scale-110 pointer-events-none animate-ping" />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              PIN Redefinido com Sucesso!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto font-medium">
              Seu novo código de segurança já está ativo e sua conta foi desbloqueada.
            </p>
          </div>

          <div className="w-full pt-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              id="btn-reset-success-ok"
              onClick={() => {
                triggerHaptic(15);
                onUnlock();
              }}
              className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
            >
              OK, Acessar Gastô
            </motion.button>
          </div>
        </motion.div>
      )}

      <footer className="w-full max-w-sm sm:max-w-md text-center pt-2 pb-1 z-10">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span>O PIN fica salvo só neste aparelho e bloqueia a abertura do app.</span>
        </p>
      </footer>
    </div>
  );
};
