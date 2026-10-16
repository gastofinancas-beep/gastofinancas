import React from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Calendar, 
  Users, 
  TrendingUp
} from 'lucide-react';
import { BankLogo } from './BankLogo';
import { ContactlessIcon, EmvSmartChip } from './CreditCardVisual';
import { triggerHaptic } from '../utils/haptics';

interface CardsEmptyIllustrationProps {
  onOpenAddCard: (prefillBank?: string) => void;
}

// Bancos mais populares com logos oficiais do repositório Tgentil/Bancos-em-SVG / logos-bancos-br
const POPULAR_BANKS = [
  { name: 'Nubank', label: 'Nubank' },
  { name: 'Itaú', label: 'Itaú' },
  { name: 'Inter', label: 'Banco Inter' },
  { name: 'C6 Bank', label: 'C6 Bank' },
  { name: 'Bradesco', label: 'Bradesco' },
  { name: 'Santander', label: 'Santander' },
  { name: 'XP', label: 'XP' },
  { name: 'PicPay', label: 'PicPay' },
  { name: 'Banco do Brasil', label: 'Banco do Brasil' },
  { name: 'Caixa', label: 'Caixa' },
  { name: 'BTG Pactual', label: 'BTG Pactual' },
  { name: 'PagBank', label: 'PagBank' }
];

export function CardsEmptyIllustration({ onOpenAddCard }: CardsEmptyIllustrationProps) {
  return (
    <div className="py-4 sm:py-8 px-2 sm:px-4 max-w-2xl mx-auto flex flex-col items-center text-center">
      
      {/* ========================================================================= */}
      {/* 1. DESENHO VETORIAL 3D DOS CARTÕES COM OS LOGOS OFICIAIS DOS BANCOS */}
      {/* ========================================================================= */}
      <div className="relative w-full max-w-xs sm:max-w-sm h-64 sm:h-72 mb-4 flex items-center justify-center select-none">
        
        {/* Glow de fundo */}
        <div className="absolute inset-0 bg-radial from-emerald-500/20 via-purple-500/10 to-transparent blur-3xl -z-10 rounded-full" />

        {/* STACK DE 3 CARTÕES EM PERSPECTIVA REAL */}
        <div className="relative w-64 sm:w-72 h-40 sm:h-44">
          
          {/* CARTÃO 3 (FUNDO - ITAÚ / AZUL ESCURO & LARANJA) */}
          <motion.div
            initial={{ rotate: -12, y: -15, x: -15 }}
            animate={{ rotate: [-12, -10, -12], y: [-15, -18, -15] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-[20px] bg-linear-to-tr from-[#002D72] via-[#0D3880] to-[#EC7000] p-4 text-white shadow-xl border border-white/20 flex flex-col justify-between overflow-hidden"
          >
            {/* Brilho diagonal */}
            <div className="absolute inset-0 bg-linear-to-tr from-white/15 to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between">
              <BankLogo bankName="Itaú" size={32} />
              <ContactlessIcon className="text-white/80" />
            </div>
            <div className="relative z-10 flex items-end justify-between">
              <span className="text-[10px] font-mono tracking-widest text-white/70">•••• 5120</span>
              <span className="text-[11px] font-bold tracking-wider text-white/90">VISA</span>
            </div>
          </motion.div>

          {/* CARTÃO 2 (MEIO - C6 BANK CARBON / DARK METALLIC) */}
          <motion.div
            initial={{ rotate: 8, y: 5, x: 22 }}
            animate={{ rotate: [8, 6, 8], y: [5, 2, 5] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
            className="absolute inset-0 rounded-[20px] bg-linear-to-tr from-[#121214] via-[#242428] to-[#3B3B42] p-4 text-white shadow-2xl border border-white/20 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute inset-0 bg-linear-to-tr from-white/20 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between">
              <BankLogo bankName="C6 Bank" size={32} />
              <EmvSmartChip size="sm" />
            </div>
            <div className="relative z-10 flex items-end justify-between">
              <span className="text-[10px] font-mono tracking-widest text-white/70">•••• 9401</span>
              <span className="text-[11px] font-bold tracking-wider text-amber-400">CARBON</span>
            </div>
          </motion.div>

          {/* CARTÃO 1 (FRENTE - NUBANK ROXINHO ULTRA / PRINCIPAL) */}
          <motion.div
            initial={{ rotate: -3, y: 22, x: -5 }}
            animate={{ rotate: [-3, -1, -3], y: [22, 18, 22] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-[20px] bg-linear-to-tr from-[#5C0D8B] via-[#820AD1] to-[#9914E8] p-4 text-white shadow-2xl border border-white/30 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute inset-0 bg-linear-to-tr from-white/25 via-white/5 to-transparent pointer-events-none" />
            
            {/* Topo do cartão com Logo Oficial do Nubank e Contactless */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BankLogo bankName="Nubank" size={36} />
                <span className="text-xs font-bold tracking-tight text-white drop-shadow-xs">
                  Gastô<span className="text-emerald-300">?</span> Card
                </span>
              </div>
              <ContactlessIcon className="text-white/90" />
            </div>

            {/* Chip EMV Inteligente */}
            <div className="relative z-10 flex items-center gap-2 my-auto">
              <EmvSmartChip size="md" />
            </div>

            {/* Rodapé com Dígitos e Bandeira Mastercard */}
            <div className="relative z-10 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-mono tracking-[0.2em] text-white/90 font-bold">
                  •••• &nbsp;•••• &nbsp;8842
                </p>
                <p className="text-[9px] font-medium text-white/70 uppercase tracking-wider mt-0.5">
                  SEU NOME AQUI
                </p>
              </div>

              {/* Círculos da Bandeira */}
              <div className="flex -space-x-2">
                <div className="w-5 h-5 rounded-full bg-[#EB001B]/95 shadow-xs" />
                <div className="w-5 h-5 rounded-full bg-[#F79E1B]/95 shadow-xs" />
              </div>
            </div>
          </motion.div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. TEXTO EXPLICATIVO DO MÓDULO (INTUITIVO & DIRETO AO PONTO) */}
      {/* ========================================================================= */}
      <div className="space-y-2 max-w-lg mt-1">
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Todos os seus cartões organizados em um só lugar
        </h3>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Chega de surpresas no fim do mês ou pagar juros por esquecer o vencimento. Cadastre seus cartões para acompanhar o fechamento das faturas, o limite disponível em tempo real e dividir compras com quem dividiu a conta.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 3. OS 3 PILARES DO MÓDULO (CARDS INFORMATIVOS CLEAN) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6 w-full text-left">
        
        {/* Pilar 1: Faturas & Vencimento */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/70 dark:border-white/[0.08] shadow-xs space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
            <Calendar size={17} />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            Faturas & Vencimentos
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            Contagem regressiva de dias até o vencimento e alerta de fechamento.
          </p>
        </div>

        {/* Pilar 2: Limite Consolidado */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/70 dark:border-white/[0.08] shadow-xs space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <TrendingUp size={17} />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            Limite em Tempo Real
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            Veja quanto limite você ainda tem livre somando todos os seus cartões.
          </p>
        </div>

        {/* Pilar 3: Divisão com Amigos */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-slate-200/70 dark:border-white/[0.08] shadow-xs space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Users size={17} />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            Divisão de Compras
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            Saiba quanto da fatura é seu e quanto amigos ou parentes devem a você.
          </p>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. BOTÃO DE CADASTRO */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => {
            onOpenAddCard();
            triggerHaptic(12);
          }}
          className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus size={18} className="stroke-[3]" />
          <span>Cadastrar Cartão</span>
        </motion.button>
      </div>

      {/* ========================================================================= */}
      {/* 5. ATALHOS RÁPIDOS DE 1 TOQUE COM OS LOGOS OFICIAIS DOS BANCOS (SVG) */}
      {/* ========================================================================= */}
      <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-white/[0.08] w-full">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-3 text-center">
          Ou toque no seu banco para adicionar com 1 clique:
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto">
          {POPULAR_BANKS.map((bank) => (
            <motion.button
              key={bank.name}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                onOpenAddCard(bank.name);
                triggerHaptic(8);
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 shadow-2xs text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer group"
            >
              <BankLogo bankName={bank.name} size={24} />
              <span>{bank.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

    </div>
  );
}

export default CardsEmptyIllustration;
