import React, { useState } from 'react';
import { X, Download, FileText, Check, Copy } from 'lucide-react';
import { CreditCard, ExpenseItem, MonthSummary, Person } from '../types';
import { formatCurrency, formatMonthDisplay } from '../utils/financeCalculations';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExpenseItem[];
  activeExpenses: { expense: ExpenseItem; currentInstallmentForMonth?: number; totalInstallments?: number }[];
  cards: CreditCard[];
  people: Person[];
  currentMonth: string;
  summary: MonthSummary;
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
}: ExportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateReportText = () => {
    let report = `📊 RELATÓRIO FINANCEIRO GASTÔ? - ${formatMonthDisplay(currentMonth).toUpperCase()}\n`;
    report += `--------------------------------------------------\n`;
    report += `Total Fatura do Mês: ${formatCurrency(summary.totalMonth)}\n`;
    report += `Meus Gastos Pessoais: ${formatCurrency(summary.totalSelf)}\n`;
    report += `Gastos de Outras Pessoas: ${formatCurrency(summary.totalOthers)}\n`;
    report += `Já Pago: ${formatCurrency(summary.totalPaid)} | Pendente: ${formatCurrency(summary.totalPending)}\n\n`;

    report += `💳 POR CARTÃO:\n`;
    cards.forEach((card) => {
      const cardExp = activeExpenses.filter((e) => e.expense.cardId === card.id);
      const total = cardExp.reduce((acc, curr) => acc + curr.expense.amount, 0);
      if (total > 0) {
        report += `• ${card.name}: ${formatCurrency(total)} (${cardExp.length} compras)\n`;
      }
    });

    report += `\n👥 DIVISÃO POR PESSOA:\n`;
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

    return report;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadCSV = () => {
    let csv = 'Data;Descricao;Categoria;Valor (R$);Tipo;Parcela;Cartao;Pessoa;Pago\n';
    activeExpenses.forEach((item) => {
      const exp = item.expense;
      const card = cards.find((c) => c.id === exp.cardId)?.name || 'Outro';
      const person = people.find((p) => p.id === exp.personId)?.name || 'Desconhecido';
      const inst = item.currentInstallmentForMonth ? `${item.currentInstallmentForMonth}/${item.totalInstallments}` : '1/1';
      csv += `"${exp.date}";"${exp.description}";"${exp.category}";"${exp.amount.toFixed(2)}";"${exp.type}";"${inst}";"${card}";"${person}";"${exp.paidByPerson ? 'Sim' : 'Nao'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `gasto_relatorio_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Download size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Exportar e Compartilhar
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Copie o resumo detalhado para enviar no WhatsApp ou baixe uma planilha formatada em CSV.
          </p>

          <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
            {generateReportText()}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              {copied ? 'Copiado!' : 'Copiar Texto'}
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs"
            >
              <FileText size={16} />
              Baixar CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
