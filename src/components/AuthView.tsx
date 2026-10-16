import React, { useState, useEffect, useRef } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { 
  signInWithGoogle, 
  signInWithApple, 
  getFriendlyAuthErrorMessage 
} from '../lib/authProviders';
import { GoogleIcon, AppleIcon } from './AuthIcons';
import { 
  Mail, 
  ArrowRight, 
  ChevronLeft,
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle,
  Lock,
  Wifi,
  BatteryMedium,
  User,
  ShieldCheck,
  ArrowUp,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LocalAuthUser } from '../types';
import { GastoLogo } from './GastoLogo';
import { LegalTermsModal } from './LegalTermsModal';
import { triggerHaptic } from '../utils/haptics';
import {
  BudgetManagementIllustration,
  FastestPaymentIllustration,
  SecurePlatformIllustration
} from './OnboardingIllustrations';

export type { LocalAuthUser };

function CellularBars({ className = "w-4 h-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 17 12" fill="currentColor">
      <rect x="0" y="8.5" width="2.5" height="3.5" rx="0.5" />
      <rect x="4.5" y="6" width="2.5" height="6" rx="0.5" />
      <rect x="9" y="3" width="2.5" height="9" rx="0.5" />
      <rect x="13.5" y="0" width="2.5" height="12" rx="0.5" />
    </svg>
  );
}

function BatteryStatus({ className = "w-5 h-2.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 25 12" fill="none" stroke="currentColor">
      <rect x="0.75" y="0.75" width="20.5" height="10.5" rx="3" strokeWidth="1.2" />
      <rect x="2.5" y="2.5" width="13" height="7" rx="1.5" fill="currentColor" stroke="none" />
      <path d="M23 4.5v3" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

interface AuthViewProps {
  onLocalLogin?: (user: LocalAuthUser) => void;
  isDarkMode?: boolean;
}

export function AuthView({ onLocalLogin, isDarkMode }: AuthViewProps) {
  // Check if dark theme is active
  const isDark = isDarkMode ?? (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));

  // Caps Lock indicator state for password field
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  // Onboarding slide index (0, 1, 2) or 'auth' screen
  // If user already visited before, directly present login form
  const [slideIndex, setSlideIndex] = useState(0);
  const [showAuthForm, setShowAuthForm] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gasto_has_opened_before') === 'true' || localStorage.getItem('gasto_auth_screen_shown') === 'true';
    }
    return false;
  });

  const openAuthForm = (signUp = false) => {
    setIsSignUp(signUp);
    setShowAuthForm(true);
    try {
      localStorage.setItem('gasto_has_opened_before', 'true');
    } catch {
      // ignore
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handlePasswordKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  // Form states
  const [isSignUp, setIsSignUp] = useState(false);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [legalOpen, setLegalOpen] = useState<null | 'privacy' | 'terms'>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [inAppNotice, setInAppNotice] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [redirectChecking, setRedirectChecking] = useState(false);
  const checkedRedirectRef = useRef(false);

  // Dynamic time string for status bar
  const [currentTime, setCurrentTime] = useState('19:02');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper to detect in-app browsers
  const isInAppBrowser = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || (typeof window !== 'undefined' && 'opera' in window ? String((window as unknown as { opera: string }).opera) : '') || '';
    return /FBAN|FBAV|Instagram|WhatsApp|Line|MicroMessenger|TikTok/i.test(ua);
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '', barColor: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[0-9]/.test(pwd) && /[a-zA-Z]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, label: 'Fraca', color: 'text-rose-600', barColor: 'bg-rose-500' };
    if (score <= 2) return { score: 2, label: 'Média (recomendado 8+ caracteres)', color: 'text-amber-600', barColor: 'bg-amber-500' };
    return { score: 3, label: 'Forte 🔒 (Excelente)', color: 'text-emerald-600', barColor: 'bg-emerald-600' };
  };

  const pwdStrength = getPasswordStrength(password);

  const describeAuthError = (err: any, provider?: 'google' | 'apple'): string => {
    return getFriendlyAuthErrorMessage(err, provider);
  };

  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (errorMsg || successMsg) {
      feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [errorMsg, successMsg]);

  useEffect(() => {
    if (isInAppBrowser()) {
      setInAppNotice(
        'Você está no navegador interno do aplicativo (WhatsApp, Instagram, etc.). O Google pode não permitir login nestas janelas. Toque nos três pontinhos e selecione "Abrir no navegador" (Chrome/Safari).'
      );
    }
  }, []);

  // Complete Google sign-in via redirect
  useEffect(() => {
    if (checkedRedirectRef.current) return;
    checkedRedirectRef.current = true;

    const isPending = localStorage.getItem('auth_redirect_pending') === '1';
    if (!isPending) return;

    setRedirectChecking(true);

    (async () => {
      try {
        const result = await getRedirectResult(auth);
        localStorage.removeItem('auth_redirect_pending');

        if (result?.user) {
          if (onLocalLogin) {
            onLocalLogin({
              uid: result.user.uid,
              email: result.user.email || undefined,
              displayName: result.user.displayName || undefined,
              photoURL: result.user.photoURL || undefined,
            });
          }
          setSuccessMsg('Login realizado com sucesso!');
        }
      } catch (err: any) {
        localStorage.removeItem('auth_redirect_pending');
        console.error('Redirect sign-in notice:', err);
        const msg = describeAuthError(err);
        setErrorMsg(msg || 'Não foi possível concluir o login. Tente novamente.');
      } finally {
        setRedirectChecking(false);
      }
    })();
  }, [onLocalLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && !fullName.trim()) {
      setErrorMsg('Por favor, informe seu nome completo.');
      return;
    }

    const rawInput = usernameOrEmail.trim();
    if (!rawInput) {
      setErrorMsg('Por favor, informe seu e-mail ou telefone.');
      return;
    }

    if (isSignUp && !acceptedTerms) {
      setErrorMsg('Para criar sua conta, é necessário aceitar os Termos de Uso e a Política de Privacidade.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setErrorMsg('As senhas não coincidem. Verifique a confirmação de senha.');
      return;
    }

    if (isSignUp && password.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanInput = rawInput.toLowerCase().replace(/\s+/g, '');
    let emailToUse = cleanInput;

    if (cleanInput.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanInput)) {
        setLoading(false);
        setErrorMsg('Formato de e-mail inválido. Digite um e-mail completo (ex: seu@email.com) ou seu número de telefone.');
        return;
      }
      emailToUse = cleanInput;
    } else {
      const cleanUsername = cleanInput.replace(/[^a-z0-9_.]/g, '');
      if (cleanUsername.length < 2) {
        setLoading(false);
        setErrorMsg('Por favor, informe um e-mail ou telefone válido.');
        return;
      }
      emailToUse = `${cleanUsername}@gastocartao.com`;
    }

    const safeEmailSlug = emailToUse.replace(/[^a-zA-Z0-9]/g, '_');
    const userDisplayName = (isSignUp && fullName.trim()) ? fullName.trim() : (cleanInput.includes('@') ? rawInput.split('@')[0] : rawInput);

    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, emailToUse, password);
        if (userDisplayName) {
          try {
            await updateProfile(cred.user, { displayName: userDisplayName });
          } catch (profileErr) {
            console.warn('Could not set display name:', profileErr);
          }
        }
        try {
          await sendEmailVerification(cred.user);
        } catch (verificationErr) {
          console.error('Erro ao enviar e-mail de verificação:', verificationErr);
        }
        setSuccessMsg('Enviamos um link de confirmação para o seu e-mail.');
        return;
      } else {
        await signInWithEmailAndPassword(auth, emailToUse, password);
        setSuccessMsg('Login realizado com sucesso!');
        return;
      }
    } catch (err: any) {
      if (err?.code !== 'auth/operation-not-allowed') {
        console.error('Auth error:', err);
      }
      setErrorMsg(describeAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = usernameOrEmail.trim();
    if (!rawInput) {
      setErrorMsg('Informe o seu e-mail para recuperar a senha.');
      return;
    }

    const cleanInput = rawInput.toLowerCase().replace(/\s+/g, '');
    const emailToUse = cleanInput.includes('@') 
      ? cleanInput 
      : `${cleanInput.replace(/[^a-z0-9_.]/g, '')}@gastocartao.com`;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await sendPasswordResetEmail(auth, emailToUse);
      setSuccessMsg('E-mail de recuperação enviado! Verifique sua caixa de entrada e spam.');
    } catch (err: any) {
      if (err?.code !== 'auth/operation-not-allowed') {
        console.error('Password reset error:', err);
      }
      setErrorMsg(describeAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (providerType: 'google' | 'apple') => {
    if (isInAppBrowser()) {
      setInAppNotice(
        'Navegadores internos (WhatsApp, Instagram, etc.) podem restringir janelas de login. Toque no menu de opções (três pontinhos ⋮) e selecione "Abrir no navegador" (Chrome/Safari).'
      );
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setInAppNotice(null);

    try {
      const cred = providerType === 'google' 
        ? await signInWithGoogle() 
        : await signInWithApple();

      if (cred?.user) {
        if (onLocalLogin) {
          onLocalLogin({
            uid: cred.user.uid,
            email: cred.user.email || undefined,
            displayName: cred.user.displayName || undefined,
            photoURL: cred.user.photoURL || undefined,
          });
        }
        setSuccessMsg('Login realizado com sucesso!');
        return;
      }
    } catch (err: any) {
      if (err?.code !== 'auth/operation-not-allowed') {
        console.error(`${providerType} OAuth sign-in notice:`, err);
      }
      const msg = describeAuthError(err, providerType);
      if (msg) {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => handleSocialLogin('google');
  const handleAppleLogin = () => handleSocialLogin('apple');

  // Carousel Onboarding slides data talking specifically about Gastô?
  const slides = [
    {
      id: 'slide-management',
      illustration: <BudgetManagementIllustration />,
      titlePrefix: 'Gestão financeira profissional com o ',
      brandHighlight: 'Gastô?',
      description: 'Acompanhe cartões, faturas, despesas e investimentos em tempo real com agilidade e total clareza.',
      primaryButtonText: 'Começar agora',
    },
    {
      id: 'slide-payments',
      illustration: <FastestPaymentIllustration />,
      titlePrefix: 'Controle total de cartões e ',
      brandHighlight: 'faturas',
      description: 'Separe compras por pessoa, acompanhe datas de fechamento e divida despesas sem estresse.',
      primaryButtonText: 'Próximo',
    },
    {
      id: 'slide-security',
      illustration: <SecurePlatformIllustration />,
      titlePrefix: 'A plataforma mais segura para suas ',
      brandHighlight: 'finanças',
      description: 'Acompanhe o rendimento e o valor guardado em cada caixinha, com proteção por código PIN de segurança.',
      primaryButtonText: 'Entrar na minha conta',
    },
  ];

  const currentSlide = slides[slideIndex];

  const handleNextSlide = () => {
    if (slideIndex < slides.length - 1) {
      setSlideIndex(prev => prev + 1);
    } else {
      setShowAuthForm(true);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 h-[100dvh] w-full flex flex-col font-sans select-none overflow-hidden ${isDark ? 'dark bg-[#0E1110] text-slate-100' : 'bg-[#F8FAF9] text-slate-900'} transition-colors duration-200`}>
      {/* Full bleed container on smartphone and desktop */}
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        
        {/* ONBOARDING CAROUSEL VIEW */}
        {!showAuthForm ? (
          <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-white dark:bg-[#0E1110]">
            
            {/* UPPER GREEN SECTION (Edge-to-edge solid brand green from top y=0 to arched base) */}
            <div className="relative w-full bg-[#10B981] flex flex-col pt-[max(0.75rem,env(safe-area-inset-top))] pb-10 sm:pb-12 px-6 overflow-hidden items-center">
              
              {/* Arched bottom cutout transition into lower half */}
              <div 
                className="absolute -bottom-8 sm:-bottom-10 left-1/2 -translate-x-1/2 w-[140%] h-20 sm:h-24 bg-white dark:bg-[#0E1110] rounded-t-[50%] pointer-events-none transition-colors duration-200"
              />

              <div className="w-full max-w-md flex flex-col">
                {/* Navigation Bar: Back chevron on left (if slide > 0) & Skip on right */}
                <div className="relative z-10 w-full flex items-center justify-between py-1.5">
                  {slideIndex > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(6);
                        setSlideIndex(prev => prev - 1);
                      }}
                      className="p-2 -ml-2 rounded-full text-white/90 hover:text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
                      title="Voltar"
                    >
                      <ChevronLeft size={22} className="stroke-[2.5]" />
                    </button>
                  ) : (
                    <div className="w-8" />
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      openAuthForm(false);
                    }}
                    className="text-xs sm:text-sm font-semibold text-white/95 hover:text-white hover:bg-white/15 px-3 py-1 rounded-full cursor-pointer active:scale-95 transition-all"
                  >
                    Pular para o Login
                  </button>
                </div>

                {/* Center Vector Illustration inside Green Dome */}
                <div className="relative z-10 w-full flex items-center justify-center my-auto pt-1 pb-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide.id + '-illustration'}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.28 }}
                      className="w-full flex items-center justify-center"
                    >
                      {currentSlide.illustration}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* LOWER SECTION (Headlines, Pagination Dots, Action Button) */}
            <div className="relative flex-1 flex flex-col justify-between px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 bg-white dark:bg-[#0E1110] text-slate-900 dark:text-white items-center">
              <div className="w-full max-w-md flex-1 flex flex-col justify-between">
                {/* Slide Text Content */}
                <div className="w-full flex flex-col items-center text-center my-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide.id + '-text'}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.25 }}
                      className="w-full"
                    >
                      <h1 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight max-w-xs mx-auto">
                        {currentSlide.titlePrefix}
                        <span className="text-emerald-600 dark:text-emerald-400">{currentSlide.brandHighlight}</span>
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal mt-2.5 sm:mt-3 leading-relaxed max-w-xs mx-auto">
                        {currentSlide.description}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Bottom Actions & Pagination Dots */}
                <div className="w-full flex flex-col items-center gap-4 sm:gap-5 pt-2">
                  {/* Pagination Dots Indicator */}
                  <div className="flex items-center gap-2">
                    {slides.map((slide, idx) => (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic(4);
                          setSlideIndex(idx);
                        }}
                        className={`transition-all duration-300 rounded-full cursor-pointer ${
                          idx === slideIndex
                            ? 'w-7 h-2 bg-emerald-600 dark:bg-emerald-500'
                            : 'w-2 h-2 bg-emerald-200 dark:bg-white/20 hover:bg-emerald-300'
                        }`}
                        title={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Main Rounded Action Button */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      triggerHaptic(8);
                      handleNextSlide();
                    }}
                    className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm tracking-wide shadow-md shadow-emerald-600/25 transition-all cursor-pointer text-center"
                  >
                    {currentSlide.primaryButtonText}
                  </motion.button>

                  {/* Returning user shortcut */}
                  <div className="text-center pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(6);
                        openAuthForm(false);
                      }}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      Já possui uma conta? <strong className="text-emerald-600 dark:text-emerald-400 font-semibold ml-0.5 hover:underline">Entrar com Senha</strong>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* LOGIN & SIGN UP FORM VIEW - SOPHISTICATED FINTECH STANDARD */
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="relative flex-1 flex flex-col justify-between px-4 sm:px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] overflow-y-auto scrollbar-none items-center"
          >
            <div className="w-full max-w-md flex-1 flex flex-col justify-between my-auto py-2">
              
              {/* Top Navigation Bar: Back & Security status */}
              <div className="w-full flex items-center justify-between pb-3 shrink-0">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={() => {
                    triggerHaptic(6);
                    if (isRecoveringPassword) {
                      setIsRecoveringPassword(false);
                    } else {
                      setShowAuthForm(false);
                    }
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-[#181A1C] border border-slate-200/90 dark:border-white/[0.08] hover:border-emerald-500/50 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  title="Voltar"
                >
                  <ChevronLeft size={20} className="stroke-[2.5]" />
                </motion.button>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 text-xs font-bold shadow-2xs">
                  <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
                  <span className="tracking-wide text-[11px]">ACESSO SEGURO</span>
                </div>
              </div>

              {/* Main Card Container with Gastô? App Standard */}
              <div className="w-full bg-white dark:bg-[#141718] border border-slate-200/90 dark:border-white/[0.08] rounded-3xl p-5 sm:p-7 shadow-xs my-auto">
                {/* Brand Hero & Header */}
                <div className="flex flex-col items-center text-center mb-5 sm:mb-6">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-b from-slate-50 to-slate-100/80 dark:from-[#1E2224] dark:to-[#171A1C] border border-slate-200/90 dark:border-white/[0.1] shadow-md shadow-slate-200/50 dark:shadow-black/40 flex items-center justify-center p-2 mb-3.5"
                  >
                    <GastoLogo size={48} />
                  </motion.div>

                  <div className="flex items-center gap-1.5 mb-1">
                    <h1 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                      Gastô<span className="text-emerald-500 dark:text-emerald-400">?</span>
                    </h1>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {isRecoveringPassword ? 'Recuperação' : isSignUp ? 'Novo Acesso' : 'Entrar'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                    {isRecoveringPassword 
                      ? 'Informe seu e-mail cadastrado para redefinir sua senha'
                      : isSignUp 
                      ? 'Abra sua conta grátis e organize suas finanças com agilidade' 
                      : 'Digite suas credenciais e sua senha para acessar com total segurança'}
                  </p>
                </div>

                {/* Feedback Alerts */}
                <div ref={feedbackRef} className="space-y-2 mb-4">
                  <AnimatePresence mode="wait">
                    {redirectChecking && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5"
                      >
                        <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin shrink-0" />
                        <span className="font-semibold">Concluindo autenticação segura...</span>
                      </motion.div>
                    )}

                    {inAppNotice && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs space-y-2"
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <span className="font-medium leading-relaxed">{inAppNotice}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="w-full py-2 px-3 bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 text-amber-900 dark:text-amber-100 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
                        >
                          {copiedLink ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">✓ Link Copiado com Sucesso!</span>
                          ) : (
                            <span>📋 Copiar Link do App para abrir no Chrome</span>
                          )}
                        </button>
                      </motion.div>
                    )}

                    {errorMsg && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5"
                      >
                        <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <span className="font-medium leading-relaxed">{errorMsg}</span>
                      </motion.div>
                    )}

                    {successMsg && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5"
                      >
                        <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-medium">{successMsg}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Password Recovery Mode */}
                {isRecoveringPassword ? (
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div className="space-y-1.5 text-left">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 tracking-tight">
                        E-mail cadastrado
                      </label>
                      <div className="relative flex items-center rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/90 dark:bg-white/[0.04] focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:bg-white dark:focus-within:bg-[#1A1D1E] transition-all shadow-2xs">
                        <div className="pl-3.5 pr-1 text-slate-400 dark:text-slate-500 pointer-events-none">
                          <Mail size={18} />
                        </div>
                        <input
                          type="email"
                          required
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          value={usernameOrEmail}
                          onChange={(e) => setUsernameOrEmail(e.target.value)}
                          placeholder="seu@email.com"
                          className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium outline-hidden"
                        />
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={loading}
                      className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span>Enviar link de recuperação</span>
                      )}
                    </motion.button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(6);
                          setIsRecoveringPassword(false);
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold transition-colors cursor-pointer"
                      >
                        ← Voltar para o Login
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Standard Login & Sign Up Form */
                  <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Full Name on Sign Up */}
                    {isSignUp && (
                      <div className="space-y-1.5 text-left">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 tracking-tight">
                          Nome completo
                        </label>
                        <div className="relative flex items-center rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/90 dark:bg-white/[0.04] focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:bg-white dark:focus-within:bg-[#1A1D1E] transition-all shadow-2xs">
                          <div className="pl-3.5 pr-1 text-slate-400 dark:text-slate-500 pointer-events-none">
                            <User size={18} />
                          </div>
                          <input
                            id="input-signup-fullname"
                            type="text"
                            required
                            autoComplete="name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Ex: Carlos Silva"
                            className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium outline-hidden"
                          />
                        </div>
                      </div>
                    )}

                    {/* Email / Username / Phone */}
                    <div className="space-y-1.5 text-left">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 tracking-tight">
                        {isSignUp ? 'E-mail ou Telefone' : 'E-mail ou Usuário'}
                      </label>
                      <div className="relative flex items-center rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/90 dark:bg-white/[0.04] focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:bg-white dark:focus-within:bg-[#1A1D1E] transition-all shadow-2xs">
                        <div className="pl-3.5 pr-1 text-slate-400 dark:text-slate-500 pointer-events-none">
                          <Mail size={18} />
                        </div>
                        <input
                          id="input-login-username"
                          type="text"
                          required
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          autoComplete="username"
                          value={usernameOrEmail}
                          onChange={(e) => setUsernameOrEmail(e.target.value)}
                          placeholder={isSignUp ? "seu@email.com ou 11999999999" : "seu@email.com"}
                          className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium outline-hidden"
                        />
                      </div>
                    </div>

                    {/* PASSWORD FIELD - ELEVATED WITH CAPS LOCK DETECTION & TOGGLE */}
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 tracking-tight">
                          Senha
                        </label>
                        {!isSignUp && (
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic(6);
                              setIsRecoveringPassword(true);
                              setErrorMsg(null);
                              setSuccessMsg(null);
                            }}
                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold transition-colors cursor-pointer hover:underline"
                          >
                            Esqueceu a senha?
                          </button>
                        )}
                      </div>

                      <div className="relative flex items-center rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/90 dark:bg-white/[0.04] focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:bg-white dark:focus-within:bg-[#1A1D1E] transition-all shadow-2xs">
                        <div className="pl-3.5 pr-1 text-slate-400 dark:text-slate-500 pointer-events-none">
                          <Lock size={18} className="stroke-[2.2]" />
                        </div>
                        <input
                          id="input-login-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          autoCapitalize="none"
                          autoCorrect="off"
                          autoComplete={isSignUp ? 'new-password' : 'current-password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={handlePasswordKeyDown}
                          onKeyUp={handlePasswordKeyUp}
                          placeholder="••••••••••••"
                          className="w-full bg-transparent px-3 py-3.5 pr-12 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium tracking-wider outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(6);
                            setShowPassword(!showPassword);
                          }}
                          className="absolute right-2.5 w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-all cursor-pointer"
                          title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      {/* Caps Lock Alert Indicator */}
                      {isCapsLockOn && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-semibold px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20"
                        >
                          <ArrowUp size={13} className="stroke-[2.5]" />
                          <span>Caps Lock (Maiúsculas) ativado</span>
                        </motion.div>
                      )}
                    </div>

                    {/* Password Strength on Sign Up */}
                    {isSignUp && password.length > 0 && (
                      <div className="space-y-1.5 text-left pt-0.5">
                        <div className="flex gap-1.5 h-1.5 w-full">
                          <div className={`h-full flex-1 rounded-full transition-all ${pwdStrength.score >= 1 ? pwdStrength.barColor : 'bg-slate-200 dark:bg-white/10'}`} />
                          <div className={`h-full flex-1 rounded-full transition-all ${pwdStrength.score >= 2 ? pwdStrength.barColor : 'bg-slate-200 dark:bg-white/10'}`} />
                          <div className={`h-full flex-1 rounded-full transition-all ${pwdStrength.score >= 3 ? pwdStrength.barColor : 'bg-slate-200 dark:bg-white/10'}`} />
                        </div>
                        <p className={`text-[11px] font-semibold ${pwdStrength.color}`}>
                          Segurança da senha: {pwdStrength.label}
                        </p>
                      </div>
                    )}

                    {/* Repeat Password on Sign Up */}
                    {isSignUp && (
                      <div className="space-y-1.5 text-left">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 tracking-tight">
                          Confirmar senha
                        </label>
                        <div className="relative flex items-center rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/90 dark:bg-white/[0.04] focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:bg-white dark:focus-within:bg-[#1A1D1E] transition-all shadow-2xs">
                          <div className="pl-3.5 pr-1 text-slate-400 dark:text-slate-500 pointer-events-none">
                            <Lock size={18} className="stroke-[2.2]" />
                          </div>
                          <input
                            id="input-signup-confirm-password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoCapitalize="none"
                            autoCorrect="off"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full bg-transparent px-3 py-3.5 pr-12 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium tracking-wider outline-hidden"
                          />
                          {confirmPassword.length > 0 && (
                            <span className="absolute right-3.5 flex items-center pointer-events-none">
                              {password === confirmPassword ? (
                                <Check size={18} className="text-emerald-500 stroke-[2.5]" />
                              ) : (
                                <AlertCircle size={18} className="text-rose-500 stroke-[2.5]" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Consentimento (LGPD) */}
                    {isSignUp && (
                      <label className="flex items-start gap-2 cursor-pointer select-none px-0.5">
                        <input
                          id="input-signup-accept-terms"
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(e) => setAcceptedTerms(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded-md border-slate-300 dark:border-white/20 accent-emerald-600 cursor-pointer shrink-0"
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                          Li e aceito os{' '}
                          <button type="button" onClick={() => setLegalOpen('terms')} className="font-bold text-emerald-600 dark:text-emerald-400 underline">Termos de Uso</button>
                          {' '}e a{' '}
                          <button type="button" onClick={() => setLegalOpen('privacy')} className="font-bold text-emerald-600 dark:text-emerald-400 underline">Política de Privacidade</button>.
                        </span>
                      </label>
                    )}

                    {/* Remember Me */}
                    {!isSignUp && (
                      <div className="flex items-center justify-between pt-0.5 px-0.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded-md border-slate-300 dark:border-white/20 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                          />
                          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Lembrar de mim neste dispositivo</span>
                        </label>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-2">
                      <motion.button
                        id="btn-login-submit"
                        type="submit"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        className="w-full h-12.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm tracking-wide shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 text-center"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>{isSignUp ? 'Criar minha conta grátis' : 'Entrar na minha conta'}</span>
                            <ArrowRight size={17} className="stroke-[2.5]" />
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>
                )}

                {/* Social Login: Google & Apple */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-slate-200 dark:border-white/[0.08] w-full" />
                  <span className="bg-white dark:bg-[#141718] px-3 text-[11px] text-slate-400 dark:text-slate-500 absolute font-bold uppercase tracking-wider">
                    ou continuar com
                  </span>
                </div>

                <div className="space-y-2.5">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      triggerHaptic(8);
                      handleGoogleLogin();
                    }}
                    disabled={loading}
                    className="w-full h-12 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-[#181A1C] hover:bg-slate-100 dark:hover:bg-white/[0.06] active:bg-slate-200/60 dark:active:bg-white/[0.1] flex items-center justify-center gap-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
                  >
                    <GoogleIcon className="w-4.5 h-4.5" />
                    <span>Continuar com o Google</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      triggerHaptic(8);
                      handleAppleLogin();
                    }}
                    disabled={loading}
                    className="w-full h-12 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-[#181A1C] hover:bg-slate-100 dark:hover:bg-white/[0.06] active:bg-slate-200/60 dark:active:bg-white/[0.1] flex items-center justify-center gap-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
                  >
                    <AppleIcon className="w-4.5 h-4.5 text-slate-900 dark:text-white" />
                    <span>Continuar com a Apple</span>
                  </motion.button>
                </div>

                {/* Bottom Toggle: Switch Login / Sign Up */}
                <div className="text-center pt-5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(6);
                      setIsSignUp(!isSignUp);
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-normal transition-colors cursor-pointer"
                  >
                    {isSignUp ? (
                      <span>Já possui uma conta? <strong className="text-emerald-600 dark:text-emerald-400 font-bold ml-1 hover:underline">Fazer Login</strong></span>
                    ) : (
                      <span>Não tem uma conta? <strong className="text-emerald-600 dark:text-emerald-400 font-bold ml-1 hover:underline">Cadastre-se grátis</strong></span>
                    )}
                  </button>
                </div>
              </div>

              {/* Bottom Trust & Security Indicator */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 pt-4 text-center">
                <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                <span>Ambiente seguro • Dados criptografados em trânsito e em repouso</span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-snug">
                Ao continuar, você concorda com os{' '}
                <button type="button" onClick={() => setLegalOpen('terms')} className="underline">Termos de Uso</button>
                {' '}e a{' '}
                <button type="button" onClick={() => setLegalOpen('privacy')} className="underline">Política de Privacidade</button>.
              </p>
            </div>
          </motion.div>
        )}

      </div>
      <LegalTermsModal isOpen={legalOpen !== null} onClose={() => setLegalOpen(null)} initialTab={legalOpen ?? 'privacy'} />
    </div>
  );
}
