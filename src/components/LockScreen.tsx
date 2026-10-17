import React, { useState, useEffect, useRef } from 'react';
import { 
  Delete,  
  Check, 
  LogOut,
  ChevronLeft,
  ArrowRight,
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

  const keysDisabled = viewMode === 'enter-pin' && lockRemainingSeconds > 0;

  const keyBase =
    'h-[68px] w-[68px] sm:h-[72px] sm:w-[72px] mx-auto rounded-full flex items-center justify-center select-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  const digitCls = `${keyBase} text-[28px] font-medium text-slate-900 dark:text-white active:bg-slate-200/80 dark:active:bg-white/10`;
  const iconKeyCls = `${keyBase} text-slate-500 dark:text-slate-400 active:bg-slate-200/80 dark:active:bg-white/10`;

  const renderDots = (value: string) => (
    <motion.div
      animate={error ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="flex items-center justify-center gap-4 py-3"
    >
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={`w-3.5 h-3.5 rounded-full border-[1.5px] transition-all duration-150 ${
            error
              ? 'bg-rose-500 border-rose-500'
              : i < value.length
              ? 'bg-slate-900 border-slate-900 dark:bg-white dark:border-white scale-110'
              : 'border-slate-300 dark:border-white/25'
          }`}
        />
      ))}
    </motion.div>
  );

  const renderKeypad = (value: string, allowBiometric: boolean) => (
    <div className="grid grid-cols-3 gap-y-2.5 w-full max-w-[300px]">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <button
          key={num}
          type="button"
          disabled={keysDisabled}
          onClick={() => handleKeyPress(num.toString())}
          className={digitCls}
        >
          {num}
        </button>
      ))}

      {allowBiometric && value.length === 0 ? (
        <button
          type="button"
          onClick={handleBiometricUnlock}
          disabled={isBiometricAuthenticating}
          className={iconKeyCls}
          title={biometricLabel.name}
        >
          {biometricLabel.hasFace ? (
            <ScanFace size={26} className={isBiometricAuthenticating ? 'animate-pulse' : ''} />
          ) : (
            <Fingerprint size={26} className={isBiometricAuthenticating ? 'animate-pulse' : ''} />
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClear}
          disabled={keysDisabled || value.length === 0}
          className={`${iconKeyCls} text-sm font-medium`}
          title="Limpar"
        >
          Limpar
        </button>
      )}

      <button
        type="button"
        disabled={keysDisabled}
        onClick={() => handleKeyPress('0')}
        className={digitCls}
      >
        0
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={keysDisabled || value.length === 0}
        className={iconKeyCls}
        title="Apagar"
      >
        <Delete size={24} />
      </button>
    </div>
  );

  const textLinkCls =
    'text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer';

  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-[#0E1110] flex flex-col items-center justify-between p-4 sm:p-6 select-none overflow-y-auto font-sans text-slate-900 dark:text-white antialiased transition-colors duration-300">
      <header className="w-full flex items-center justify-between pt-1 max-w-sm sm:max-w-md z-10">
        {viewMode !== 'enter-pin' && viewMode !== 'reset-success' ? (
          <button
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
            className="-ml-2 p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Voltar ao PIN"
          >
            <ChevronLeft size={22} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <GastoLogo size={30} />
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Gastô<span className="text-emerald-500 dark:text-emerald-400">?</span>
            </span>
          </div>
        )}

        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="-mr-2 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Sair da conta"
          >
            <LogOut size={18} />
          </button>
        )}
      </header>

      {viewMode === 'enter-pin' && (
        <main className="w-full max-w-sm sm:max-w-md flex-1 flex flex-col items-center justify-between py-4 my-auto z-10">
          <div className="flex flex-col items-center text-center w-full">
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName || 'Perfil'}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover bg-slate-100 dark:bg-[#2C2C2E]"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-2xl font-semibold text-slate-600 dark:text-slate-200">
                {(displayName || displayEmail || 'G').charAt(0).toUpperCase()}
              </div>
            )}

            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white mt-4">
              {displayName ? `Olá, ${displayName}` : 'Bem-vindo de volta'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Digite seu PIN para entrar</p>

            <div className="mt-5">{renderDots(pin)}</div>

            <div className="min-h-6 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {biometricSuccess ? (
                  <motion.p
                    key="ok"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-1.5"
                  >
                    <Check size={15} className="stroke-[3]" />
                    Autenticado
                  </motion.p>
                ) : lockRemainingSeconds > 0 ? (
                  <motion.p
                    key="lockout"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-rose-600 dark:text-rose-400 text-sm text-center px-4"
                  >
                    Muitas tentativas. Tente novamente em {formatCountdown(lockRemainingSeconds)}.
                  </motion.p>
                ) : errorMessage ? (
                  <motion.p
                    key="err"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-rose-600 dark:text-rose-400 text-sm text-center px-4"
                  >
                    {errorMessage}
                  </motion.p>
                ) : isBiometricAuthenticating ? (
                  <motion.p
                    key="wait"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-slate-500 dark:text-slate-400 text-sm"
                  >
                    Aguardando {biometricLabel.short}...
                  </motion.p>
                ) : biometricError ? (
                  <motion.p
                    key="bio"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-amber-600 dark:text-amber-400 text-sm text-center px-4"
                  >
                    {biometricError}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <div className="w-full flex flex-col items-center gap-3 pt-2">
            {renderKeypad(pin, true)}

            <button
              type="button"
              id="btn-forget-pin"
              onClick={() => {
                triggerHaptic(10);
                setPassword('');
                setPasswordError(null);
                setReauthError(null);
                setViewMode('forgot-pin-options');
              }}
              className={`${textLinkCls} py-2`}
            >
              Esqueci meu PIN
            </button>
          </div>
        </main>
      )}

      {viewMode === 'forgot-pin-options' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-sm sm:max-w-md flex-1 flex flex-col items-center justify-center text-center space-y-6 py-6 z-10 my-auto"
        >
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Recuperar seu PIN</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
              Confirme que é você para criar um novo PIN.
            </p>
            {displayEmail ? (
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-3 truncate max-w-[280px] mx-auto">
                {displayEmail}
              </p>
            ) : null}
          </div>

          {!auth.currentUser ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Entre novamente na sua conta para redefinir o PIN.
            </p>
          ) : (
            <div className="w-full space-y-4">
              {isPasswordUser && (
                <form onSubmit={handlePasswordReauth} className="w-full space-y-3">
                  <div className="space-y-1">
                    <input
                      type="password"
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError(null);
                      }}
                      className="w-full py-3 px-4 text-base rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.05] outline-none focus:border-slate-900 dark:focus:border-white text-slate-900 dark:text-white transition-colors"
                    />
                    {passwordError && <p className="text-sm text-rose-500">{passwordError}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={!password || isReauthenticating}
                    className="w-full py-3 px-5 bg-slate-900 dark:bg-white hover:opacity-90 disabled:opacity-40 text-white dark:text-slate-900 rounded-xl font-semibold text-sm transition-opacity cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Confirmar</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              )}

              {isGoogleUser && (
                <div className="w-full">
                  <button
                    type="button"
                    onClick={handleGoogleReauth}
                    disabled={isReauthenticating}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-white/[0.1] text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Continuar com Google
                  </button>
                  {reauthError && <p className="text-sm text-rose-500 mt-2">{reauthError}</p>}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {(viewMode === 'set-new-pin' || viewMode === 'confirm-new-pin') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-sm sm:max-w-md flex-1 flex flex-col items-center justify-between py-4 my-auto z-10"
        >
          <div className="flex flex-col items-center text-center w-full">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {viewMode === 'set-new-pin' ? 'Crie um novo PIN' : 'Confirme o novo PIN'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              {viewMode === 'set-new-pin'
                ? 'Escolha 6 números para proteger o app.'
                : 'Digite os 6 números novamente.'}
            </p>

            <div className="mt-5">{renderDots(currentDisplayPin)}</div>

            <div className="min-h-6 flex items-center justify-center">
              <AnimatePresence>
                {errorMessage && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-rose-600 dark:text-rose-400 text-sm"
                  >
                    {errorMessage}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="w-full flex flex-col items-center gap-3 pt-2">
            {renderKeypad(currentDisplayPin, false)}

            <button
              type="button"
              onClick={() => {
                triggerHaptic(8);
                setViewMode('enter-pin');
              }}
              className={`${textLinkCls} py-2`}
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      {viewMode === 'reset-success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm sm:max-w-md flex-1 flex flex-col items-center justify-center text-center space-y-6 py-6 my-auto z-10"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center">
            <Check size={30} className="stroke-[3]" />
          </div>

          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">PIN redefinido</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">
              Seu novo PIN já está ativo e sua conta foi desbloqueada.
            </p>
          </div>

          <button
            type="button"
            id="btn-reset-success-ok"
            onClick={() => {
              triggerHaptic(15);
              onUnlock();
            }}
            className="w-full py-3 px-6 bg-slate-900 dark:bg-white hover:opacity-90 text-white dark:text-slate-900 rounded-xl font-semibold text-sm transition-opacity cursor-pointer"
          >
            Acessar o Gastô
          </button>
        </motion.div>
      )}

      <footer className="w-full max-w-sm sm:max-w-md text-center pt-2 pb-1 z-10">
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          O PIN fica salvo só neste aparelho e bloqueia a abertura do app.
        </p>
      </footer>
    </div>
  );
};
