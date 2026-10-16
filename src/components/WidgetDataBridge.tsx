import React, { useEffect, useMemo } from 'react';
import { 
  ExpenseItem, 
  IncomeItem, 
  CreditCard, 
  SubscriptionItem, 
  MonthlySavingsTarget, 
  WalletAccount, 
  CardBillPayment, 
  Person 
} from '../types';
import { 
  calculateMonthSummary, 
  getActiveExpensesForMonth, 
  getActiveIncomesForMonth,
  buildMonthlyHistory,
  formatCurrency 
} from '../utils/financeCalculations';

export interface WidgetDataBridgeProps {
  expenses: ExpenseItem[];
  incomes: IncomeItem[];
  cards: CreditCard[];
  subscriptions: SubscriptionItem[];
  currentMonth: string;
  monthlyTargets: Record<string, MonthlySavingsTarget>;
  walletAccounts: WalletAccount[];
  paidBills: CardBillPayment[];
  people: Person[];
}

export interface GastoWidgetData {
  percentGasto: number;
  healthStatus: 'ok' | 'warning' | 'danger';
  gastoTotal: string;
  saldoDisponivel: string;
  proximaFatura: {
    valor: string;
    diasRestantes: number;
  };
  totalAssinaturas: string;
  metaMes: string;
  mesAno: string;
  saldoTotal?: string;
  historyBars?: { monthYear: string; expense: number; income: number }[];
  cobrancas: {
    totalAReceber: string;
    totalPessoas: number;
    totalItens: number;
    pessoas: Array<{
      personId: string;
      nome: string;
      iniciais: string;
      totalAReceber: string;
      cartaoNome: string;
      quantidadeItens: number;
    }>;
    quantidadePagaram: number;
  };
}

export function useWidgetSync(expenses: ExpenseItem[], incomes: IncomeItem[]) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('gasto_widget_updated'));
  }, [expenses, incomes]);
}

export function WidgetDataBridge({
  expenses,
  incomes,
  cards,
  subscriptions,
  currentMonth,
  monthlyTargets,
  walletAccounts,
  paidBills,
  people,
}: WidgetDataBridgeProps) {
  useEffect(() => {
    try {
      // 1. Total Gasto no Mês
      const monthSummary = calculateMonthSummary(expenses, currentMonth);
      const totalMonth = monthSummary.totalMonth;

      // 1b. Orçamento do Mês (meta ou soma dos incomes do mês)
      const targetLimit = monthlyTargets[currentMonth]?.targetExpenseLimit;
      const activeIncomes = getActiveIncomesForMonth(incomes, currentMonth);
      const incomeSum = activeIncomes.reduce((acc, inc) => acc + (inc.amount || 0), 0);
      
      const orcamentoMes = (targetLimit && targetLimit > 0) 
        ? targetLimit 
        : (incomeSum > 0 ? incomeSum : 0);

      // 1c. percentGasto: número 0 a 100
      let percentGasto = 0;
      if (orcamentoMes > 0) {
        percentGasto = Math.round((totalMonth / orcamentoMes) * 100);
      } else if (totalMonth > 0) {
        percentGasto = 100;
      }

      // 2. healthStatus: 'ok' se < 70 | 'warning' se >= 70 e < 95 | 'danger' se >= 95
      let healthStatus: 'ok' | 'warning' | 'danger' = 'ok';
      if (percentGasto >= 95) {
        healthStatus = 'danger';
      } else if (percentGasto >= 70) {
        healthStatus = 'warning';
      } else {
        healthStatus = 'ok';
      }

      // 3. gastoTotal: string BRL formatada. Ex: "R$ 1.280"
      const gastoTotal = formatCurrency(totalMonth);

      // 4. saldoDisponivel: string BRL formatada. Pode ser negativo.
      const saldoDisponivelNum = orcamentoMes - totalMonth;
      const saldoDisponivel = formatCurrency(saldoDisponivelNum);

      // 5. proximaFatura: { valor: string, diasRestantes: number }
      // Calcule olhando o array cards e seus closingDay para o mês atual.
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonthIndex = today.getMonth();
      const currentDay = today.getDate();

      let nextClosingCard: { card: CreditCard; daysRemaining: number } | null = null;

      for (const card of (cards || [])) {
        const closingDay = card.closingDay || 1;
        let closingDate = new Date(currentYear, currentMonthIndex, closingDay);

        // Se já passou do dia de fechamento neste mês, a próxima data de corte será no mês seguinte
        if (closingDay < currentDay) {
          closingDate = new Date(currentYear, currentMonthIndex + 1, closingDay);
        }

        const diffTime = closingDate.getTime() - new Date(currentYear, currentMonthIndex, currentDay).getTime();
        const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        if (!nextClosingCard || daysRemaining < nextClosingCard.daysRemaining) {
          nextClosingCard = { card, daysRemaining };
        }
      }

      const activeExpenses = getActiveExpensesForMonth(expenses, currentMonth);

      let nextCardBillTotal = 0;
      if (nextClosingCard) {
        const targetCardId = nextClosingCard.card.id;
        nextCardBillTotal = activeExpenses
          .filter((item) => item.expense.cardId === targetCardId)
          .reduce((sum, item) => sum + item.expense.amount, 0);
      }

      const proximaFatura = {
        valor: formatCurrency(nextCardBillTotal),
        diasRestantes: nextClosingCard ? nextClosingCard.daysRemaining : 0,
      };

      // 6. totalAssinaturas: string BRL da soma das subscriptions com active === true e billingCycle === 'mensal'
      const totalAssinaturasNum = (subscriptions || [])
        .filter((sub) => sub.active === true && sub.billingCycle === 'mensal')
        .reduce((sum, sub) => sum + (sub.amount || 0), 0);
      const totalAssinaturas = formatCurrency(totalAssinaturasNum);

      // 7. metaMes: string. Ex: "68% concluída"
      const metaMes = `${percentGasto}% concluída`;

      // 8. mesAno: string do mês. Ex: "Setembro"
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      const monthNumber = parseInt(currentMonth.split('-')[1] || '1', 10);
      const mesAno = monthNames[monthNumber - 1] || 'Mês Atual';

      // 9. cobrancas: objeto com os seguintes campos
      // Despesas de terceiros para o mês atual
      const othersExpenses = activeExpenses.filter(
        (item) => item.expense.personId && item.expense.personId !== 'person-me'
      );

      // Despesas a receber (paidByPerson === false)
      const pendingExpenses = othersExpenses.filter(
        (item) => item.expense.paidByPerson === false || !item.expense.paidByPerson
      );

      const totalAReceberNum = pendingExpenses.reduce(
        (sum, item) => sum + item.expense.amount, 
        0
      );
      const totalAReceber = formatCurrency(totalAReceberNum);

      const pendingPersonIds = Array.from(
        new Set(pendingExpenses.map((item) => item.expense.personId))
      );
      const totalPessoas = pendingPersonIds.length;
      const totalItens = pendingExpenses.length;

      // Lista de pessoas com cobranças pendentes
      const pessoas = pendingPersonIds.map((pId) => {
        const personExp = pendingExpenses.filter((item) => item.expense.personId === pId);
        const personObj = (people || []).find((p) => p.id === pId);
        const nome = personObj?.name || 'Pessoa';

        // Iniciais: primeiras letras do nome (ex: "AN")
        const nameParts = nome.trim().split(/\s+/).filter(Boolean);
        let iniciais = 'P';
        if (nameParts.length >= 2) {
          iniciais = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        } else if (nameParts.length === 1) {
          iniciais = nameParts[0].slice(0, 2).toUpperCase();
        }

        const personTotal = personExp.reduce((sum, item) => sum + item.expense.amount, 0);

        // Cartão da primeira despesa dessa pessoa ou "Sem cartão"
        const firstCardId = personExp.find((item) => item.expense.cardId)?.expense.cardId;
        const cardObj = firstCardId ? (cards || []).find((c) => c.id === firstCardId) : undefined;
        const cartaoNome = cardObj?.name || 'Sem cartão';

        return {
          personId: pId,
          nome,
          iniciais,
          totalAReceber: formatCurrency(personTotal),
          cartaoNome,
          quantidadeItens: personExp.length,
        };
      });

      // Quantidade de pessoas que têm TODAS as suas despesas deste mês com paidByPerson === true
      const allOthersPersonIds = Array.from(
        new Set(othersExpenses.map((item) => item.expense.personId))
      );
      const quantidadePagaram = allOthersPersonIds.filter((pId) => {
        const personAllExpenses = othersExpenses.filter((item) => item.expense.personId === pId);
        return personAllExpenses.length > 0 && personAllExpenses.every((item) => item.expense.paidByPerson === true);
      }).length;

      // Saldo total das contas da carteira (para o widget de saldo)
      const walletSum = (walletAccounts || [])
        .filter((acc) => acc.includeInTotal !== false)
        .reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
      const saldoTotal = formatCurrency(walletSum);

      // Histórico dos últimos 7 meses para as mini barras
      const history = buildMonthlyHistory(incomes, expenses, 7);
      const historyBars = history.map((h) => ({
        monthYear: h.monthYear,
        expense: h.expense,
        income: h.income,
      }));

      const widgetData: GastoWidgetData = {
        percentGasto,
        healthStatus,
        gastoTotal,
        saldoDisponivel,
        proximaFatura,
        totalAssinaturas,
        metaMes,
        mesAno,
        saldoTotal,
        historyBars,
        cobrancas: {
          totalAReceber,
          totalPessoas,
          totalItens,
          pessoas,
          quantidadePagaram,
        },
      };

      localStorage.setItem('gasto_widget_data', JSON.stringify(widgetData));
      window.dispatchEvent(new CustomEvent('gasto_widget_updated', { detail: widgetData }));
    } catch (err) {
      console.warn('[WidgetDataBridge] Erro ao salvar dados do widget:', err);
    }
  }, [
    expenses,
    incomes,
    cards,
    subscriptions,
    currentMonth,
    monthlyTargets,
    walletAccounts,
    paidBills,
    people,
  ]);

  return null;
}
