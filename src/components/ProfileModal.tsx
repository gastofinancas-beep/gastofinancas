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
  ChevronRight,
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
  subscribeToPushNotifications, enableBackgroundPush, disableBackgroundPush, 
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

const fieldInputCls =
  'w-full bg-transparent text-right text-[16px] sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none';

function Switch({ checked, onChange, disabled }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`relative inline-flex items-center shrink-0 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-11 h-6 bg-slate-200 dark:bg-[#3A3A3C] rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all" />
    </label>
  );
}

function SettingsGroup({ title, footer, children }: { title?: string; footer?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      {title && (
        <h2 className="px-1 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</h2>
      )}
      <div className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] divide-y divide-slate-100 dark:divide-white/[0.06] overflow-hidden">
        {children}
      </div>
      {footer && <p className="px-1 mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{footer}</p>}
    </section>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  right,
  onClick,
  chevron,
  destructive,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  chevron?: boolean;
  destructive?: boolean;
}) {
  const body = (
    <>
      {icon && (
        <span className={`shrink-0 ${destructive ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`}>{icon}</span>
      )}
      <span className="min-w-0 flex-1 text-left">
        <span className={`block text-sm font-medium truncate ${destructive ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{title}</span>
        {subtitle && <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</span>}
      </span>
      {right}
      {chevron && <ChevronRight size={16} className="shrink-0 text-slate-300 dark:text-slate-600" />}
    </>
  );
  const cls = 'w-full px-4 py-3.5 flex items-center gap-3';
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors`}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="px-4 py-3.5 flex items-center gap-3">
      <span className="w-28 shrink-0 text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <span className="flex-1 min-w-0">{children}</span>
    </label>
  );
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
  const [activeSubTab, setActiveSubTab] = useState<'geral' | 'notificacoes' | 'prefs'>('geral');
  const [showPhotoPanel, setShowPhotoPanel] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState('');

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
      setInitialSnapshot(JSON.stringify([
        initialName, initialNickname, initialEmail, profile.recoveryEmail || '', profile.phone || gPhone || '',
        profile.pixKey || '', profile.pixKeyType || 'email', initialPhoto, profile.cpf || '', profile.birthDate || '',
        profile.occupation || '', profile.bio || '', profile.budgets || {}, true,
      ]));

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
      disableBackgroundPush().catch(() => {});
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
      enableBackgroundPush().catch(() => {});
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
        enableBackgroundPush().catch(() => {});
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
        enableBackgroundPush().catch(() => {});
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

  const isDirty = initialSnapshot !== '' && initialSnapshot !== JSON.stringify([
    name, nickname, email, recoveryEmail, phone, pixKey, pixKeyType, photoURL, cpf, birthDate, occupation, bio, budgets, syncWithPersonMe,
  ]);
  const showSaveBar = isDirty || savedSuccess;
  const accountInitial = (nickname || name || 'U').charAt(0).toUpperCase();
  const photoSourceLabel =
    photoSource === 'google' ? 'Foto da conta Google'
    : photoSource === 'upload' ? 'Foto do aparelho'
    : photoSource === 'url' ? 'Foto por link'
    : 'Sem foto';
  const activeBudgets = Object.values(budgets).filter(v => Number(v) > 0).length;
  const totalBudget = Object.values(budgets).reduce((acc, v) => acc + (Number(v) || 0), 0);
  const unverifiedEmail = isPasswordUser && !isEmailVerified;

  const tabs: { id: typeof activeSubTab; label: string }[] = [
    { id: 'geral', label: 'Conta' },
    { id: 'notificacoes', label: 'Avisos' },
    { id: 'prefs', label: 'Ajustes' },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-[#09090B] overflow-y-auto flex flex-col w-full h-[100dvh] text-slate-900 dark:text-slate-100">
      <header
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        className="sticky top-0 z-40 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md border-b border-slate-200/70 dark:border-white/[0.08] shrink-0"
      >
        <div className="px-4 sm:px-6 h-14 flex items-center gap-3 max-w-xl w-full mx-auto">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 -ml-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Voltar"
          >
            <ArrowLeft size={19} />
          </button>
          <h1 className="text-base font-bold tracking-tight">Perfil</h1>
        </div>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 pt-4 space-y-5" style={{ paddingBottom: showSaveBar ? '9rem' : '3rem' }}>
        <div className="p-1 rounded-xl bg-slate-200/60 dark:bg-white/[0.06] grid grid-cols-3 gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveSubTab(t.id)}
              className={`py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeSubTab === t.id
                  ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">

          {/* ===================== CONTA ===================== */}
          {activeSubTab === 'geral' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col items-center text-center pt-1">
                <button type="button" onClick={() => setShowPhotoPanel(v => !v)} className="relative cursor-pointer" aria-label="Alterar foto">
                  <span className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 dark:bg-[#2C2C2E] text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-3xl">
                    {photoURL ? (
                      <img src={photoURL} alt={nickname || name || 'Foto'} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : accountInitial}
                  </span>
                  <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-emerald-500 text-white ring-2 ring-slate-50 dark:ring-[#09090B] flex items-center justify-center">
                    <Camera size={14} />
                  </span>
                </button>
                <p className="mt-3 font-bold text-lg tracking-tight">{name || nickname || 'Seu nome'}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{email || userEmail || 'Sem e-mail informado'}</p>
                <button
                  type="button"
                  onClick={() => setShowPhotoPanel(v => !v)}
                  className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 cursor-pointer"
                >
                  {showPhotoPanel ? 'Concluir' : 'Alterar foto'}
                </button>
              </div>

              {showPhotoPanel && (
                <SettingsGroup footer={photoError || photoSourceLabel}>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <SettingsRow
                    icon={<Upload size={17} />}
                    title={isUploadingPhoto ? 'Processando...' : 'Escolher do aparelho'}
                    onClick={() => fileInputRef.current?.click()}
                    chevron
                  />
                  {hasGoogleAccount && (
                    <SettingsRow icon={<User size={17} />} title="Usar foto da conta Google" onClick={handlePullFromGoogle} chevron />
                  )}
                  <SettingsRow icon={<LinkIcon size={17} />} title="Usar um link" onClick={() => setShowUrlInput(v => !v)} chevron />
                  {showUrlInput && (
                    <div className="px-4 py-3 flex items-center gap-2">
                      <input
                        type="url"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="https://exemplo.com/foto.jpg"
                        className="flex-1 min-w-0 px-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] rounded-xl text-[16px] sm:text-sm outline-none focus:border-emerald-500"
                      />
                      <button type="button" onClick={handleApplyCustomUrl} className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold cursor-pointer">
                        Aplicar
                      </button>
                    </div>
                  )}
                  {photoURL && (
                    <SettingsRow icon={<Trash2 size={17} />} title="Remover foto" destructive onClick={handleRemovePhoto} />
                  )}
                </SettingsGroup>
              )}

              <SettingsGroup title="Dados pessoais">
                <FieldRow label="Nome">
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" className={fieldInputCls} />
                </FieldRow>
                <FieldRow label="Apelido">
                  <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Como quer ser chamado(a)" className={fieldInputCls} />
                </FieldRow>
                <FieldRow label="E-mail">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className={fieldInputCls} />
                </FieldRow>
                {unverifiedEmail && (
                  <div className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-amber-700 dark:text-amber-300 min-w-0">
                      <AlertCircle size={15} className="shrink-0" />
                      <span className="truncate">E-mail não confirmado</span>
                    </span>
                    <button
                      type="button"
                      disabled={resendCooldown > 0}
                      onClick={handleResendConfirmation}
                      className="shrink-0 font-semibold text-emerald-600 dark:text-emerald-400 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : 'Reenviar'}
                    </button>
                  </div>
                )}
                <FieldRow label="Telefone">
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" className={fieldInputCls} />
                </FieldRow>
              </SettingsGroup>
              {resendStatus && (
                <p className={`-mt-3 px-1 text-xs ${resendStatus.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {resendStatus.message}
                </p>
              )}

              <SettingsGroup title="Recebimentos" footer="A chave Pix vai junto nas mensagens de cobrança enviadas aos seus amigos.">
                <div className="px-4 py-3 flex items-center gap-1.5 overflow-x-auto">
                  {(['cpf', 'email', 'telefone', 'aleatoria'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPixKeyType(t)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        pixKeyType === t
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {t === 'cpf' ? 'CPF' : t === 'email' ? 'E-mail' : t === 'telefone' ? 'Telefone' : 'Aleatória'}
                    </button>
                  ))}
                </div>
                <FieldRow label="Chave Pix">
                  <input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder={
                      pixKeyType === 'cpf' ? '000.000.000-00'
                      : pixKeyType === 'telefone' ? '(11) 99999-9999'
                      : pixKeyType === 'email' ? 'seu-pix@email.com' : 'Chave aleatória'
                    }
                    className={fieldInputCls}
                  />
                </FieldRow>
              </SettingsGroup>

              <SettingsGroup
                title="Opcional"
                footer="Usados em relatórios e extratos em PDF."
              >
                <SettingsRow
                  title="Informações adicionais"
                  subtitle="CPF, nascimento, profissão e meta"
                  right={showExtras ? <ChevronUp size={17} className="text-slate-400" /> : <ChevronDown size={17} className="text-slate-400" />}
                  onClick={() => setShowExtras(v => !v)}
                />
                {showExtras && (
                  <>
                    <FieldRow label="CPF">
                      <input type="text" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" className={fieldInputCls} />
                    </FieldRow>
                    <div className="px-4 py-3">
                      <DatePickerInput
                        label="Data de nascimento"
                        value={birthDate}
                        onChange={(newDate) => setBirthDate(newDate)}
                        inputClassName="!px-4 !py-3 !rounded-2xl !text-[16px] sm:!text-sm"
                      />
                    </div>
                    <FieldRow label="Profissão">
                      <input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Ex: Motorista, Autônomo" className={fieldInputCls} />
                    </FieldRow>
                    <div className="px-4 py-3">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Meta ou frase de foco</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={2}
                        placeholder="Ex: Juntar R$ 15.000 para a reserva até dezembro"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] rounded-xl text-[16px] sm:text-sm outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>
                  </>
                )}
              </SettingsGroup>

              <SettingsGroup footer="Atualiza seu nome, foto e chave Pix nos rateios de cartão.">
                <SettingsRow
                  title="Usar meus dados na aba Divisão"
                  subtitle="Você aparece como titular"
                  right={<Switch checked={syncWithPersonMe} onChange={setSyncWithPersonMe} />}
                />
              </SettingsGroup>
            </div>
          )}

          {/* ===================== AVISOS ===================== */}
          {activeSubTab === 'notificacoes' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <SettingsGroup
                footer={
                  pushStatusMessage
                    ? pushStatusMessage
                    : pushPermission === 'denied'
                    ? 'As notificações estão bloqueadas no navegador. Libere nas configurações do site.'
                    : pushPermission === 'unsupported'
                    ? 'Este navegador não suporta notificações.'
                    : 'Receba lembretes de vencimento no celular, mesmo com o app fechado.'
                }
              >
                <SettingsRow
                  icon={<Bell size={17} />}
                  title="Avisos no celular"
                  subtitle={
                    pushPermission === 'granted' && notificationsEnabled ? 'Ativados neste aparelho'
                    : pushPermission === 'denied' ? 'Bloqueados no navegador'
                    : 'Desativados'
                  }
                  right={<Switch checked={notificationsEnabled && pushPermission === 'granted'} onChange={handleToggleNotifications} disabled={pushPermission === 'unsupported'} />}
                />
              </SettingsGroup>

              <SettingsGroup title="O que avisar">
                <SettingsRow
                  icon={<CardIcon size={17} />}
                  title="Faturas de cartão"
                  subtitle={`Até 3 dias antes do vencimento · ${cards.length} ${cards.length === 1 ? 'cartão' : 'cartões'}`}
                  right={<Switch checked={notifyCardBillsDue} onChange={handleToggleCardBills} />}
                />
                <SettingsRow
                  icon={<TrendingUp size={17} />}
                  title="Rendimento das caixinhas"
                  subtitle={`Resumo do mês · ${boxes.length} ${boxes.length === 1 ? 'caixinha' : 'caixinhas'}`}
                  right={<Switch checked={notifyInvestmentYields} onChange={handleToggleYields} />}
                />
              </SettingsGroup>

              <SettingsGroup
                title="E-mail"
                footer={unverifiedEmail ? 'Confirme seu e-mail para garantir a entrega dos avisos.' : 'Os avisos de fatura também chegam por e-mail.'}
              >
                <SettingsRow
                  icon={<Mail size={17} />}
                  title="Faturas por e-mail"
                  subtitle={recoveryEmail || email || 'Nenhum e-mail configurado'}
                  right={<Switch checked={notifyCardBillsEmail} onChange={handleToggleCardBillsEmail} />}
                />
                <FieldRow label="E-mail de aviso">
                  <input type="email" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} placeholder="Opcional" className={fieldInputCls} />
                </FieldRow>
                {unverifiedEmail && (
                  <div className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-amber-700 dark:text-amber-300 min-w-0">
                      <AlertCircle size={15} className="shrink-0" />
                      <span className="truncate">E-mail não confirmado</span>
                    </span>
                    <button
                      type="button"
                      disabled={resendCooldown > 0}
                      onClick={handleResendConfirmation}
                      className="shrink-0 font-semibold text-emerald-600 dark:text-emerald-400 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : 'Reenviar'}
                    </button>
                  </div>
                )}
              </SettingsGroup>
            </div>
          )}

          {/* ===================== AJUSTES ===================== */}
          {activeSubTab === 'prefs' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <SettingsGroup
                title="Segurança"
                footer={deviceSensorStatus || 'Protege a abertura do app com o bloqueio do seu celular.'}
              >
                <SettingsRow
                  icon={biometricLabel.hasFace ? <ScanFace size={17} /> : <Fingerprint size={17} />}
                  title={biometricLabel.name}
                  subtitle={deviceSensorTesting ? 'Aguardando confirmação no aparelho...' : useBiometrics ? 'Ativo' : 'Desativado'}
                  right={<Switch checked={useBiometrics} onChange={handleToggleDeviceBiometrics} disabled={deviceSensorTesting} />}
                />
                <SettingsRow
                  icon={<Lock size={17} />}
                  title="PIN de 6 dígitos"
                  subtitle={appLockEnabled && appLockPin ? 'Configurado' : 'Opcional'}
                  right={
                    <Switch
                      checked={appLockEnabled && Boolean(appLockPin)}
                      onChange={(checked) => {
                        setAppLockEnabled(checked);
                        triggerHaptic(8);
                        if (checked && !appLockPin && onOpenPinSetup) onOpenPinSetup();
                      }}
                    />
                  }
                />
                {appLockEnabled && onOpenPinSetup && (
                  <SettingsRow
                    title={appLockPin ? 'Alterar PIN' : 'Definir PIN'}
                    onClick={() => { onClose(); onOpenPinSetup(); }}
                    chevron
                  />
                )}
              </SettingsGroup>

              <SettingsGroup title="Privacidade e uso">
                <SettingsRow
                  icon={<EyeOff size={17} />}
                  title="Ocultar saldos ao iniciar"
                  subtitle="Mostra os valores como ••••••"
                  right={<Switch checked={privacyHideBalances} onChange={handleTogglePrivacyHideBalances} />}
                />
                <SettingsRow
                  icon={<Smartphone size={17} />}
                  title="Vibração"
                  subtitle="Resposta tátil ao tocar nos botões"
                  right={<Switch checked={hapticFeedbackEnabled} onChange={handleToggleHaptic} />}
                />
                <SettingsRow
                  icon={<Globe size={17} />}
                  title="Moeda"
                  right={<span className="text-sm text-slate-500 dark:text-slate-400">Real (R$)</span>}
                />
              </SettingsGroup>

              <SettingsGroup
                title="Orçamento"
                footer={isBudgetsExpanded ? 'Valores em zero não terão teto. Você recebe um aviso ao chegar em 80%.' : undefined}
              >
                <SettingsRow
                  icon={<TrendingUp size={17} />}
                  title="Tetos de gastos por categoria"
                  subtitle={activeBudgets > 0 ? `${activeBudgets} ativos · ${totalBudget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por mês` : 'Nenhum teto definido'}
                  right={isBudgetsExpanded ? <ChevronUp size={17} className="text-slate-400" /> : <ChevronDown size={17} className="text-slate-400" />}
                  onClick={() => setIsBudgetsExpanded(v => !v)}
                />
                {isBudgetsExpanded && (
                  <div className="px-4 py-3 space-y-3">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={budgetSearch}
                        onChange={(e) => setBudgetSearch(e.target.value)}
                        placeholder="Buscar categoria"
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] rounded-xl text-[16px] sm:text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
                      {EXPENSE_CATEGORIES
                        .filter(cat => !budgetSearch.trim() || cat.label.toLowerCase().includes(budgetSearch.toLowerCase()))
                        .map((cat) => {
                          const Icon = cat.icon;
                          return (
                            <div key={cat.id} className="py-2 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Icon size={15} className="text-slate-400 shrink-0" />
                                <span className="text-sm truncate">{cat.label}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-xs text-slate-400">R$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="50"
                                  placeholder="0"
                                  value={budgets[cat.id] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                    setBudgets(prev => ({ ...prev, [cat.id]: isNaN(val) ? 0 : val }));
                                  }}
                                  className="w-24 px-2 py-1.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.08] rounded-lg text-[16px] sm:text-sm outline-none focus:border-emerald-500 text-right font-semibold"
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    {activeBudgets > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Deseja zerar todos os tetos de categorias?')) {
                            setBudgets({});
                            triggerHaptic(12);
                          }
                        }}
                        className="text-sm font-medium text-rose-600 dark:text-rose-400 cursor-pointer"
                      >
                        Zerar todos os tetos
                      </button>
                    )}
                  </div>
                )}
              </SettingsGroup>

              <SettingsGroup title="Dados" footer={syncSuccessMessage || undefined}>
                <SettingsRow icon={<Download size={17} />} title="Backup completo (JSON)" subtitle="Baixa uma cópia dos seus dados" onClick={handleDownloadJsonBackup} chevron />
                {onOpenExport && (
                  <SettingsRow icon={<FileText size={17} />} title="Exportar relatórios" subtitle="PDF, CSV ou impressão" onClick={() => { onClose(); onOpenExport(); }} chevron />
                )}
                <SettingsRow
                  icon={<RefreshCw size={17} className={isSyncing ? 'animate-spin' : ''} />}
                  title={isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}
                  onClick={handleSyncAndRefresh}
                />
              </SettingsGroup>

              <SettingsGroup title="Conta">
                {onOpenLegalTerms && (
                  <SettingsRow icon={<ShieldCheck size={17} />} title="Termos de uso e privacidade" onClick={() => { onClose(); onOpenLegalTerms(); }} chevron />
                )}
                <SettingsRow icon={<LogOut size={17} />} title="Sair da conta" onClick={onSignOut} />
                {onOpenDeleteAccount && (
                  <SettingsRow icon={<Trash2 size={17} />} title="Excluir minha conta" destructive onClick={() => { onClose(); onOpenDeleteAccount(); }} />
                )}
              </SettingsGroup>
            </div>
          )}
        </form>
      </main>

      {showSaveBar && (
      <footer
        style={{ paddingBottom: 'max(0.875rem, env(safe-area-inset-bottom))' }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md border-t border-slate-200/70 dark:border-white/[0.08] px-4 sm:px-6 pt-3.5"
      >
        <div className="max-w-xl mx-auto flex items-center gap-2.5 sm:gap-3">
          <Button type="button" variant="secondary" className="w-24 sm:w-28 shrink-0" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="profile-form"
            variant="primary"
            className="flex-1"
            leftIcon={<Check size={16} className="shrink-0" />}
          >
            {savedSuccess ? 'Salvo!' : 'Salvar alterações'}
          </Button>
        </div>
      </footer>
      )}
    </div>,
    document.body
  );
}
