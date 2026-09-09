import React, { useState, useMemo } from 'react';
import { 
  X, 
  Car, 
  DollarSign, 
  Fuel, 
  Wrench, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Share2, 
  Target, 
  Gauge, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { DriverTrip, DriverExpense, DriverGoals } from '../types';

interface DriverDaySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  trips: DriverTrip[];
  expenses: DriverExpense[];
  goals: DriverGoals;
  dateStr?: string;
}

export function DriverDaySummaryModal({
  isOpen,
  onClose,
  trips,
  expenses,
  goals,
  dateStr
}: DriverDaySummaryModalProps) {
  const [copied, setCopied] = useState(false);
  const targetDate = dateStr || new Date().toISOString().split('T')[0];

  // Day specific calculations
  const daySummary = useMemo(() => {
    const dayTrips = trips.filter(t => t.date === targetDate);
    const dayExpenses = expenses.filter(e => e.date === targetDate);

    const faturamentoBruto = dayTrips.reduce((acc, t) => acc + (t.grossAmount || 0), 0);
    const taxas = dayTrips.reduce((acc, t) => acc + (t.feeAmount || 0), 0);
    const faturamentoLiquido = dayTrips.reduce((acc, t) => acc + (t.netAmount || 0), 0);

    const combustivel = dayExpenses
      .filter(e => e.category === 'combustivel')
      .reduce((acc, e) => acc + (e.amount || 0), 0);

    const outrosCustos = dayExpenses
      .filter(e => e.category !== 'combustivel')
      .reduce((acc, e) => acc + (e.amount || 0), 0);

    const totalCustosCarro = combustivel + outrosCustos;
    const lucroReal = faturamentoLiquido - totalCustosCarro;

    const totalMinutos = dayTrips.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
    const totalKm = dayTrips.reduce((acc, t) => acc + (t.distanceKm || 0), 0);

    const horasTrabalhadas = totalMinutos / 60;
    const horasInt = Math.floor(totalMinutos / 60);
    const minutosResto = totalMinutos % 60;
    const tempoFormatado = horasInt > 0 || minutosResto > 0 ? `${horasInt}h${minutosResto > 0 ? `${String(minutosResto).padStart(2, '0')}min` : '00'}` : '0h';

    const lucroPorHora = horasTrabalhadas > 0 ? lucroReal / horasTrabalhadas : 0;
    const lucroPorKm = totalKm > 0 ? lucroReal / totalKm : 0;

    const metaDiaria = goals.daily || 300;
    const progressoMeta = metaDiaria > 0 ? Math.min(999, Math.round((lucroReal / metaDiaria) * 100)) : 0;

    // Diagnostic logic
    let diagnosticType: 'lucrativo' | 'atencao' | 'meta_superada' | 'neutro' = 'neutro';
    let diagnosticTitle = 'Resumo do Dia';
    let diagnosticMessage = 'Acompanhe o balanço do seu expediente.';

    if (faturamentoBruto > 0) {
      if (lucroReal >= metaDiaria) {
        diagnosticType = 'meta_superada';
        diagnosticTitle = 'Meta de Lucro Superada! 🎯';
        diagnosticMessage = 'Parabéns! Você bateu sua meta de lucro líquido de hoje com folga.';
      } else if (faturamentoLiquido > 0 && totalCustosCarro > faturamentoLiquido * 0.4) {
        diagnosticType = 'atencao';
        diagnosticTitle = 'Atenção';
        diagnosticMessage = 'Seu faturamento foi bom, mas seus custos reduziram bastante seu lucro.';
      } else if (lucroReal > 0 && (totalCustosCarro <= faturamentoLiquido * 0.4 || lucroReal >= metaDiaria * 0.6)) {
        diagnosticType = 'lucrativo';
        diagnosticTitle = 'Dia lucrativo';
        diagnosticMessage = 'Você teve um bom resultado hoje.';
      } else if (lucroReal <= 0 && totalCustosCarro > 0) {
        diagnosticType = 'atencao';
        diagnosticTitle = 'Atenção aos Custos';
        diagnosticMessage = 'Os custos de hoje foram superiores ao lucro obtido nas corridas.';
      }
    }

    return {
      faturamentoBruto,
      taxas,
      faturamentoLiquido,
      combustivel,
      outrosCustos,
      totalCustosCarro,
      lucroReal,
      totalMinutos,
      totalKm,
      tempoFormatado,
      lucroPorHora,
      lucroPorKm,
      metaDiaria,
      progressoMeta,
      tripsCount: dayTrips.length,
      diagnosticType,
      diagnosticTitle,
      diagnosticMessage
    };
  }, [trips, expenses, goals, targetDate]);

  // Formatted plain text for WhatsApp sharing
  const shareableText = useMemo(() => {
    const d = targetDate.split('-').reverse().join('/');
    return `Seu dia 🚗 (${d})

💰 Faturamento: R$ ${daySummary.faturamentoBruto.toFixed(2)}
💸 Taxas: R$ ${daySummary.taxas.toFixed(2)}
⛽ Combustível: R$ ${daySummary.combustivel.toFixed(2)}
🔧 Outros custos: R$ ${daySummary.outrosCustos.toFixed(2)}
📈 Lucro: R$ ${daySummary.lucroReal.toFixed(2)}

⏱️ Trabalhou: ${daySummary.tempoFormatado}
📏 Rodou: ${daySummary.totalKm.toFixed(0)} km
💵 Lucro/hora: R$ ${daySummary.lucroPorHora.toFixed(2)}
🚗 Lucro/km: R$ ${daySummary.lucroPorKm.toFixed(2)}

Meta diária de lucro: R$ ${daySummary.metaDiaria.toFixed(2)}
Progresso: ${daySummary.progressoMeta}%

*${daySummary.diagnosticTitle}*
${daySummary.diagnosticMessage}`;
  }, [daySummary, targetDate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Resumo do Dia - MeuUber (${targetDate})`,
          text: shareableText
        });
      } catch (err) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Car size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                Resumo do Dia 🚗
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Fechamento de expediente ({targetDate.split('-').reverse().join('/')})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Smart Diagnostic Callout Card */}
          <div className={`p-4 rounded-2xl border transition-all ${
            daySummary.diagnosticType === 'meta_superada' || daySummary.diagnosticType === 'lucrativo'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
              : daySummary.diagnosticType === 'atencao'
              ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500/30 text-amber-950 dark:text-amber-200'
              : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {daySummary.diagnosticType === 'meta_superada' ? (
                  <Sparkles size={20} className="text-emerald-600 dark:text-emerald-400" />
                ) : daySummary.diagnosticType === 'lucrativo' ? (
                  <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                ) : daySummary.diagnosticType === 'atencao' ? (
                  <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
                ) : (
                  <Car size={20} className="text-slate-500" />
                )}
              </div>
              <div className="space-y-0.5">
                <h4 className="font-black text-sm tracking-tight">
                  {daySummary.diagnosticTitle}
                </h4>
                <p className="text-xs opacity-90 leading-relaxed">
                  {daySummary.diagnosticMessage}
                </p>
              </div>
            </div>
          </div>

          {/* Clean Receipt / Breakdown Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] space-y-3 font-mono text-xs">
            
            {/* Financial Rows */}
            <div className="space-y-2 border-b border-slate-200 dark:border-white/[0.08] pb-3 font-sans">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  💰 <strong>Faturamento Bruto:</strong>
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  R$ {daySummary.faturamentoBruto.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                <span className="flex items-center gap-1.5">
                  💸 <strong>Taxas dos Apps:</strong>
                </span>
                <span>- R$ {daySummary.taxas.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                <span className="flex items-center gap-1.5">
                  ⛽ <strong>Combustível:</strong>
                </span>
                <span>- R$ {daySummary.combustivel.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  🔧 <strong>Outros custos:</strong>
                </span>
                <span>- R$ {daySummary.outrosCustos.toFixed(2)}</span>
              </div>
            </div>

            {/* Real Profit Result Row */}
            <div className="flex items-center justify-between text-sm sm:text-base font-sans pt-1">
              <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                📈 <strong>Lucro Líquido Real:</strong>
              </span>
              <span className={`font-black ${
                daySummary.lucroReal >= 0 
                  ? 'text-emerald-600 dark:text-emerald-400 text-lg' 
                  : 'text-rose-600 dark:text-rose-400 text-lg'
              }`}>
                R$ {daySummary.lucroReal.toFixed(2)}
              </span>
            </div>

          </div>

          {/* Operational Metrics (Time, Km, Hourly rate) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">⏱️ Trabalhou</span>
              <p className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5">
                {daySummary.tempoFormatado}
              </p>
              <span className="text-[10px] text-slate-400">{daySummary.tripsCount} corridas</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">📏 Rodou</span>
              <p className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5">
                {daySummary.totalKm.toFixed(0)} km
              </p>
              <span className="text-[10px] text-slate-400">km total</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">💵 Lucro / Hora</span>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                R$ {daySummary.lucroPorHora.toFixed(2)}
              </p>
              <span className="text-[10px] text-slate-400">por hora na rua</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">🚗 Lucro / KM</span>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                R$ {daySummary.lucroPorKm.toFixed(2)}
              </p>
              <span className="text-[10px] text-slate-400">por km rodado</span>
            </div>
          </div>

          {/* Goal Progress Section */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Target size={14} className="text-amber-500" />
                Meta diária de lucro: R$ {daySummary.metaDiaria.toFixed(2)}
              </span>
              <span className="font-black text-amber-700 dark:text-amber-400">
                {daySummary.progressoMeta}%
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div
                style={{ width: `${Math.min(100, daySummary.progressoMeta)}%` }}
                className={`h-full rounded-full transition-all duration-500 ${
                  daySummary.progressoMeta >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </div>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-white/[0.08] flex items-center gap-2.5 bg-slate-50/50 dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={handleCopy}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
          >
            {copied ? (
              <>
                <Check size={16} className="text-white stroke-[3]" />
                <span>Copiado com Sucesso!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copiar Resumo (WhatsApp)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
            title="Compartilhar resumo"
          >
            <Share2 size={16} />
          </button>
        </div>

      </motion.div>
    </div>
  );
}
