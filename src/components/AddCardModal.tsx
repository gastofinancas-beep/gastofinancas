import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  CreditCard as CardIcon, 
  Trash2, 
  Search, 
  Check, 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Wifi, 
  ChevronRight,
  ChevronDown,
  Building2,
  Plus,
  Minus,
  Camera,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Upload,
  Loader2
} from 'lucide-react';
import { CreditCard } from '../types';
import { BankLogo } from './BankLogo';
import { CurrencyInput } from './CurrencyInput';
import { Button } from './Button';
import { formatCurrency } from '../utils/financeCalculations';
import { triggerHaptic } from '../utils/haptics';
import { CreditCardVisual } from './CreditCardVisual';
import { CardScannerModal } from './CardScannerModal';
import { cropCardFromSource, analyzeCardFromCanvas, CARD_ASPECT_RATIO } from '../utils/cardScannerUtils';
import { BRAZILIAN_BANKS_CATALOG, BankCardsGroup, PresetCardItem } from '../utils/brazilianCardsCatalog';
import { fetchBrasilApiBanks, BrasilApiBank } from '../utils/brasilApiBanks';
import { BankCard, BankCardSelector } from './bank-cards';
import { CATEGORY_LABELS, getCardPresetById, matchBestCardPreset } from '../data/bankCards';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: Partial<CreditCard>) => void;
  editingCard?: CreditCard | null;
  onDelete?: (cardId: string) => void;
}

export interface BankPreset {
  bank: string;
  name: string;
  color: string;
  gradient: string;
  category?: string;
}

export const ALL_BANKS: BankPreset[] = [
  { bank: 'Nubank', name: 'Nubank Roxinho', color: '#820AD1', gradient: 'from-[#820AD1] via-[#9B1BE8] to-[#5C0D8B]', category: 'Digital' },
  { bank: 'Itaú', name: 'Itaú Mastercard', color: '#EC7000', gradient: 'from-[#EC7000] via-[#FA7D09] to-[#002D72]', category: 'Tradicional' },
  { bank: 'Inter', name: 'Banco Inter Gold', color: '#FF7A00', gradient: 'from-[#FF7A00] via-[#FF9432] to-[#E65C00]', category: 'Digital' },
  { bank: 'C6 Bank', name: 'C6 Carbon', color: '#181818', gradient: 'from-[#333338] via-[#1E1E22] to-[#121214]', category: 'Digital' },
  { bank: 'Bradesco', name: 'Bradesco Elo', color: '#CC092F', gradient: 'from-[#CC092F] via-[#E8113A] to-[#8A0019]', category: 'Tradicional' },
  { bank: 'Santander', name: 'Santander SX', color: '#EC0000', gradient: 'from-[#EC0000] via-[#FF2626] to-[#A30000]', category: 'Tradicional' },
  { bank: 'Banco do Brasil', name: 'Ourocard BB', color: '#003882', gradient: 'from-[#003882] via-[#0055C7] to-[#00224F]', category: 'Tradicional' },
  { bank: 'Caixa', name: 'Caixa Sim', color: '#005CA9', gradient: 'from-[#005CA9] via-[#007EE6] to-[#003E73]', category: 'Tradicional' },
  { bank: 'Mercado Pago', name: 'Mercado Pago Visa', color: '#009EE3', gradient: 'from-[#009EE3] via-[#1EB6FC] to-[#007AB0]', category: 'Carteira' },
  { bank: 'XP', name: 'XP Visa Infinite', color: '#000000', gradient: 'from-[#282828] via-[#161616] to-[#050505]', category: 'Investimentos' },
  { bank: 'BTG Pactual', name: 'BTG Pactual Black', color: '#0B1E36', gradient: 'from-[#0B1E36] via-[#183E6E] to-[#061120]', category: 'Investimentos' },
  { bank: 'PicPay', name: 'PicPay Card', color: '#11C76F', gradient: 'from-[#11C76F] via-[#1EE381] to-[#0B9652]', category: 'Carteira' },
  { bank: 'PagBank', name: 'PagBank Visa', color: '#00A868', gradient: 'from-[#00A868] via-[#00C97D] to-[#007548]', category: 'Pagamentos' },
  { bank: 'Neon', name: 'Neon Visa', color: '#00D1FF', gradient: 'from-[#00D1FF] via-[#0094FF] to-[#0055D4]', category: 'Digital' },
  { bank: 'Banco Pan', name: 'Pan Mastercard', color: '#0080FF', gradient: 'from-[#0080FF] via-[#00A3FF] to-[#0052B3]', category: 'Digital' },
  { bank: 'Safra', name: 'Safra Visa', color: '#0D1E32', gradient: 'from-[#0D1E32] via-[#1B365D] to-[#081220]', category: 'Tradicional' },
  { bank: 'Sicredi', name: 'Sicredi Mastercard', color: '#004A26', gradient: 'from-[#006634] via-[#004A26] to-[#00331A]', category: 'Cooperativa' },
  { bank: 'Sicoob', name: 'Sicoobcard', color: '#003641', gradient: 'from-[#005263] via-[#003641] to-[#002229]', category: 'Cooperativa' },
  { bank: 'Cresol', name: 'Cresol Card', color: '#F37021', gradient: 'from-[#F37021] via-[#FF8533] to-[#C9540C]', category: 'Cooperativa' },
  { bank: 'BMG', name: 'BMG Card', color: '#FF5A00', gradient: 'from-[#FF5A00] via-[#FF7524] to-[#CC4800]', category: 'Digital' },
  { bank: 'Outro', name: 'Cartão Personalizado', color: '#3B82F6', gradient: 'from-[#2563EB] via-[#3B82F6] to-[#1D4ED8]', category: 'Personalizado' },
];

export function AddCardModal({ isOpen, onClose, onSave, editingCard, onDelete }: AddCardModalProps) {
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [customBankName, setCustomBankName] = useState('');
  const [isBankSelectorOpen, setIsBankSelectorOpen] = useState(false);
  const [searchBank, setSearchBank] = useState('');
  const [lastDigits, setLastDigits] = useState('');
  const [limit, setLimit] = useState<number>(5000);
  const [closingDay, setClosingDay] = useState('8');
  const [dueDay, setDueDay] = useState('15');
  const [selectedTheme, setSelectedTheme] = useState<BankPreset>(ALL_BANKS[0]);
  const [showAllBanks, setShowAllBanks] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Scanned Card Real Photo & Visual Options
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cardPhotoUrl, setCardPhotoUrl] = useState<string | undefined>(undefined);
  const [visualStyle, setVisualStyle] = useState<'digital' | 'photo' | 'hybrid' | undefined>(undefined);
  const [textColor, setTextColor] = useState<'light' | 'dark' | undefined>(undefined);
  const [brand, setBrand] = useState<CreditCard['brand']>(undefined);

  // Bank Cards Official Library Preset & Color Variant
  const [cardDesignId, setCardDesignId] = useState<string | undefined>('nubank-roxinho');
  const [colorVariant, setColorVariant] = useState<string | undefined>(undefined);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Gallery Picker & Optical Analyzer
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const mainScrollRef = useRef<HTMLElement | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  // BrasilAPI Banks Cache & Search (declared at top level before any early return)
  const [brasilBanks, setBrasilBanks] = useState<BrasilApiBank[]>([]);
  const [isLoadingBrasilApi, setIsLoadingBrasilApi] = useState(false);
  const [activeTabMode, setActiveTabMode] = useState<'catalog' | 'allBanks'>('catalog');
  const [expandedBank, setExpandedBank] = useState<string | null>('Nubank');

  // Load BrasilAPI banks lazily on mount/open
  useEffect(() => {
    if (isOpen) {
      setIsLoadingBrasilApi(true);
      fetchBrasilApiBanks()
        .then((data) => {
          setBrasilBanks(data);
        })
        .finally(() => {
          setIsLoadingBrasilApi(false);
        });
    }
  }, [isOpen]);

  const handleGalleryPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic(12);
    setIsProcessingPhoto(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        let cropWidth = img.width;
        let cropHeight = cropWidth / CARD_ASPECT_RATIO;

        if (cropHeight > img.height) {
          cropHeight = img.height;
          cropWidth = cropHeight * CARD_ASPECT_RATIO;
        }

        const cropX = (img.width - cropWidth) / 2;
        const cropY = (img.height - cropHeight) / 2;

        const croppedCanvas = cropCardFromSource(img, {
          x: cropX,
          y: cropY,
          width: cropWidth,
          height: cropHeight,
        });

        try {
          const analysis = await analyzeCardFromCanvas(croppedCanvas);
          setCardPhotoUrl(analysis.photoDataUrl);
          setVisualStyle('photo');
          setTextColor(analysis.textColor);

          if (analysis.suggestedBank && (!bank || bank === 'Nubank' || bank === 'Outro')) {
            setBank(analysis.suggestedBank);
          }
          if (analysis.suggestedName && (!name || name === 'Nubank Roxinho' || name.trim() === '')) {
            setName(analysis.suggestedName);
          }
          if (analysis.suggestedBrand) {
            setBrand(analysis.suggestedBrand);
          }
          if (analysis.detectedDigits && !lastDigits) {
            setLastDigits(analysis.detectedDigits);
          }

          setSelectedTheme(prev => ({
            ...prev,
            color: analysis.dominantColor || prev.color,
            gradient: analysis.gradient || prev.gradient,
          }));

          triggerHaptic(15);
        } catch (err) {
          console.error('Erro ao analisar foto da galeria:', err);
        } finally {
          setIsProcessingPhoto(false);
          if (galleryInputRef.current) {
            galleryInputRef.current.value = '';
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSearchBank('');
      setShowAllBanks(false);
      setValidationError(null);
      if (editingCard) {
        setName(editingCard.name || '');
        setBank(editingCard.bank || '');
        setLastDigits(editingCard.lastDigits || '');
        setLimit(editingCard.limit || 5000);
        setClosingDay(String(editingCard.closingDay || '8'));
        setDueDay(String(editingCard.dueDay || '15'));
        setCardPhotoUrl(editingCard.cardPhotoUrl);
        setVisualStyle(editingCard.visualStyle);
        setTextColor(editingCard.textColor);
        setBrand(editingCard.brand);
        setCardDesignId(editingCard.cardDesignId || matchBestCardPreset(editingCard.bank, editingCard.name)?.id || 'nubank-roxinho');
        setColorVariant(editingCard.colorVariant);
        setIsCardFlipped(false);

        const matchedPreset = ALL_BANKS.find(
          p => p.bank.toLowerCase() === (editingCard.bank || '').toLowerCase()
        );
        if (matchedPreset) {
          setSelectedTheme({
            ...matchedPreset,
            color: editingCard.color || matchedPreset.color,
            gradient: editingCard.gradient || matchedPreset.gradient,
          });
        } else {
          setSelectedTheme({
            bank: editingCard.bank || 'Outro',
            name: editingCard.name || 'Personalizado',
            color: editingCard.color || '#3b82f6',
            gradient: editingCard.gradient || 'from-blue-950 via-slate-900 to-slate-950',
          });
        }
      } else {
        setName('');
        setBank('');
        setLastDigits('');
        setLimit(5000);
        setClosingDay('8');
        setDueDay('15');
        setSelectedTheme(ALL_BANKS[0]);
        setCardPhotoUrl(undefined);
        setVisualStyle(undefined);
        setTextColor(undefined);
        setBrand(undefined);
        setCardDesignId('nubank-roxinho');
        setColorVariant(undefined);
        setIsCardFlipped(false);
      }
    }
  }, [isOpen, editingCard]);

  if (typeof document === 'undefined') return null;

  const handleCardScanned = (scannedData: Partial<CreditCard>) => {
    triggerHaptic(12);
    if (scannedData.bank) setBank(scannedData.bank);
    if (scannedData.name) setName(scannedData.name);
    if (scannedData.lastDigits) setLastDigits(scannedData.lastDigits);
    if (scannedData.limit) setLimit(scannedData.limit);
    if (scannedData.closingDay) setClosingDay(String(scannedData.closingDay));
    if (scannedData.dueDay) setDueDay(String(scannedData.dueDay));
    if (scannedData.cardPhotoUrl) setCardPhotoUrl(scannedData.cardPhotoUrl);
    if (scannedData.visualStyle) setVisualStyle(scannedData.visualStyle);
    if (scannedData.textColor) setTextColor(scannedData.textColor);
    if (scannedData.brand) setBrand(scannedData.brand);

    if (scannedData.color || scannedData.gradient) {
      setSelectedTheme({
        bank: scannedData.bank || 'Personalizado',
        name: scannedData.name || 'Personalizado',
        color: scannedData.color || '#820AD1',
        gradient: scannedData.gradient || '',
      });
    }
  };

  const handleSelectCardPreset = (bankGroup: BankCardsGroup, cardPreset: PresetCardItem) => {
    triggerHaptic(10);
    setBank(bankGroup.bank);
    setName(cardPreset.name);
    if (cardPreset.suggestedClosingDay) {
      setClosingDay(String(cardPreset.suggestedClosingDay));
    }
    if (cardPreset.suggestedDueDay) {
      setDueDay(String(cardPreset.suggestedDueDay));
    }
    setBrand(cardPreset.brand);
    setSelectedTheme({
      bank: bankGroup.bank,
      name: cardPreset.name,
      color: cardPreset.color,
      gradient: cardPreset.gradient,
      category: bankGroup.category,
    });
    setValidationError(null);
    setIsBankSelectorOpen(false);
  };

  const handleSelectGenericBank = (bankName: string, category: string = 'Digital') => {
    triggerHaptic(8);
    setBank(bankName);
    if (!name || name.trim() === '' || name.toLowerCase().includes('cartão')) {
      setName(`${bankName} Card`);
    }
    setSelectedTheme({
      bank: bankName,
      name: `${bankName} Card`,
      color: '#059669',
      gradient: 'from-[#059669] via-[#10B981] to-[#047857]',
      category,
    });
    setValidationError(null);
    setIsBankSelectorOpen(false);
  };

  const filteredBanks = ALL_BANKS.filter(b => 
    b.bank.toLowerCase().includes(searchBank.toLowerCase()) || 
    b.name.toLowerCase().includes(searchBank.toLowerCase())
  );

  const displayedBanks = searchBank ? filteredBanks : (showAllBanks ? ALL_BANKS : ALL_BANKS.slice(0, 8));

  const adjustDay = (setter: React.Dispatch<React.SetStateAction<string>>, currentVal: string, delta: number) => {
    triggerHaptic(5);
    const curr = parseInt(currentVal, 10) || 1;
    let next = curr + delta;
    if (next < 1) next = 31;
    if (next > 31) next = 1;
    setter(String(next));
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAndSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    const finalName = name.trim();
    const finalBank = (bank === 'Outro' && customBankName.trim()) 
      ? customBankName.trim() 
      : (bank.trim() || selectedTheme.bank);

    if (!finalName) {
      setValidationError('Por favor, informe o nome do cartão.');
      triggerHaptic(25);
      mainScrollRef.current?.scrollTo({ top: 400, behavior: 'smooth' });
      return;
    }

    if (!finalBank) {
      setValidationError('Por favor, selecione ou informe o banco emissor.');
      triggerHaptic(25);
      mainScrollRef.current?.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    setValidationError(null);
    setIsSaving(true);
    triggerHaptic(18);

    onSave({
      ...(editingCard ? { id: editingCard.id } : {}),
      name: finalName,
      bank: finalBank,
      lastDigits: lastDigits.trim() || undefined,
      limit: limit || 1000,
      closingDay: parseInt(closingDay, 10) || 8,
      dueDay: parseInt(dueDay, 10) || 15,
      color: selectedTheme.color,
      gradient: selectedTheme.gradient,
      cardPhotoUrl,
      visualStyle,
      textColor,
      brand,
      cardDesignId,
      colorVariant,
    });

    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 180);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="add-card-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[200] bg-slate-950/60 dark:bg-black/80 backdrop-blur-md flex flex-col items-center justify-end sm:justify-center overflow-hidden"
        >
          <motion.div
            key="add-card-modal-panel"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: '0%' }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 32,
              mass: 0.85
            }}
            className="w-full h-[100dvh] sm:h-[94vh] sm:max-h-[920px] sm:max-w-2xl bg-slate-100 dark:bg-[#09090B] sm:rounded-[32px] sm:border sm:border-slate-200/60 dark:sm:border-white/[0.08] sm:shadow-2xl flex flex-col text-slate-900 dark:text-slate-100 overflow-hidden select-none"
            style={{
              overscrollBehavior: 'contain',
            }}
          >
      {/* Hidden File Input for Gallery Photo Selection */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleGalleryPhotoSelect}
        className="hidden"
      />

      {/* Full-Screen Sticky Header with Back Button AND Top Quick Save Button (Optimized for iOS) */}
      <header className="shrink-0 z-40 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.08] px-3.5 sm:px-6 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(6);
              onClose();
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
            title="Voltar"
          >
            <ArrowLeft size={18} className="stroke-[2.5]" />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {editingCard ? 'Editar Cartão' : 'Novo Cartão'}
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              {editingCard ? 'Altere dados ou limites' : 'Adicione à sua carteira'}
            </p>
          </div>
        </div>

        {/* Action Controls in Header (Top Save Button for immediate 1-tap save on mobile) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveAndSubmit()}
            className="px-3.5 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-70 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            title="Salvar dados do cartão"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} className="stroke-[3]" />
            )}
            <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(6);
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area - Smooth Scrollable with iOS Safe Spacing */}
      <main 
        ref={mainScrollRef}
        className="flex-1 min-h-0 overflow-y-auto max-w-xl w-full mx-auto p-4 sm:p-6 pb-28 sm:pb-24 space-y-5"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        {/* Validation Error Alert if any */}
        {validationError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-shake">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Real-time Interactive Visual Card Preview */}
        <div className="space-y-2">
          {cardPhotoUrl && visualStyle !== 'digital' ? (
            <CreditCardVisual
              card={{
                bank: bank || selectedTheme.bank,
                name: name || selectedTheme.name || 'Seu Cartão',
                lastDigits,
                color: selectedTheme.color,
                gradient: selectedTheme.gradient,
                closingDay: parseInt(closingDay, 10) || 8,
                dueDay: parseInt(dueDay, 10) || 15,
                limit: limit || 0,
                cardPhotoUrl,
                visualStyle,
                textColor,
                brand,
                cardDesignId,
                colorVariant,
              }}
              interactive={false}
              scale={1.0}
              className="w-full"
            />
          ) : (
            <BankCard
              design={cardDesignId || 'nubank-roxinho'}
              colorVariant={colorVariant}
              cardNumber={lastDigits}
              cardHolder={name || 'SEU NOME AQUI'}
              expiryDate={`${String(closingDay).padStart(2, '0')}/${String(dueDay).padStart(2, '0')}`}
              cvv="•••"
              flipped={isCardFlipped}
              onFlip={setIsCardFlipped}
              showFlipButton={true}
              interactive={true}
              fallbackBankName={bank || selectedTheme.bank}
            />
          )}

          {cardPhotoUrl && (
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Visual Ativo</span>
                <span className="text-[10px] text-slate-500">({visualStyle === 'photo' ? 'Foto Real' : visualStyle === 'digital' ? 'Digital' : 'Híbrido'})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer text-xs"
                >
                  Reescanear
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setCardPhotoUrl(undefined);
                    setVisualStyle(undefined);
                    triggerHaptic(5);
                  }}
                  className="font-bold text-rose-500 hover:underline cursor-pointer text-xs"
                >
                  Remover Foto
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* 🏦 CAMPO DE SELEÇÃO DE BANCO (CLEAN & INTUITIVO) */}
        {/* ===================================================================== */}
        <div className="bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 rounded-3xl border border-slate-200/60 dark:border-white/[0.08] shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Building2 size={15} className="text-emerald-500" />
              Banco ou Instituição Emissora *
            </label>
            {selectedTheme.category && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                {selectedTheme.category}
              </span>
            )}
          </div>

          {/* Active Selected Bank Display Card */}
          <div 
            onClick={() => {
              triggerHaptic(8);
              setIsBankSelectorOpen(!isBankSelectorOpen);
            }}
            className="group p-3.5 sm:p-4 rounded-2xl border border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer flex items-center justify-between gap-3 select-none"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 flex items-center justify-center shrink-0">
                <BankLogo bankName={bank || selectedTheme.bank} size={42} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                    {bank || selectedTheme.bank}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    {selectedTheme.category || 'Banco'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {selectedTheme.name || `${bank || selectedTheme.bank} Card`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline hidden sm:inline">
                {isBankSelectorOpen ? 'Fechar Lista' : 'Trocar Banco'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#2C2C2E] flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-2xs">
                <ChevronDown 
                  size={16} 
                  className={`transition-transform duration-200 ${isBankSelectorOpen ? 'rotate-180 text-emerald-500' : ''}`} 
                />
              </div>
            </div>
          </div>

          {/* Search Field & Comprehensive Bank & Cards Catalog */}
          {isBankSelectorOpen && (
            <div className="pt-2 border-t border-slate-100 dark:border-white/[0.08] space-y-3">
              {/* Tab Selector: Catálogo com Modelos vs Todos os Bancos (BrasilAPI) */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#2C2C2E] rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(5);
                    setActiveTabMode('catalog');
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTabMode === 'catalog'
                      ? 'bg-white dark:bg-[#1C1C1E] text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles size={13} className="text-emerald-500" />
                  <span>Cartões por Banco</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 font-bold">
                    {BRAZILIAN_BANKS_CATALOG.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(5);
                    setActiveTabMode('allBanks');
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTabMode === 'allBanks'
                      ? 'bg-white dark:bg-[#1C1C1E] text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Building2 size={13} className="text-blue-500" />
                  <span>Todos os Bancos (BACEN)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/10 font-bold">
                    {brasilBanks.length || '350+'}
                  </span>
                </button>
              </div>

              {/* ABA 1: BIBLIOTECA COMPLETA DE CARTÕES */}
              {activeTabMode === 'catalog' && (
                <BankCardSelector
                  selectedDesignId={cardDesignId}
                  selectedColorVariantId={colorVariant}
                  defaultBankId={bank ? bank.toLowerCase() : 'nubank'}
                  onSelectCard={(preset, variantId) => {
                    setCardDesignId(preset.id);
                    setColorVariant(variantId);
                    setBank(preset.bankName);
                    setName(preset.name);
                    setBrand(preset.network as any);
                    setSelectedTheme({
                      bank: preset.bankName,
                      name: preset.name,
                      color: preset.colors.primary,
                      gradient: `from-[${preset.colors.primary}] via-[${preset.colors.secondary || preset.colors.primary}] to-[${preset.colors.tertiary || preset.colors.primary}]`,
                      category: CATEGORY_LABELS[preset.category]?.label,
                    });
                    setValidationError(null);
                  }}
                />
              )}

              {/* ABA 2: TODOS OS BANCOS DO BRASIL (BRASILAPI / BANCO CENTRAL) */}
              {activeTabMode === 'allBanks' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search 
                      size={16} 
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
                    />
                    <input
                      type="text"
                      value={searchBank}
                      onChange={(e) => setSearchBank(e.target.value)}
                      placeholder="Buscar qualquer instituição por nome ou código BACEN..."
                      className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-[#2C2C2E]/60 border border-slate-200 dark:border-white/[0.12] rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
                    />
                    {searchBank && (
                      <button
                        type="button"
                        onClick={() => setSearchBank('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                <div className="max-h-72 overflow-y-auto pr-1 space-y-1 divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {isLoadingBrasilApi && brasilBanks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                      <Loader2 size={18} className="animate-spin text-emerald-500" />
                      <span>Consultando sistema bancário nacional (BrasilAPI / BACEN)...</span>
                    </div>
                  ) : (
                    brasilBanks
                      .filter((b) => {
                        if (!searchBank) return true;
                        const query = searchBank.toLowerCase();
                        return (
                          (b.name && b.name.toLowerCase().includes(query)) ||
                          (b.fullName && b.fullName.toLowerCase().includes(query)) ||
                          (b.code && String(b.code).includes(query))
                        );
                      })
                      .slice(0, searchBank ? 60 : 40)
                      .map((b) => {
                        const bankTitle = b.name || b.fullName;
                        const isCurrent = (bank || selectedTheme.bank).toLowerCase() === bankTitle.toLowerCase();

                        return (
                          <button
                            key={`${b.ispb}-${b.code}`}
                            type="button"
                            onClick={() => handleSelectGenericBank(bankTitle, 'BACEN')}
                            className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                              isCurrent
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold'
                                : 'hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 flex items-center justify-center shrink-0">
                                <BankLogo bankName={bankTitle} size={32} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold truncate">
                                    {bankTitle}
                                  </span>
                                  {b.code && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.08] text-slate-500 font-mono">
                                      Bco {b.code}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                  {b.fullName}
                                </p>
                              </div>
                            </div>

                            {isCurrent && (
                              <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
                            )}
                          </button>
                        );
                      })
                  )}
                </div>
              </div>
            )}

              {/* Botão de Banco Personalizado / Outro */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleSelectGenericBank('Outro', 'Personalizado')}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Não encontrou? Digitar banco personalizado</span>
                </button>
                <span className="text-[10px] text-slate-400">
                  Dados BACEN / BrasilAPI
                </span>
              </div>

              {bank === 'Outro' && (
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Nome do seu Banco ou Emissor
                  </label>
                  <input
                    type="text"
                    value={customBankName}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    placeholder="Digite o nome do seu banco"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#2C2C2E]/60 border border-slate-200 dark:border-white/[0.10] rounded-xl text-slate-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Details Form */}
        <form id="card-form" onSubmit={handleSaveAndSubmit} className="space-y-4">
          {/* Card Name & Last Digits Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2 bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 rounded-3xl border border-slate-200/60 dark:border-white/[0.08] shadow-xs space-y-1.5">
              <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                Nome de Identificação do Cartão *
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pb-0.5">
                Como você quer visualizar este cartão na lista
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Ex: Nubank Roxinho, Itaú Click, Inter Black..."
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-[#2C2C2E]/60 border border-slate-200 dark:border-white/[0.10]/80 rounded-2xl text-slate-900 dark:text-white text-base sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all"
              />
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 rounded-3xl border border-slate-200/60 dark:border-white/[0.08] shadow-xs space-y-1.5">
              <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                Últimos 4 Dígitos
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pb-0.5">
                Para diferenciar
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={lastDigits}
                onChange={(e) => setLastDigits(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 8492"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-[#2C2C2E]/60 border border-slate-200 dark:border-white/[0.10]/80 rounded-2xl text-slate-900 dark:text-white text-base sm:text-sm font-mono tracking-wider font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Limite Total do Cartão */}
          <div className="bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 rounded-3xl border border-slate-200/60 dark:border-white/[0.08] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                  Limite Total do Cartão *
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Limite de crédito total aprovado pelo banco
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <DollarSign size={16} />
              </div>
            </div>

            <div className="pt-1">
              <CurrencyInput
                value={limit}
                onChange={setLimit}
                placeholder="5.000,00"
                className="py-3 px-4 text-base sm:text-lg font-bold text-slate-900 dark:text-white rounded-2xl border-slate-200 dark:border-white/[0.10]/80 bg-slate-50 dark:bg-[#2C2C2E]/60"
              />
            </div>
          </div>

          {/* Datas da Fatura (Fechamento e Vencimento) */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Dia de Fechamento */}
            <div className="bg-white dark:bg-[#1C1C1E] p-3.5 sm:p-5 rounded-3xl border border-slate-200/60 dark:border-white/[0.08] shadow-xs flex flex-col justify-between space-y-2.5">
              <div>
                <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm">
                  <Calendar size={14} className="text-emerald-500 shrink-0" />
                  <span className="truncate">Fechamento</span>
                </div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 truncate">
                  Melhor dia compra
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => adjustDay(setClosingDay, closingDay, -1)}
                  className="w-8 h-10 sm:w-10 sm:h-11 rounded-xl bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <Minus size={15} className="stroke-[2.5]" />
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="31"
                  value={closingDay}
                  onChange={(e) => setClosingDay(e.target.value)}
                  className="w-full h-10 sm:h-11 text-center font-bold text-base sm:text-lg text-slate-900 dark:text-white bg-slate-50 dark:bg-[#2C2C2E]/60 border border-slate-200 dark:border-white/[0.10]/80 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => adjustDay(setClosingDay, closingDay, 1)}
                  className="w-8 h-10 sm:w-10 sm:h-11 rounded-xl bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <Plus size={15} className="stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Dia de Vencimento */}
            <div className="bg-white dark:bg-[#1C1C1E] p-3.5 sm:p-5 rounded-3xl border border-slate-200/60 dark:border-white/[0.08] shadow-xs flex flex-col justify-between space-y-2.5">
              <div>
                <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm">
                  <Calendar size={14} className="text-amber-500 shrink-0" />
                  <span className="truncate">Vencimento</span>
                </div>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 truncate">
                  Dia de pagamento
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => adjustDay(setDueDay, dueDay, -1)}
                  className="w-8 h-10 sm:w-10 sm:h-11 rounded-xl bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <Minus size={15} className="stroke-[2.5]" />
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  className="w-full h-10 sm:h-11 text-center font-bold text-base sm:text-lg text-slate-900 dark:text-white bg-slate-50 dark:bg-[#2C2C2E]/60 border border-slate-200 dark:border-white/[0.10]/80 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => adjustDay(setDueDay, dueDay, 1)}
                  className="w-8 h-10 sm:w-10 sm:h-11 rounded-xl bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <Plus size={15} className="stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* Direct In-Form Action Button */}
          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              fullWidth
              leftIcon={<CardIcon size={18} />}
            >
              {editingCard ? 'Atualizar Dados' : 'Cadastrar Cartão'}
            </Button>
            <p className="text-center text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
              Dados salvos localmente e sincronizados de forma segura
            </p>
          </div>
        </form>
      </main>

      {/* FIXED Bottom Action Bar (Anchored with iOS Safe Area) */}
      <footer 
        className="shrink-0 z-50 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md border-t border-slate-200 dark:border-white/[0.08] px-4 py-2.5 sm:py-3 shadow-2xl"
        style={{
          paddingBottom: 'max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))',
        }}
      >
        <div className="max-w-xl w-full mx-auto flex items-center justify-between gap-3">
          {editingCard && onDelete ? (
            <Button
              variant="danger"
              onClick={() => {
                triggerHaptic(20);
                onDelete(editingCard.id);
                onClose();
              }}
              leftIcon={<Trash2 size={16} />}
            >
              Excluir
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => {
                triggerHaptic(6);
                onClose();
              }}
            >
              Cancelar
            </Button>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              disabled={isSaving}
              onClick={() => handleSaveAndSubmit()}
              leftIcon={isSaving ? <Loader2 size={16} className="animate-spin" /> : <CardIcon size={16} />}
            >
              {isSaving ? 'Salvando...' : editingCard ? 'Atualizar Cartão' : 'Salvar Cartão'}
            </Button>
          </div>
        </div>
      </footer>

      {/* Camera and Optical Card Scanner Modal */}
      <CardScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onCardScanned={handleCardScanned}
      />
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

