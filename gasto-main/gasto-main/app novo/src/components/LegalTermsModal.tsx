import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, FileText, Lock, Database, Trash2, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LegalTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms';
  onOpenDeleteAccount?: () => void;
}

export function LegalTermsModal({
  isOpen,
  onClose,
  initialTab = 'privacy',
  onOpenDeleteAccount
}: LegalTermsModalProps) {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 id="legal-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Privacidade & Termos de Uso
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Transparência e segurança sobre seus dados financeiros
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar termos de uso e privacidade"
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 p-1 mt-4 bg-slate-100 dark:bg-slate-950 rounded-2xl shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'privacy'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Política de Privacidade
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'terms'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Termos de Uso
            </button>
          </div>

          {/* Content Area */}
          <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {/* Disclaimer banner */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <HelpCircle size={18} className="shrink-0 mt-0.5" />
              <p className="text-[11px] leading-tight">
                <strong>Aviso Informativo:</strong> Este documento estabelece as diretrizes de operação do <strong>Gastô?</strong> e está estruturado conforme as boas práticas da Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
            </div>

            {activeTab === 'privacy' ? (
              <div className="space-y-4">
                <section className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Database size={15} className="text-emerald-500" />
                    1. Coleta e Finalidade dos Dados
                  </h3>
                  <p>
                    O aplicativo coleta exclusivamente as informações financeiras que você insere de forma ativa (como descrição de despesas, valores, categorias de gastos, cartões e caixinhas de economia) para gerar relatórios, previsões de faturas e consolidação de saldos.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Lock size={15} className="text-emerald-500" />
                    2. Armazenamento e Segurança
                  </h3>
                  <p>
                    Seus dados são protegidos por regras estritas de segurança em nuvem (Google Cloud / Firebase Firestore). O acesso aos seus lançamentos financeiros é restrito exclusivamente ao seu identificador único de usuário autenticado (<code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">request.auth.uid == userId</code>). Nenhum outro usuário ou terceiro tem permissão de leitura ou escrita sobre seus registros.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText size={15} className="text-emerald-500" />
                    3. Não Compartilhamento com Terceiros
                  </h3>
                  <p>
                    O <strong>Gastô?</strong> não comercializa, não monetiza e não transfere seus dados pessoais ou movimentações bancárias para anunciantes, birôs de crédito ou parceiros comerciais.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Trash2 size={15} className="text-rose-500" />
                    4. Exclusão e Portabilidade dos Dados (LGPD)
                  </h3>
                  <p>
                    Você é proprietário de todos os seus dados. É possível exportar seus relatórios e planilhas a qualquer momento pela ferramenta de exportação, bem como excluir permanentemente sua conta e todos os dados vinculados diretamente nas configurações do seu perfil.
                  </p>
                  {onOpenDeleteAccount && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenDeleteAccount();
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 dark:bg-white/[0.06] dark:hover:bg-rose-950/20 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} className="shrink-0 opacity-70" />
                        <span>Excluir minha conta</span>
                      </button>
                    </div>
                  )}
                </section>
              </div>
            ) : (
              <div className="space-y-4">
                <section className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    1. Objeto do Aplicativo
                  </h3>
                  <p>
                    O <strong>Gastô?</strong> é uma ferramenta de gestão e organização financeira pessoal e profissional (controle de despesas de cartões, caixinhas de reservas, carteira e registros de renda extra). Ele não presta consultoria de investimentos regulamentada nem atua como instituição bancária.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    2. Responsabilidade pelas Informações
                  </h3>
                  <p>
                    O usuário é responsável pela exatidão dos dados inseridos, bem como pela custódia e proteção de sua conta de acesso (e-mail ou conta Google).
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    3. Disponibilidade e Backup
                  </h3>
                  <p>
                    O aplicativo emprega infraestrutura de alta disponibilidade em nuvem com sincronização automática e suporte offline progressivo, permitindo o uso contínuo mesmo com oscilações momentâneas de conexão.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    4. Atualizações dos Termos
                  </h3>
                  <p>
                    Estes termos poderão ser aprimorados para refletir novas funcionalidades e conformidades jurídicas. Notificações relevantes serão exibidas diretamente na interface do app.
                  </p>
                </section>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
