import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Download, 
  FileText, 
  Check, 
  Copy, 
  Printer, 
  Layers, 
  CreditCard as CardIcon, 
  Wallet as WalletIcon, 
  PiggyBank, 
  Briefcase, 
  Repeat
} from 'lucide-react';
import { 
  CreditCard, 
  ExpenseItem, 
  MonthSummary, 
  Person, 
  WalletAccount, 
  WalletTransaction, 
  InvestmentBox, 
  InvestmentFolder, 
  DriverTrip, 
  DriverExpense, 
  FreelanceEntry, 
  FreelanceExpense, 
  SubscriptionItem 
} from '../types';
import { formatCurrency, formatMonthDisplay } from '../utils/financeCalculations';
import { Button } from './Button';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExpenseItem[];
  activeExpenses: { expense: ExpenseItem; currentInstallmentForMonth?: number; totalInstallments?: number }[];
  cards: CreditCard[];
  people: Person[];
  currentMonth: string;
  summary: MonthSummary;
  walletAccounts?: WalletAccount[];
  walletTransactions?: WalletTransaction[];
  boxes?: InvestmentBox[];
  folders?: InvestmentFolder[];
  driverTrips?: DriverTrip[];
  driverExpenses?: DriverExpense[];
  freelanceEntries?: FreelanceEntry[];
  freelanceExpenses?: FreelanceExpense[];
  subscriptions?: SubscriptionItem[];
}

export function ExportModal({
  isOpen,
  onClose,
  expenses,
  activeExpenses,
  cards,
  people,
  currentMonth,
  summary,
  walletAccounts = [],
  walletTransactions = [],
  boxes = [],
  folders = [],
  driverTrips = [],
  driverExpenses = [],
  freelanceEntries = [],
  freelanceExpenses = [],
  subscriptions = [],
}: ExportModalProps) {
  const [copied, setCopied] = useState(false);
  const [exportSection, setExportSection] = useState<'all' | 'cards' | 'wallet' | 'investments' | 'extra'>('all');

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
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

  const totalInvested = boxes.reduce((acc, b) => acc + b.currentBalance, 0);
  const totalWalletBalance = walletAccounts.reduce((acc, a) => acc + (a.initialBalance || 0), 0);
  const totalSubscriptionsMonthly = subscriptions.filter(s => s.active).reduce((acc, s) => acc + s.amount, 0);

  const generateReportText = () => {
    let report = `📊 RELATÓRIO FINANCEIRO CONSOLIDADO - GASTÔ?\n`;
    report += `Competência: ${formatMonthDisplay(currentMonth).toUpperCase()}\n`;
    report += `==================================================\n\n`;

    report += `1. RESUMO GERAL DAS FATURAS\n`;
    report += `--------------------------------------------------\n`;
    report += `• Total da Fatura do Mês: ${formatCurrency(summary.totalMonth)}\n`;
    report += `• Meus Gastos Pessoais: ${formatCurrency(summary.totalSelf)}\n`;
    report += `• Gastos Compartilhados (Outros): ${formatCurrency(summary.totalOthers)}\n`;
    report += `• Já Quitado: ${formatCurrency(summary.totalPaid)} | A Pagar: ${formatCurrency(summary.totalPending)}\n\n`;

    if (cards.length > 0) {
      report += `2. DETALHAMENTO POR CARTÃO DE CRÉDITO\n`;
      report += `--------------------------------------------------\n`;
      cards.forEach((card) => {
        const cardExp = activeExpenses.filter((e) => e.expense.cardId === card.id);
        const total = cardExp.reduce((acc, curr) => acc + curr.expense.amount, 0);
        report += `• ${card.name} (Fecha dia ${card.closingDay || 'N/A'}, Vence dia ${card.dueDay || 'N/A'}): ${formatCurrency(total)} (${cardExp.length} itens)\n`;
      });
      report += `\n`;
    }

    if (people.length > 0) {
      report += `3. DIVISÃO POR PESSOA / AMIGO\n`;
      report += `--------------------------------------------------\n`;
      people.forEach((p) => {
        const personExp = activeExpenses.filter((e) => e.expense.personId === p.id);
        const total = personExp.reduce((acc, curr) => acc + curr.expense.amount, 0);
        if (total > 0) {
          const isPaid = personExp.every((e) => e.expense.paidByPerson);
          report += `• ${p.name}: ${formatCurrency(total)} [${isPaid ? 'QUITADO' : 'PENDENTE'}]\n`;
          personExp.forEach((item) => {
            const inst = item.currentInstallmentForMonth
              ? `(${item.currentInstallmentForMonth}/${item.totalInstallments})`
              : '';
            report += `   - ${item.expense.description} ${inst}: ${formatCurrency(item.expense.amount)}\n`;
          });
        }
      });
      report += `\n`;
    }

    if (subscriptions.length > 0) {
      report += `4. ASSINATURAS E RECORRÊNCIAS MENSAIS\n`;
      report += `--------------------------------------------------\n`;
      report += `• Total Mensal em Assinaturas: ${formatCurrency(totalSubscriptionsMonthly)}\n`;
      subscriptions.filter(s => s.active).forEach((sub) => {
        report += `   - ${sub.name}: ${formatCurrency(sub.amount)} (${sub.category || 'Geral'})\n`;
      });
      report += `\n`;
    }

    if (boxes.length > 0) {
      report += `5. PATRIMÔNIO EM CAIXINHAS E RESERVAS\n`;
      report += `--------------------------------------------------\n`;
      report += `• Saldo Total Acumulado: ${formatCurrency(totalInvested)}\n`;
      boxes.forEach((box) => {
        report += `   - ${box.title}: ${formatCurrency(box.currentBalance)} (${box.monthlyYieldPercent}% a.m.)\n`;
      });
      report += `\n`;
    }

    if (walletAccounts.length > 0) {
      report += `6. CONTAS E CARTEIRAS\n`;
      report += `--------------------------------------------------\n`;
      walletAccounts.forEach((acc) => {
        report += `   - ${acc.name} (${acc.accountType}): Saldo Inicial ${formatCurrency(acc.initialBalance)}\n`;
      });
      report += `\n`;
    }

    if (freelanceEntries.length > 0 || driverTrips.length > 0) {
      report += `7. RENDA EXTRA (UBER / FREELANCER)\n`;
      report += `--------------------------------------------------\n`;
      if (driverTrips.length > 0) {
        const totalDriver = driverTrips.reduce((acc, t) => acc + t.grossAmount, 0);
        report += `• Motorista de App: ${driverTrips.length} viagens registradas (${formatCurrency(totalDriver)})\n`;
      }
      if (freelanceEntries.length > 0) {
        const totalFreelance = freelanceEntries.reduce((acc, f) => acc + f.amount, 0);
        report += `• Freelancer: ${freelanceEntries.length} projetos/entradas (${formatCurrency(totalFreelance)})\n`;
      }
    }

    return report;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadCompleteCSV = () => {
    let csv = 'Secao;Data;Descricao;Categoria;Valor (R$);Tipo;Parcela;Cartao_Conta;Pessoa_Cliente;Status\n';

    // 1. Despesas de Cartão
    activeExpenses.forEach((item) => {
      const exp = item.expense;
      const card = cards.find((c) => c.id === exp.cardId)?.name || 'Geral';
      const person = people.find((p) => p.id === exp.personId)?.name || 'Eu';
      const inst = item.currentInstallmentForMonth ? `${item.currentInstallmentForMonth}/${item.totalInstallments}` : '1/1';
      csv += `"Fatura/Cartao";"${exp.date}";"${exp.description}";"${exp.category}";"${exp.amount.toFixed(2)}";"${exp.type}";"${inst}";"${card}";"${person}";"${exp.paidByPerson ? 'Pago' : 'Pendente'}"\n`;
    });

    // 2. Transações da Carteira
    walletTransactions.forEach((tx) => {
      const acc = walletAccounts.find((a) => a.id === tx.accountId)?.name || 'Conta';
      csv += `"Carteira";"${tx.date}";"${tx.description}";"${tx.category}";"${tx.amount.toFixed(2)}";"${tx.type}";"1/1";"${acc}";"-";"Confirmado"\n`;
    });

    // 3. Assinaturas
    subscriptions.forEach((sub) => {
      const card = cards.find((c) => c.id === sub.cardId)?.name || 'Padrao';
      csv += `"Assinaturas";"Recorrente";"${sub.name}";"${sub.category}";"${sub.amount.toFixed(2)}";"Fixa";"-";"${card}";"-";"${sub.active ? 'Ativa' : 'Inativa'}"\n`;
    });

    // 4. Caixinhas de Investimento
    boxes.forEach((box) => {
      const folder = folders.find((f) => f.id === box.folderId)?.name || 'Geral';
      csv += `"Caixinhas";"${box.updatedAt || ''}";"${box.title}";"${folder}";"${box.currentBalance.toFixed(2)}";"Investimento";"-";"${box.institution || 'Banco'}";"-";"Rende ${box.monthlyYieldPercent}% a.m."\n`;
    });

    // 5. Renda Extra - Freelancer
    freelanceEntries.forEach((fe) => {
      csv += `"Renda Extra (Freelance)";"${fe.date}";"${fe.title}";"${fe.category}";"${fe.amount.toFixed(2)}";"Receita";"-";"-";"${fe.clientName || 'Cliente'}";"${fe.status}"\n`;
    });

    // 6. Renda Extra - Motorista
    driverTrips.forEach((dt) => {
      csv += `"Renda Extra (Motorista)";"${dt.date}";"Corrida ${dt.app}";"${dt.app}";"${dt.grossAmount.toFixed(2)}";"Receita";"-";"-";"-";"Concluido"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `gasto_relatorio_completo_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return createPortal(
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 dark:bg-black/80 backdrop-blur-sm overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#1C1C1E] rounded-[28px] max-w-xl w-full p-6 shadow-2xl border border-slate-200/60 dark:border-white/[0.08] flex flex-col max-h-[90vh] my-auto"
        >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Download size={18} />
            </div>
            <div>
              <h2 id="export-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Exportar Dados Financeiros
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gere planilhas em CSV, relatórios para WhatsApp ou imprima em PDF
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de exportação"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-4 flex-1 overflow-y-auto pr-1">
          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">Faturas do Mês</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(summary.totalMonth)}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">Em Caixinhas</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalInvested)}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">Assinaturas/Mês</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">{formatCurrency(totalSubscriptionsMonthly)}</span>
            </div>
          </div>

          {/* Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pré-visualização do Relatório Consolidado
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {formatMonthDisplay(currentMonth)}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 max-h-52 overflow-y-auto whitespace-pre-wrap select-all">
              {generateReportText()}
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <Button
              variant="outline"
              onClick={handleCopyText}
              aria-label="Copiar relatório em texto"
              leftIcon={copied ? <Check size={16} className="text-[#00C48C]" /> : <Copy size={16} />}
            >
              {copied ? 'Copiado!' : 'Copiar Texto'}
            </Button>

            <Button
              variant="primary"
              onClick={handleDownloadCompleteCSV}
              aria-label="Baixar planilha CSV completa"
              leftIcon={<FileText size={16} />}
            >
              Baixar CSV Completo
            </Button>

            <Button
              variant="secondary"
              onClick={handlePrintPDF}
              aria-label="Imprimir ou salvar em PDF"
              leftIcon={<Printer size={16} />}
            >
              Imprimir / PDF
            </Button>
          </div>

        </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
