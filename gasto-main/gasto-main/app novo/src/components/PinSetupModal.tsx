import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ChevronLeft, 
  Delete, 
  Check, 
  Lock, 
  Sparkles,
  ArrowRight,
  ScanFace,
  Fingerprint,
  Smartphone
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
  '0': '',
};

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

  // Step indicator segment index (0 to 3)
  const getStepProgressIndex = () => {
    switch (step) {
      case 'intro':
        return 0;
      case 'create':
        return 1;
      case 'confirm':
        return 2;
      case 'success':
        return 3;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#F8FAF9] dark:bg-[#0E1110] flex flex-col justify-between overflow-y-auto select-none font-sans text-slate-900 dark:text-white antialiased transition-colors duration-300">
      <div className="w-full max-w-sm sm:max-w-md mx-auto flex-1 flex flex-col justify-between p-5 sm:p-6 min-h-screen z-10">
        
        {/* Top Header & Progress Bars */}
        <div className="pt-2 pb-2 w-full space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <GastoLogo size={38} />
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white leading-none">
                  Gastô<span className="text-emerald-500 dark:text-emerald-400">?</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                  SEGURANÇA
                </span>
              </div>
            </div>

            {userEmail && (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-3 py-1 bg-white dark:bg-[#1A1D1C] rounded-lg border border-slate-200/80 dark:border-white/10 shadow-2xs truncate max-w-[160px] sm:max-w-[200px]">
                {userEmail}
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {[0, 1, 2, 3].map((idx) => {
              const currentIdx = getStepProgressIndex();
              const isFilled = idx <= currentIdx;
              return (
                <div
                  key={idx}
                  className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
                    isFilled
                      ? 'bg-emerald-500 dark:bg-emerald-400'
                      : 'bg-slate-200 dark:bg-white/10'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Content Views */}
        <div className="flex-1 flex flex-col py-3 justify-center">
          {/* STEP 1: INTRO */}
          {step === 'intro' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-5 my-auto"
            >
              <div className="relative my-2">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                  <Lock size={40} className="stroke-[1.8]" />
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-emerald-500 text-white rounded-md flex items-center justify-center shadow-xs border border-white dark:border-[#0E1110]">
                  <Check size={14} className="stroke-[3]" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Proteja seu Gastô
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-xs mx-auto">
                  Crie um código PIN de 6 dígitos para proteger suas finanças e cartões com total segurança.
                </p>

                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#1A1D1C] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 text-xs font-semibold">
                  <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Proteção por PIN de 6 dígitos</span>
                </div>
              </div>

              <div className="w-full pt-4 space-y-2.5">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  id="btn-create-pin-start"
                  onClick={() => {
                    triggerHaptic(12);
                    setStep('create');
                  }}
                  className="w-full py-3.5 sm:py-4 px-5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Criar PIN de 6 Dígitos</span>
                  <ArrowRight size={18} />
                </motion.button>

                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full py-2.5 text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Agora não, configurar depois
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 & 3: CREATE & CONFIRM PIN */}
          {(step === 'create' || step === 'confirm') && (
            <motion.div 
              key={step}
              initial={{ opacity: 0, x: step === 'create' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: step === 'create' ? 20 : -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col justify-between py-2 my-auto"
            >
              <div className="text-center space-y-1.5">
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
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 mb-1 cursor-pointer transition-colors"
                >
                  <ChevronLeft size={16} />
                  <span>Voltar</span>
                </button>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {step === 'create' ? 'Crie seu PIN de 6 Dígitos' : 'Confirme seu PIN'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {step === 'create' 
                    ? 'Escolha uma sequência segura que você não vá esquecer' 
                    : 'Digite novamente os 6 dígitos para confirmação'}
                </p>
              </div>

              {/* Rectangular PIN Display Cells (matching modern fintech style) */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-5">
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const isFilled = index < activeValue.length;
                  const isCurrent = index === activeValue.length;
                  return (
                    <motion.div
                      key={index}
                      animate={isFilled ? { scale: [1.05, 1] } : { scale: 1 }}
                      transition={{ duration: 0.15 }}
                      className={`w-10 sm:w-11 h-12 sm:h-13 rounded-xl border flex items-center justify-center transition-all duration-200 ${
                        error
                          ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30'
                          : isFilled
                          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30'
                          : isCurrent
                          ? 'border-emerald-500 dark:border-emerald-400 bg-white dark:bg-[#1A1D1C] ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#1A1D1C]/60'
                      }`}
                    >
                      {isFilled ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2.5 h-2.5 rounded-sm bg-emerald-500 dark:bg-emerald-400"
                        />
                      ) : isCurrent ? (
                        <div className="w-1 h-4 rounded-full bg-emerald-500/60 animate-pulse" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Error Message */}
              <div className="h-6 flex items-center justify-center">
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-semibold text-rose-500 dark:text-rose-400 text-center"
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              {/* Rectangular Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[320px] mx-auto w-full pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <motion.button
                    key={digit}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => handleKeyPress(digit)}
                    className="h-13 sm:h-14 rounded-xl sm:rounded-2xl bg-white dark:bg-[#1A1D1C] border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-[#222524] active:bg-emerald-500/10 dark:active:bg-emerald-500/15 text-slate-900 dark:text-white flex flex-col items-center justify-center transition-all shadow-xs cursor-pointer select-none"
                  >
                    <span className="text-xl sm:text-2xl font-bold leading-none">{digit}</span>
                    {KEYPAD_LETTERS[digit] && (
                      <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider mt-0.5 uppercase">
                        {KEYPAD_LETTERS[digit]}
                      </span>
                    )}
                  </motion.button>
                ))}

                {/* Bottom Row: Limpar (C), 0, Apagar (Delete) */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    if (step === 'create') setPin('');
                    else setConfirmPin('');
                    setError(null);
                  }}
                  className="h-13 sm:h-14 rounded-xl sm:rounded-2xl bg-white/70 dark:bg-[#1A1D1C]/50 border border-slate-200/70 dark:border-white/10 hover:border-emerald-500/30 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex flex-col items-center justify-center transition-all shadow-xs cursor-pointer select-none"
                  title="Limpar PIN"
                >
                  <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">C</span>
                  <span className="text-[8px] font-semibold text-slate-400 dark:text-slate-500 uppercase mt-0.5">Limpar</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => handleKeyPress('0')}
                  className="h-13 sm:h-14 rounded-xl sm:rounded-2xl bg-white dark:bg-[#1A1D1C] border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-[#222524] active:bg-emerald-500/10 dark:active:bg-emerald-500/15 text-slate-900 dark:text-white flex flex-col items-center justify-center transition-all shadow-xs cursor-pointer select-none"
                >
                  <span className="text-xl sm:text-2xl font-bold leading-none">0</span>
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase mt-0.5">+</span>
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDelete}
                  className="h-13 sm:h-14 rounded-xl sm:rounded-2xl bg-white/70 dark:bg-[#1A1D1C]/50 border border-slate-200/70 dark:border-white/10 hover:border-rose-300 dark:hover:border-rose-900/50 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex flex-col items-center justify-center active:bg-rose-50 dark:active:bg-rose-950/40 transition-all shadow-xs cursor-pointer select-none"
                  title="Apagar dígito"
                >
                  <Delete size={20} className="stroke-[2]" />
                  <span className="text-[8px] font-semibold text-slate-400 dark:text-slate-500 uppercase mt-0.5">Apagar</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: SUCCESS MODAL */}
          {step === 'success' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-5 py-6 my-auto"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs border-2 border-emerald-400">
                  <Check size={40} className="stroke-[3]" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  PIN de Segurança Ativado!
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto font-medium leading-relaxed">
                  Seu código de 6 dígitos foi configurado com sucesso para proteger o seu Gastô.
                </p>
              </div>

              <div className="w-full pt-4 space-y-2.5">
                {biometricAvailable && !biometricLinked && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleLinkDeviceBiometrics}
                    disabled={biometricRegistering}
                    className="w-full py-3 px-4 bg-white dark:bg-[#1A1D1C] border border-emerald-500/40 hover:border-emerald-500 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
                  >
                    {biometricLabel.hasFace ? <ScanFace size={16} /> : <Fingerprint size={16} />}
                    <span>{biometricRegistering ? 'Aguardando sensor...' : `Ativar também ${biometricLabel.name}`}</span>
                  </motion.button>
                )}

                {biometricLinked && (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                    <Check size={14} className="stroke-[3]" />
                    <span>{biometricLabel.name} vinculado com sucesso!</span>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  id="btn-pin-success-ok"
                  onClick={handleSkip}
                  className="w-full py-3.5 sm:py-4 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                >
                  OK, Acessar Gastô
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footnote */}
        <div className="pb-1 px-6 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            O PIN fica salvo só neste aparelho e bloqueia a abertura do app.
          </p>
        </div>
      </div>
    </div>
  );
}
