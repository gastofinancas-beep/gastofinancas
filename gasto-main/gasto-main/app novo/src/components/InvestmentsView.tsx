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
  Building2
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
    return boxes.reduce((acc, curr) => acc + curr.currentBalance, 0);
  }, [boxes]);

  const estimatedMonthlyYield = useMemo(() => {
    return boxes.reduce((acc, curr) => {
      const yieldAmt = curr.currentBalance * (curr.monthlyYieldPercent / 100);
      return acc + yieldAmt;
    }, 0);
  }, [boxes]);

  const filteredBoxes = useMemo(() => {
    if (selectedFolderId === 'all') return boxes;
    return boxes.filter((b) => b.folderId === selectedFolderId);
  }, [boxes, selectedFolderId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Total Saved and Yield */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <PiggyBank size={16} />
              <span>Patrimônio em Caixinhas & Reservas</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {formatCurrency(totalInvested)}
            </h2>
            <p className="text-xs text-emerald-200/80 mt-1">
              {boxes.length} {boxes.length === 1 ? 'caixinha ativa' : 'caixinhas ativas'} organizadas em pastas
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-emerald-200 block">Rendimento Estimado / Mês</span>
              <span className="text-base font-extrabold text-emerald-300">
                +{formatCurrency(estimatedMonthlyYield)} <span className="text-[10px] text-white/70 font-normal">a.m.</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Folders Bar & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setSelectedFolderId('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedFolderId === 'all'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Todas as Caixinhas ({boxes.length})
          </button>

          {folders.map((folder) => {
            const count = boxes.filter((b) => b.folderId === folder.id).length;
            const isSelected = selectedFolderId === folder.id;

            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => setSelectedFolderId(folder.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: folder.color }} />
                <span>{folder.name} ({count})</span>
              </button>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={onOpenAddFolder}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <FolderPlus size={15} />
            <span>Nova Pasta</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenAddBox(selectedFolderId !== 'all' ? selectedFolderId : undefined)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95"
          >
            <Plus size={15} />
            <span>Nova Caixinha</span>
          </button>
        </div>
      </div>

      {/* Boxes Grid */}
      {filteredBoxes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <PiggyBank size={36} className="mx-auto text-slate-400 mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Nenhuma caixinha nesta pasta.</p>
          <button
            type="button"
            onClick={() => onOpenAddBox(selectedFolderId !== 'all' ? selectedFolderId : undefined)}
            className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
          >
            Criar Caixinha Agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBoxes.map((box) => {
            const folder = folders.find((f) => f.id === box.folderId);
            const progress = box.targetAmount ? Math.min(100, (box.currentBalance / box.targetAmount) * 100) : null;
            const monthlyYield = box.currentBalance * (box.monthlyYieldPercent / 100);

            return (
              <div
                key={box.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between group hover:border-emerald-500/40 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      {folder && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          {folder.name}
                        </span>
                      )}
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                        {box.title}
                      </h3>
                      {box.institution && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          {box.institution} • {box.yieldDescription || '100% CDI'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => onEditBox(box)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteBox(box.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="mt-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Saldo Atual</span>
                    <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {formatCurrency(box.currentBalance)}
                    </p>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Rende aprox. +{formatCurrency(monthlyYield)}/mês
                    </span>
                  </div>

                  {/* Target Goal Progress */}
                  {box.targetAmount && progress !== null && (
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        <span>Meta: {formatCurrency(box.targetAmount)}</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Deposit / Withdraw Action Buttons */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenDeposit(box)}
                    className="py-2 px-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ArrowDownRight size={14} />
                    <span>Aportar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenWithdraw(box)}
                    className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ArrowUpRight size={14} />
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
