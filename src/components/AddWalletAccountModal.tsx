import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ArrowLeft,
  Wallet, 
  Building2, 
  Search,
  Check, 
  Trash2,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  Banknote,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { WalletAccount, WalletAccountType } from '../types';
import { formatCurrency } from '../utils/financeCalculations';
import { CurrencyInput } from './CurrencyInput';
import { triggerHaptic } from '../utils/haptics';
import { BankLogo } from './BankLogo';
import { Button } from './Button';

export interface BankOption {
  id: string;
  name: string;
  fullName: string;
  institution: string;
  category: 'popular' | 'digital' | 'tradicional' | 'investimento' | 'cooperativa' | 'especie' | 'outro';
  categoryLabel: string;
  color: string;
  gradient: string;
  accountType: WalletAccountType;
}

export const COMPREHENSIVE_BANKS: BankOption[] = [
  // Principais / Populares
  {
    id: 'nubank',
    name: 'Nubank',
    fullName: 'Nubank (Nu Pagamentos)',
    institution: 'Nubank',
    category: 'popular',
    categoryLabel: 'Bancos Populares',
    color: '#820AD1',
    gradient: 'from-purple-900 via-purple-700 to-indigo-900',
    accountType: 'pagamentos',
  },
  {
    id: 'inter',
    name: 'Banco Inter',
    fullName: 'Banco Inter S.A.',
    institution: 'Inter',
    category: 'popular',
    categoryLabel: 'Bancos Populares',
    color: '#FF7A00',
    gradient: 'from-orange-700 via-orange-500 to-amber-900',
    accountType: 'corrente',
  },
  {
    id: 'itau',
    name: 'Itaú Unibanco',
    fullName: 'Itaú Unibanco S.A.',
    institution: 'Itaú',
    category: 'popular',
    categoryLabel: 'Bancos Populares',
    color: '#EC7000',
    gradient: 'from-blue-900 via-amber-700 to-orange-600',
    accountType: 'corrente',
  },
  {
    id: 'bradesco',
    name: 'Bradesco',
    fullName: 'Banco Bradesco S.A.',
    institution: 'Bradesco',
    category: 'popular',
    categoryLabel: 'Bancos Populares',
    color: '#CC092F',
    gradient: 'from-red-900 via-red-700 to-rose-900',
    accountType: 'corrente',
  },
  {
    id: 'santander',
    name: 'Santander',
    fullName: 'Banco Santander Brasil',
    institution: 'Santander',
    category: 'popular',
    categoryLabel: 'Bancos Populares',
    color: '#EC0000',
    gradient: 'from-red-900 via-red-600 to-neutral-900',
    accountType: 'corrente',
  },
  {
    id: 'bb',
    name: 'Banco do Brasil',
    fullName: 'Banco do Brasil S.A.',
    institution: 'Banco do Brasil',
    category: 'popular',
    categoryLabel: 'Bancos Populares',
    color: '#003882',
    gradient: 'from-blue-900 via-blue-700 to-yellow-600',
    accountType: 'corrente',
  },
  {
    id: 'caixa',
    name: 'Caixa Econômica',
    fullName: 'Caixa Econômica Federal',
    institution: 'Caixa',
    category: 'popular',
    categoryLabel: 'Bancos Populares',
    color: '#005CA9',
    gradient: 'from-blue-900 via-sky-700 to-blue-950',
    accountType: 'poupanca',
  },
  {
    id: 'c6',
    name: 'C6 Bank',
    fullName: 'Banco C6 S.A.',
    institution: 'C6 Bank',
    category: 'popular',
    categoryLabel: 'Bancos Populares',
    color: '#181818',
    gradient: 'from-[#1C1C1E] via-stone-800 to-neutral-900',
    accountType: 'corrente',
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    fullName: 'Mercado Pago Conta Digital',
    institution: 'Mercado Pago',
    category: 'digital',
    categoryLabel: 'Contas Digitais & Fintechs',
    color: '#009EE3',
    gradient: 'from-sky-700 via-blue-600 to-teal-800',
    accountType: 'pagamentos',
  },
  {
    id: 'picpay',
    name: 'PicPay',
    fullName: 'PicPay Instituição de Pagamentos',
    institution: 'PicPay',
    category: 'digital',
    categoryLabel: 'Contas Digitais & Fintechs',
    color: '#11C76F',
    gradient: 'from-emerald-800 via-green-600 to-teal-900',
    accountType: 'pagamentos',
  },
  {
    id: 'dinheiro',
    name: 'Dinheiro em Espécie',
    fullName: 'Dinheiro Físico / Carteira',
    institution: 'Dinheiro',
    category: 'especie',
    categoryLabel: 'Físico / Carteira',
    color: '#10B981',
    gradient: 'from-emerald-800 via-teal-700 to-emerald-950',
    accountType: 'dinheiro',
  },
  {
    id: 'btg',
    name: 'BTG Pactual',
    fullName: 'Banco BTG Pactual S.A.',
    institution: 'BTG Pactual',
    category: 'investimento',
    categoryLabel: 'Investimentos & Bancos',
    color: '#0B1E36',
    gradient: 'from-slate-950 via-blue-950 to-indigo-950',
    accountType: 'investimento',
  },
  {
    id: 'xp',
    name: 'XP Investimentos',
    fullName: 'XP Corretora de Câmbio e Títulos',
    institution: 'XP Investimentos',
    category: 'investimento',
    categoryLabel: 'Investimentos & Bancos',
    color: '#000000',
    gradient: 'from-zinc-950 via-stone-900 to-neutral-950',
    accountType: 'investimento',
  },
  {
    id: 'pagbank',
    name: 'PagBank',
    fullName: 'PagBank PagSeguro',
    institution: 'PagBank',
    category: 'digital',
    categoryLabel: 'Contas Digitais & Fintechs',
    color: '#00B17D',
    gradient: 'from-emerald-900 via-teal-700 to-green-900',
    accountType: 'pagamentos',
  },
  {
    id: 'neon',
    name: 'Neon',
    fullName: 'Banco Neon Pagamentos',
    institution: 'Neon',
    category: 'digital',
    categoryLabel: 'Contas Digitais & Fintechs',
    color: '#00E6FF',
    gradient: 'from-cyan-900 via-sky-700 to-blue-900',
    accountType: 'pagamentos',
  },
  {
    id: 'pan',
    name: 'Banco Pan',
    fullName: 'Banco Pan S.A.',
    institution: 'Banco Pan',
    category: 'digital',
    categoryLabel: 'Contas Digitais & Fintechs',
    color: '#0080FF',
    gradient: 'from-blue-800 via-sky-600 to-blue-900',
    accountType: 'corrente',
  },
  {
    id: 'safra',
    name: 'Banco Safra',
    fullName: 'Banco Safra S.A.',
    institution: 'Safra',
    category: 'tradicional',
    categoryLabel: 'Bancos Tradicionais',
    color: '#0D1E32',
    gradient: 'from-slate-900 via-blue-950 to-stone-900',
    accountType: 'corrente',
  },
  {
    id: 'sicredi',
    name: 'Sicredi',
    fullName: 'Sicredi Cooperativa de Crédito',
    institution: 'Sicredi',
    category: 'cooperativa',
    categoryLabel: 'Cooperativas de Crédito',
    color: '#006633',
    gradient: 'from-green-900 via-emerald-800 to-teal-950',
    accountType: 'corrente',
  },
  {
    id: 'sicoob',
    name: 'Sicoob',
    fullName: 'Sicoob Sistema de Cooperativas',
    institution: 'Sicoob',
    category: 'cooperativa',
    categoryLabel: 'Cooperativas de Crédito',
    color: '#003641',
    gradient: 'from-teal-950 via-cyan-950 to-slate-900',
    accountType: 'corrente',
  },
  {
    id: 'cresol',
    name: 'Cresol',
    fullName: 'Cresol Cooperativa',
    institution: 'Cresol',
    category: 'cooperativa',
    categoryLabel: 'Cooperativas de Crédito',
    color: '#F37021',
    gradient: 'from-orange-800 via-amber-700 to-stone-900',
    accountType: 'corrente',
  },
  {
    id: 'bmg',
    name: 'Banco BMG',
    fullName: 'Banco BMG S.A.',
    institution: 'BMG',
    category: 'digital',
    categoryLabel: 'Contas Digitais & Fintechs',
    color: '#FF5A00',
    gradient: 'from-orange-800 via-amber-600 to-orange-950',
    accountType: 'corrente',
  },
  {
    id: 'outro',
    name: 'Outro Banco',
    fullName: 'Conta Personalizada / Outro Banco',
    institution: 'Outro Banco',
    category: 'outro',
    categoryLabel: 'Personalizado',
    color: '#475569',
    gradient: 'from-slate-800 via-slate-700 to-slate-900',
    accountType: 'outros',
  }
];

interface AddWalletAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Partial<WalletAccount>) => void;
  onDelete?: (id: string) => void;
  editingAccount?: WalletAccount | null;
}

export function AddWalletAccountModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingAccount,
}: AddWalletAccountModalProps) {
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('Nubank');
  const [accountType, setAccountType] = useState<WalletAccountType>('corrente');
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [color, setColor] = useState('#820AD1');
  const [gradient, setGradient] = useState('from-purple-900 via-purple-700 to-indigo-900');
  const [pixKey, setPixKey] = useState('');
  const [includeInTotal, setIncludeInTotal] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [notes, setNotes] = useState('');

  // Bank selector search & view state
  const [bankSearch, setBankSearch] = useState('');
  const [isBankSelectorOpen, setIsBankSelectorOpen] = useState(false);

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
    if (editingAccount) {
      setName(editingAccount.name || '');
      setInstitution(editingAccount.institution || 'Nubank');
      setAccountType(editingAccount.accountType || 'corrente');
      setInitialBalance(editingAccount.initialBalance || 0);
      setCurrentBalance(editingAccount.currentBalance || 0);
      setColor(editingAccount.color || '#820AD1');
      setGradient(editingAccount.gradient || 'from-purple-900 via-purple-700 to-indigo-900');
      setPixKey(editingAccount.pixKey || '');
      setIncludeInTotal(editingAccount.includeInTotal !== false);
      setIsDefault(Boolean(editingAccount.isDefault));
      setNotes(editingAccount.notes || '');
      setIsBankSelectorOpen(false);
      setBankSearch('');
    } else {
      // Default to first preset
      const preset = COMPREHENSIVE_BANKS[0];
      setName('Nubank (Conta Principal)');
      setInstitution(preset.institution);
      setAccountType(preset.accountType);
      setInitialBalance(0);
      setCurrentBalance(0);
      setColor(preset.color);
      setGradient(preset.gradient);
      setPixKey('');
      setIncludeInTotal(true);
      setIsDefault(false);
      setNotes('');
      setIsBankSelectorOpen(false);
      setBankSearch('');
    }
  }, [editingAccount, isOpen]);

  // Selected Bank Object
  const selectedBank = useMemo(() => {
    return (
      COMPREHENSIVE_BANKS.find(
        (b) => b.institution.toLowerCase() === institution.toLowerCase() || b.name.toLowerCase() === institution.toLowerCase()
      ) || COMPREHENSIVE_BANKS[0]
    );
  }, [institution]);

  // Filtered banks for search
  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return COMPREHENSIVE_BANKS;
    const q = bankSearch.toLowerCase().trim();
    return COMPREHENSIVE_BANKS.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.fullName.toLowerCase().includes(q) ||
        b.institution.toLowerCase().includes(q) ||
        b.categoryLabel.toLowerCase().includes(q)
    );
  }, [bankSearch]);

  const handleSelectBank = (bank: BankOption) => {
    triggerHaptic(10);
    setInstitution(bank.institution);
    setAccountType(bank.accountType);
    setColor(bank.color);
    setGradient(bank.gradient);

    // Auto-update name if it's default or matches a known bank
    const isAutoName = !name.trim() || 
      COMPREHENSIVE_BANKS.some((b) => b.name === name || `${b.institution} (Conta Principal)` === name || `${b.name} (Conta Principal)` === name);

    if (isAutoName) {
      if (bank.id === 'dinheiro') {
        setName('Carteira Física (Dinheiro)');
      } else if (bank.id === 'outro') {
        setName('Outra Conta Bancária');
      } else {
        setName(`${bank.name} (Conta Principal)`);
      }
    }

    setIsBankSelectorOpen(false);
    setBankSearch('');
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    triggerHaptic(12);
    const parsedInitial = initialBalance || 0;
    const parsedCurrent = editingAccount 
      ? (currentBalance || 0)
      : parsedInitial;

    onSave({
      id: editingAccount?.id,
      name: name.trim(),
      institution: institution.trim(),
      accountType,
      initialBalance: parsedInitial,
      currentBalance: parsedCurrent,
      color,
      gradient,
      pixKey: pixKey.trim() || undefined,
      includeInTotal,
      isDefault,
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });

    onClose();
  };

  return createPortal(
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed inset-0 z-[150] w-full h-full bg-slate-50 dark:bg-[#121214] text-slate-900 dark:text-white flex flex-col overflow-hidden"
      >
        {/* ========================================================================= */}
        {/* 🌟 FULL SCREEN TOP HEADER BAR */}
        {/* ========================================================================= */}
        <header className="sticky top-0 z-20 w-full bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.08] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(8);
                onClose();
              }}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
              title="Voltar / Fechar"
              aria-label="Voltar / Fechar"
            >
              <ArrowLeft size={20} className="stroke-[2.2]" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
                <Wallet size={18} className="text-emerald-500 shrink-0" />
                {editingAccount ? 'Editar Conta Bancária' : 'Nova Conta ou Carteira'}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Gerencie saldo real, dados do banco e formas de pagamento
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Check size={16} className="stroke-[2.5]" />
              <span className="hidden sm:inline">
                {editingAccount ? 'Salvar' : 'Criar Conta'}
              </span>
              <span className="sm:hidden">Salvar</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 🌟 SCROLLABLE FORM BODY */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-28">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">

            {/* ===================================================================== */}
            {/* 🏦 CAMPO DE SELEÇÃO DE BANCO (MELHORADO & COMPLETO) */}
            {/* ===================================================================== */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Building2 size={15} className="text-emerald-500" />
                  Banco ou Instituição Financeira *
                </label>
                <span className="text-[11px] text-slate-400">
                  {selectedBank.fullName}
                </span>
              </div>

              {/* Active Selected Bank Display Card */}
              <div 
                onClick={() => {
                  triggerHaptic(8);
                  setIsBankSelectorOpen(!isBankSelectorOpen);
                }}
                className="group p-3.5 sm:p-4 rounded-xl border border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all cursor-pointer flex items-center justify-between gap-3 select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    <BankLogo bankName={institution} size={42} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                        {selectedBank.name}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        {selectedBank.categoryLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {selectedBank.fullName}
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

              {/* Search Field & Comprehensive Bank List (Toggleable or Expandable) */}
              {isBankSelectorOpen && (
                <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] space-y-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search 
                      size={18} 
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
                    />
                    <input
                      type="text"
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      placeholder="Buscar banco ou instituição (ex: Nubank, Inter, Itaú, BB, Caixa, C6...)"
                      className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.12] rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
                      autoFocus
                    />
                    {bankSearch && (
                      <button
                        type="button"
                        onClick={() => setBankSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  {/* List of Filtered Banks with Full Names */}
                  <div className="max-h-64 overflow-y-auto pr-1 space-y-1 divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {filteredBanks.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        Nenhum banco encontrado com &ldquo;{bankSearch}&rdquo;. Você pode escolher &ldquo;Outro Banco&rdquo; abaixo.
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => handleSelectBank(COMPREHENSIVE_BANKS.find(b => b.id === 'outro')!)}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-white/[0.08] rounded-lg text-slate-800 dark:text-slate-200 font-medium"
                          >
                            Usar Banco Personalizado
                          </button>
                        </div>
                      </div>
                    ) : (
                      filteredBanks.map((bank) => {
                        const isCurrent = institution.toLowerCase() === bank.institution.toLowerCase();
                        return (
                          <button
                            key={bank.id}
                            type="button"
                            onClick={() => handleSelectBank(bank)}
                            className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                              isCurrent
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold'
                                : 'hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                <BankLogo bankName={bank.institution} size={36} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-semibold truncate">
                                  {bank.name}
                                </div>
                                <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                  {bank.fullName}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400">
                                {bank.categoryLabel}
                              </span>
                              {isCurrent && (
                                <Check size={16} className="text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ===================================================================== */}
            {/* 📝 DADOS PRINCIPAIS DA CONTA */}
            {/* ===================================================================== */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Wallet size={15} className="text-emerald-500" />
                Identificação & Saldo
              </h2>

              {/* Account Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome da Conta / Identificação *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Nubank (Principal), Inter Invest, Carteira Física..."
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                />
              </div>

              {/* Type & Balances Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Account Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tipo de Conta
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as WalletAccountType)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="corrente">Conta Corrente</option>
                    <option value="pagamentos">Conta de Pagamentos / Digital</option>
                    <option value="poupanca">Conta Poupança</option>
                    <option value="dinheiro">Dinheiro Físico (Espécie)</option>
                    <option value="investimento">Conta Investimentos</option>
                    <option value="outros">Outro Tipo</option>
                  </select>
                </div>

                {/* Initial / Current Balance */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {editingAccount ? 'Saldo Atual em Conta' : 'Saldo Inicial Atual (R$)'}
                  </label>
                  <CurrencyInput
                    value={editingAccount ? currentBalance : initialBalance}
                    onChange={(val) => {
                      if (editingAccount) {
                        setCurrentBalance(val);
                      } else {
                        setInitialBalance(val);
                      }
                    }}
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {editingAccount ? 'Valor que reflete o dinheiro real em conta agora' : 'Saldo existente no momento do cadastro'}
                  </span>
                </div>
              </div>

              {/* Pix Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Chave Pix vinculada a esta conta (opcional)
                </label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="Ex: seu-pix@email.com, telefone ou CPF"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* ===================================================================== */}
            {/* 🎨 PERSONALIZAÇÃO VISUAL & PREFERÊNCIAS */}
            {/* ===================================================================== */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <SlidersHorizontal size={15} className="text-emerald-500" />
                Personalização & Ajustes
              </h2>

              {/* Color Tag Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Cor de Identificação no App
                </label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {[
                    { c: '#820AD1', g: 'from-purple-900 via-purple-700 to-indigo-900' },
                    { c: '#FF7A00', g: 'from-orange-700 via-orange-500 to-amber-900' },
                    { c: '#EC7000', g: 'from-blue-900 via-amber-700 to-orange-600' },
                    { c: '#CC092F', g: 'from-red-900 via-red-700 to-rose-900' },
                    { c: '#EC0000', g: 'from-red-900 via-red-600 to-neutral-900' },
                    { c: '#003882', g: 'from-blue-900 via-blue-700 to-yellow-600' },
                    { c: '#005CA9', g: 'from-blue-900 via-sky-700 to-blue-950' },
                    { c: '#009EE3', g: 'from-sky-700 via-blue-600 to-teal-800' },
                    { c: '#11C76F', g: 'from-emerald-800 via-green-600 to-teal-900' },
                    { c: '#10B981', g: 'from-emerald-800 via-teal-700 to-emerald-950' },
                    { c: '#181818', g: 'from-[#1C1C1E] via-stone-800 to-neutral-900' },
                    { c: '#475569', g: 'from-slate-800 via-slate-700 to-slate-900' },
                  ].map((item) => (
                    <button
                      key={item.c}
                      type="button"
                      onClick={() => {
                        triggerHaptic(8);
                        setColor(item.c);
                        setGradient(item.g);
                      }}
                      className={`w-8 h-8 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center justify-center ${
                        color === item.c 
                          ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110 shadow-md' 
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{ backgroundColor: item.c }}
                    >
                      {color === item.c && <Check size={14} className="text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options: Include in Total & Set Default */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                  <input
                    type="checkbox"
                    checked={includeInTotal}
                    onChange={(e) => setIncludeInTotal(e.target.checked)}
                    className="mt-0.5 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Somar no Saldo Total da Carteira
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Quando ativado, o saldo desta conta compõe o total geral visível no topo da Carteira.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="mt-0.5 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      Definir como Conta Padrão
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Esta conta será selecionada automaticamente em novos pagamentos Pix e débito.
                    </span>
                  </div>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Observações adicionais (opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Agência 0001, Conta 12345-6, usar para despesas da casa..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/[0.10] rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

          </form>
        </div>

        {/* ========================================================================= */}
        {/* 🌟 STICKY BOTTOM ACTION FOOTER */}
        {/* ========================================================================= */}
        <footer className="sticky bottom-0 z-20 w-full bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-white/[0.08] px-4 sm:px-6 py-3.5 shadow-lg">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            {editingAccount && onDelete ? (
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={() => {
                  triggerHaptic(15);
                  if (confirm('Deseja realmente excluir esta conta da carteira?')) {
                    onDelete(editingAccount.id);
                    onClose();
                  }
                }}
                leftIcon={<Trash2 size={16} />}
              >
                Excluir Conta
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onClose}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSubmit}
                leftIcon={<Check size={16} className="stroke-[2.5]" />}
              >
                {editingAccount ? 'Salvar Alterações' : 'Criar Conta Bancária'}
              </Button>
            </div>
          </div>
        </footer>

      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
