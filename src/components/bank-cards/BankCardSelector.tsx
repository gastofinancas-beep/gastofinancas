import React, { useState, useMemo } from 'react';
import { Search, Check, Sparkles, Filter, SlidersHorizontal, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ALL_BANK_CARDS, 
  filterBankCards, 
  getBanksCatalog, 
  getCardPresetById,
  CATEGORY_LABELS,
  CardCategory,
  CardNetwork,
  BankCardPreset
} from '../../data/bankCards';
import { BankLogo } from '../BankLogo';
import { triggerHaptic } from '../../utils/haptics';

interface BankCardSelectorProps {
  selectedDesignId?: string;
  selectedColorVariantId?: string;
  onSelectCard: (preset: BankCardPreset, colorVariantId?: string) => void;
  className?: string;
  defaultBankId?: string;
}

export function BankCardSelector({
  selectedDesignId,
  selectedColorVariantId,
  onSelectCard,
  className = '',
  defaultBankId,
}: BankCardSelectorProps) {
  const [selectedBankId, setSelectedBankId] = useState<string>(defaultBankId || 'nubank');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CardCategory | 'all'>('all');
  const [selectedNetwork, setSelectedNetwork] = useState<CardNetwork | 'all'>('all');
  const [showLegacy, setShowLegacy] = useState(false);

  const banks = useMemo(() => getBanksCatalog(), []);

  // Se o usuário estiver pesquisando algo, pode buscar em todos os bancos
  const activeBankFilter = searchQuery.trim() ? undefined : selectedBankId;

  const filteredCards = useMemo(() => {
    return filterBankCards({
      bankId: activeBankFilter,
      category: selectedCategory,
      network: selectedNetwork,
      status: showLegacy ? 'all' : 'current',
      searchQuery,
    });
  }, [activeBankFilter, selectedCategory, selectedNetwork, showLegacy, searchQuery]);

  const currentPreset = useMemo(() => {
    return getCardPresetById(selectedDesignId) || filteredCards[0];
  }, [selectedDesignId, filteredCards]);

  const handleSelectCardPreset = (preset: BankCardPreset) => {
    triggerHaptic(8);
    const defaultVariant = preset.colorVariants?.[0]?.id;
    onSelectCard(preset, defaultVariant);
  };

  const handleSelectVariant = (variantId: string) => {
    if (!currentPreset) return;
    triggerHaptic(5);
    onSelectCard(currentPreset, variantId);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. Barra de Busca com atalhos */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar cartão... (ex: ultravioleta, carbon, pão, black, prime)"
          className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* 2. Seleção de Bancos (Carrossel Horizontal com logos oficiais dos bancos) */}
      {!searchQuery && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1">
            <span>Selecione a Instituição:</span>
            <span>{banks.length} bancos disponíveis</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
            {banks.map(bank => {
              const isSelected = selectedBankId === bank.id;
              return (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => {
                    setSelectedBankId(bank.id);
                    triggerHaptic(5);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                      : 'bg-white dark:bg-[#1C1C1E] border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <BankLogo bankName={bank.name} size={20} />
                  <span>{bank.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {bank.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Filtros de Categoria (Pills horizontais) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-full font-medium shrink-0 transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
          }`}
        >
          Todas as Categorias
        </button>

        {(Object.keys(CATEGORY_LABELS) as CardCategory[]).map(cat => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full font-medium shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
              }`}
            >
              {CATEGORY_LABELS[cat].label}
            </button>
          );
        })}
      </div>

      {/* 4. Grade de Cartões Disponíveis */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1">
          <span>Cartões ({filteredCards.length}):</span>
          {showLegacy ? (
            <button
              type="button"
              onClick={() => setShowLegacy(false)}
              className="text-emerald-500 hover:underline cursor-pointer"
            >
              Ocultar legados
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowLegacy(true)}
              className="hover:underline cursor-pointer text-slate-400"
            >
              Exibir legados
            </button>
          )}
        </div>

        {filteredCards.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
            Nenhum cartão encontrado com os filtros selecionados.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[290px] overflow-y-auto pr-1">
            {filteredCards.map(preset => {
              const isSelected = (selectedDesignId || filteredCards[0]?.id) === preset.id;
              const catConfig = CATEGORY_LABELS[preset.category];

              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectCardPreset(preset)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left ${
                    isSelected
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 shadow-xs'
                      : 'bg-white dark:bg-[#1C1C1E] border-slate-200/70 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Amostra visual em miniatura */}
                    <div
                      style={{
                        background: `linear-gradient(135deg, ${preset.colors.primary}, ${preset.colors.secondary || preset.colors.primary})`,
                      }}
                      className="w-11 h-7 rounded-md border border-white/20 shrink-0 shadow-xs flex items-center justify-center text-[8px] font-bold text-white uppercase"
                    >
                      {preset.network === 'mastercard' ? 'MC' : preset.network.slice(0, 3)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {preset.name}
                        </span>
                        {preset.availability.status === 'legacy' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                            Legado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {preset.bankName}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full ${catConfig.badge}`}>
                          {catConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-white/20'
                      }`}
                    >
                      {isSelected && <Check size={12} className="stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Seletor de Variantes de Cores (quando o cartão possuir variantes, ex: C6 Bank) */}
      {currentPreset?.colorVariants && currentPreset.colorVariants.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              Cores Disponíveis do Cartão:
            </span>
            <span className="text-[11px] font-normal text-slate-500">
              {currentPreset.colorVariants.find(v => v.id === selectedColorVariantId)?.name || 'Padrão'}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {currentPreset.colorVariants.map(variant => {
              const isVariantActive = (selectedColorVariantId || currentPreset.colorVariants![0].id) === variant.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  title={variant.name}
                  onClick={() => handleSelectVariant(variant.id)}
                  style={{ backgroundColor: variant.primary }}
                  className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer shrink-0 flex items-center justify-center ${
                    isVariantActive
                      ? 'border-emerald-500 scale-110 shadow-md ring-2 ring-emerald-500/30'
                      : 'border-white/40 hover:scale-105'
                  }`}
                >
                  {isVariantActive && <Check size={13} className="text-white drop-shadow-md stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
