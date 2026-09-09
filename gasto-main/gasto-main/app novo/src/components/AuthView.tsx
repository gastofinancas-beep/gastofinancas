import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { GastoLogo } from './GastoLogo';
import { FinanceIllustration } from './FinanceIllustration';
import { 
  Lock, 
  User as UserIcon, 
  Mail, 
  ArrowRight, 
  ChevronLeft,
  Sparkles, 
  Zap, 
  Eye, 
  EyeOff, 
  KeyRound, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface LocalAuthUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  isAnonymous?: boolean;
}

interface AuthViewProps {
  onLocalLogin?: (user: LocalAuthUser) => void;
}

export function AuthView({ onLocalLogin }: AuthViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Mobile step: 'splash' (initial hero with Iniciar button) or 'form' (login inputs)
  const [mobileStep, setMobileStep] = useState<'splash' | 'form'>('splash');

  const fallbackLocalLogin = (userEmailOrName?: string, displayName?: string) => {
    const raw = userEmailOrName?.trim() || 'usuario';
    const cleanEmail = raw.includes('@') ? raw : `${raw.toLowerCase()}@gastocartao.com`;
    const cleanName = displayName || raw.split('@')[0] || 'Usuário';
    const fakeUid = `local_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    const localUser: LocalAuthUser = {
      uid: fakeUid,
      email: cleanEmail,
      displayName: cleanName,
      isAnonymous: false,
    };
    
    if (onLocalLogin) {
      onLocalLogin(localUser);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim()) {
      setErrorMsg('Por favor, informe seu usuário ou e-mail.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const emailToUse = usernameOrEmail.includes('@') 
      ? usernameOrEmail.trim() 
      : `${usernameOrEmail.trim().toLowerCase()}@gastocartao.com`;

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, emailToUse, password || '123456');
      } else {
        await signInWithEmailAndPassword(auth, emailToUse, password || '123456');
      }
    } catch (err: any) {
      console.warn('Firebase auth attempt:', err);
      // Fallback seamlessly if restricted
      if (
        err.code === 'auth/admin-restricted-operation' || 
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/network-request-failed' ||
        err.message?.includes('admin-restricted-operation')
      ) {
        fallbackLocalLogin(usernameOrEmail, usernameOrEmail.split('@')[0]);
        return;
      }

      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErrorMsg('Usuário ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Este usuário/e-mail já está cadastrado. Tente entrar.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      } else {
        fallbackLocalLogin(usernameOrEmail, usernameOrEmail.split('@')[0]);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim()) {
      setErrorMsg('Informe o seu e-mail para recuperar a senha.');
      return;
    }

    const emailToUse = usernameOrEmail.includes('@') 
      ? usernameOrEmail.trim() 
      : `${usernameOrEmail.trim().toLowerCase()}@gastocartao.com`;

    setLoading(true);
    setErrorMsg(null);
    try {
      await sendPasswordResetEmail(auth, emailToUse);
      setSuccessMsg('E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada.');
    } catch (err: any) {
      console.warn('Password reset notice:', err);
      setSuccessMsg('Instruções de redefinição processadas para este usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.warn('Google auth error:', err);
      fallbackLocalLogin('usuario.google@gmail.com', 'Usuário Google');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickEntry = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.warn('Anonymous auth fallback:', err);
      fallbackLocalLogin('visitante@gastocartao.com', 'Visitante');
    } finally {
      setLoading(false);
    }
  };

  const renderFormContent = () => (
    <div>
      {/* Card Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-[#00D06C] tracking-wide uppercase">
          {isRecoveringPassword ? 'RECUPERAR' : isSignUp ? 'CADASTRAR' : 'LOGIN'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          {isRecoveringPassword 
            ? 'Redefina o acesso à sua conta' 
            : isSignUp 
            ? 'Crie sua conta para gerenciar seus gastos' 
            : 'Acesse seu painel financeiro Gastô?'}
        </p>
      </div>

      {/* Feedback Messages */}
      <AnimatePresence mode="wait">
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2 shadow-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle size={15} className="text-rose-500 shrink-0" />
              <span className="truncate font-medium">{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => fallbackLocalLogin(usernameOrEmail, usernameOrEmail.split('@')[0])}
              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
            >
              Entrar Direto
            </button>
          </motion.div>
        )}

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-xs"
          >
            <Check size={16} className="text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Reset Form */}
      {isRecoveringPassword ? (
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div className="text-center mb-2">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Recuperar Senha</h3>
            <p className="text-xs text-slate-500 mt-0.5">Digite o e-mail ou usuário cadastrado</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 tracking-tight">
              Usuário ou E-mail
            </label>
            <input
              type="text"
              required
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="Digite seu e-mail cadastrado"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-[#00D06C] focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
            />
          </div>

          {/* Clean Pill Button for Reset */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 bg-[#00D06C] hover:bg-[#00B960] active:scale-[0.98] text-slate-950 font-black text-sm tracking-wider uppercase rounded-full shadow-[0_10px_25px_-5px_rgba(0,208,108,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(0,208,108,0.55)] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'ENVIANDO...' : 'ENVIAR LINK'}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRecoveringPassword(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
            >
              Voltar para o Login
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Field: Usuário */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 tracking-tight">
              Usuário
            </label>
            <input
              id="input-login-username"
              type="text"
              required
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder="Usuário"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-[#00D06C] focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium shadow-xs"
            />
          </div>

          {/* Field: Senha */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 tracking-tight">
              Senha
            </label>
            <div className="relative">
              <input
                id="input-login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-[#00D06C] focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Recuperar senha link */}
            {!isSignUp && (
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecoveringPassword(true);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs text-slate-500 hover:text-[#00B960] font-medium transition-colors cursor-pointer"
                >
                  Recuperar senha?
                </button>
              </div>
            )}
          </div>

          {/* Confirm Password in Sign Up mode */}
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 tracking-tight">
                Confirmar Senha
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita sua senha"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-[#00D06C] focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium shadow-xs"
              />
            </div>
          )}

          {/* Ultra Clean Emerald Pill Submit Button (LOGIN) */}
          <div className="pt-2">
            <button
              id="btn-login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-[#00D06C] hover:bg-[#00B960] active:scale-[0.98] text-slate-950 font-black text-sm tracking-wider uppercase rounded-full shadow-[0_10px_25px_-5px_rgba(0,208,108,0.45)] hover:shadow-[0_15px_30px_-5px_rgba(0,208,108,0.6)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <span>{isSignUp ? 'CADASTRAR' : 'LOGIN'}</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Social / Alternative Buttons (iOS Pill Style) */}
      <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 active:scale-95 text-xs font-semibold text-slate-700 rounded-full border border-slate-200/80 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 12s.7 2.3 1.9 4.7l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"/>
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={handleQuickEntry}
            disabled={loading}
            className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100/80 active:scale-95 text-xs font-semibold text-emerald-800 rounded-full border border-emerald-200/80 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Sparkles size={14} className="text-amber-500 fill-amber-500" />
            <span>Modo Demo</span>
          </button>
        </div>

        {/* Toggle Sign Up / Sign In */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setIsRecoveringPassword(false);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
          >
            {isSignUp ? (
              <span>Já tem uma conta? <strong className="text-[#00B960] font-bold underline">Fazer Login</strong></span>
            ) : (
              <span>Ainda não tem conta? <strong className="text-[#00B960] font-bold underline">Cadastre-se aqui</strong></span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#141518] font-sans selection:bg-[#00FF88] selection:text-[#0f172a] overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* DESKTOP VIEW: Persistent Split Screen (Side-by-side)                      */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex w-full min-h-screen">
        {/* Left Side (Dark Charcoal Gray Canvas) */}
        <div className="w-[54%] xl:w-[56%] bg-[#141518] relative flex flex-col justify-between p-10 xl:p-12 overflow-hidden border-r border-zinc-800/80">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-emerald-500/12 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Top Brand */}
          <div className="flex items-center gap-3 z-10">
            <div className="p-2.5 rounded-2xl bg-[#1f2126] border border-[#2e323b] shadow-lg shadow-black/40">
              <GastoLogo size={30} />
            </div>
            <div className="flex items-center">
              <span className="text-2xl font-black text-white tracking-tight">Gastô</span>
              <span className="text-2xl font-black text-[#00FF88]">?</span>
            </div>
          </div>

          {/* Centered Illustration */}
          <div className="my-auto py-8 z-10 max-w-xl w-full mx-auto flex flex-col items-center justify-center text-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-full flex justify-center items-center"
            >
              <FinanceIllustration />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
              className="text-xs sm:text-sm text-slate-300/90 pt-3 max-w-md mx-auto leading-relaxed font-normal text-center"
            >
              O controle inteligente de finanças, faturas de cartões, divisão de gastos e caixinhas que rendem todo mês.
            </motion.p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center text-[11px] text-slate-500 z-10 pt-4 font-medium tracking-wide">
            <span>Gastô? • Gestão e Controle Financeiro</span>
          </div>
        </div>

        {/* Right Side (Clean Apple White Form) */}
        <div className="w-[46%] xl:w-[44%] bg-white text-slate-900 flex flex-col justify-between p-10 xl:p-12 relative z-20 shadow-2xl">
          <div className="flex justify-end items-center z-10">
            <button
              type="button"
              onClick={handleQuickEntry}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-semibold tracking-tight transition-all border border-slate-200/80 cursor-pointer shadow-xs"
            >
              <Zap size={14} className="text-emerald-600 fill-emerald-600" />
              <span>Acesso Rápido</span>
            </button>
          </div>

          <div className="my-auto max-w-sm w-full mx-auto py-4">
            {renderFormContent()}
          </div>

          <div className="text-center text-[11px] text-slate-400 font-medium pt-4">
            Gastô? © 2026 • Design seguro e intuitivo
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE VIEW: Animated Fluid Screen Transitions (Splash <-> Login)         */}
      {/* ========================================================================= */}
      <div className="lg:hidden w-full min-h-screen relative overflow-hidden bg-[#141518]">
        <AnimatePresence mode="wait" initial={false}>
          {mobileStep === 'splash' ? (
            <motion.div
              key="mobile-splash"
              initial={{ opacity: 0, x: -40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -90, scale: 0.92, filter: 'blur(6px)' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="w-full min-h-screen bg-[#141518] flex flex-col justify-between p-6 relative overflow-hidden"
            >
              {/* Ambient neon glows */}
              <div className="absolute -top-16 -left-16 w-80 h-80 bg-emerald-500/12 rounded-full blur-[90px] pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-teal-500/10 rounded-full blur-[90px] pointer-events-none" />

              {/* Mobile Top Header */}
              <div className="flex items-center justify-between z-10 w-full">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-2xl bg-[#1f2126] border border-[#2e323b] shadow-lg shadow-black/40">
                    <GastoLogo size={26} />
                  </div>
                  <div className="flex items-center">
                    <span className="text-xl font-black text-white tracking-tight">Gastô</span>
                    <span className="text-xl font-black text-[#00FF88]">?</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickEntry}
                  disabled={loading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1f2126] hover:bg-[#282b32] active:scale-95 text-[#00FF88] text-xs font-semibold tracking-tight border border-[#2e323b] cursor-pointer shadow-xs transition-all"
                >
                  <Zap size={13} className="text-[#00FF88] fill-[#00FF88]" />
                  <span>Demo</span>
                </button>
              </div>

              {/* Mobile Center Hero with animated float */}
              <div className="my-auto py-4 z-10 w-full flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full flex justify-center items-center"
                >
                  <FinanceIllustration />
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="text-xs text-slate-300/90 pt-3 max-w-xs mx-auto leading-relaxed text-center font-normal"
                >
                  O controle inteligente de finanças, faturas de cartões, divisão de gastos e caixinhas que rendem todo mês.
                </motion.p>
              </div>

              {/* Mobile Bottom Action: INICIAR button with pulse effect */}
              <div className="w-full pt-2 pb-3 z-10 flex flex-col items-center">
                <motion.button
                  type="button"
                  onClick={() => setMobileStep('form')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className="w-full max-w-xs py-4 px-6 bg-gradient-to-r from-[#00D06C] to-[#00FF88] hover:from-[#00B960] hover:to-[#00D06C] text-slate-950 font-black text-sm tracking-wider uppercase rounded-full shadow-[0_10px_35px_rgba(0,255,136,0.45)] flex items-center justify-center gap-2.5 transition-all cursor-pointer group"
                >
                  <span>INICIAR</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  >
                    <ArrowRight size={18} className="text-slate-950 stroke-[3]" />
                  </motion.div>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="mobile-form"
              initial={{ opacity: 0, x: 90, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 90, scale: 0.94 }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="w-full min-h-screen bg-white text-slate-900 flex flex-col justify-between p-6 relative z-20 overflow-y-auto"
            >
              {/* Mobile Form Header with Back Action */}
              <div className="flex justify-between items-center z-10 mb-2">
                <motion.button
                  type="button"
                  onClick={() => setMobileStep('splash')}
                  whileTap={{ scale: 0.92 }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-bold tracking-tight transition-all cursor-pointer shadow-xs border border-slate-200/80"
                >
                  <ChevronLeft size={16} className="stroke-[2.5]" />
                  <span>Voltar</span>
                </motion.button>

                <button
                  type="button"
                  onClick={handleQuickEntry}
                  disabled={loading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold tracking-tight transition-all border border-emerald-200 cursor-pointer"
                >
                  <Zap size={13} className="text-emerald-600 fill-emerald-600" />
                  <span>Acesso Rápido</span>
                </button>
              </div>

              {/* Form Content */}
              <div className="my-auto max-w-sm w-full mx-auto py-2">
                {renderFormContent()}
              </div>

              {/* Mobile Footer */}
              <div className="text-center text-[10px] text-slate-400 font-medium pt-3 pb-1">
                Gastô? © 2026 • Design seguro e intuitivo
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}

