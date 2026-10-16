import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, FileText, Lock, Database, Trash2, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PRIVACY_EMAIL = import.meta.env.VITE_PRIVACY_EMAIL;

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
                    1. Dados que coletamos e para quê
                  </h3>
                  <p>
                    Coletamos apenas o necessário para o app funcionar:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Conta:</strong> e-mail ou telefone/usuário, nome e foto (quando você entra com Google ou Apple).</li>
                    <li><strong>Dados financeiros que você insere:</strong> despesas, rendas, cartões, caixinhas, carteira, assinaturas e registros de renda extra.</li>
                    <li><strong>Dados opcionais do perfil:</strong> CPF, data de nascimento, telefone/WhatsApp, chave Pix e profissão. Só preenchemos se você informar, e você pode apagar quando quiser.</li>
                    <li><strong>Dados de terceiros que você cadastra:</strong> nome, telefone e chave Pix de pessoas com quem você divide gastos. Você deve cadastrá-los apenas para uso pessoal e organização das suas contas.</li>
                    <li><strong>Dados técnicos:</strong> identificadores de sessão e de notificação (push) do seu aparelho, quando você ativa os avisos.</li>
                  </ul>
                  <p>
                    Usamos esses dados para gerar relatórios, previsões de fatura, avisos que você escolher ativar e para manter sua conta segura.
                  </p>
                </section>
                <section className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-emerald-500" />
                    2. Base legal (LGPD, art. 7º)
                  </h3>
                  <p>
                    Tratamos seus dados para <strong>executar o serviço que você contratou</strong> (conta e controle financeiro), com base no seu <strong>consentimento</strong> para dados opcionais e avisos (e-mail, push, WhatsApp), e no nosso <strong>legítimo interesse</strong> em segurança e prevenção a fraudes. Você pode revogar o consentimento a qualquer momento.
                  </p>
                </section>
                <section className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText size={15} className="text-emerald-500" />
                    3. Com quem os dados são compartilhados
                  </h3>
                  <p>
                    Não vendemos nem alugamos seus dados, e não os repassamos a anunciantes ou birôs de crédito. Para o app funcionar, usamos prestadores (operadores) que tratam dados em nosso nome:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Google (Firebase):</strong> autenticação e banco de dados.</li>
                    <li><strong>Netlify:</strong> hospedagem do aplicativo.</li>
                    <li><strong>Provedor de e-mail:</strong> envio dos avisos de fatura, somente se você ativar essa opção.</li>
                    <li><strong>Twilio/WhatsApp e Google Gemini:</strong> somente se você usar o lançamento de gastos por mensagem de WhatsApp.</li>
                  </ul>
                  <p>
                    Alguns desses prestadores armazenam dados fora do Brasil. Nesses casos, a transferência internacional ocorre conforme o art. 33 da LGPD.
                  </p>
                </section>
                <section className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Lock size={15} className="text-emerald-500" />
                    4. Segurança
                  </h3>
                  <p>
                    Seus dados ficam no Firebase com regras de acesso que permitem que <strong>somente a sua conta</strong> leia e grave seus registros. A conexão é protegida por HTTPS, o PIN do app é guardado apenas como hash, e os dados são cifrados em trânsito e em repouso pela infraestrutura do Google. Em caso de incidente de segurança com risco relevante, comunicaremos você e a ANPD, conforme o art. 48 da LGPD.
                  </p>
                </section>
                <section className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Database size={15} className="text-emerald-500" />
                    5. Por quanto tempo guardamos
                  </h3>
                  <p>
                    Mantemos seus dados enquanto sua conta estiver ativa. Ao excluir a conta, seus dados são apagados do banco de dados. Cópias técnicas de segurança do provedor podem permanecer por um curto período até serem sobrescritas.
                  </p>
                </section>
                <section className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Trash2 size={15} className="text-rose-500" />
                    6. Seus direitos como titular
                  </h3>
                  <p>
                    Você pode, a qualquer momento (LGPD, art. 18): confirmar se tratamos seus dados, acessá-los, corrigi-los, pedir portabilidade, eliminar dados, saber com quem os compartilhamos e revogar consentimentos. No app: edite em <strong>Perfil</strong>, baixe uma cópia em <strong>Exportar Dados</strong> e exclua tudo em <strong>Excluir minha conta</strong>.
                  </p>
                  {PRIVACY_EMAIL && (
                    <p>
                      Para outros pedidos ou dúvidas, fale com o encarregado de dados: <a href={`mailto:${PRIVACY_EMAIL}`} className="font-semibold text-emerald-600 dark:text-emerald-400 underline">{PRIVACY_EMAIL}</a>.
                    </p>
                  )}
                  {onOpenDeleteAccount && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenDeleteAccount();
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 dark:bg-white/[0.06] dark:hover:bg-rose-950/20 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
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
                    2.1 Idade mínima
                  </h3>
                  <p>
                    O uso do aplicativo é destinado a pessoas com <strong>18 anos ou mais</strong>. Ao criar sua conta, você declara ter essa idade.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    2.2 Dados de outras pessoas
                  </h3>
                  <p>
                    Ao cadastrar dados de terceiros (como nome, telefone ou chave Pix de quem divide gastos com você), você declara que o faz para uso pessoal e que tem motivo legítimo para isso. Esses dados não são usados pelo Gastô? para qualquer outra finalidade.
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
