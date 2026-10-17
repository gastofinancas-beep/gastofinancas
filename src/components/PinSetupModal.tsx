import React, { useState, useEffect } from 'react';
import {  
  ChevronLeft, 
  Delete, 
  Check,  
  ArrowRight,
  ScanFace,
  Fingerprint,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../utils/haptics';
import { hashPin } from '../utils/pinSecurity';
import { GastoLogo } from './GastoLogo';
import { getDeviceBiometricLabel, unlockWithDeviceSensor, isWebAuthnAvailable } from '../utils/webauthn';

interface PinSetupModalProps {
  isOpen: boolean;
  userEmail?: string;
  onComplete: (hashedPin: string, useBiometrics?: boolean, photoSample?: string, credentialId?: string) => void;
  onSkip: () => void;
}

type SetupStep = 'intro' | 'create' | 'confirm' | 'success';

export function PinSetupModal({
  isOpen,
  userEmail,
  onComplete,
  onSkip,
}: PinSetupModalProps) {
  const [step, setStep] = useState<SetupStep>('intro');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hashedPinResult, setHashedPinResult] = useState<string>('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLinked, setBiometricLinked] = useState(false);
  const [biometricRegistering, setBiometricRegistering] = useState(false);
  const biometricLabel = getDeviceBiometricLabel();

  useEffect(() => {
    if (isOpen) {
      setIsDismissed(false);
      setStep('intro');
      setPin('');
      setConfirmPin('');
      setError(null);
      setBiometricLinked(false);
      setBiometricRegistering(false);
      isWebAuthnAvailable().then(setBiometricAvailable).catch(() => setBiometricAvailable(false));
    }
  }, [isOpen]);

  const handleLinkDeviceBiometrics = async () => {
    if (biometricRegistering) return;
    setBiometricRegistering(true);
    triggerHaptic(10);
    try {
      const result = await unlockWithDeviceSensor({
        userEmail: userEmail || '',
        userName: 'Usuário Gastô',
        isEnrollment: true,
      });
      if (result.success) {
        triggerHaptic(25);
        setBiometricLinked(true);
        if (result.newCredentialId) {
          onComplete(hashedPinResult, true, undefined, result.newCredentialId);
        } else {
          onComplete(hashedPinResult, true);
        }
      }
    } catch (e) {
      console.warn('Biometric setup failed:', e);
    } finally {
      setBiometricRegistering(false);
    }
  };

  const handleSkip = () => {
    triggerHaptic(8);
    setIsDismissed(true);
    onSkip();
  };

  if (!isOpen || isDismissed) return null;

  const handleKeyPress = (digit: string) => {
    triggerHaptic(8);
    setError(null);

    if (step === 'create') {
      if (pin.length < 6) {
        const nextPin = pin + digit;
        setPin(nextPin);
        if (nextPin.length === 6) {
          setTimeout(() => {
            setStep('confirm');
            setConfirmPin('');
          }, 220);
        }
      }
    } else if (step === 'confirm') {
      if (confirmPin.length < 6) {
        const nextConfirm = confirmPin + digit;
        setConfirmPin(nextConfirm);

        if (nextConfirm.length === 6) {
          if (nextConfirm === pin) {
            triggerHaptic(20);
            setTimeout(async () => {
              const hashed = await hashPin(nextConfirm);
              setHashedPinResult(hashed);
              // Complete directly with PIN only (no Face ID)
              onComplete(hashed, false, undefined);
              setStep('success');
            }, 220);
          } else {
            triggerHaptic(30);
            setError('Os PINs digitados não coincidem. Tente novamente.');
            setTimeout(() => {
              setConfirmPin('');
            }, 600);
          }
        }
      }
    }
  };

  const handleDelete = () => {
    triggerHaptic(8);
    setError(null);
    if (step === 'create') {
      setPin(prev => prev.slice(0, -1));
    } else if (step === 'confirm') {
      setConfirmPin(prev => prev.slice(0, -1));
    }
  };

  // Keyboard listener for desktop users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (step !== 'create' && step !== 'confirm') return;
      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, pin, confirmPin]);

  const activeValue = step === 'create' ? pin : confirmPin;

  const keyBase =
    'h-[68px] w-[68px] sm:h-[72px] sm:w-[72px] mx-auto rounded-full flex items-center justify-center select-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  const digitCls = `${keyBase} text-[28px] font-medium text-slate-900 dark:text-white active:bg-slate-200/80 dark:active:bg-white/10`;
  const iconKeyCls = `${keyBase} text-slate-500 dark:text-slate-400 active:bg-slate-200/80 dark:active:bg-white/10`;

  const primaryBtnCls =
    'w-full py-3 px-5 bg-slate-900 dark:bg-white hover:opacity-90 text-white dark:text-slate-900 rounded-xl font-semibold text-sm transition-opacity cursor-pointer flex items-center justify-center gap-2';

  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-[#0E1110] flex flex-col justify-between overflow-y-auto select-none font-sans text-slate-900 dark:text-white antialiased transition-colors duration-300">
      <div className="w-full max-w-sm sm:max-w-md mx-auto flex-1 flex flex-col justify-between p-5 sm:p-6 min-h-screen z-10">
        {/* Header */}
        <div className="pt-1 w-full flex items-center justify-between">
          {step === 'create' || step === 'confirm' ? (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(8);
                if (step === 'confirm') {
                  setStep('create');
                  setConfirmPin('');
                } else {
                  setStep('intro');
                }
              }}
              className="-ml-2 p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Voltar"
            >
              <ChevronLeft size={22} />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <GastoLogo size={30} />
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                Gastô<span className="text-emerald-500 dark:text-emerald-400">?</span>
              </span>
            </div>
          )}

          {userEmail && step !== 'create' && step !== 'confirm' && (
            <span className="text-xs text-slate-400 truncate max-w-[200px]">{userEmail}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col py-3 justify-center">
          {step === 'intro' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-6 my-auto"
            >
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Proteja seu Gastô
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-xs mx-auto">
                  Crie um PIN de 6 números para que só você consiga abrir o app e ver suas finanças.
                </p>
              </div>

              <div className="w-full pt-2 space-y-1">
                <button
                  type="button"
                  id="btn-create-pin-start"
                  onClick={() => {
                    triggerHaptic(12);
                    setStep('create');
                  }}
                  className={primaryBtnCls}
                >
                  <span>Criar PIN</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full py-3 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Agora não
                </button>
              </div>
            </motion.div>
          )}

          {(step === 'create' || step === 'confirm') && (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: step === 'create' ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col justify-between py-2 my-auto"
            >
              <div className="text-center">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  {step === 'create' ? 'Crie seu PIN' : 'Confirme seu PIN'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {step === 'create'
                    ? 'Escolha 6 números que você não vá esquecer'
                    : 'Digite os 6 números novamente'}
                </p>

                <motion.div
                  animate={error ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
                  transition={{ duration: 0.35 }}
                  className="flex items-center justify-center gap-4 pt-6 pb-3"
                >
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <div
                      key={index}
                      className={`w-3.5 h-3.5 rounded-full border-[1.5px] transition-all duration-150 ${
                        error
                          ? 'bg-rose-500 border-rose-500'
                          : index < activeValue.length
                          ? 'bg-slate-900 border-slate-900 dark:bg-white dark:border-white scale-110'
                          : 'border-slate-300 dark:border-white/25'
                      }`}
                    />
                  ))}
                </motion.div>

                <div className="min-h-6 flex items-center justify-center">
                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-rose-500 dark:text-rose-400 text-center"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-y-2.5 max-w-[300px] mx-auto w-full pt-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button key={digit} type="button" onClick={() => handleKeyPress(digit)} className={digitCls}>
                    {digit}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={activeValue.length === 0}
                  onClick={() => {
                    triggerHaptic(8);
                    if (step === 'create') setPin('');
                    else setConfirmPin('');
                    setError(null);
                  }}
                  className={`${iconKeyCls} text-sm font-medium`}
                  title="Limpar"
                >
                  Limpar
                </button>

                <button type="button" onClick={() => handleKeyPress('0')} className={digitCls}>
                  0
                </button>

                <button
                  type="button"
                  disabled={activeValue.length === 0}
                  onClick={handleDelete}
                  className={iconKeyCls}
                  title="Apagar"
                >
                  <Delete size={24} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-6 my-auto"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <Check size={30} className="stroke-[3]" />
              </div>

              <div>
                <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">PIN ativado</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                  Pronto! Agora o Gastô só abre com o seu PIN.
                </p>
              </div>

              <div className="w-full pt-2 space-y-2.5">
                {biometricAvailable && !biometricLinked && (
                  <button
                    type="button"
                    onClick={handleLinkDeviceBiometrics}
                    disabled={biometricRegistering}
                    className="w-full py-3 px-4 border border-slate-200 dark:border-white/[0.12] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-800 dark:text-slate-100 rounded-xl font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {biometricLabel.hasFace ? <ScanFace size={18} /> : <Fingerprint size={18} />}
                    <span>{biometricRegistering ? 'Aguardando sensor...' : `Ativar também ${biometricLabel.name}`}</span>
                  </button>
                )}

                {biometricLinked && (
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                    <Check size={15} className="stroke-[3]" />
                    {biometricLabel.name} ativado
                  </p>
                )}

                <button type="button" id="btn-pin-success-ok" onClick={handleSkip} className={primaryBtnCls}>
                  Acessar o Gastô
                </button>
              </div>
            </motion.div>
          )}
        </div>

        <div className="pb-1 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            O PIN fica salvo só neste aparelho e bloqueia a abertura do app.
          </p>
        </div>
      </div>
    </div>
  );
}
