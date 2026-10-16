import React, { useState, useEffect } from 'react';
import { CreditCard, Repeat, Target, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';
import { GastoWidgetData } from './WidgetDataBridge';

const DEFAULT_WIDGET_DATA: GastoWidgetData = {
  percentGasto: 42,
  healthStatus: 'ok',
  gastoTotal: 'R$ 1.280,00',
  saldoDisponivel: 'R$ 1.720,00',
  proximaFatura: { valor: 'R$ 840,00', diasRestantes: 6 },
  totalAssinaturas: 'R$ 139,90',
  metaMes: '42% concluída',
  mesAno: 'Mês Atual',
  saldoTotal: 'R$ 4.850,00',
  historyBars: [
    { monthYear: '1', expense: 1200, income: 2500 },
    { monthYear: '2', expense: 1500, income: 2500 },
    { monthYear: '3', expense: 1100, income: 2500 },
    { monthYear: '4', expense: 1800, income: 2600 },
    { monthYear: '5', expense: 1400, income: 2700 },
    { monthYear: '6', expense: 1650, income: 2700 },
    { monthYear: '7', expense: 1280, income: 3000 },
  ],
  cobrancas: {
    totalAReceber: 'R$ 380,00',
    totalPessoas: 2,
    totalItens: 4,
    pessoas: [
      {
        personId: 'demo-1',
        nome: 'Lucas Silva',
        iniciais: 'LS',
        totalAReceber: 'R$ 220,00',
        cartaoNome: 'Nubank Ultravioleta',
        quantidadeItens: 2,
      },
      {
        personId: 'demo-2',
        nome: 'Mariana Costa',
        iniciais: 'MC',
        totalAReceber: 'R$ 160,00',
        cartaoNome: 'Itaú Personalité',
        quantidadeItens: 2,
      },
    ],
    quantidadePagaram: 1,
  },
};

export function WidgetPreview() {
  const [data, setData] = useState<GastoWidgetData>(DEFAULT_WIDGET_DATA);
  const [activePlatform, setActivePlatform] = useState<'ios' | 'android'>('ios');

  useEffect(() => {
    const loadData = () => {
      try {
        const stored = localStorage.getItem('gasto_widget_data');
        if (stored) {
          const parsed = JSON.parse(stored);
          setData((prev) => ({
            ...prev,
            ...parsed,
            cobrancas: {
              ...prev.cobrancas,
              ...(parsed.cobrancas || {}),
            },
          }));
        }
      } catch (e) {
        console.warn('Erro ao carregar dados do widget:', e);
      }
    };

    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('gasto_widget_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('gasto_widget_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const {
    percentGasto = 0,
    healthStatus = 'ok',
    gastoTotal = 'R$ 0,00',
    saldoDisponivel = 'R$ 0,00',
    proximaFatura = { valor: 'R$ 0,00', diasRestantes: 0 },
    totalAssinaturas = 'R$ 0,00',
    metaMes = '0% concluída',
    mesAno = 'Mês Atual',
    saldoTotal = 'R$ 0,00',
    historyBars = [],
    cobrancas = {
      totalAReceber: 'R$ 0,00',
      totalPessoas: 0,
      totalItens: 0,
      pessoas: [],
      quantidadePagaram: 0,
    },
  } = data;

  // Status Colors & Themes
  const statusConfig = {
    ok: {
      color: '#10b981',
      bgClass: 'bg-[#f0faf5]',
      label: 'Saudável',
      badgeText: 'Orçamento sob controle',
      badgeBg: 'bg-emerald-100 text-emerald-800',
    },
    warning: {
      color: '#f59e0b',
      bgClass: 'bg-[#fffbeb]',
      label: 'Atenção',
      badgeText: 'Atenção ao ritmo de gastos',
      badgeBg: 'bg-amber-100 text-amber-800',
    },
    danger: {
      color: '#f43f5e',
      bgClass: 'bg-[#fff1f2]',
      label: 'Crítico',
      badgeText: 'Limite mensal atingido',
      badgeBg: 'bg-rose-100 text-rose-800',
    },
  };

  const currentStatus = statusConfig[healthStatus] || statusConfig.ok;

  // SVG Ring Math (Circumference of r=38 is 2 * PI * 38 = 238.76 -> 239)
  const clampedPercent = Math.max(0, Math.min(100, percentGasto));
  const strokeDashoffset = 239 - (clampedPercent / 100) * 239;

  // Mês Abreviado
  const mesAbrev = mesAno.slice(0, 3);

  // Avatar Color Cycle
  const AVATAR_COLORS = ['#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'];

  // Safe bars
  const displayBars = historyBars && historyBars.length > 0 
    ? historyBars.slice(-7) 
    : [
        { monthYear: '1', expense: 1200 },
        { monthYear: '2', expense: 1500 },
        { monthYear: '3', expense: 1100 },
        { monthYear: '4', expense: 1800 },
        { monthYear: '5', expense: 1400 },
        { monthYear: '6', expense: 1650 },
        { monthYear: '7', expense: 1280 },
      ];
  const maxExpense = Math.max(...displayBars.map((b) => b.expense || 1), 100);

  return (
    <div className="space-y-4 pt-2">
      {/* Top Controls & Explanation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100 dark:border-white/[0.06]">
        <div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Estes widgets sincronizam automaticamente com os dados do seu <strong>Gastô?</strong> na tela inicial do seu celular.
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Chave nativa: <code className="text-emerald-600 dark:text-emerald-400 font-mono">gasto_widget_data</code>
          </p>
        </div>

        {/* Platform Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#2C2C2E] rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActivePlatform('ios')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activePlatform === 'ios'
                ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            iOS Widget
          </button>
          <button
            type="button"
            onClick={() => setActivePlatform('android')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activePlatform === 'android'
                ? 'bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Android Widget
          </button>
        </div>
      </div>

      {/* Simulated Home Screen Container */}
      <div className="p-4 sm:p-6 rounded-[28px] bg-slate-100/80 dark:bg-black/30 border border-slate-200/80 dark:border-white/[0.08] shadow-inner space-y-4">
        
        {/* Row 1: Widget Grande + Stack de Widgets Menores */}
        <div className="flex flex-wrap sm:flex-nowrap items-start justify-center gap-3.5">
          
          {/* ========================================================= */}
          {/* 1. WIDGET GRANDE (w-[170px], rounded-[24px], padding 14px) */}
          {/* ========================================================= */}
          <div 
            className={`w-[170px] shrink-0 rounded-[24px] p-[14px] shadow-sm flex flex-col justify-between select-none ${currentStatus.bgClass}`}
            style={{ minHeight: '260px' }}
          >
            <div>
              {/* Linha superior: ponto colorido animado + label de status + mês abreviado */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full animate-pulse shrink-0"
                    style={{ backgroundColor: currentStatus.color }}
                  />
                  <span 
                    className="text-[10px] font-bold tracking-tight truncate uppercase"
                    style={{ color: currentStatus.color }}
                  >
                    {currentStatus.label}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 capitalize">
                  {mesAbrev}
                </span>
              </div>

              {/* Anel circular SVG (96x96px, raio 38, stroke-width 7) */}
              <div className="relative w-[96px] h-[96px] mx-auto my-1 flex items-center justify-center">
                <svg className="w-[96px] h-[96px] -rotate-90 origin-center" viewBox="0 0 96 96">
                  {/* Trilha cinza */}
                  <circle
                    cx="48"
                    cy="48"
                    r="38"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="7"
                  />
                  {/* Progresso colorido */}
                  <circle
                    cx="48"
                    cy="48"
                    r="38"
                    fill="none"
                    stroke={currentStatus.color}
                    strokeWidth="7"
                    strokeDasharray="239"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                </svg>

                {/* Centro do anel: percentGasto% em 21px font-weight 500 + "do orçamento" em 9px */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span 
                    className="text-slate-900 tracking-tight leading-none"
                    style={{ fontSize: '21px', fontWeight: 500 }}
                  >
                    {percentGasto}%
                  </span>
                  <span 
                    className="text-slate-500 leading-tight mt-0.5"
                    style={{ fontSize: '9px' }}
                  >
                    do orçamento
                  </span>
                </div>
              </div>

              {/* Linha "Gasto" + gastoTotal */}
              <div className="flex items-center justify-between text-[11px] mt-2 leading-tight">
                <span className="text-slate-500 font-medium">Gasto</span>
                <span className="font-bold text-slate-800 tracking-tight">{gastoTotal}</span>
              </div>

              {/* Linha "Disponível" + saldoDisponivel (verde/amarelo/vermelho) */}
              <div className="flex items-center justify-between text-[11px] mt-1 leading-tight">
                <span className="text-slate-500 font-medium">Disponível</span>
                <span 
                  className="font-bold tracking-tight"
                  style={{ color: currentStatus.color }}
                >
                  {saldoDisponivel}
                </span>
              </div>

              {/* Separador */}
              <div className="h-px bg-slate-200/90 my-2" />

              {/* "Próx. fatura" + proximaFatura.valor + diasRestantes + "dias" */}
              <div className="flex items-center justify-between text-[10px] text-slate-600 leading-tight">
                <span className="truncate">
                  Próx. fatura: <strong className="font-semibold text-slate-800">{proximaFatura.valor}</strong>
                </span>
                <span className="shrink-0 text-[9px] px-1 py-0.5 rounded bg-white/70 font-medium text-slate-600 border border-slate-200/50 ml-1">
                  {proximaFatura.diasRestantes} dias
                </span>
              </div>

              {/* Mini barras das últimas 7 semanas / meses */}
              <div className="flex items-end justify-between gap-1 h-5 mt-2 px-1">
                {displayBars.map((bar, idx) => {
                  const isCurrent = idx === displayBars.length - 1;
                  const barHeight = Math.max(3, Math.round(((bar.expense || 0) / maxExpense) * 18));
                  return (
                    <div
                      key={idx}
                      className="flex-1 rounded-xs transition-all"
                      style={{
                        height: `${barHeight}px`,
                        backgroundColor: isCurrent ? currentStatus.color : '#cbd5e1',
                      }}
                      title={`Mês ${idx + 1}: ${bar.expense}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Badge inferior com texto contextual por estado */}
            <div className="mt-2.5 pt-1.5 border-t border-slate-200/60 flex items-center justify-center">
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full text-center leading-tight truncate ${currentStatus.badgeBg}`}>
                {currentStatus.badgeText}
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* STACK LATERAL: PEQUENO SALDO + ASSINATURAS + META         */}
          {/* ========================================================= */}
          <div className="flex flex-col gap-2.5">
            
            {/* 2. WIDGET PEQUENO SALDO (w-[170px] h-[78px], rounded-[20px]) */}
            <div className="w-[170px] h-[78px] rounded-[20px] bg-white dark:bg-[#1C1C1E] p-3 shadow-xs border border-slate-200/70 dark:border-white/[0.08] flex items-center gap-3 select-none">
              {/* Anel SVG menor (30px) à esquerda com mesmo sistema de cores */}
              <div className="relative w-[30px] h-[30px] shrink-0 flex items-center justify-center">
                <svg className="w-[30px] h-[30px] -rotate-90 origin-center" viewBox="0 0 30 30">
                  <circle
                    cx="15"
                    cy="15"
                    r="11"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="3"
                  />
                  <circle
                    cx="15"
                    cy="15"
                    r="11"
                    fill="none"
                    stroke={currentStatus.color}
                    strokeWidth="3"
                    strokeDasharray="69"
                    strokeDashoffset={69 - (clampedPercent / 100) * 69}
                    strokeLinecap="round"
                  />
                </svg>
                <div 
                  className="w-2 h-2 rounded-full absolute"
                  style={{ backgroundColor: currentStatus.color }}
                />
              </div>

              {/* Label "Saldo total" + walletAccounts somados */}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block leading-tight">
                  Saldo total
                </span>
                <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white tracking-tight truncate block">
                  {saldoTotal}
                </span>
              </div>
            </div>

            {/* 3. WIDGET MÉDIO ASSINATURAS (w-[170px] h-[78px], rounded-[20px]) */}
            <div className="w-[170px] h-[78px] rounded-[20px] bg-white dark:bg-[#1C1C1E] p-3 shadow-xs border border-slate-200/70 dark:border-white/[0.08] flex items-center gap-3 select-none">
              {/* Ícone lucide Repeat à esquerda em caixa cinza rounded-[9px] */}
              <div className="w-8 h-8 rounded-[9px] bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                <Repeat size={16} />
              </div>

              {/* Label "Assinaturas" + totalAssinaturas */}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block leading-tight">
                  Assinaturas
                </span>
                <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white tracking-tight truncate block">
                  {totalAssinaturas}
                </span>
              </div>
            </div>

            {/* 4. WIDGET MÉDIO META (w-[170px] h-[78px], rounded-[20px]) */}
            <div className="w-[170px] h-[78px] rounded-[20px] bg-white dark:bg-[#1C1C1E] p-3 shadow-xs border border-slate-200/70 dark:border-white/[0.08] flex items-center gap-3 select-none">
              {/* Ícone lucide Target à esquerda */}
              <div 
                className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${currentStatus.color}20`,
                  color: currentStatus.color,
                }}
              >
                <Target size={16} />
              </div>

              {/* Label "Meta do mês" + metaMes (colorido por healthStatus) */}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block leading-tight">
                  Meta do mês
                </span>
                <span 
                  className="text-xs sm:text-[13px] font-bold tracking-tight truncate block"
                  style={{ color: currentStatus.color }}
                >
                  {metaMes}
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* ========================================================= */}
        {/* 5. WIDGET DE COBRANÇAS (largura total, rounded-[22px], bg-[#f5f3ff]) */}
        {/* ========================================================= */}
        <div className="w-full rounded-[22px] bg-[#f5f3ff] p-4 shadow-xs border border-purple-200/60 select-none space-y-3">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between gap-2">
            {/* Ícone CreditCard em caixa roxa + label "A receber do cartão" */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#7c3aed] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <CreditCard size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#3730a3] leading-tight">
                  A receber do cartão
                </h4>
                <p className="text-[10px] text-[#7c3aed]">
                  Rateios e faturas compartilhadas
                </p>
              </div>
            </div>

            {/* totalAReceber em 16px font-weight 600 cor #4c1d95 + "X pessoas · Y despesas" em 9px cor #7c3aed à direita */}
            <div className="text-right">
              <span 
                className="block leading-tight tracking-tight"
                style={{ fontSize: '16px', fontWeight: 600, color: '#4c1d95' }}
              >
                {cobrancas.totalAReceber}
              </span>
              <span 
                className="block leading-tight"
                style={{ fontSize: '9px', color: '#7c3aed' }}
              >
                {cobrancas.totalPessoas} pessoas · {cobrancas.totalItens} despesas
              </span>
            </div>
          </div>

          {/* Chips de pessoas */}
          <div className="flex flex-wrap gap-2 pt-1">
            {(!cobrancas.pessoas || cobrancas.pessoas.length === 0) ? (
              <div className="w-full py-4 text-center text-xs font-medium text-[#7c3aed]">
                Nenhuma pendência no momento
              </div>
            ) : (
              cobrancas.pessoas.map((p, idx) => {
                const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                return (
                  <div
                    key={p.personId || idx}
                    className="flex items-center gap-2.5 bg-white/90 border border-purple-100 rounded-2xl px-3 py-2 shadow-2xs"
                  >
                    {/* Avatar circular 28px com iniciais */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {p.iniciais}
                    </div>

                    {/* Nome + Cartão / Itens */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span 
                          className="truncate block"
                          style={{ fontSize: '11px', fontWeight: 500, color: '#3730a3' }}
                        >
                          {p.nome}
                        </span>
                        <span 
                          className="shrink-0"
                          style={{ fontSize: '12px', fontWeight: 600, color: '#4c1d95' }}
                        >
                          {p.totalAReceber}
                        </span>
                      </div>
                      <span 
                        className="truncate block"
                        style={{ fontSize: '9px', color: '#7c3aed' }}
                      >
                        {p.cartaoNome} · {p.quantidadeItens} {p.quantidadeItens === 1 ? 'item' : 'itens'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Rodapé: "X já pagaram esse mês" em 10px cor #7c3aed à esquerda | badge roxo "A receber" à direita */}
          <div className="pt-2 border-t border-purple-200/50 flex items-center justify-between gap-2">
            <span 
              className="font-medium"
              style={{ fontSize: '10px', color: '#7c3aed' }}
            >
              {cobrancas.quantidadePagaram} já {cobrancas.quantidadePagaram === 1 ? 'pagou' : 'pagaram'} esse mês
            </span>

            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#7c3aed]/15 text-[#5b21b6] uppercase tracking-wider">
              A receber
            </span>
          </div>
        </div>

      </div>

      {/* Instalação e Ação Direta para o usuário */}
      <div className="p-4 rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 space-y-3 text-xs text-slate-700 dark:text-slate-300">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Smartphone size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              Como adicionar à tela inicial do celular:
            </span>
          </div>

          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
            Passo a Passo
          </span>
        </div>

        <div className="space-y-2 text-xs leading-relaxed">
          {activePlatform === 'ios' ? (
            <div className="space-y-1.5">
              <p>
                <strong>1. No iPhone (Safari):</strong> Toque no ícone <strong>Compartilhar ⎋</strong> na barra inferior do Safari.
              </p>
              <p>
                <strong>2.</strong> Role a lista e toque em <strong>"Adicionar à Tela de Início" ➕</strong>.
              </p>
              <p>
                <strong>3. Atalhos Rápidos:</strong> Na sua tela inicial, <strong>pressione e segure o ícone do Gastô?</strong> para acessar os widgets rápidos de <em>Novo Lançamento</em>, <em>Minhas Faturas</em> e <em>Resumo</em>!
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p>
                <strong>1. No Android (Chrome):</strong> Toque nos <strong>três pontinhos (⋮)</strong> no topo do navegador e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
              </p>
              <p>
                <strong>2. Atalhos Rápidos:</strong> Pressione e segure o ícone do Gastô? na tela inicial para ver os <strong>Widgets de Atalho Rápido</strong> e fixá-los individualmente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
