import { ExpenseItem, IncomeItem } from '../types';
import { addMonths, getActiveExpensesForMonth, getActiveIncomesForMonth } from './financeCalculations';

export interface MonthFinancialSnapshot {
  monthKey: string;           // Ex: "2026-09"
  monthOffset: number;        // 0 a 11
  projectedIncome: number;    // Renda projetada
  committedExpenses: number;  // Despesas já comprometidas (fixas + parcelas futuras conhecidas)
  baseFreeMargin: number;     // Folga antes da viagem: Income - Expense
  accumulatedSavings: number; // Saldo poupado acumulado sem a viagem
}

export interface TravelScenarioResult {
  travelMonthKey: string;      // Mês em que a viagem aconteceria
  travelMonthOffset: number;   // Daqui a quantos meses
  paymentMethod: 'a_vista' | 'parcelado';
  installmentsCount: number;
  installmentValue: number;
  
  // Respostas diretas ao pedido do usuário:
  tightMonthsCount: number;        // "quantos meses vou ficar mal para ir viajar"
  maxDeficitAmount: number;        // Maior rombo/saldo negativo acumulado no período
  postTripSavingsAtTravel: number; // Saldo de reserva que sobra no mês da viagem
  recoveryMonthKey?: string;       // Em qual mês as finanças voltam a ficar 100% no azul
  
  status: 'excelente' | 'viavel' | 'apertado' | 'critico';
  statusLabel: string;
  badgeColor: string;
  summaryMessage: string;
  
  // Linha do tempo projetada mês a mês após a viagem
  timeline: {
    monthKey: string;
    monthOffset: number;
    income: number;
    expenseWithTrip: number;
    netMargin: number;          // Renda do mês - Gastos totais com a viagem
    cumulativeReserve: number;  // Saldo em caixa/reserva restante
    isTravelMonth: boolean;
    isInstallmentMonth: boolean;
    isTight: boolean;           // Se este mês ficou no aperto/vermelho
    tightReason?: string;
  }[];
}

export interface TravelFeasibilityAnalysis {
  goalTitle: string;
  targetCost: number;
  initialReserve: number;
  bestMonthKey: string;         // "em qual mês vou estar mais bem financeiramente para viajar"
  bestMonthOffset: number;
  bestScenario: TravelScenarioResult;
  selectedScenario: TravelScenarioResult; // Cenário do mês atualmente inspecionado
  currentMonthScenario: TravelScenarioResult; // Se viajar imediatamente neste mês
  allScenarios: TravelScenarioResult[];
  monthlyAverageIncome: number;
  monthlyAverageExpense: number;
  monthlyAverageSurplus: number;
  recommendationTips: string[];
}

export interface CalculatorOptions {
  currentMonth: string;
  targetCost: number;
  goalTitle?: string;
  initialReserve?: number;
  incomes: IncomeItem[];
  expenses: ExpenseItem[];
  paymentMethod?: 'a_vista' | 'parcelado';
  installmentsCount?: number;
  customMonthlyIncome?: number; // Permite ao usuário simular uma renda diferente
  selectedMonthOffset?: number; // Mês selecionado para inspeção
  safetyBuffer?: number;        // Colchão mínimo de segurança desejado (ex: R$ 200)
}

/**
 * Calcula a viabilidade financeira e prevê o melhor mês para viajar e o número de meses no aperto.
 */
export function calculateTravelFeasibility(options: CalculatorOptions): TravelFeasibilityAnalysis {
  const {
    currentMonth,
    targetCost,
    goalTitle = 'Viajar',
    initialReserve = 0,
    incomes,
    expenses,
    paymentMethod = 'a_vista',
    installmentsCount = 5,
    customMonthlyIncome,
    selectedMonthOffset = 0,
    safetyBuffer = 150,
  } = options;

  // 1. Calcular renda base recorrente
  const activeIncomesM0 = getActiveIncomesForMonth(incomes, currentMonth);
  const registeredIncomeM0 = activeIncomesM0.reduce((acc, inc) => acc + inc.amount, 0);
  const baselineIncome = customMonthlyIncome && customMonthlyIncome > 0
    ? customMonthlyIncome
    : registeredIncomeM0 > 0
    ? registeredIncomeM0
    : 3500; // Valor de referência para simulação caso o usuário não tenha cadastrado rendas

  // 2. Mapear os próximos 12 meses (offset 0 a 11)
  const baselineMonths: MonthFinancialSnapshot[] = [];
  let runningSavings = initialReserve;

  // Obter média de despesas variáveis/avulsas do mês atual para prever os meses futuros
  const activeExpensesM0 = getActiveExpensesForMonth(expenses, currentMonth);
  const singleExpensesM0 = activeExpensesM0
    .filter(e => e.expense.type === 'unica')
    .reduce((sum, e) => sum + e.expense.amount, 0);

  for (let offset = 0; offset < 12; offset++) {
    const monthKey = addMonths(currentMonth, offset);
    
    // Renda do mês
    const monthIncomes = getActiveIncomesForMonth(incomes, monthKey);
    const hasSpecificIncomes = monthIncomes.length > 0;
    const projectedIncome = hasSpecificIncomes 
      ? monthIncomes.reduce((acc, inc) => acc + inc.amount, 0)
      : baselineIncome;

    // Despesas ativas agendadas para este mês
    const monthExpenses = getActiveExpensesForMonth(expenses, monthKey);
    let committedExpenses = monthExpenses.reduce((acc, e) => acc + e.expense.amount, 0);

    // Se for mês futuro sem despesas avulsas ainda lançadas, projeta a média do dia a dia
    if (offset > 0 && committedExpenses < singleExpensesM0 * 0.5) {
      committedExpenses += singleExpensesM0 * 0.7; // projeção prudencial
    }

    const baseFreeMargin = projectedIncome - committedExpenses;
    runningSavings += baseFreeMargin;

    baselineMonths.push({
      monthKey,
      monthOffset: offset,
      projectedIncome,
      committedExpenses,
      baseFreeMargin,
      accumulatedSavings: runningSavings,
    });
  }

  // 3. Simular cenários de viagem para cada mês de partida possível (offset 0 a 11)
  const effectiveInstallments = paymentMethod === 'parcelado' ? Math.max(1, installmentsCount) : 1;
  const installmentValue = targetCost / effectiveInstallments;

  const allScenarios: TravelScenarioResult[] = baselineMonths.map((travelMonthSnapshot) => {
    const travelOffset = travelMonthSnapshot.monthOffset;
    const travelMonthKey = travelMonthSnapshot.monthKey;

    let cumulativeReserve = initialReserve;
    let tightMonthsCount = 0;
    let maxDeficitAmount = 0;
    let postTripSavingsAtTravel = 0;
    let recoveryMonthKey: string | undefined = undefined;

    const timeline: TravelScenarioResult['timeline'] = [];

    for (let m = 0; m < 12; m++) {
      const snap = baselineMonths[m];
      const isTravelMonth = m === travelOffset;
      const isInstallmentMonth = paymentMethod === 'parcelado'
        ? m >= travelOffset && m < travelOffset + effectiveInstallments
        : isTravelMonth;

      // Adicionar impacto da viagem nos gastos do mês
      let tripCostThisMonth = 0;
      if (paymentMethod === 'a_vista') {
        if (isTravelMonth) tripCostThisMonth = targetCost;
      } else {
        if (isInstallmentMonth) tripCostThisMonth = installmentValue;
      }

      const expenseWithTrip = snap.committedExpenses + tripCostThisMonth;
      const netMargin = snap.projectedIncome - expenseWithTrip;
      cumulativeReserve += netMargin;

      if (isTravelMonth) {
        postTripSavingsAtTravel = cumulativeReserve;
      }

      // Critério para "Ficar Mal / No Aperto":
      // 1. Saldo de reserva abaixo de zero (no vermelho)
      // 2. OU margem livre mensal negativa com pouca reserva (< safetyBuffer)
      // 3. Apenas a partir do mês em que a viagem começa
      let isTight = false;
      let tightReason: string | undefined = undefined;

      if (m >= travelOffset) {
        if (cumulativeReserve < 0) {
          isTight = true;
          tightReason = `Saldo negativo de -R$ ${Math.abs(Math.round(cumulativeReserve))}`;
          tightMonthsCount++;
        } else if (cumulativeReserve < safetyBuffer && netMargin < 0) {
          isTight = true;
          tightReason = `Reserva zerando (R$ ${Math.round(cumulativeReserve)}) e mês no vermelho`;
          tightMonthsCount++;
        } else if (netMargin < -100 && cumulativeReserve < targetCost * 0.3) {
          isTight = true;
          tightReason = `Sufoco de caixa: gastos excedem ganhos em R$ ${Math.abs(Math.round(netMargin))}`;
          tightMonthsCount++;
        }

        if (cumulativeReserve < maxDeficitAmount) {
          maxDeficitAmount = cumulativeReserve;
        }

        // Detectar recuperação definitiva (quando volta a ficar acima de safetyBuffer e margin > 0)
        if (!recoveryMonthKey && m > travelOffset && !isTight && cumulativeReserve >= safetyBuffer) {
          recoveryMonthKey = snap.monthKey;
        }
      }

      timeline.push({
        monthKey: snap.monthKey,
        monthOffset: m,
        income: snap.projectedIncome,
        expenseWithTrip,
        netMargin,
        cumulativeReserve,
        isTravelMonth,
        isInstallmentMonth,
        isTight,
        tightReason,
      });
    }

    // Determinar classificação e mensagem
    let status: TravelScenarioResult['status'] = 'excelente';
    let statusLabel = 'Perfeito — Sem Aperto';
    let badgeColor = 'bg-emerald-500 text-white';
    let summaryMessage = '';

    if (tightMonthsCount === 0 && postTripSavingsAtTravel >= safetyBuffer) {
      status = 'excelente';
      statusLabel = 'Mês Ideal (0 aperto)';
      badgeColor = 'bg-emerald-600 text-white';
      summaryMessage = `Zero meses de aperto! Você viaja com tranquilidade e mantém uma folga de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(postTripSavingsAtTravel)} guardados.`;
    } else if (tightMonthsCount === 0) {
      status = 'viavel';
      statusLabel = 'Viável com Cuidado';
      badgeColor = 'bg-teal-600 text-white';
      summaryMessage = `Você consegue viajar sem se endividar, mas sua reserva ficará baixa nos primeiros meses.`;
    } else if (tightMonthsCount <= 2) {
      status = 'apertado';
      statusLabel = `${tightMonthsCount} ${tightMonthsCount === 1 ? 'mês' : 'meses'} no aperto`;
      badgeColor = 'bg-amber-500 text-white';
      summaryMessage = `Você ficará ${tightMonthsCount} ${tightMonthsCount === 1 ? 'mês' : 'meses'} com o orçamento no limite até suas finanças se reequilibrarem.`;
    } else {
      status = 'critico';
      statusLabel = `${tightMonthsCount} meses no vermelho`;
      badgeColor = 'bg-rose-600 text-white';
      summaryMessage = `Atenção: viajar nesta data causará ${tightMonthsCount} meses de aperto financeiro intenso (déficit de até ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(maxDeficitAmount))}).`;
    }

    return {
      travelMonthKey,
      travelMonthOffset: travelOffset,
      paymentMethod,
      installmentsCount: effectiveInstallments,
      installmentValue,
      tightMonthsCount,
      maxDeficitAmount,
      postTripSavingsAtTravel,
      recoveryMonthKey,
      status,
      statusLabel,
      badgeColor,
      summaryMessage,
      timeline,
    };
  });

  // 4. Encontrar o "Melhor Mês para Viajar"
  // Prioriza o mês mais próximo que tem tightMonthsCount === 0 e postTripSavings >= 0
  let bestScenario = allScenarios.find(s => s.tightMonthsCount === 0 && s.postTripSavingsAtTravel >= safetyBuffer);
  
  if (!bestScenario) {
    bestScenario = allScenarios.find(s => s.tightMonthsCount === 0);
  }
  if (!bestScenario) {
    // Se nenhum mês fica com 0 aperto, escolhe o mês com o MENOR número de meses apertados
    bestScenario = [...allScenarios].sort((a, b) => a.tightMonthsCount - b.tightMonthsCount)[0];
  }

  const bestMonthKey = bestScenario ? bestScenario.travelMonthKey : baselineMonths[0].monthKey;
  const bestMonthOffset = bestScenario ? bestScenario.travelMonthOffset : 0;

  // Cenário selecionado para detalhamento
  const clampedSelectedOffset = Math.max(0, Math.min(11, selectedMonthOffset));
  const selectedScenario = allScenarios[clampedSelectedOffset] || allScenarios[0];
  const currentMonthScenario = allScenarios[0];

  // Médias para contexto
  const monthlyAverageIncome = baselineMonths.reduce((acc, m) => acc + m.projectedIncome, 0) / 12;
  const monthlyAverageExpense = baselineMonths.reduce((acc, m) => acc + m.committedExpenses, 0) / 12;
  const monthlyAverageSurplus = monthlyAverageIncome - monthlyAverageExpense;

  // Dicas práticas personalizadas
  const recommendationTips: string[] = [];

  if (bestScenario.travelMonthOffset > 0) {
    const monthlyNeeded = (targetCost - initialReserve) / bestScenario.travelMonthOffset;
    if (monthlyNeeded > 0) {
      recommendationTips.push(
        `Poupar ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyNeeded)} por mês garante sua viagem em ${bestScenario.travelMonthKey} sem entrar no vermelho.`
      );
    }
  }

  if (paymentMethod === 'a_vista' && currentMonthScenario.tightMonthsCount > 0) {
    recommendationTips.push(
      `Se você parcelar a viagem em 5x ou 6x no cartão de crédito, você reduz o impacto imediato e pode antecipar a data com menor aperto.`
    );
  }

  // Identificar se há meses onde as parcelas de cartão reduzem
  const maxExpenseMonth = [...baselineMonths].sort((a, b) => b.committedExpenses - a.committedExpenses)[0];
  const minExpenseMonth = [...baselineMonths].sort((a, b) => a.committedExpenses - b.committedExpenses)[0];
  if (maxExpenseMonth.committedExpenses - minExpenseMonth.committedExpenses > 200) {
    recommendationTips.push(
      `A partir de ${minExpenseMonth.monthKey}, suas despesas caem em ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(maxExpenseMonth.committedExpenses - minExpenseMonth.committedExpenses)}, criando uma janela perfeita para viajar.`
    );
  }

  return {
    goalTitle,
    targetCost,
    initialReserve,
    bestMonthKey,
    bestMonthOffset,
    bestScenario,
    selectedScenario,
    currentMonthScenario,
    allScenarios,
    monthlyAverageIncome,
    monthlyAverageExpense,
    monthlyAverageSurplus,
    recommendationTips,
  };
}
