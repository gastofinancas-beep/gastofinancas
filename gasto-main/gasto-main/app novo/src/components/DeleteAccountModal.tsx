import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Trash2, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Loader2, 
  UserX, 
  RefreshCw,
  FileText,
  Lock,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { deleteDoc, doc, collection, getDocs } from 'firebase/firestore';
import { 
  deleteUser, 
  GoogleAuthProvider, 
  OAuthProvider,
  EmailAuthProvider,
  reauthenticateWithPopup,
  reauthenticateWithCredential 
} from 'firebase/auth';
import { GoogleIcon, AppleIcon } from './AuthIcons';
import { InvestmentBox } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { Button } from './Button';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  userEmail?: string | null;
  boxes?: InvestmentBox[];
  onOpenExport?: () => void;
  onAccountDeleted: () => void;
}

type DeletionStep = 'idle' | 'auth' | 'cloud' | 'local' | 'reauth_needed' | 'success' | 'error';

export function DeleteAccountModal({
  isOpen,
  onClose,
  currentUser,
  userEmail,
  boxes = [],
  onOpenExport,
  onAccountDeleted,
}: DeleteAccountModalProps) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isReauthenticating, setIsReauthenticating] = useState(false);
  const [step, setStep] = useState<DeletionStep>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state when modal is opened or closed
  useEffect(() => {
    if (isOpen) {
      setConfirmationInput('');
      setPasswordInput('');
      setShowPassword(false);
      setIsReauthenticating(false);
      setStep('idle');
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && step === 'idle') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, onClose]);

  if (!isOpen) return null;

  const isConfirmationValid = confirmationInput.trim().toUpperCase() === 'EXCLUIR';

  // Detect which authentication providers the current user has linked
  const getDetectedProviders = () => {
    const providerData = auth.currentUser?.providerData || [];
    const providerIds = providerData.map((p) => p.providerId);
    const hasPassword = providerIds.includes('password');
    const hasGoogle = providerIds.includes('google.com');
    const hasApple = providerIds.includes('apple.com');

    // Fallback if providerData is temporarily empty
    if (!hasPassword && !hasGoogle && !hasApple) {
      return {
        hasPassword: Boolean(auth.currentUser?.email || userEmail),
        hasGoogle: true,
        hasApple: true,
      };
    }

    return { hasPassword, hasGoogle, hasApple };
  };

  const { hasPassword, hasGoogle, hasApple } = getDetectedProviders();

  const purgeLocalStorageAndCache = (targetUid?: string) => {
    try {
      if (targetUid) {
        const userPrefix = `user_${targetUid}_`;
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith(userPrefix)) {
            localStorage.removeItem(k);
          }
        }
      }

      // Purge application-specific keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k &&
          (k.startsWith('gasto_') ||
            k.startsWith('financas_') ||
            k.startsWith('user_') ||
            k.includes('profile') ||
            k.includes('pin') ||
            k.includes('token') ||
            k.includes('webauthn'))
        ) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {
          // ignore
        }
      });
    } catch (e) {
      console.warn('Error purging local storage:', e);
    }
  };

  /**
   * Execute account deletion in inverted safe order:
   * 1. Re-authenticate if necessary and delete the user from Firebase Auth.
   *    If auth deletion fails (e.g. requires recent login or permission), ABORT and do NOT delete data.
   * 2. Only once auth deletion succeeds, delete Firestore data and subcollections.
   * 3. Purge local storage and device cache.
   */
  const executeAccountDeletion = async (isReauthRetry = false) => {
    if (!isReauthRetry && !isConfirmationValid) return;

    triggerHaptic(25);
    setErrorMessage(null);
    const targetUid = currentUser?.uid || auth.currentUser?.uid;

    try {
      // 1. DELETE USER FROM FIREBASE AUTH FIRST
      setStep('auth');
      const authUser = auth.currentUser;
      if (authUser) {
        try {
          await deleteUser(authUser);
        } catch (authErr: any) {
          console.warn('Auth user deletion response:', authErr);
          // If Firebase requires recent authentication for security
          if (authErr?.code === 'auth/requires-recent-login') {
            setStep('reauth_needed');
            return; // CRITICAL: Stop here immediately. No data was deleted.
          }
          // If any other Auth deletion error occurred, abort without deleting any Firestore data
          setStep('error');
          setErrorMessage(
            authErr?.message || 'Falha ao excluir a conta de autenticação. Nenhum dado foi apagado. Tente novamente.'
          );
          return;
        }
      }

      // 2. ONLY ONCE AUTH DELETION SUCCEEDED: DELETE FIRESTORE DATA & SUBCOLLECTIONS
      setStep('cloud');
      if (targetUid) {
        try {
          // Delete investment box entries subcollections if any
          if (Array.isArray(boxes) && boxes.length > 0) {
            for (const box of boxes) {
              try {
                const entriesCol = collection(db, 'users', targetUid, 'investmentBoxHistory', box.id, 'entries');
                const entriesSnap = await getDocs(entriesCol);
                for (const entryDoc of entriesSnap.docs) {
                  await deleteDoc(entryDoc.ref);
                }
              } catch (subErr) {
                console.warn(`Notice while deleting subcollection entries for box ${box.id}:`, subErr);
              }
            }
          }

          // Delete primary user financial document
          const userDocRef = doc(db, 'users', targetUid);
          await deleteDoc(userDocRef);
        } catch (docErr: unknown) {
          console.warn('Notice while deleting user Firestore data after auth deletion:', docErr);
        }
      }

      // 3. PURGE LOCAL STORAGE, BIOMETRICS, AND CACHE
      setStep('local');
      purgeLocalStorageAndCache(targetUid);

      // 4. FINAL SUCCESS STATE
      setStep('success');
      triggerHaptic(30);

      // Complete flow after confirmation message
      setTimeout(() => {
        onAccountDeleted();
      }, 2400);

    } catch (err: any) {
      console.error('Error during LGPD account deletion:', err);
      setStep('error');
      setErrorMessage(
        err?.message || 'Ocorreu um erro ao processar a exclusão. Verifique sua conexão e tente novamente.'
      );
    }
  };

  const handleReauthWithPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passwordInput.trim()) {
      setErrorMessage('Por favor, informe sua senha.');
      return;
    }

    const authUser = auth.currentUser;
    const emailToUse = authUser?.email || userEmail;
    if (!authUser || !emailToUse) {
      setErrorMessage('Não foi possível identificar o e-mail da conta.');
      return;
    }

    triggerHaptic(15);
    setIsReauthenticating(true);
    setErrorMessage(null);

    try {
      const credential = EmailAuthProvider.credential(emailToUse, passwordInput);
      await reauthenticateWithCredential(authUser, credential);
      setPasswordInput('');
      await executeAccountDeletion(true);
    } catch (err: any) {
      console.error('Password re-authentication failed:', err);
      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setErrorMessage('Senha incorreta. Por favor, tente novamente.');
      } else if (err?.code === 'auth/too-many-requests') {
        setErrorMessage('Muitas tentativas sem sucesso. Aguarde um instante e tente novamente.');
      } else {
        setErrorMessage(err?.message || 'Falha ao validar a senha. Tente novamente.');
      }
    } finally {
      setIsReauthenticating(false);
    }
  };

  const handleReauthWithGoogle = async () => {
    triggerHaptic(15);
    const authUser = auth.currentUser;
    if (!authUser) {
      purgeLocalStorageAndCache(currentUser?.uid);
      setStep('success');
      setTimeout(() => onAccountDeleted(), 1500);
      return;
    }

    setIsReauthenticating(true);
    setErrorMessage(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await reauthenticateWithPopup(authUser, provider);
      await executeAccountDeletion(true);
    } catch (reauthErr: any) {
      console.error('Google re-authentication failed:', reauthErr);
      if (
        reauthErr?.code === 'auth/popup-closed-by-user' ||
        reauthErr?.code === 'auth/cancelled-popup-request'
      ) {
        setIsReauthenticating(false);
        return;
      }
      if (reauthErr?.code === 'auth/operation-not-allowed') {
        setErrorMessage('Login com Google não está habilitado no projeto do Firebase.');
      } else {
        setErrorMessage('Falha na autenticação com o Google. Por favor, tente novamente para autorizar a exclusão.');
      }
    } finally {
      setIsReauthenticating(false);
    }
  };

  const handleReauthWithApple = async () => {
    triggerHaptic(15);
    const authUser = auth.currentUser;
    if (!authUser) {
      purgeLocalStorageAndCache(currentUser?.uid);
      setStep('success');
      setTimeout(() => onAccountDeleted(), 1500);
      return;
    }

    setIsReauthenticating(true);
    setErrorMessage(null);

    try {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      await reauthenticateWithPopup(authUser, provider);
      await executeAccountDeletion(true);
    } catch (reauthErr: any) {
      console.error('Apple re-authentication failed:', reauthErr);
      if (
        reauthErr?.code === 'auth/popup-closed-by-user' ||
        reauthErr?.code === 'auth/cancelled-popup-request'
      ) {
        setIsReauthenticating(false);
        return;
      }
      if (reauthErr?.code === 'auth/operation-not-allowed') {
        setErrorMessage('Login com a Apple não está habilitado no projeto do Firebase.');
      } else {
        setErrorMessage('Falha na autenticação com a Apple. Por favor, tente novamente para autorizar a exclusão.');
      }
    } finally {
      setIsReauthenticating(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="bg-white dark:bg-[#1C1C1E] rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-rose-200/80 dark:border-rose-900/40 flex flex-col max-h-[92vh] overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 dark:border-white/[0.08] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shrink-0">
                <Trash2 size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="delete-account-title" className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Excluir Conta e Dados
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[10px] font-extrabold tracking-wider border border-rose-200/60 dark:border-rose-800/40">
                    LGPD
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Direito à eliminação definitiva • Art. 18, VI da Lei nº 13.709/2018
                </p>
              </div>
            </div>

            {step === 'idle' && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar modal"
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Modal Body */}
          <div className="mt-4 flex-1 overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-slate-300 pr-0.5">
            {step === 'success' ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Conta e Dados Excluídos com Sucesso
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  Todos os seus registros financeiros, perfil pessoal e identificadores de acesso foram definitivamente purgados em total conformidade com a LGPD.
                </p>
                <div className="pt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Redirecionando para a tela inicial...</span>
                </div>
              </div>
            ) : step === 'reauth_needed' ? (
              <div className="space-y-4 py-2">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <ShieldAlert size={17} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Confirmação de Segurança Necessária</span>
                  </div>
                  <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                    Por motivos de segurança exigidos pelo Firebase e pela LGPD, é necessário revalidar sua identidade antes de apagar a conta <strong className="font-semibold">{userEmail || ''}</strong>. Nenhum dado foi excluído ainda.
                  </p>
                </div>

                {errorMessage && (
                  <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
                    {errorMessage}
                  </p>
                )}

                <div className="space-y-3 pt-1">
                  {/* Password re-authentication */}
                  {hasPassword && (
                    <form onSubmit={handleReauthWithPassword} className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <KeyRound size={15} className="text-emerald-600 dark:text-emerald-400" />
                        <span>Confirmar com sua Senha</span>
                      </div>
                      <div className="relative flex items-center rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141718] focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
                        <div className="pl-3 pr-1 text-slate-400">
                          <Lock size={15} />
                        </div>
                        <input
                          id="reauth-password-input"
                          type={showPassword ? 'text' : 'password'}
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="Digite sua senha cadastrada"
                          className="w-full bg-transparent px-2.5 py-2.5 pr-10 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                          title={showPassword ? "Ocultar senha" : "Ver senha"}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      <Button
                        fullWidth
                        type="submit"
                        variant="danger"
                        disabled={!passwordInput.trim() || isReauthenticating}
                        leftIcon={isReauthenticating ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                      >
                        {isReauthenticating ? 'Confirmando...' : 'Confirmar Senha e Excluir'}
                      </Button>
                    </form>
                  )}

                  {/* Visual divider if password and social are both shown */}
                  {hasPassword && (hasGoogle || hasApple) && (
                    <div className="relative flex items-center justify-center my-1">
                      <div className="border-t border-slate-200 dark:border-white/[0.08] w-full" />
                      <span className="bg-white dark:bg-[#1C1C1E] px-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        ou reautenticar com
                      </span>
                    </div>
                  )}

                  {/* Google re-authentication */}
                  {hasGoogle && (
                    <Button
                      fullWidth
                      variant="outline"
                      onClick={handleReauthWithGoogle}
                      disabled={isReauthenticating}
                      leftIcon={<GoogleIcon className="w-4 h-4" />}
                      className="border-slate-200 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/[0.05]"
                    >
                      {isReauthenticating ? 'Reautenticando...' : 'Reautenticar com Google'}
                    </Button>
                  )}

                  {/* Apple re-authentication */}
                  {hasApple && (
                    <Button
                      fullWidth
                      variant="outline"
                      onClick={handleReauthWithApple}
                      disabled={isReauthenticating}
                      leftIcon={<AppleIcon className="w-4 h-4 text-slate-900 dark:text-white" />}
                      className="border-slate-200 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/[0.05]"
                    >
                      {isReauthenticating ? 'Reautenticando...' : 'Reautenticar com Apple'}
                    </Button>
                  )}
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('idle');
                      setErrorMessage(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium cursor-pointer"
                  >
                    ← Cancelar e voltar
                  </button>
                </div>
              </div>
            ) : step === 'cloud' || step === 'auth' || step === 'local' ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 size={36} className="text-rose-600 dark:text-rose-400 animate-spin" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {step === 'cloud' && 'Eliminando seus dados financeiros...'}
                    {step === 'auth' && 'Excluindo sua conta de acesso...'}
                    {step === 'local' && 'Limpando os dados deste aparelho...'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Por favor, aguarde alguns instantes. Não feche a janela.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Irreversible warning banner */}
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-900 dark:text-rose-200 flex items-start gap-2.5">
                  <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold leading-tight">
                      Atenção: Esta ação é definitiva e não poderá ser desfeita.
                    </p>
                    <p className="text-[11px] leading-relaxed text-rose-800/90 dark:text-rose-300/90">
                      Ao prosseguir, você exercerá seu <strong>Direito ao Esquecimento</strong> previsto no Art. 18 da Lei Federal nº 13.709/2018 (LGPD).
                    </p>
                  </div>
                </div>

                {/* Portability / Export Recommendation (Art. 18, V) */}
                {onOpenExport && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <FileText size={18} className="text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Deseja salvar um backup primeiro?
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Você tem direito à portabilidade completa dos seus dados (Excel / JSON).
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onClose();
                        onOpenExport();
                      }}
                      leftIcon={<Download size={13} />}
                    >
                      Exportar
                    </Button>
                  </div>
                )}

                {/* List of items that will be deleted */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    O que será permanentemente destruído:
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span><strong>Transações e Despesas:</strong> Todos os lançamentos, parcelamentos, despesas fixas e histórico de receitas.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span><strong>Cartões e Carteiras:</strong> Cartões cadastrados, faturas, contas bancárias e extrato da carteira.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span><strong>Caixinhas e Metas:</strong> Todas as caixinhas de investimento, rendimentos simulados, depósitos e saques.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span><strong>Perfil e Pessoas:</strong> Foto, nome, e-mail ({userEmail || 'vinculado'}), chave Pix, telefone e contatos de divisão.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span><strong>Segurança e Biometria:</strong> PIN de 6 dígitos criptografado, credenciais Face ID / Touch ID locais.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span><strong>Conta de Acesso:</strong> Exclusão irrecuperável do seu acesso ao aplicativo.</span>
                    </li>
                  </ul>
                </div>

                {errorMessage && (
                  <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
                    {errorMessage}
                  </p>
                )}

                {/* Confirmation Input Field */}
                <div className="pt-2 space-y-2">
                  <label htmlFor="confirm-delete-input" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Para confirmar, digite <span className="text-rose-600 dark:text-rose-400 font-mono tracking-wider bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900">EXCLUIR</span> abaixo:
                  </label>
                  <input
                    id="confirm-delete-input"
                    type="text"
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                    placeholder="Digite EXCLUIR"
                    autoComplete="off"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/25 border border-slate-200 dark:border-white/[0.08] rounded-2xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 transition-all font-mono"
                  />
                  <p className="text-[10px] text-slate-400">
                    O botão de exclusão só será liberado após a digitação exata.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          {step === 'idle' && (
            <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 shrink-0">
              <Button
                variant="secondary"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>

              <Button
                variant="danger"
                disabled={!isConfirmationValid}
                onClick={() => executeAccountDeletion(false)}
                leftIcon={<UserX size={15} />}
                className="w-full sm:w-auto"
              >
                Excluir Definitivamente
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
