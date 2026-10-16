import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Camera, 
  Upload, 
  RefreshCw, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  Sliders, 
  ArrowLeft, 
  CreditCard as CardIcon, 
  FlipHorizontal,
  Zap,
  DollarSign,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { CreditCard } from '../types';
import { CreditCardVisual } from './CreditCardVisual';
import { BankLogo } from './BankLogo';
import { CurrencyInput } from './CurrencyInput';
import { ALL_BANKS } from './AddCardModal';
import { triggerHaptic } from '../utils/haptics';
import { 
  analyzeCardFromCanvas, 
  cropCardFromSource, 
  ScannedCardAnalysis, 
  CARD_ASPECT_RATIO 
} from '../utils/cardScannerUtils';

interface CardScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCardScanned: (cardData: Partial<CreditCard>) => void;
}

type VisualMode = 'photo' | 'digital' | 'hybrid';

export function CardScannerModal({ isOpen, onClose, onCardScanned }: CardScannerModalProps) {
  // Step 1: Scanner / Capture, Step 2: Customization & Confirmation
  const [step, setStep] = useState<'capture' | 'preview'>('capture');

  // Camera & Stream State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  // Scanned & Generated Card State
  const [scannedResult, setScannedResult] = useState<ScannedCardAnalysis | null>(null);
  const [visualMode, setVisualMode] = useState<VisualMode>('photo');
  const [cardName, setCardName] = useState('');
  const [cardBank, setCardBank] = useState('');
  const [lastDigits, setLastDigits] = useState('');
  const [cardLimit, setCardLimit] = useState<number>(5000);
  const [closingDay, setClosingDay] = useState('8');
  const [dueDay, setDueDay] = useState('15');
  const [selectedColor, setSelectedColor] = useState('#820AD1');
  const [customGradient, setCustomGradient] = useState('');
  const [textColor, setTextColor] = useState<'light' | 'dark'>('light');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Prevent background scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  // Stop camera stream helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
    setHasTorch(false);
  }, []);

  // Start camera stream
  const startCamera = useCallback(async (facing: 'environment' | 'user' = 'environment') => {
    stopCamera();
    setCameraError(null);

    // Verify if mediaDevices is supported in current environment
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Câmera não suportada neste navegador ou ambiente. Use a opção de foto/arquivo.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setIsCameraActive(true);
        };
      }

      // Check if torch/flashlight is supported
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : {};
      if (capabilities && capabilities.torch) {
        setHasTorch(true);
      }
    } catch (err: any) {
      console.warn('Erro ao acessar a câmera:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permissão para acessar a câmera foi negada. Você pode escolher uma foto da galeria.');
      } else {
        setCameraError('Não foi possível iniciar a câmera diretamente. Utilize a opção de tirar ou escolher foto.');
      }
      setIsCameraActive(false);
    }
  }, [stopCamera]);

  // Start camera when modal opens in capture step
  useEffect(() => {
    if (isOpen && step === 'capture') {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, step, facingMode, startCamera, stopCamera]);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextState = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
      triggerHaptic(8);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  // Switch between front and back camera
  const switchCamera = () => {
    triggerHaptic(10);
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
  };

  // Process captured image canvas into visual state
  const handleProcessImageCanvas = async (croppedCanvas: HTMLCanvasElement) => {
    setIsProcessing(true);
    triggerHaptic(15);
    try {
      const analysis = await analyzeCardFromCanvas(croppedCanvas);
      setScannedResult(analysis);
      setVisualMode('photo');
      setCardBank(analysis.suggestedBank);
      setCardName(analysis.suggestedName);
      setSelectedColor(analysis.dominantColor);
      setCustomGradient(analysis.gradient);
      setTextColor(analysis.textColor);
      setStep('preview');
      stopCamera();
    } catch (err) {
      console.error('Erro ao analisar o cartão:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Capture photo from live video feed
  const handleCapturePhoto = () => {
    if (!videoRef.current || !isCameraActive) return;
    triggerHaptic(20);

    const video = videoRef.current;
    const vWidth = video.videoWidth || 1280;
    const vHeight = video.videoHeight || 720;

    // Crop area corresponding to the central card viewport frame
    // Frame width is 85% of smaller dimension or based on 1.586 ratio
    let cropWidth = vWidth * 0.85;
    let cropHeight = cropWidth / CARD_ASPECT_RATIO;

    if (cropHeight > vHeight * 0.85) {
      cropHeight = vHeight * 0.85;
      cropWidth = cropHeight * CARD_ASPECT_RATIO;
    }

    const cropX = (vWidth - cropWidth) / 2;
    const cropY = (vHeight - cropHeight) / 2;

    const croppedCanvas = cropCardFromSource(video, {
      x: cropX,
      y: cropY,
      width: cropWidth,
      height: cropHeight,
    });

    handleProcessImageCanvas(croppedCanvas);
  };

  // Handle image selected from gallery or native camera picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic(12);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Crop image to standard card ratio
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

        handleProcessImageCanvas(croppedCanvas);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Bank change in preview step
  const handleSelectBank = (bankName: string) => {
    setCardBank(bankName);
    const preset = ALL_BANKS.find((b) => b.bank.toLowerCase() === bankName.toLowerCase());
    if (preset) {
      if (!cardName || ALL_BANKS.some((b) => b.name === cardName)) {
        setCardName(preset.name);
      }
      setSelectedColor(preset.color);
      setCustomGradient(preset.gradient);
    }
    triggerHaptic(6);
  };

  // Reset to capture step
  const handleRecapture = () => {
    triggerHaptic(8);
    setScannedResult(null);
    setStep('capture');
  };

  // Save and apply card
  const handleConfirmCard = () => {
    if (!cardBank.trim()) return;
    triggerHaptic(15);

    const finalCardData: Partial<CreditCard> = {
      name: cardName.trim() || 'Meu Cartão',
      bank: cardBank.trim(),
      lastDigits: lastDigits.trim() || undefined,
      limit: cardLimit || 5000,
      closingDay: parseInt(closingDay, 10) || 8,
      dueDay: parseInt(dueDay, 10) || 15,
      color: selectedColor,
      gradient: customGradient || undefined,
      cardPhotoUrl: scannedResult?.photoDataUrl,
      visualStyle: visualMode,
      textColor: textColor,
      brand: scannedResult?.suggestedBrand || 'mastercard',
    };

    onCardScanned(finalCardData);
    onClose();
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[250] bg-black/85 backdrop-blur-md flex flex-col w-full h-full text-slate-100"
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
      }}
    >
      
      {/* Hidden File Input for Gallery Photo Selection (No capture attr so mobile opens Gallery/Photo Library) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Sticky Header */}
      <header className="shrink-0 z-50 bg-[#121214]/90 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 pt-[max(0.875rem,env(safe-area-inset-top))] pb-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={step === 'preview' ? handleRecapture : onClose}
            className="w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Voltar"
          >
            <ArrowLeft size={18} className="stroke-[2.5]" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>{step === 'capture' ? 'Escanear Cartão Físico' : 'Visual do Cartão Gerado'}</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles size={11} />
                <span>IA & Óptico</span>
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              {step === 'capture'
                ? 'Posicione a frente do seu cartão no quadro abaixo'
                : 'Seu cartão digital com a mesma identidade visual'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </header>

      {/* ========================================================================= */}
      {/* STEP 1: SCANNER COM CÂMERA AO VIVO OU OPÇÃO DE FOTO */}
      {/* ========================================================================= */}
      {step === 'capture' && (
        <main className="flex-1 overflow-y-auto overscroll-contain max-w-xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-between space-y-5 pb-24">
          
          {/* Viewfinder Frame Container */}
          <div className="relative w-full aspect-[1.586/1] rounded-[26px] overflow-hidden bg-slate-900 border-2 border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.15)] flex items-center justify-center">
            
            {/* Live Camera Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover object-center"
            />

            {/* Error or Fallback State */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-950/95 p-6 flex flex-col items-center justify-center text-center space-y-4 z-20">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <AlertCircle size={28} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Acesso à Câmera Indisponível</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">{cameraError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 hover:bg-emerald-400 active:scale-95 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Upload size={14} />
                  <span>Escolher Foto do Cartão</span>
                </button>
              </div>
            )}

            {/* Viewfinder Overlays when Camera is active */}
            {!cameraError && (
              <>
                {/* Dark Vignette outside active card bounds */}
                <div className="absolute inset-0 border-[6px] border-emerald-500/60 rounded-[24px] pointer-events-none" />

                {/* 4 Corner Target Brackets */}
                <div className="absolute top-3 left-3 w-8 h-8 border-t-3 border-l-3 border-emerald-400 rounded-tl-xl pointer-events-none shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                <div className="absolute top-3 right-3 w-8 h-8 border-t-3 border-r-3 border-emerald-400 rounded-tr-xl pointer-events-none shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                <div className="absolute bottom-3 left-3 w-8 h-8 border-b-3 border-l-3 border-emerald-400 rounded-bl-xl pointer-events-none shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                <div className="absolute bottom-3 right-3 w-8 h-8 border-b-3 border-r-3 border-emerald-400 rounded-br-xl pointer-events-none shadow-[0_0_12px_rgba(52,211,153,0.8)]" />

                {/* Animated Laser Scanning Beam */}
                <motion.div
                  animate={{ y: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-0 left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10B981] pointer-events-none z-10"
                />

                {/* Center Guidelines / Watermark */}
                <div className="absolute inset-0 flex flex-col items-center justify-between p-4 pointer-events-none z-10">
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold text-emerald-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Enquadre a frente do cartão</span>
                  </div>

                  <div className="text-center">
                    <p className="text-[11px] font-semibold text-white/90 drop-shadow-md bg-black/40 px-3 py-0.5 rounded-full">
                      Mantenha bem iluminado e sem reflexos fortes
                    </p>
                  </div>
                </div>

                {/* Camera Control Overlays (Top Right) */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                  {hasTorch && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center transition-all cursor-pointer ${
                        isTorchOn
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg'
                          : 'bg-black/60 text-white border-white/20 hover:bg-black/80'
                      }`}
                      title="Lanterna / Flash"
                    >
                      <Zap size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={switchCamera}
                    className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all cursor-pointer"
                    title="Alternar Câmera"
                  >
                    <FlipHorizontal size={16} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Capture Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-6">
              {/* Shutter Button */}
              <button
                type="button"
                disabled={isProcessing || !isCameraActive}
                onClick={handleCapturePhoto}
                className="relative group w-20 h-20 rounded-full border-4 border-white/80 p-1 flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                title="Capturar Foto do Cartão"
              >
                <div className="w-full h-full rounded-full bg-emerald-500 group-hover:bg-emerald-400 transition-colors flex items-center justify-center text-slate-950 shadow-inner">
                  <Camera size={26} className="stroke-[2.5]" />
                </div>
              </button>
            </div>

            {/* Quick Gallery Upload Button */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 text-xs font-bold border border-white/10 transition-all cursor-pointer active:scale-95"
              >
                <Upload size={14} className="text-emerald-400" />
                <span>Escolher foto da galeria do celular</span>
              </button>
            </div>

            {/* Privacy & Security Guarantee Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-200 flex items-start gap-2.5 text-xs">
              <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-emerald-300 font-bold">Privacidade & Segurança Bancária</strong>
                <p className="text-[11px] text-emerald-200/80 leading-relaxed mt-0.5">
                  Apenas a parte frontal do cartão é escaneada para extrair o design, cores e banco. 
                  <strong> Nunca solicitamos nem fotografe o verso com código CVV ou senhas.</strong>
                </p>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: PERSONALIZAÇÃO & VISUAL GERADO (FOTO REAL, DIGITAL OU HÍBRIDO) */}
      {/* ========================================================================= */}
      {step === 'preview' && (
        <main className="flex-1 overflow-y-auto overscroll-contain max-w-xl w-full mx-auto p-4 sm:p-6 pb-48 sm:pb-36 space-y-6">
          
          {/* Live 3D Generated Card Preview */}
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-400" />
                <span>Pré-visualização do Seu Cartão</span>
              </label>
              <button
                type="button"
                onClick={handleRecapture}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Tirar outra foto</span>
              </button>
            </div>

            <CreditCardVisual
              card={{
                name: cardName || 'Seu Cartão',
                bank: cardBank || 'Banco',
                lastDigits: lastDigits || undefined,
                color: selectedColor,
                gradient: customGradient,
                cardPhotoUrl: scannedResult?.photoDataUrl,
                visualStyle: visualMode,
                textColor: textColor,
                closingDay: parseInt(closingDay, 10) || 8,
                dueDay: parseInt(dueDay, 10) || 15,
                limit: cardLimit,
              }}
              interactive={true}
              tiltLimit={14}
              scale={1.03}
              className="w-full"
            />
          </section>

          {/* Visual Style Selector: 3 Options */}
          <section className="bg-[#1C1C1E] p-4 sm:p-5 rounded-3xl border border-white/[0.08] shadow-lg space-y-3">
            <label className="text-xs font-bold text-white block">
              Estilo Visual do Cartão Gerado
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setVisualMode('photo');
                  triggerHaptic(6);
                }}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  visualMode === 'photo'
                    ? 'border-emerald-500 bg-emerald-500/20 text-white shadow-md'
                    : 'border-white/10 bg-white/[0.04] text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xs font-bold block">Foto Real</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Textura Fiel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setVisualMode('digital');
                  triggerHaptic(6);
                }}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  visualMode === 'digital'
                    ? 'border-emerald-500 bg-emerald-500/20 text-white shadow-md'
                    : 'border-white/10 bg-white/[0.04] text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xs font-bold block">Design Digital</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Vetor HD</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setVisualMode('hybrid');
                  triggerHaptic(6);
                }}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  visualMode === 'hybrid'
                    ? 'border-emerald-500 bg-emerald-500/20 text-white shadow-md'
                    : 'border-white/10 bg-white/[0.04] text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xs font-bold block">Híbrido</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Foto + Brilho</span>
              </button>
            </div>
          </section>

          {/* Detected Bank Confirmation */}
          <section className="bg-[#1C1C1E] p-4 sm:p-5 rounded-3xl border border-white/[0.08] shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white">
                Instituição / Banco Detectado
              </label>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {cardBank || 'Selecione'}
              </span>
            </div>

            {/* Quick Bank Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {ALL_BANKS.slice(0, 10).map((preset) => {
                const isSelected = cardBank.toLowerCase() === preset.bank.toLowerCase();
                return (
                  <button
                    key={preset.bank}
                    type="button"
                    onClick={() => handleSelectBank(preset.bank)}
                    className={`shrink-0 px-3 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-md'
                        : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <BankLogo bankName={preset.bank} size={24} className="shrink-0" />
                    <span>{preset.bank}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Quick Edit Card Fields */}
          <section className="bg-[#1C1C1E] p-4 sm:p-5 rounded-3xl border border-white/[0.08] shadow-lg space-y-4">
            {/* Card Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nome do Cartão
              </label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Ex: Nubank Ultravioleta, Inter Black..."
                className="w-full px-4 py-3 bg-[#2C2C2E]/70 border border-white/10 rounded-2xl text-white text-base sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            {/* Last 4 Digits & Credit Limit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Últimos 4 Dígitos (Opcional)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={lastDigits}
                  onChange={(e) => setLastDigits(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 8492"
                  className="w-full px-4 py-3 bg-[#2C2C2E]/70 border border-white/10 rounded-2xl text-white text-base sm:text-sm font-mono font-bold tracking-wider focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Limite de Crédito
                </label>
                <CurrencyInput
                  value={cardLimit}
                  onChange={setCardLimit}
                  className="w-full py-3 px-4 bg-[#2C2C2E]/70 border border-white/10 rounded-2xl text-white text-base sm:text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>

            {/* Fechamento & Vencimento */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Dia Fechamento
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={closingDay}
                  onChange={(e) => setClosingDay(e.target.value)}
                  className="w-full px-4 py-3 bg-[#2C2C2E]/70 border border-white/10 rounded-2xl text-white text-base sm:text-sm font-bold text-center focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Dia Vencimento
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  className="w-full px-4 py-3 bg-[#2C2C2E]/70 border border-white/10 rounded-2xl text-white text-base sm:text-sm font-bold text-center focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>

            {/* Direct In-Form Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleConfirmCard}
                className="w-full py-3.5 px-6 font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98] cursor-pointer text-sm flex items-center justify-center gap-2"
              >
                <Check size={18} className="stroke-[3]" />
                <span>Confirmar e Usar este Cartão</span>
              </button>
            </div>
          </section>
        </main>
      )}

      {/* Sticky Bottom Bar for Confirmation */}
      {step === 'preview' && (
        <footer 
          className="shrink-0 z-50 bg-[#121214]/95 backdrop-blur-md border-t border-white/[0.08] px-4 py-3 sm:py-3.5 shadow-2xl"
          style={{
            paddingBottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))',
          }}
        >
          <div className="max-w-xl w-full mx-auto flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleRecapture}
              className="px-5 py-3 font-bold text-slate-300 hover:bg-white/[0.08] rounded-2xl transition-all cursor-pointer text-xs sm:text-sm active:scale-95"
            >
              Voltar à Câmera
            </button>

            <button
              type="button"
              onClick={handleConfirmCard}
              className="flex-1 sm:flex-none px-6 py-3 font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <Check size={16} className="stroke-[3]" />
              <span>Usar este Cartão</span>
            </button>
          </div>
        </footer>
      )}
    </div>,
    document.body
  );
}
