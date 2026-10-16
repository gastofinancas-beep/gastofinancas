import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  User, 
  Phone, 
  QrCode, 
  LogOut, 
  Check, 
  Camera, 
  Upload, 
  Sparkles, 
  Mail, 
  FileText, 
  Calendar, 
  Briefcase, 
  Trash2,
  Link as LinkIcon, 
  RefreshCw,
  ShieldCheck,
  Globe,
  Lock,
  ArrowLeft,
  Bell,
  ScanFace,
  Fingerprint,
  Smartphone,
  CreditCard as CardIcon,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  CheckCircle2,
  Clock,
  EyeOff,
  Sliders,
  Download,
  Search,
  Shield
} from 'lucide-react';
import { Button } from './Button';
import { triggerHaptic } from '../utils/haptics';

import { Person, UserProfile, CreditCard, ExpenseItem, InvestmentBox, CardBillPayment } from '../types';
import { compressImageFile } from '../utils/imageUtils';
import { EXPENSE_CATEGORIES } from '../data/categories';
import { DatePickerInput } from './DatePickerInput';
import { auth } from '../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { getDeviceBiometricLabel, unlockWithDeviceSensor, isWebAuthnAvailable } from '../utils/webauthn';
import { hashPin } from '../utils/pinSecurity';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  subscribeToPushNotifications, 
  NotificationPermissionStatus 
} from '../utils/notifications';
import { currentMonthLocal, todayLocalISO } from '../utils/dateUtils';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
  currentUser?: any;
  profile: UserProfile;
  people: Person[];
  cards?: CreditCard[];
  expenses?: ExpenseItem[];
  boxes?: InvestmentBox[];
  paidBills?: CardBillPayment[];
  currentMonth?: string;
  onSaveProfile: (updatedProfile: UserProfile, syncWithPersonMe: boolean) => void;
  onSignOut: () => void;
  onWipeData?: () => void;
  onOpenDeleteAccount?: () => void;
  onOpenLegalTerms?: () => void;
  onOpenPinSetup?: () => void;
  onOpenExport?: () => void;
}

export function ProfileModal({
  isOpen,
  onClose,
  userEmail,
  currentUser,
  profile,
  people,
  cards = [],
  expenses = [],
  boxes = [],
  paidBills = [],
  currentMonth = currentMonthLocal(),
  onSaveProfile,
  onSignOut,
  onWipeData,
  onOpenDeleteAccount,
  onOpenLegalTerms,
  onOpenPinSetup,
  onOpenExport,
}: ProfileModalProps) {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'email' | 'telefone' | 'aleatoria'>('email');
  const [photoURL, setPhotoURL] = useState('');
  const [photoSource, setPhotoSource] = useState<'google' | 'upload' | 'url' | 'preset'>('upload');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [occupation, setOccupation] = useState('');
  const [bio, setBio] = useState('');
  
  // Preferences
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifyCardBillsDue, setNotifyCardBillsDue] = useState(true);
  const [notifyCardBillsEmail, setNotifyCardBillsEmail] = useState(true);
  const [notifyInvestmentYields, setNotifyInvestmentYields] = useState(true);
  const [pushPermission, setPushPermission] = useState<NotificationPermissionStatus>(() => getNotificationPermission());
  const [pushStatusMessage, setPushStatusMessage] = useState<string | null>(null);

  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [appLockPin, setAppLockPin] = useState('');
  const [useBiometrics, setUseBiometrics] = useState(false);
  const [deviceSensorTesting, setDeviceSensorTesting] = useState(false);
  const [deviceSensorStatus, setDeviceSensorStatus] = useState<string | null>(null);
  const biometricLabel = getDeviceBiometricLabel();
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  
  // Ajustes / Preferences UI State
  const [privacyHideBalances, setPrivacyHideBalances] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gasto_balance_visible') === 'false';
    } catch {
      return false;
    }
  });
  const [hapticFeedbackEnabled, setHapticFeedbackEnabled] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('gasto_haptics_enabled');
      return v !== null ? v === 'true' : true;
    } catch {
      return true;
    }
  });
  const [isBudgetsExpanded, setIsBudgetsExpanded] = useState(false);
  const [budgetSearch, setBudgetSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  const [syncWithPersonMe, setSyncWithPersonMe] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'geral' | 'notificacoes' | 'foto' | 'pessoal' | 'prefs'>('geral');

  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(() => Boolean(auth.currentUser?.emailVerified));
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isPasswordUser = Boolean(auth.currentUser?.providerData?.some((p) => p.providerId === 'password'));

  useEffect(() => {
    if (isOpen && auth.currentUser) {
      auth.currentUser.reload().then(() => {
        setIsEmailVerified(Boolean(auth.currentUser?.emailVerified));
      }).catch((err) => {
        console.error('Falha ao recarregar status do usuário:', err);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendConfirmation = async () => {
    if (resendCooldown > 0) return;
    const user = auth.currentUser;
    if (!user) return;
    triggerHaptic(10);
    setResendStatus(null);
    try {
      await sendEmailVerification(user);
      setResendCooldown(60);
      setResendStatus({
        type: 'success',
        message: 'E-mail de confirmação enviado com sucesso! Verifique sua caixa de entrada.',
      });
    } catch (err: any) {
      if (err?.code === 'auth/too-many-requests') {
        setResendStatus({
          type: 'error',
          message: 'Aguarde alguns minutos antes de tentar de novo.',
        });
      } else {
        setResendStatus({
          type: 'error',
          message: err?.message || 'Erro ao reenviar confirmação.',
        });
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize state on open or profile change
  useEffect(() => {
    if (isOpen) {
      const authUser = auth.currentUser || currentUser;
      const gName = authUser?.displayName || authUser?.providerData?.[0]?.displayName || '';
      const gEmail = authUser?.email || authUser?.providerData?.[0]?.email || userEmail || '';
      const gPhoto = authUser?.photoURL || authUser?.providerData?.[0]?.photoURL || '';
      const gPhone = authUser?.phoneNumber || authUser?.providerData?.[0]?.phoneNumber || '';

      const isPlaceholderName = profile.name === 'Usuário Google';
      const isPlaceholderEmail = profile.email === 'usuario.google@gmail.com';

      const initialName = (!isPlaceholderName && profile.name) ? profile.name : (gName || profile.name || '');
      const initialNickname = (!isPlaceholderName && profile.nickname) ? profile.nickname : (gName || profile.nickname || '');
      const initialEmail = (!isPlaceholderEmail && profile.email) ? profile.email : (gEmail || profile.email || '');
      const initialPhoto = profile.photoURL || gPhoto || '';

      setName(initialName);
      setNickname(initialNickname);
      setEmail(initialEmail);
      setRecoveryEmail(profile.recoveryEmail || '');
      setPhone(profile.phone || gPhone || '');
      setPixKey(profile.pixKey || '');
      setPixKeyType(profile.pixKeyType || 'email');
      setPhotoURL(initialPhoto);
      setPhotoSource(profile.photoSource || (initialPhoto ? 'google' : 'upload'));
      setCpf(profile.cpf || '');
      setBirthDate(profile.birthDate || '');
      setOccupation(profile.occupation || '');
      setBio(profile.bio || '');
      
      setNotificationsEnabled(profile.notificationsEnabled || false);
      setNotifyCardBillsDue(profile.notifyCardBillsDue !== false);
      setNotifyCardBillsEmail(profile.notifyCardBillsEmail !== false);
      setNotifyInvestmentYields(profile.notifyInvestmentYields !== false);
      setPushPermission(getNotificationPermission());
      setPushStatusMessage(null);
      setAppLockEnabled(profile.appLockEnabled || false);
      setAppLockPin(profile.appLockPin || '');
      setUseBiometrics(profile.useBiometrics || false);
      setBudgets(profile.budgets || {});

      setSavedSuccess(false);
      setShowUrlInput(false);
      setPhotoError(null);
    }
  }, [isOpen, profile, currentUser, userEmail]);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  // Handle Photo File Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setPhotoError(null);
    try {
      const compressedDataUrl = await compressImageFile(file, 400, 400, 0.85);
      setPhotoURL(compressedDataUrl);
      setPhotoSource('upload');
    } catch (err: any) {
      setPhotoError(err.message || 'Erro ao processar imagem.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Pull Photo and Data from Google
  const handlePullFromGoogle = () => {
    const authUser = auth.currentUser || currentUser;
    if (authUser) {
      const gName = authUser.displayName || authUser.providerData?.[0]?.displayName;
      const gEmail = authUser.email || authUser.providerData?.[0]?.email;
      const gPhoto = authUser.photoURL || authUser.providerData?.[0]?.photoURL;
      const gPhone = authUser.phoneNumber || authUser.providerData?.[0]?.phoneNumber;

      let updated = false;
      if (gPhoto) {
        setPhotoURL(gPhoto);
        setPhotoSource('google');
        updated = true;
      }
      if (gName) {
        setName(gName);
        setNickname(gName);
        updated = true;
      }
      if (gEmail) {
        setEmail(gEmail);
        updated = true;
      }
      if (gPhone) {
        setPhone(gPhone);
        updated = true;
      }

      if (updated) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 1800);
      }
    }
  };

  // Apply custom URL
  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    setPhotoURL(customUrl.trim());
    setPhotoSource('url');
    setShowUrlInput(false);
    setCustomUrl('');
  };

  // Remove Photo
  const handleRemovePhoto = () => {
    setPhotoURL('');
    setPhotoSource('upload');
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile: UserProfile = {
      name: name.trim() || undefined,
      nickname: nickname.trim() || undefined,
      email: email.trim() || undefined,
      recoveryEmail: recoveryEmail.trim() || undefined,
      phone: phone.trim() || undefined,
      pixKey: pixKey.trim() || undefined,
      pixKeyType,
      photoURL: photoURL.trim() || undefined,
      photoSource,
      cpf: cpf.trim() || undefined,
      birthDate: birthDate.trim() || undefined,
      occupation: occupation.trim() || undefined,
      bio: bio.trim() || undefined,
      
      notificationsEnabled,
      notifyCardBillsDue,
      notifyCardBillsEmail,
      notifyInvestmentYields,
      appLockEnabled,
      appLockPin,
      useBiometrics,
      biometricCredentialRegistered: useBiometrics,
      biometricRegisteredAt: useBiometrics ? (profile.biometricRegisteredAt || new Date().toISOString()) : undefined,
      webauthnCredentialId: profile.webauthnCredentialId,
      budgets,

      updatedAt: new Date().toISOString(),
    };

    onSaveProfile(updatedProfile, syncWithPersonMe);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleToggleNotifications = async (checked: boolean) => {
    if (!checked) {
      setNotificationsEnabled(false);
      setPushStatusMessage(null);
      const updated: UserProfile = {
        ...profile,
        notificationsEnabled: false,
        notifyCardBillsDue,
        notifyInvestmentYields,
        updatedAt: new Date().toISOString(),
      };
      onSaveProfile(updated, false);
      return;
    }

    // Request native push permission
    const perm = await requestNotificationPermission();
    setPushPermission(perm);

    if (perm === 'granted') {
      setNotificationsEnabled(true);
      setPushStatusMessage('Notificações Push ativadas com sucesso neste dispositivo!');
      subscribeToPushNotifications().catch(() => {});
      const updated: UserProfile = {
        ...profile,
        notificationsEnabled: true,
        notifyCardBillsDue,
        notifyInvestmentYields,
        updatedAt: new Date().toISOString(),
      };
      onSaveProfile(updated, false);
      setTimeout(() => setPushStatusMessage(null), 4500);
    } else if (perm === 'denied') {
      setNotificationsEnabled(false);
      setPushStatusMessage('Permissão bloqueada no navegador. Habilite o envio de notificações nas configurações do seu site.');
    } else {
      setNotificationsEnabled(false);
      setPushStatusMessage('Permissão de notificações não concedida.');
    }
  };

  const handleToggleCardBills = async (checked: boolean) => {
    setNotifyCardBillsDue(checked);
    // If turning on and master push is off, try to request/enable push as well
    let willEnablePush = notificationsEnabled;
    if (checked && !notificationsEnabled) {
      const perm = await requestNotificationPermission();
      setPushPermission(perm);
      if (perm === 'granted') {
        setNotificationsEnabled(true);
        willEnablePush = true;
        subscribeToPushNotifications().catch(() => {});
      }
    }
    const updated: UserProfile = {
      ...profile,
      notificationsEnabled: willEnablePush,
      notifyCardBillsDue: checked,
      notifyInvestmentYields,
      updatedAt: new Date().toISOString(),
    };
    onSaveProfile(updated, false);
  };

  const handleToggleYields = async (checked: boolean) => {
    setNotifyInvestmentYields(checked);
    // If turning on and master push is off, try to request/enable push as well
    let willEnablePush = notificationsEnabled;
    if (checked && !notificationsEnabled) {
      const perm = await requestNotificationPermission();
      setPushPermission(perm);
      if (perm === 'granted') {
        setNotificationsEnabled(true);
        willEnablePush = true;
        subscribeToPushNotifications().catch(() => {});
      }
    }
    const updated: UserProfile = {
      ...profile,
      notificationsEnabled: willEnablePush,
      notifyCardBillsDue,
      notifyInvestmentYields: checked,
      updatedAt: new Date().toISOString(),
    };
    onSaveProfile(updated, false);
  };

  const handleToggleCardBillsEmail = (checked: boolean) => {
    setNotifyCardBillsEmail(checked);
    const updated: UserProfile = {
      ...profile,
      recoveryEmail: recoveryEmail.trim() || undefined,
      notifyCardBillsEmail: checked,
      updatedAt: new Date().toISOString(),
    };
    onSaveProfile(updated, false);
  };

  const handleToggleDeviceBiometrics = async (checked: boolean) => {
    triggerHaptic(10);
    if (!checked) {
      setUseBiometrics(false);
      setDeviceSensorStatus('Desbloqueio biométrico desativado.');
      const shouldKeepAppLock = Boolean(appLockPin && appLockPin.trim());
      if (!shouldKeepAppLock) {
        setAppLockEnabled(false);
      }
      const updated: UserProfile = {
        ...profile,
        useBiometrics: false,
        biometricCredentialRegistered: false,
        appLockEnabled: shouldKeepAppLock,
      };
      await onSaveProfile(updated, false);
      return;
    }

    // Activating: Prompt native device Face ID / Touch / PIN immediately
    setDeviceSensorTesting(true);
    setDeviceSensorStatus(`Aguardando confirmação do seu celular (${biometricLabel.short})...`);
    try {
      const result = await unlockWithDeviceSensor({
        userEmail: email || profile.email || '',
        userId: email || profile.email || '',
        userName: nickname || name || 'Usuário Gastô',
        registeredCredentialId: profile.webauthnCredentialId,
        isEnrollment: true,
      });

      if (result.success) {
        triggerHaptic(20);
        setUseBiometrics(true);
        setAppLockEnabled(true);
        const updated: UserProfile = {
          ...profile,
          useBiometrics: true,
          appLockEnabled: true,
          biometricCredentialRegistered: true,
          biometricRegisteredAt: new Date().toISOString(),
          webauthnCredentialId: result.newCredentialId || profile.webauthnCredentialId,
        };
        await onSaveProfile(updated, false);
        setDeviceSensorStatus(`Ativado com sucesso! Protegido pelo ${biometricLabel.name}.`);
      } else if (result.cancelled) {
        setUseBiometrics(false);
        setDeviceSensorStatus('Ativação cancelada no celular.');
      } else {
        setUseBiometrics(false);
        setDeviceSensorStatus(result.error || 'Não foi possível validar o sensor do aparelho.');
      }
    } catch {
      setUseBiometrics(false);
      setDeviceSensorStatus('Erro ao comunicar com o sensor do celular.');
    } finally {
      setDeviceSensorTesting(false);
    }
  };

  const handleTogglePrivacyHideBalances = (hide: boolean) => {
    setPrivacyHideBalances(hide);
    triggerHaptic(10);
    try {
      localStorage.setItem('gasto_balance_visible', String(!hide));
      window.dispatchEvent(new Event('storage'));
    } catch {
      // ignore
    }
  };

  const handleToggleHaptic = (enabled: boolean) => {
    setHapticFeedbackEnabled(enabled);
    try {
      localStorage.setItem('gasto_haptics_enabled', String(enabled));
      if (enabled) {
        triggerHaptic(15);
      }
    } catch {
      // ignore
    }
  };

  const handleDownloadJsonBackup = () => {
    try {
      triggerHaptic(10);
      const backupData = {
        appName: 'Gastô? Controle Inteligente de Finanças',
        exportedAt: new Date().toISOString(),
        user: {
          name: name || profile.name || 'Usuário',
          email: email || profile.email || '',
        },
        profile,
        cards,
        expenses,
        boxes,
        paidBills,
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gasto-backup-${todayLocalISO()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSyncSuccessMessage('Backup JSON gerado e baixado com sucesso!');
      setTimeout(() => setSyncSuccessMessage(null), 3500);
    } catch {
      setSyncSuccessMessage('Erro ao gerar arquivo de backup.');
      setTimeout(() => setSyncSuccessMessage(null), 3500);
    }
  };

  const handleSyncAndRefresh = async () => {
    setIsSyncing(true);
    triggerHaptic(10);
    try {
      window.dispatchEvent(new CustomEvent('gasto_refresh_data'));
      await new Promise(r => setTimeout(r, 650));
      setSyncSuccessMessage('Dados sincronizados com sucesso!');
    } catch {
      setSyncSuccessMessage('Sincronização concluída.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncSuccessMessage(null), 3500);
    }
  };

  const hasGoogleAccount = Boolean(currentUser?.photoURL || currentUser?.email?.includes('@gmail.com') || currentUser?.providerData?.some((p: any) => p.providerId === 'google.com'));

  return createPortal(
    <div 
      className="fixed inset-0 z-[200] bg-slate-100 dark:bg-[#09090B] overflow-y-auto flex flex-col w-full h-[100dvh] text-slate-900 dark:text-slate-100"
    >
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.08] px-3.5 sm:px-6 py-3 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
            title="Voltar"
          >
            <ArrowLeft size={17} className="stroke-[2.5]" />
          </button>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 truncate">
              <User size={17} className="text-emerald-600 shrink-0" />
              <span className="truncate">Meu Perfil</span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              Dados pessoais e preferências
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.04] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-1"
          title="Fechar"
        >
          <X size={18} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 pb-36 space-y-5">
        
        {/* Navigation Tabs - 5-column balanced grid */}
        <div className="bg-slate-200/60 dark:bg-[#1C1C1E]/90 p-1 rounded-2xl grid grid-cols-5 gap-1 border border-slate-200/60 dark:border-white/[0.08]/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('geral')}
            className={`py-2 px-0.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeSubTab === 'geral'
                ? 'bg-white dark:bg-[#2C2C2E] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User size={14} className="shrink-0" />
            <span className="truncate">Perfil</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('notificacoes')}
            className={`py-2 px-0.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeSubTab === 'notificacoes'
                ? 'bg-white dark:bg-[#2C2C2E] text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Bell size={14} className="shrink-0" />
              {notificationsEnabled && (
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </div>
            <span className="truncate">Avisos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('foto')}
            className={`py-2 px-0.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeSubTab === 'foto'
                ? 'bg-white dark:bg-[#2C2C2E] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera size={14} className="shrink-0" />
            <span className="truncate">Foto</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('pessoal')}
            className={`py-2 px-0.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeSubTab === 'pessoal'
                ? 'bg-white dark:bg-[#2C2C2E] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText size={14} className="shrink-0" />
            <span className="truncate">Extras</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('prefs')}
            className={`py-2 px-0.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
              activeSubTab === 'prefs'
                ? 'bg-white dark:bg-[#2C2C2E] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders size={14} className="shrink-0" />
            <span className="truncate">Ajustes</span>
          </button>
        </div>

        {/* Form Container */}
        <form id="profile-form" onSubmit={handleSubmit} className="space-y-5">
          
          {/* ========================================================= */}
          {/* TAB 1: IDENTIFICAÇÃO E DADOS PRINCIPAIS                   */}
          {/* ========================================================= */}
          {activeSubTab === 'geral' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Profile Card Preview Banner */}
              <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.08] shadow-xs flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#2C2C2E] text-slate-800 dark:text-slate-200 border-2 border-white dark:border-white/[0.10] shadow-sm flex items-center justify-center font-bold text-lg shrink-0">
                    {photoURL ? (
                      <img 
                        src={photoURL} 
                        alt={nickname || name || 'Foto'} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      (nickname || name || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {name || nickname || 'Seu Nome'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {email || userEmail || 'Sem e-mail informado'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('foto')}
                  className="px-3 py-2 bg-slate-50 dark:bg-[#2C2C2E] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.10] rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-95"
                >
                  <Camera size={13} />
                  <span>Trocar</span>
                </button>
              </div>

              {/* Identity Form Fields */}
              <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
                
                {/* Nome Completo */}
                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5 text-xs sm:text-sm">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Pedro Otávio da Silva"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] rounded-2xl text-slate-900 dark:text-white text-[16px] sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder:text-slate-400"
                  />
                </div>

                {/* Apelido no App */}
                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5 text-xs sm:text-sm">
                    Como quer ser chamado(a)? (Apelido no App)
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Ex: Pedro, Mari, Dudu..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] rounded-2xl text-slate-900 dark:text-white text-[16px] sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder:text-slate-400"
                  />
                </div>

                {/* E-mail */}
                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5 text-xs sm:text-sm flex items-center gap-1.5">
                    <Mail size={15} className="text-slate-400" />
                    E-mail de Contato
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu-email@gmail.com"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] rounded-2xl text-slate-900 dark:text-white text-[16px] sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder:text-slate-400"
                  />
                  {isPasswordUser && !isEmailVerified && (
                    <div className="mt-2 p-2.5 sm:p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 flex items-center justify-between gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertCircle size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
                        <span className="truncate">E-mail não confirmado</span>
                      </div>
                      <button
                        type="button"
                        disabled={resendCooldown > 0}
                        onClick={handleResendConfirmation}
                        className="shrink-0 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : 'Reenviar confirmação'}
                      </button>
                    </div>
                  )}
                  {resendStatus && (
                    <div
                      className={`mt-1.5 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                        resendStatus.type === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200'
                          : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-200'
                      }`}
                    >
                      {resendStatus.type === 'success' ? (
                        <CheckCircle2 size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertCircle size={15} className="shrink-0 text-rose-600 dark:text-rose-400" />
                      )}
                      <span className="leading-tight">{resendStatus.message}</span>
                    </div>
                  )}
                </div>

                {/* E-mail de Recuperação & Notificações de Faturas */}
                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5 text-xs sm:text-sm flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
                    E-mail de Recuperação & Avisos de Faturas
                  </label>
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="recuperacao@email.com"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] rounded-2xl text-slate-900 dark:text-white text-[16px] sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder:text-slate-400"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Cadastre um e-mail alternativo seguro para receber notificações de <strong>faturas a vencer</strong> e recuperação de acesso.
                  </p>
                </div>

                {/* Chave Pix para Recebimento */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm flex items-center gap-1.5">
                      <QrCode size={15} className="text-emerald-500" />
                      Sua Chave Pix para Recebimentos
                    </label>
                    <div className="flex items-center gap-1">
                      {(['cpf', 'email', 'telefone', 'aleatoria'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setPixKeyType(t)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                            pixKeyType === t
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {t === 'aleatoria' ? 'Chave' : t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder={
                      pixKeyType === 'cpf' ? '000.000.000-00' :
                      pixKeyType === 'telefone' ? '(11) 99999-9999' :
                      pixKeyType === 'email' ? 'seu-pix@email.com' : 'Chave aleatória'
                    }
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] rounded-2xl text-slate-900 dark:text-white text-[16px] sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder:text-slate-400"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Esta chave é incluída automaticamente ao enviar mensagens de cobrança para amigos.
                  </p>
                </div>

                {/* WhatsApp / Telefone */}
                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5 text-xs sm:text-sm flex items-center gap-1.5">
                    <Phone size={15} className="text-blue-500" />
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] rounded-2xl text-slate-900 dark:text-white text-[16px] sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder:text-slate-400"
                  />
                </div>

                {/* Sync with Person Me Checkbox */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E]/60 border border-slate-200/70 dark:border-white/[0.10]/60">
                  <input
                    type="checkbox"
                    id="syncPersonMe"
                    checked={syncWithPersonMe}
                    onChange={(e) => setSyncWithPersonMe(e.target.checked)}
                    className="mt-1 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="syncPersonMe" className="text-xs text-slate-600 dark:text-slate-300 select-none cursor-pointer leading-relaxed">
                    <strong className="block text-slate-900 dark:text-white font-semibold">
                      Sincronizar com a aba de Divisão ("Titular / Você")
                    </strong>
                    Atualiza automaticamente seu nome, foto e chave Pix nos rateios de cartão.
                  </label>
                </div>
              </div>

              {/* Painel de Lembretes & Notificações Push Rápidas */}
              <div className="bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Bell size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        Lembretes & Notificações Push
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Ative avisos de vencimentos e rendimentos no seu celular
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveSubTab('notificacoes')}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Ver Tudo
                  </button>
                </div>

                {/* Opção 1: Faturas Vencendo */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#252527] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <CardIcon size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-xs text-slate-800 dark:text-white">
                          Faturas Vencendo
                        </p>
                        <span className={`text-[9px] font-bold px-1 rounded ${notifyCardBillsDue ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-slate-200 text-slate-600 dark:bg-white/[0.06] dark:text-slate-400'}`}>
                          {notifyCardBillsDue ? 'Ativado' : 'Desativado'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        Avisos 3 dias antes, na véspera e no vencimento
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifyCardBillsDue}
                      onChange={(e) => handleToggleCardBills(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-[#3A3A3C] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-white/[0.12] peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {/* Opção 2: Rendimentos das Caixinhas */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#252527] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <TrendingUp size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-xs text-slate-800 dark:text-white">
                          Rendimentos das Caixinhas
                        </p>
                        <span className={`text-[9px] font-bold px-1 rounded ${notifyInvestmentYields ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-white/[0.06] dark:text-slate-400'}`}>
                          {notifyInvestmentYields ? 'Ativado' : 'Desativado'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        Avisos de juros compostos e rendimento estimado
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifyInvestmentYields}
                      onChange={(e) => handleToggleYields(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-[#3A3A3C] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-white/[0.12] peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: PAINEL DEDICADO DE NOTIFICAÇÕES PUSH                  */}
          {/* ========================================================= */}
          {activeSubTab === 'notificacoes' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Push Notifications API & Alertas Inteligentes */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-4">
                {/* Header Principal */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
                      <Bell size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                          Notificações Push
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Receba lembretes de faturas e rendimentos direto no seu celular (Android / iOS).
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notificationsEnabled}
                      onChange={(e) => handleToggleNotifications(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-[#3A3A3C] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-white/[0.12] peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Status da Permissão no Navegador */}
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#2C2C2E]/60 text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Permissão no Aparelho:</span>
                  {pushPermission === 'granted' && (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Permitido e Ativo
                    </span>
                  )}
                  {pushPermission === 'denied' && (
                    <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertCircle size={13} />
                      Bloqueado no navegador
                    </span>
                  )}
                  {pushPermission === 'default' && (
                    <button
                      type="button"
                      onClick={() => handleToggleNotifications(true)}
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles size={12} />
                      Autorizar Permissão
                    </button>
                  )}
                  {pushPermission === 'unsupported' && (
                    <span className="text-slate-500">Não suportado neste navegador</span>
                  )}
                </div>

                {/* Feedback Toast / Status Message */}
                {pushStatusMessage && (
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5 animate-in fade-in">
                    <Sparkles size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="flex-1 leading-relaxed">{pushStatusMessage}</p>
                  </div>
                )}

                {/* Painel com as Duas Categorias Separadas */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] space-y-3.5">
                  
                  {/* 1. Lembretes de Faturas Vencendo */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#252527] border border-slate-200/70 dark:border-white/[0.06] space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <CardIcon size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">
                              Faturas Próximas a Vencer
                            </h4>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${notifyCardBillsDue ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-slate-200 text-slate-600 dark:bg-white/[0.06] dark:text-slate-400'}`}>
                              {notifyCardBillsDue ? 'Ativado' : 'Desativado'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                            Lembretes automáticos 3 dias antes, na véspera e no dia do vencimento da fatura.
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notifyCardBillsDue}
                          onChange={(e) => handleToggleCardBills(e.target.checked)}
                        />
                        <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-[#3A3A3C] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all dark:border-white/[0.12] peer-checked:bg-amber-600"></div>
                      </label>
                    </div>

                    <div className="pt-1 border-t border-slate-200/50 dark:border-white/[0.04]">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {cards.length} {cards.length === 1 ? 'cartão monitorado' : 'cartões monitorados'}
                      </span>
                    </div>
                  </div>

                  {/* 2. Avisos de Rendimentos nas Caixinhas */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#252527] border border-slate-200/70 dark:border-white/[0.06] space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <TrendingUp size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">
                              Rendimentos das Caixinhas
                            </h4>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${notifyInvestmentYields ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-white/[0.06] dark:text-slate-400'}`}>
                              {notifyInvestmentYields ? 'Ativado' : 'Desativado'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                            Resumo de quanto suas reservas renderam no mês e destaques de rentabilidade.
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notifyInvestmentYields}
                          onChange={(e) => handleToggleYields(e.target.checked)}
                        />
                        <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-[#3A3A3C] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all dark:border-white/[0.12] peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <div className="pt-1 border-t border-slate-200/50 dark:border-white/[0.04]">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {boxes.length} {boxes.length === 1 ? 'caixinha ativa' : 'caixinhas ativas'}
                      </span>
                    </div>
                  </div>

                  {/* 3. Notificações de Faturas por E-mail */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#252527] border border-slate-200/70 dark:border-white/[0.06] space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Mail size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">
                              Notificações de Faturas por E-mail
                            </h4>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${notifyCardBillsEmail ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' : 'bg-slate-200 text-slate-600 dark:bg-white/[0.06] dark:text-slate-400'}`}>
                              {notifyCardBillsEmail ? 'Ativado' : 'Desativado'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                            Receba lembretes de vencimento diretamente no seu e-mail de recuperação.
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={notifyCardBillsEmail}
                          onChange={(e) => handleToggleCardBillsEmail(e.target.checked)}
                        />
                        <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-[#3A3A3C] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all dark:border-white/[0.12] peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="pt-2 border-t border-slate-200/50 dark:border-white/[0.04]">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 min-w-0">
                        <span className="shrink-0 font-medium">Destino:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                          {recoveryEmail || email || 'Nenhum e-mail configurado'}
                        </span>
                      </div>
                      {isPasswordUser && !isEmailVerified && (
                        <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-white/[0.04] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 min-w-0">
                            <AlertCircle size={13} className="shrink-0" />
                            <span className="truncate">E-mail não confirmado</span>
                          </div>
                          <button
                            type="button"
                            disabled={resendCooldown > 0}
                            onClick={handleResendConfirmation}
                            className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shrink-0"
                          >
                            {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : 'Reenviar confirmação'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: GERENCIAMENTO DE FOTO DE PERFIL                   */}
          {/* ========================================================= */}
          {activeSubTab === 'foto' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Active Avatar View & Actions */}
              <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.08] text-center shadow-xs">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-100 dark:bg-[#2C2C2E] text-slate-800 dark:text-slate-200 border-4 border-white dark:border-white/[0.10] shadow-md flex items-center justify-center font-bold text-4xl">
                    {photoURL ? (
                      <img 
                        src={photoURL} 
                        alt={nickname || name || 'Foto de Perfil'} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      (nickname || name || 'U').charAt(0).toUpperCase()
                    )}
                  </div>

                  {photoURL && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      title="Remover foto"
                      className="absolute -top-1 -right-1 p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md transition-all active:scale-90 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="mt-4">
                  <p className="font-bold text-base text-slate-900 dark:text-white">
                    {photoURL ? 'Foto de Perfil Ativa' : 'Nenhuma foto personalizada'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {photoSource === 'google' ? 'Foto sincronizada da Conta Google' : 
                     photoSource === 'upload' ? 'Foto enviada do seu aparelho' : 
                     photoSource === 'preset' ? 'Avatar estilizado selecionado' : 'Usando inicial do seu nome'}
                  </p>
                </div>

                {photoError && (
                  <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                    {photoError}
                  </p>
                )}

                {/* Upload Buttons */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* 1. Escolher do Aparelho */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-full text-xs font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Upload size={15} />
                    <span>{isUploadingPhoto ? 'Processando...' : 'Carregar do Aparelho'}</span>
                  </button>

                  {/* 2. Inserir Link */}
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <LinkIcon size={14} />
                    <span>Inserir Link</span>
                  </button>
                </div>
              </div>

              {/* Custom Image URL input */}
              {showUrlInput && (
                <div className="p-4 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.08] space-y-2.5 shadow-xs animate-in fade-in duration-150">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    URL da Imagem na Web
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://exemplo.com/minha-foto.jpg"
                      className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white text-[16px] sm:text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl text-xs cursor-pointer active:scale-95 transition-all"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: DADOS EXTRAS & NOTA PESSOAL                        */}
          {/* ========================================================= */}
          {activeSubTab === 'pessoal' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-4">
                
                {/* CPF / Documento */}
                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5 text-xs sm:text-sm flex items-center gap-1.5">
                    <FileText size={15} className="text-slate-400" />
                    CPF ou Documento (Opcional)
                  </label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] rounded-2xl text-slate-900 dark:text-white text-[16px] sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder:text-slate-400"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Útil para identificação em relatórios e extratos gerados em PDF.
                  </p>
                </div>

                {/* Data de Nascimento */}
                <div>
                  <DatePickerInput
                    label="Data de Nascimento"
                    value={birthDate}
                    onChange={(newDate) => setBirthDate(newDate)}
                    inputClassName="!px-4 !py-3 !rounded-2xl !text-[16px] sm:!text-sm"
                  />
                </div>

                {/* Profissão / Ocupação */}
                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5 text-xs sm:text-sm flex items-center gap-1.5">
                    <Briefcase size={15} className="text-slate-400" />
                    Profissão ou Ocupação Principal
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="Ex: Motorista Uber, Engenheiro, Autônomo, Estudante..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] rounded-2xl text-slate-900 dark:text-white text-[16px] sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium placeholder:text-slate-400"
                  />
                </div>

                {/* Meta Financeira / Frase de Foco */}
                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5 text-xs sm:text-sm flex items-center gap-1.5">
                    <Sparkles size={15} className="text-amber-500" />
                    Meta Financeira ou Frase de Foco
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Ex: 'Quero juntar R$ 15.000 para a caixinha de reserva até o final do ano.'"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] rounded-2xl text-slate-900 dark:text-white text-[16px] sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-all font-medium placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: AJUSTES & PREFERÊNCIAS (PROFISSIONAL & CLEAN)      */}
          {/* ========================================================= */}
          {activeSubTab === 'prefs' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Header de Resumo */}
              <div className="px-4 py-3 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Sliders size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Preferências do Aplicativo
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Segurança, limites de orçamento e experiência de uso
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <ShieldCheck size={12} />
                  <span>Protegido</span>
                </div>
              </div>

              {/* SEÇÃO 1: SEGURANÇA E ACESSO */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-1 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Segurança & Acesso</h4>
                    <p className="text-[11px] text-slate-400">Proteja a abertura das suas finanças com o bloqueio do seu celular</p>
                  </div>
                </div>

                {/* Biometria / Face ID / Touch do Aparelho */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        useBiometrics 
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                          : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400'
                      }`}>
                        {biometricLabel.hasFace ? (
                          <ScanFace size={19} className="stroke-[2.2]" />
                        ) : (
                          <Fingerprint size={19} className="stroke-[2.2]" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {biometricLabel.name}
                          </span>
                          {useBiometrics ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              Ativo no Aparelho
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400">
                              Desativado
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          {biometricLabel.description}
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input 
                        type="checkbox" 
                        checked={useBiometrics} 
                        disabled={deviceSensorTesting}
                        onChange={(e) => handleToggleDeviceBiometrics(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Feedback de status ou validação em andamento */}
                  {deviceSensorTesting && (
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 animate-pulse">
                      <RefreshCw size={14} className="animate-spin text-emerald-500 shrink-0" />
                      <span>{deviceSensorStatus || 'Aguardando confirmação no seu aparelho...'}</span>
                    </div>
                  )}

                  {deviceSensorStatus && !deviceSensorTesting && (
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <Check size={14} className="text-emerald-500 shrink-0" />
                      <span>{deviceSensorStatus}</span>
                    </div>
                  )}
                </div>

                <div className="h-px bg-slate-100 dark:bg-white/[0.06]" />

                {/* Bloqueio por PIN Alternativo (Opcional) */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Lock size={17} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            Código PIN de 6 Dígitos
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            (Opcional)
                          </span>
                          {appLockEnabled && Boolean(appLockPin) && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Ativo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Crie um PIN alternativo caso prefira digitar código numérico em vez da biometria.
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input 
                        type="checkbox" 
                        checked={appLockEnabled && Boolean(appLockPin)} 
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAppLockEnabled(checked);
                          triggerHaptic(8);
                          if (checked && !appLockPin && onOpenPinSetup) {
                            onOpenPinSetup();
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {appLockEnabled && (
                    <div className="pt-2 pl-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {onOpenPinSetup ? (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenPinSetup();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                          >
                            <Lock size={12} />
                            <span>{appLockPin ? 'Alterar PIN Cadastrado' : 'Definir PIN de 6 Dígitos'}</span>
                          </button>
                        ) : null}

                        <span className="text-[11px] text-slate-400 font-mono">
                          {appLockPin ? '•••••• PIN Configurado' : 'Nenhum PIN definido ainda'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SEÇÃO 2: PRIVACIDADE & EXPERIÊNCIA DE USO */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-1 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <EyeOff size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Privacidade & Visualização</h4>
                    <p className="text-[11px] text-slate-400">Personalize a discrição e a resposta do app</p>
                  </div>
                </div>

                {/* Ocultar Saldos ao Iniciar */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      <EyeOff size={17} />
                    </div>
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        Ocultar Saldos ao Iniciar
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Inicia o app com os valores em '••••••' para proteger suas finanças de olhares em público.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input 
                      type="checkbox" 
                      checked={privacyHideBalances} 
                      onChange={(e) => handleTogglePrivacyHideBalances(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="h-px bg-slate-100 dark:bg-white/[0.06]" />

                {/* Resposta Tátil (Vibração Háptica) */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Smartphone size={17} />
                    </div>
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        Feedback Háptico (Vibração)
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Vibração tátil sutil ao pressionar botões e registrar lançamentos.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input 
                      type="checkbox" 
                      checked={hapticFeedbackEnabled} 
                      onChange={(e) => handleToggleHaptic(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="h-px bg-slate-100 dark:bg-white/[0.06]" />

                {/* Moeda e Região */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <Globe size={17} />
                    </div>
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        Moeda & Região
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Padrão financeiro brasileiro
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.06] px-2.5 py-1 rounded-lg">
                    Real Brasileiro (R$ · BRL)
                  </span>
                </div>
              </div>

              {/* SEÇÃO 3: TETOS DE GASTOS & ORÇAMENTO (COLAPSÁVEL & LIMPO) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-3.5">
                <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Tetos de Gastos por Categoria</h4>
                      <p className="text-[11px] text-slate-400">Controle de limites mensais com alertas automáticos em 80%</p>
                    </div>
                  </div>
                  
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 whitespace-nowrap">
                    {Object.values(budgets).filter(v => Number(v) > 0).length} tetos ativos
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200/70 dark:border-white/[0.06]">
                  <div className="text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Total mensal planejado: </span>
                    <strong className="text-slate-900 dark:text-white font-bold">
                      {Object.values(budgets).reduce((acc, v) => acc + (Number(v) || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBudgetsExpanded(!isBudgetsExpanded)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/[0.08] text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    <span>{isBudgetsExpanded ? 'Recolher' : 'Ajustar Limites'}</span>
                    {isBudgetsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {isBudgetsExpanded && (
                  <div className="space-y-3 pt-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        value={budgetSearch}
                        onChange={(e) => setBudgetSearch(e.target.value)}
                        placeholder="Buscar categoria para definir limite..."
                        className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#151516] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>

                    <div className="max-h-64 overflow-y-auto pr-1 space-y-1.5 divide-y divide-slate-100 dark:divide-white/[0.04]">
                      {EXPENSE_CATEGORIES
                        .filter(cat => !budgetSearch.trim() || cat.label.toLowerCase().includes(budgetSearch.toLowerCase()))
                        .map((cat) => {
                          const Icon = cat.icon;
                          const currentVal = budgets[cat.id] || '';
                          return (
                            <div key={cat.id} className="pt-1.5 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div 
                                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                                >
                                  <Icon size={14} />
                                </div>
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                  {cat.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-xs font-bold text-slate-400">R$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="50"
                                  placeholder="0,00"
                                  value={currentVal}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                    setBudgets(prev => ({
                                      ...prev,
                                      [cat.id]: isNaN(val) ? 0 : val
                                    }));
                                  }}
                                  className="w-24 px-2 py-1 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.08] rounded-lg text-xs outline-none focus:ring-1 focus:ring-amber-500 text-right font-bold text-slate-900 dark:text-white"
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                      <span>Valores em zero não terão teto.</span>
                      {Object.values(budgets).some(v => Number(v) > 0) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Deseja zerar todos os tetos de categorias?')) {
                              setBudgets({});
                              triggerHaptic(12);
                            }
                          }}
                          className="text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                        >
                          Zerar todos os tetos
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SEÇÃO 4: CENTRAL DE AVISOS E NOTIFICAÇÕES (ATALHO RÁPIDO) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Bell size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Lembretes & Notificações</h4>
                      <p className="text-[11px] text-slate-400">Push no navegador e avisos de faturas a vencer</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    pushPermission === 'granted' 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400 border-slate-200 dark:border-white/[0.08]'
                  }`}>
                    {pushPermission === 'granted' ? 'Permissão Ativa' : 'Pendente'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200/70 dark:border-white/[0.06] gap-2">
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {notifyCardBillsDue ? 'Lembretes de faturas ativados' : 'Lembretes desativados'} · {notifyInvestmentYields ? 'Avisos de caixinhas ativos' : 'Caixinhas silenciadas'}
                  </p>
                  
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setActiveSubTab('notificacoes');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 text-xs font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                  >
                    <span>Gerenciar na Aba Avisos</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>

              {/* SEÇÃO 5: DADOS, BACKUP E MANUTENÇÃO */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-3">
                <div className="flex items-center gap-2.5 pb-1 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="w-7 h-7 rounded-lg bg-slate-500/10 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                    <RefreshCw size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Dados, Backup & Manutenção</h4>
                    <p className="text-[11px] text-slate-400">Exporte seus registros e force a sincronização com a nuvem</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Exportar JSON */}
                  <button
                    type="button"
                    onClick={handleDownloadJsonBackup}
                    className="p-3 bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-2xl flex items-center gap-3 transition-all text-left cursor-pointer group shadow-2xs"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Download size={18} />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">
                        Backup Completo (JSON)
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        Baixar cópia segura de todos os dados
                      </span>
                    </div>
                  </button>

                  {/* Relatórios ExportModal (se disponível) */}
                  {onOpenExport ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenExport();
                      }}
                      className="p-3 bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-2xl flex items-center gap-3 transition-all text-left cursor-pointer group shadow-2xs"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FileText size={18} />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white block">
                          Exportar Relatórios
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          Gerar PDF, CSV ou Impressão
                        </span>
                      </div>
                    </button>
                  ) : (
                    /* Sincronizar & Atualizar */
                    <button
                      type="button"
                      onClick={handleSyncAndRefresh}
                      disabled={isSyncing}
                      className="p-3 bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-2xl flex items-center gap-3 transition-all text-left cursor-pointer group shadow-2xs"
                    >
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white block">
                          {isSyncing ? 'Sincronizando...' : 'Sincronizar dados'}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          Buscar as informações mais recentes
                        </span>
                      </div>
                    </button>
                  )}
                </div>

                {onOpenExport && (
                  <button
                    type="button"
                    onClick={handleSyncAndRefresh}
                    disabled={isSyncing}
                    className="w-full p-2.5 bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    <RefreshCw size={14} className={isSyncing ? 'animate-spin text-emerald-500' : 'text-slate-400'} />
                    <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar dados'}</span>
                  </button>
                )}

                {syncSuccessMessage && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                    <span>{syncSuccessMessage}</span>
                  </div>
                )}
              </div>

              {/* SEÇÃO 6: CONTA, TERMOS & SESSÃO */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-3">
                <div className="flex items-center gap-2.5 pb-1 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="w-7 h-7 rounded-lg bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
                    <Shield size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Termos & Sessão</h4>
                    <p className="text-[11px] text-slate-400">Políticas legais e controle de acesso da sua conta</p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  {onOpenLegalTerms && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenLegalTerms();
                      }}
                      className="w-full p-3 bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between transition-all cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                        <span>Termos de Uso & Políticas de Privacidade (LGPD)</span>
                      </div>
                      <ExternalLink size={14} className="text-slate-400" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onSignOut}
                    className="w-full p-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.08] rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
                  >
                    <LogOut size={15} className="shrink-0 text-slate-500" />
                    <span>Encerrar Sessão (Sair da Conta)</span>
                  </button>

                  {onOpenDeleteAccount && (
                    <div className="pt-1 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenDeleteAccount();
                        }}
                        className="w-full py-2 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 size={13} className="shrink-0 opacity-70" />
                        <span>Excluir minha conta e dados definitivamente</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </form>

        {/* Account Management & Legal Section (For other tabs) */}
        {activeSubTab !== 'prefs' && (
          <div className="pt-3 space-y-2.5 border-t border-slate-200/60 dark:border-white/[0.08]">
            {onOpenLegalTerms && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLegalTerms();
                }}
                className="w-full p-3.5 bg-white dark:bg-[#1C1C1E] hover:bg-slate-50 dark:hover:bg-white/[0.04]/80 border border-slate-200 dark:border-white/[0.08] rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                  <span>Termos de Uso & Políticas de Privacidade</span>
                </div>
                <span className="text-xs font-medium text-slate-400">Ver</span>
              </button>
            )}

            <button
              type="button"
              onClick={onSignOut}
              className="w-full p-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.08] rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
            >
              <LogOut size={15} className="shrink-0" />
              <span>Encerrar Sessão (Sair da Conta)</span>
            </button>

            {onOpenDeleteAccount && (
              <div className="pt-0.5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDeleteAccount();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={13} className="shrink-0 opacity-70" />
                  <span>Excluir minha conta</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Sticky Bottom Actions Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md border-t border-slate-200 dark:border-white/[0.08] p-3.5 sm:p-4 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center gap-2.5 sm:gap-3">
          <Button
            type="button"
            variant="secondary"
            className="w-24 sm:w-28 shrink-0"
            onClick={onClose}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            form="profile-form"
            variant="primary"
            className="flex-1"
            leftIcon={<Check size={16} className="shrink-0" />}
          >
            {savedSuccess ? 'Salvo!' : 'Salvar Alterações'}
          </Button>
        </div>
      </footer>
    </div>,
    document.body
  );
}
