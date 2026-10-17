import React, { useState, useMemo } from 'react';
import { 
  PiggyBank, 
  Plus, 
  FolderPlus, 
  Folder, 
  Shield, 
  Sparkles, 
  TrendingUp, 
  ArrowDownRight, 
  ArrowUpRight, 
  Edit3, 
  Trash2, 
  DollarSign,
  Target,
  Building2,
  Wallet,
  Coins,
  CheckCircle2,
  Landmark,
  Layers,
  ArrowRight
} from 'lucide-react';
import { InvestmentBox, InvestmentFolder } from '../types';
import { formatCurrency } from '../utils/financeCalculations';

interface InvestmentsViewProps {
  folders: InvestmentFolder[];
  boxes: InvestmentBox[];
  onOpenAddFolder: () => void;
  onEditFolder: (folder: InvestmentFolder) => void;
  onDeleteFolder: (folderId: string) => void;
  onOpenAddBox: (folderId?: string) => void;
  onEditBox: (box: InvestmentBox) => void;
  onDeleteBox: (boxId: string) => void;
  onOpenDeposit: (box: InvestmentBox) => void;
  onOpenWithdraw: (box: InvestmentBox) => void;
}

export function InvestmentsView({
  folders,
  boxes,
  onOpenAddFolder,
  onEditFolder,
  onDeleteFolder,
  onOpenAddBox,
  onEditBox,
  onDeleteBox,
  onOpenDeposit,
  onOpenWithdraw,
}: InvestmentsViewProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');

  const totalInvested = useMemo(() => {
    return boxes.reduce((acc, curr) => acc + (curr.currentBalance || 0), 0);
  }, [boxes]);

  const estimatedMonthlyYield = useMemo(() => {
    return boxes.reduce((acc, curr) => {
      const yieldAmt = (curr.currentBalance || 0) * ((curr.monthlyYieldPercent || 0) / 100);
      return acc + yieldAmt;
    }, 0);
  }, [boxes]);

  // Projeção anual com juros compostos (cada caixinha rende sobre o saldo + rendimento do mês anterior).
  const estimatedYearlyYield = useMemo(() => {
    return boxes.reduce((acc, curr) => {
      const balance = curr.currentBalance || 0;
      const rate = (curr.monthlyYieldPercent || 0) / 100;
      return acc + balance * (Math.pow(1 + rate, 12) - 1);
    }, 0);
  }, [boxes]);

  // Overall Goal Progress
  const goalStats = useMemo(() => {
    const boxesWithGoals = boxes.filter(b => b.targetAmount && b.targetAmount > 0);
    if (boxesWithGoals.length === 0) return null;

    const totalTarget = boxesWithGoals.reduce((acc, b) => acc + (b.targetAmount || 0), 0);
    const totalCurrentForGoals = boxesWithGoals.reduce((acc, b) => acc + Math.min(b.currentBalance || 0, b.targetAmount || 0), 0);
    const progressPercent = totalTarget > 0 ? (totalCurrentForGoals / totalTarget) * 100 : 0;

    return {
      count: boxesWithGoals.length,
      totalTarget,
      totalCurrent: totalCurrentForGoals,
      progressPercent: Math.min(100, progressPercent),
    };
  }, [boxes]);

  // Active folder object if filtered
  const activeFolder = useMemo(() => {
    if (selectedFolderId === 'all') return null;
    return folders.find(f => f.id === selectedFolderId) || null;
  }, [folders, selectedFolderId]);

  // Filtered boxes
  const filteredBoxes = useMemo(() => {
    if (selectedFolderId === 'all') return boxes;
    return boxes.filter((b) => b.folderId === selectedFolderId);
  }, [boxes, selectedFolderId]);

  // Total in current filtered view
  const currentViewTotal = useMemo(() => {
    return filteredBoxes.reduce((acc, b) => acc + (b.currentBalance || 0), 0);
  }, [filteredBoxes]);

  return (
    <div className="space-y-6 sm:space-y-7 w-full max-w-full pb-8">
      
      {/* 1. Executive Summary Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        
        {/* Subtle Ambient Light Gradient Accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.04] dark:bg-emerald-400/[0.03] rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="relative p-5 sm:p-7 space-y-6">
          
          {/* Top Row: Title & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  <Coins size={11} className="stroke-[2.5]" />
                  Patrimônio & Caixinhas
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {boxes.length} {boxes.length === 1 ? 'caixinha' : 'caixinhas'} em {folders.length} {folders.length === 1 ? 'pasta' : 'pastas'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Investimentos & Reservas
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={onOpenAddFolder}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold bg-slate-100/90 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-white/[0.05] transition-colors cursor-pointer select-none"
              >
                <FolderPlus size={14} className="stroke-[2.2]" />
                <span>Nova Pasta</span>
              </button>

              <button
                type="button"
                data-tour="add-box"
                onClick={() => onOpenAddBox(selectedFolderId !== 'all' ? selectedFolderId : undefined)}
                className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4.5 py-2.5 rounded-2xl text-xs font-semibold shadow-sm hover:shadow transition-all cursor-pointer select-none"
              >
                <Plus size={15} className="stroke-[2.5]" />
                <span>Nova Caixinha</span>
              </button>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
            
            {/* Total Balance Metric */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Saldo Total Guardado
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
                    {formatCurrency(totalInvested)}
                  </span>
                </div>
              </div>

              {/* Badges / Sub-metrics */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 text-xs font-medium tabular-nums border border-slate-200/50 dark:border-white/[0.04]">
                  <PiggyBank size={12} className="text-slate-400" />
                  <span>{boxes.length} {boxes.length === 1 ? 'meta ativa' : 'metas ativas'}</span>
                </span>
                {goalStats && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 text-xs font-medium tabular-nums border border-slate-200/50 dark:border-white/[0.04]">
                    <Target size={12} className="text-emerald-500" />
                    <span>{goalStats.progressPercent.toFixed(0)}% das metas alcançadas</span>
                  </span>
                )}
              </div>
            </div>

            {/* Yield & Target Highlights */}
            <div className="lg:col-span-6 bg-slate-50/80 dark:bg-white/[0.03] p-4 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-white/[0.05] flex flex-col justify-between space-y-4">
              
              {/* Estimated Yield */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Rendimento Estimado
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{formatCurrency(estimatedMonthlyYield)}
                    </span>
                    <span className="text-xs text-slate-400">/mês</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-medium text-slate-400 block mb-0.5">
                    Projeção anual
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                    +{formatCurrency(estimatedYearlyYield)} /ano
                  </span>
                </div>
              </div>

              {/* Goal Progress Bar if goals exist */}
              {goalStats ? (
                <div className="space-y-1.5 pt-3 border-t border-slate-200/50 dark:border-white/[0.05]">
                  <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>Progresso total das metas</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                      {formatCurrency(goalStats.totalCurrent)} de {formatCurrency(goalStats.totalTarget)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200/80 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${goalStats.progressPercent}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-200/50 dark:border-white/[0.05] text-xs text-slate-400 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-emerald-500 shrink-0" />
                  <span>Defina metas em suas caixinhas para acompanhar o progresso automático.</span>
                </div>
              )}

            </div>

          </div>

        </div>
      </div>

      {/* 2. Folders Bar (Pastas Organizadoras) */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedFolderId('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none flex items-center gap-1.5 ${
              selectedFolderId === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#1C1C1E] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.08] hover:border-emerald-500/30'
            }`}
          >
            <span>Todas as Caixinhas</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
              selectedFolderId === 'all' 
                ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black' 
                : 'bg-slate-100 dark:bg-white/[0.08] text-slate-500'
            }`}>
              {boxes.length}
            </span>
          </button>

          {folders.map((folder) => {
            const count = boxes.filter((b) => b.folderId === folder.id).length;
            const isSelected = selectedFolderId === folder.id;

            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => setSelectedFolderId(folder.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none flex items-center gap-2 ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-[#1C1C1E] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.08] hover:border-emerald-500/30'
                }`}
              >
                <span 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: folder.color || '#10B981' }} 
                />
                <span>{folder.name}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isSelected 
                    ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black' 
                    : 'bg-slate-100 dark:bg-white/[0.08] text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Folder Context Banner */}
        {activeFolder && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white"
                style={{ backgroundColor: activeFolder.color || '#10B981' }}
              >
                <Folder size={18} className="stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    Pasta: {activeFolder.name}
                  </h3>
                  <span className="text-xs text-slate-400">
                    ({filteredBoxes.length} {filteredBoxes.length === 1 ? 'caixinha' : 'caixinhas'})
                  </span>
                </div>
                {activeFolder.description ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {activeFolder.description}
                  </p>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Total nesta pasta: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(currentViewTotal)}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Folder Actions */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => onEditFolder(activeFolder)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer text-xs flex items-center gap-1 px-2.5"
                title="Editar pasta"
              >
                <Edit3 size={13} />
                <span>Editar Pasta</span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteFolder(activeFolder.id)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Excluir pasta"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Caixinhas Grid */}
      {filteredBoxes.length === 0 ? (
        <div className="rounded-3xl p-10 sm:p-14 text-center bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-2xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <PiggyBank size={28} />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            {selectedFolderId === 'all' ? 'Nenhuma caixinha criada ainda' : `Nenhuma caixinha na pasta "${activeFolder?.name}"`}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Crie caixinhas para organizar sua reserva de emergência, metas de viagem, compras futuras e veja seus rendimentos automáticos a cada mês.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => onOpenAddBox(selectedFolderId !== 'all' ? selectedFolderId : undefined)}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus size={15} className="stroke-[2.5]" />
              <span>Criar Primeira Caixinha</span>
            </button>
            {folders.length === 0 && (
              <button
                type="button"
                onClick={onOpenAddFolder}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold transition-all cursor-pointer"
              >
                <FolderPlus size={15} />
                <span>Criar Pasta Organizadora</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBoxes.map((box) => {
            const folder = folders.find((f) => f.id === box.folderId);
            const progress = box.targetAmount ? Math.min(100, ((box.currentBalance || 0) / box.targetAmount) * 100) : null;
            const remaining = box.targetAmount ? Math.max(0, box.targetAmount - (box.currentBalance || 0)) : 0;
            const monthlyYield = (box.currentBalance || 0) * ((box.monthlyYieldPercent || 0) / 100);

            // Select an intuitive icon based on box title or custom icon
            const lowerTitle = box.title.toLowerCase();
            const IconComponent = lowerTitle.includes('emerg') || lowerTitle.includes('reserva')
              ? Shield
              : lowerTitle.includes('viagem') || lowerTitle.includes('férias')
                ? Compass
                : lowerTitle.includes('carro') || lowerTitle.includes('veículo') || lowerTitle.includes('moto')
                  ? Landmark
                  : lowerTitle.includes('casa') || lowerTitle.includes('imóvel') || lowerTitle.includes('apartamento')
                    ? Building2
                    : lowerTitle.includes('meta') || box.targetAmount
                      ? Target
                      : PiggyBank;

            return (
              <div
                key={box.id}
                className="rounded-3xl p-5 bg-white dark:bg-[#1C1C1E] border border-slate-200/60 dark:border-white/[0.08] shadow-[0_2px_14px_rgba(0,0,0,0.03)] dark:shadow-none hover:border-emerald-500/30 dark:hover:border-white/20 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top: Icon + Titles + Quick Action Menu */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: box.color || folder?.color || '#10B981' }}
                      >
                        <IconComponent size={20} className="stroke-[2.2]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {folder && (
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                              {folder.name}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {box.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditBox(box)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        title="Editar caixinha"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteBox(box.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Excluir caixinha"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Institution & Yield Pill */}
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                      <Landmark size={11} className="text-slate-400" />
                      <span>{box.institution || 'Banco'}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                      <TrendingUp size={11} />
                      <span>{box.yieldDescription || `${box.monthlyYieldPercent || 0.8}% a.m.`}</span>
                    </span>
                  </div>

                  {/* Saldo Atual & Rendimento Box */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/[0.04]">
                    <span className="text-xs font-normal text-slate-500 text-slate-400 uppercase tracking-wider block">
                      Saldo Acumulado
                    </span>
                    <div className="flex items-baseline justify-between gap-2 mt-0.5">
                      <span className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                        {formatCurrency(box.currentBalance || 0)}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <TrendingUp size={12} />
                      <span>Rende aprox. +{formatCurrency(monthlyYield)}/mês</span>
                    </div>
                  </div>

                  {/* Target Goal Progress */}
                  {box.targetAmount && progress !== null ? (
                    <div className="mt-3.5 space-y-1.5">
                      <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                        <span>Meta: {formatCurrency(box.targetAmount)}</span>
                        <span className="tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>
                          {remaining <= 0 ? 'Meta atingida!' : `Faltam ${formatCurrency(remaining)}`}
                        </span>
                        {remaining <= 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 size={11} /> Concluída
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Sparkles size={12} className="text-slate-400 shrink-0" />
                      <span>Reserva livre • Liquidez diária</span>
                    </div>
                  )}
                </div>

                {/* Deposit / Withdraw Action Buttons */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/[0.06] grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenDeposit(box)}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer select-none"
                  >
                    <ArrowDownRight size={14} className="stroke-[2.5]" />
                    <span>Aportar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenWithdraw(box)}
                    className="py-2.5 px-3 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200/90 dark:hover:bg-white/10 active:scale-95 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none border border-slate-200/50 dark:border-white/[0.05]"
                  >
                    <ArrowUpRight size={14} className="stroke-[2.5]" />
                    <span>Resgatar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

// Fallback icons import helper
function Compass(props: any) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  );
}
