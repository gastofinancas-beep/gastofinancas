import React, { useState } from 'react';
import { 
  X, 
  Car, 
  Briefcase, 
  Sparkles, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Wallet, 
  Target, 
  Fuel, 
  Bike, 
  Zap, 
  HelpCircle,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ExtraProfileConfig, 
  ExtraWorkType, 
  DriverAppType, 
  WalletAccount,
  FreelanceCategory 
} from '../types';
import { DriverAppLogo } from './DriverAppLogo';
import { APP_CONFIGS } from '../data/initialDriverData';
import { FREELANCE_CATEGORY_CONFIG } from '../data/initialFreelanceData';

interface ExtraSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExtraProfileConfig;
  accounts: WalletAccount[];
  onSaveConfig: (newConfig: ExtraProfileConfig) => void;
}

const AVAILABLE_DRIVER_APPS: DriverAppType[] = [
  'uber',
  '99',
  'indrive',
  'ifood',
  'rappi',
  'lalamove',
  'particular',
  'blablacar',
  'outro'
];

export function ExtraSetupModal({
  isOpen,
  onClose,
  config,
  accounts,
  onSaveConfig
}: ExtraSetupModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [workType, setWorkType] = useState<ExtraWorkType>(
    config.workType === 'motorista_app' || config.workType === 'freelancer' 
      ? config.workType 
      : 'motorista_app'
  );
  
  // Freelance category selection
  const [selectedCategory, setSelectedCategory] = useState<FreelanceCategory>(
    config.freelanceCategories?.[0] || 'design'
  );

  // Driver specific settings
  const [selectedApps, setSelectedApps] = useState<DriverAppType[]>(
    config.selectedApps && config.selectedApps.length > 0 
      ? config.selectedApps 
      : ['uber', '99', 'indrive']
  );
  const [vehicleType, setVehicleType] = useState<'carro_proprio' | 'carro_alugado' | 'moto' | 'bike' | 'outro'>(
    config.vehicleType || 'carro_proprio'
  );
  const [fuelType, setFuelType] = useState<'gasolina' | 'etanol' | 'gnv' | 'diesel' | 'eletrico' | 'outro'>(
    config.fuelType || 'gasolina'
  );
  const [dailyGoal, setDailyGoal] = useState<string>(
    config.dailyGoal ? String(config.dailyGoal) : '250'
  );
  const [monthlyGoal, setMonthlyGoal] = useState<string>(
    config.monthlyGoal ? String(config.monthlyGoal) : '5500'
  );
  const [defaultAccountId, setDefaultAccountId] = useState<string>(
    config.defaultAccountId || (accounts[0]?.id || '')
  );

  if (!isOpen) return null;

  const toggleApp = (app: DriverAppType) => {
    setSelectedApps(prev => {
      if (prev.includes(app)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(a => a !== app);
      }
      return [...prev, app];
    });
  };

  const handleFinish = () => {
    const cleanDaily = parseFloat(dailyGoal.replace(',', '.')) || 250;
    const cleanMonthly = parseFloat(monthlyGoal.replace(',', '.')) || 5500;

    const newConfig: ExtraProfileConfig = {
      workType,
      selectedApps: workType === 'motorista_app' ? selectedApps : ['outro'],
      vehicleType,
      fuelType,
      freelanceCategories: workType === 'freelancer' ? [selectedCategory] : (config.freelanceCategories || ['design']),
      dailyGoal: cleanDaily,
      monthlyGoal: cleanMonthly,
      defaultAccountId,
      setupCompleted: true,
      lastCustomizedAt: new Date().toISOString()
    };

    onSaveConfig(newConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
      />

      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-200 dark:border-white/10 flex flex-col max-h-[92vh] sm:max-h-[90vh] z-10"
      >
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full mx-auto mt-2 sm:hidden" />

        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Configurar Renda Extra
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Passo {step} de 2: {step === 1 ? 'Atividade' : 'Personalização'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="text-center sm:text-left space-y-1">
                <h4 className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  O que você faz como Renda Extra?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Escolha sua atividade principal. Você pode alterar a qualquer momento.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWorkType('motorista_app')}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-4 cursor-pointer relative ${
                    workType === 'motorista_app'
                      ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm'
                      : 'border-slate-200 dark:border-white/10 hover:border-emerald-500/30 dark:hover:border-white/20'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${workType === 'motorista_app' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300'}`}>
                    <Car size={24} />
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        Motorista / Entregador de App
                      </span>
                      <span className="self-start sm:self-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 whitespace-nowrap">
                        Uber, 99, iFood...
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Controle de ganhos por plataforma, gastos com combustível, lucro líquido real e fechamento do dia.
                    </p>
                  </div>
                  {workType === 'motorista_app' && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check size={14} className="stroke-[3]" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setWorkType('freelancer')}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-4 cursor-pointer relative ${
                    workType === 'freelancer'
                      ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 shadow-sm'
                      : 'border-slate-200 dark:border-white/10 hover:border-emerald-500/30 dark:hover:border-white/20'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${workType === 'freelancer' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300'}`}>
                    <Briefcase size={24} />
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        Freelancer & Serviços
                      </span>
                      <span className="self-start sm:self-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        Design, Dev, Aulas...
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Gestão de faturamento por projeto ou serviço, custos de ferramentas, e lucro líquido real.
                    </p>
                  </div>
                  {workType === 'freelancer' && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check size={14} className="stroke-[3]" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {workType === 'motorista_app' ? (
                <>
                  <div className="space-y-3">
                    <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Quais aplicativos você roda?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {AVAILABLE_DRIVER_APPS.map(appId => {
                        const isSelected = selectedApps.includes(appId);
                        const appConfig = APP_CONFIGS[appId];
                        return (
                          <button
                            key={appId}
                            type="button"
                            onClick={() => toggleApp(appId)}
                            className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center relative ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm'
                                : 'border-slate-200 dark:border-white/10 hover:border-emerald-500/30 dark:hover:border-white/20 opacity-60'
                            }`}
                          >
                            <DriverAppLogo app={appId} size="md" />
                            <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                              {appConfig?.shortName || appId}
                            </span>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                                <Check size={10} className="stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-white/5">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">
                        Meio de Transporte
                      </label>
                      <select
                        value={vehicleType}
                        onChange={e => setVehicleType(e.target.value as NonNullable<ExtraProfileConfig['vehicleType']>)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50"
                      >
                        <option value="carro_proprio">Carro Próprio</option>
                        <option value="carro_alugado">Carro Alugado</option>
                        <option value="moto">Moto</option>
                        <option value="bike">Bicicleta</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">
                        Combustível
                      </label>
                      <select
                        value={fuelType}
                        onChange={e => setFuelType(e.target.value as NonNullable<ExtraProfileConfig['fuelType']>)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50"
                      >
                        <option value="gasolina">Gasolina</option>
                        <option value="etanol">Etanol</option>
                        <option value="gnv">GNV</option>
                        <option value="diesel">Diesel</option>
                        <option value="eletrico">Elétrico</option>
                        <option value="outro">Outro / N/A</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">
                        Meta Diária
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-sm font-bold text-slate-400">R$</span>
                        <input
                          type="number"
                          value={dailyGoal}
                          onChange={e => setDailyGoal(e.target.value)}
                          placeholder="250,00"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">
                        Conta Principal
                      </label>
                      <select
                        value={defaultAccountId}
                        onChange={e => setDefaultAccountId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 truncate"
                      >
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Qual é a sua área de atuação?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(FREELANCE_CATEGORY_CONFIG).map(([catKey, catVal]) => {
                        const isSelected = selectedCategory === catKey;
                        return (
                          <button
                            key={catKey}
                            type="button"
                            onClick={() => setSelectedCategory(catKey as FreelanceCategory)}
                            className={`p-3 rounded-xl border text-left flex items-center gap-2.5 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold shadow-sm'
                                : 'border-slate-200 dark:border-white/10 hover:border-emerald-500/30 dark:hover:border-white/20 text-slate-700 dark:text-slate-300 text-sm'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${catVal.color.split(' ')[0]}`} />
                            <span className="text-xs sm:text-sm truncate">{catVal.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">
                        Meta Mensal
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-sm font-bold text-slate-400">R$</span>
                        <input
                          type="number"
                          value={monthlyGoal}
                          onChange={e => setMonthlyGoal(e.target.value)}
                          placeholder="5000,00"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase">
                        Conta para Recebimentos
                      </label>
                      <select
                        value={defaultAccountId}
                        onChange={e => setDefaultAccountId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 truncate"
                      >
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-[#1C1C1E] sticky bottom-0 z-10">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
            >
              Cancelar
            </button>
          )}

          {step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              className={`px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer ml-auto active:scale-95 ${
                workType === 'motorista_app' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
              }`}
            >
              Continuar
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className={`px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95 ${
                workType === 'motorista_app' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
              }`}
            >
              Salvar Configuração
              <Check size={16} />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

