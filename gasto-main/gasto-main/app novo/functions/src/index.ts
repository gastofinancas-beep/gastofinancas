import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { getFirestore, Transaction } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore(admin.app(), process.env.FIREBASE_DATABASE_ID || 'ai-studio-financegastos220-81373407-56dc-4fe4-8f86-a49bec9a9867');

/**
 * Configure Nodemailer transport from environment configuration.
 * Falls back to simulation/console logging if SMTP credentials are not configured.
 */
function getEmailTransporter(): nodemailer.Transporter | null {
  const smtpHost = process.env.SMTP_HOST || functions.config().smtp?.host;
  const smtpPort = Number(process.env.SMTP_PORT || functions.config().smtp?.port || 587);
  const smtpUser = process.env.SMTP_USER || functions.config().smtp?.user;
  const smtpPass = process.env.SMTP_PASS || functions.config().smtp?.pass;

  if (smtpHost && smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  return null;
}

/**
 * Helper to format currency in Brazilian Real (BRL).
 */
function formatBRL(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

/**
 * Helper to escape HTML characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Check rate limit for cloud functions
 */
async function checkFunctionRateLimit(uid: string): Promise<boolean> {
  const ref = db.collection('rateLimits').doc(uid);
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_DAY = 24 * 60 * 60 * 1000;

  return await db.runTransaction(async (transaction: Transaction) => {
    const doc = await transaction.get(ref);
    const data = doc.data();

    let hourlyCount = 0;
    let hourlyResetAt = now + ONE_HOUR;
    let dailyCount = 0;
    let dailyResetAt = now + ONE_DAY;

    if (data) {
      hourlyCount = typeof data.hourlyCount === 'number' ? data.hourlyCount : 0;
      hourlyResetAt = typeof data.hourlyResetAt === 'number' ? data.hourlyResetAt : now + ONE_HOUR;
      dailyCount = typeof data.dailyCount === 'number' ? data.dailyCount : 0;
      dailyResetAt = typeof data.dailyResetAt === 'number' ? data.dailyResetAt : now + ONE_DAY;

      if (now > hourlyResetAt) {
        hourlyCount = 0;
        hourlyResetAt = now + ONE_HOUR;
      }
      if (now > dailyResetAt) {
        dailyCount = 0;
        dailyResetAt = now + ONE_DAY;
      }
    }

    if (hourlyCount >= 5 || dailyCount >= 20) {
      return false;
    }

    transaction.set(
      ref,
      {
        hourlyCount: hourlyCount + 1,
        hourlyResetAt,
        dailyCount: dailyCount + 1,
        dailyResetAt,
        lastSentAt: now,
      },
      { merge: true }
    );

    return true;
  });
}

/**
 * Generates high quality HTML template for card bill email notification.
 */
function generateBillEmailHtml(params: {
  userName: string;
  cardName: string;
  bankName?: string;
  amount: number;
  dueDay: number;
  dueDateFormatted: string;
  daysDiff: number;
  statusText: string;
}): string {
  const {
    userName,
    cardName,
    bankName,
    amount,
    dueDay,
    dueDateFormatted,
    daysDiff,
    statusText,
  } = params;

  let alertBadgeColor = '#F59E0B'; // Amber
  let alertBadgeBg = '#FEF3C7';
  let alertTitle = `Lembrete: Fatura do cartão ${cardName} vence em ${daysDiff} dia(s)`;

  if (daysDiff === 0) {
    alertBadgeColor = '#DC2626'; // Red
    alertBadgeBg = '#FEE2E2';
    alertTitle = `🚨 URGENTE: Fatura do cartão ${cardName} vence HOJE!`;
  } else if (daysDiff === 1) {
    alertBadgeColor = '#EA580C'; // Orange
    alertBadgeBg = '#FFEDD5';
    alertTitle = `⏰ ATENÇÃO: Fatura do cartão ${cardName} vence AMANHÃ!`;
  } else if (daysDiff < 0) {
    alertBadgeColor = '#991B1B';
    alertBadgeBg = '#FEE2E2';
    alertTitle = `🔴 AVISO: Fatura do cartão ${cardName} vencida há ${Math.abs(daysDiff)} dia(s)`;
  }

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aviso de Fatura - Gastô Finanças</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 30px auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #E2E8F0;">
      <!-- Header -->
      <tr>
        <td style="padding: 28px 32px; background: linear-gradient(135deg, #059669 0%, #10B981 100%); text-align: left;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <h1 style="margin: 0; color: #FFFFFF; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                  Gastô Finanças
                </h1>
                <p style="margin: 4px 0 0 0; color: #D1FAE5; font-size: 13px; font-weight: 500;">
                  Alerta Inteligente de Faturas & Controle Financeiro
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body Content -->
      <tr>
        <td style="padding: 32px;">
          <!-- Status Banner -->
          <div style="background-color: ${alertBadgeBg}; border-left: 4px solid ${alertBadgeColor}; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
            <p style="margin: 0; color: ${alertBadgeColor}; font-size: 15px; font-weight: 700;">
              ${alertTitle}
            </p>
            <p style="margin: 4px 0 0 0; color: #475569; font-size: 13px;">
              ${statusText}
            </p>
          </div>

          <p style="font-size: 15px; line-height: 24px; color: #334155; margin: 0 0 20px 0;">
            Olá, <strong>${userName}</strong>! Este é um lembrete automático do vencimento da sua fatura cadastrada no <strong>Gastô</strong>:
          </p>

          <!-- Card Summary Box -->
          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; margin-bottom: 26px;">
            <tr>
              <td style="padding: 20px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom: 12px; color: #64748B; font-size: 13px; font-weight: 600;">
                      Cartão / Banco:
                    </td>
                    <td align="right" style="padding-bottom: 12px; color: #0F172A; font-size: 14px; font-weight: 700;">
                      ${cardName} ${bankName ? `(${bankName})` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 12px; color: #64748B; font-size: 13px; font-weight: 600;">
                      Data de Vencimento:
                    </td>
                    <td align="right" style="padding-bottom: 12px; color: #0F172A; font-size: 14px; font-weight: 700;">
                      Dia ${dueDay} (${dueDateFormatted})
                    </td>
                  </tr>
                  <tr style="border-top: 1px dashed #CBD5E1;">
                    <td style="padding-top: 14px; color: #0F172A; font-size: 15px; font-weight: 800;">
                      Valor Total da Fatura:
                    </td>
                    <td align="right" style="padding-top: 14px; color: #059669; font-size: 20px; font-weight: 800;">
                      ${formatBRL(amount)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Action Button -->
          <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 20px auto 26px auto;">
            <tr>
              <td align="center" style="border-radius: 12px; background-color: #059669;">
                <a href="https://gastofinancas.netlify.app" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 12px;">
                  Acessar Aplicativo Gastô
                </a>
              </td>
            </tr>
          </table>

          <p style="font-size: 12px; line-height: 18px; color: #94A3B8; text-align: center; margin: 0;">
            Evite cobrança de juros e multas rotativas realizando o pagamento até a data limite indicada pelo emissor.
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding: 20px 32px; background-color: #F1F5F9; border-top: 1px solid #E2E8F0; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #64748B;">
            Você recebeu esta mensagem porque configurou o envio de lembretes no seu perfil do Gastô Finanças.<br/>
            E-mail de recuperação e avisos cadastrado pelo titular da conta.
          </p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

/**
 * Dispatches an email using nodemailer or logs structured output for webhook delivery.
 */
async function sendEmailNotification(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; messageId?: string; simulated?: boolean }> {
  const fromEmail = process.env.NOTIFICATION_SENDER_EMAIL || 'notificacoes@gastofinancas.com';
  const transporter = getEmailTransporter();

  if (transporter) {
    const info = await transporter.sendMail({
      from: `"Gastô Finanças" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.subject,
    });
    return { success: true, messageId: info.messageId, simulated: false };
  }

  // If no SMTP configured, log cleanly and return simulated success
  console.log(`[EMAIL DISPATCH] To: ${options.to} | Subject: ${options.subject}`);
  return { success: true, messageId: `simulated-${Date.now()}`, simulated: true };
}

/**
 * 1. SCHEDULED CRON FUNCTION: checkUpcomingCardBillsAndSendEmail
 * Runs every day at 08:00 AM America/Sao_Paulo (11:00 UTC) to check all users'
 * card bills and send email notifications for upcoming / due bills.
 */
export const checkUpcomingCardBillsAndSendEmail = functions.pubsub
  .schedule('0 8 * * *')
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    console.log('Iniciando rotina agendada de verificação de faturas vencendo por e-mail...');

    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.toISOString().slice(0, 7); // "YYYY-MM"
    const todayStr = now.toISOString().slice(0, 10);

    const usersSnapshot = await db.collection('users').get();
    let totalEmailsSent = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const profile = userData.profile || {};
      
      // Check if email notifications are allowed (default true if recoveryEmail or email is present)
      const notifyEmail = profile.notifyCardBillsEmail !== false;
      const targetEmail = profile.recoveryEmail || profile.email || userData.email;

      if (!notifyEmail || !targetEmail) {
        continue;
      }

      const cards = (userData.cards || []) as any[];
      const expenses = (userData.expenses || []) as any[];
      const paidBills = (userData.paidBills || []) as any[];

      for (const card of cards) {
        // Skip if already marked as paid for this month
        const isPaid = paidBills.some(
          (b: any) => b.cardId === card.id && b.monthYear === currentMonth
        );
        if (isPaid) continue;

        // Sum up current month expenses for this card
        const cardExpenses = expenses.filter((e: any) => {
          if (e.cardId !== card.id) return false;
          return e.startMonthYear === currentMonth || e.date?.startsWith(currentMonth);
        });

        const billTotal = cardExpenses.reduce((sum: number, exp: any) => sum + (Number(exp.amount) || 0), 0);
        if (billTotal <= 0) continue;

        const dueDay = Number(card.dueDay) || 15;
        const daysDiff = dueDay - currentDay;

        // Trigger on: 3 days before, 1 day before (tomorrow), or day of (today)
        let shouldNotify = false;
        let statusText = '';

        if (daysDiff === 0) {
          shouldNotify = true;
          statusText = 'A fatura vence hoje. Efetue o pagamento para manter suas contas em dia.';
        } else if (daysDiff === 1) {
          shouldNotify = true;
          statusText = 'A fatura vence amanhã. Não deixe para a última hora!';
        } else if (daysDiff === 3) {
          shouldNotify = true;
          statusText = `Sua fatura vence em 3 dias (dia ${dueDay}).`;
        }

        if (!shouldNotify) continue;

        const subject = daysDiff === 0
          ? `🚨 URGENTE: Fatura do cartão ${card.name} vence HOJE (${formatBRL(billTotal)})`
          : `⏰ Lembrete: Fatura do cartão ${card.name} vence dia ${dueDay} (${formatBRL(billTotal)})`;

        const dueDateFormatted = `${String(dueDay).padStart(2, '0')}/${currentMonth.split('-')[1]}/${currentMonth.split('-')[0]}`;
        const userName = profile.nickname || profile.name || 'Usuário';

        const html = generateBillEmailHtml({
          userName,
          cardName: card.name,
          bankName: card.bank,
          amount: billTotal,
          dueDay,
          dueDateFormatted,
          daysDiff,
          statusText,
        });

        try {
          await sendEmailNotification({
            to: targetEmail,
            subject,
            html,
          });
          totalEmailsSent++;
          console.log(`[CRON NOTIFICAÇÃO] E-mail enviado para ${targetEmail} referente ao cartão ${card.name}`);
        } catch (err) {
          console.error(`[CRON ERRO] Falha ao enviar e-mail para ${targetEmail}:`, err);
        }
      }
    }

    console.log(`Rotina finalizada. Total de notificações por e-mail disparadas: ${totalEmailsSent}`);
    return { success: true, totalEmailsSent };
  });

/**
 * 2. CALLABLE / HTTPS CLOUD FUNCTION: triggerBillNotificationEmail
 * Allows client application to trigger on-demand bill email notification or test email.
 */
export const triggerBillNotificationEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado.');
  }

  const targetEmail = context.auth.token.email;
  if (!targetEmail) {
    throw new functions.https.HttpsError('invalid-argument', 'Token não possui e-mail associado.');
  }

  if (!context.auth.token.email_verified) {
    throw new functions.https.HttpsError('failed-precondition', 'E-mail não verificado.');
  }

  const {
    userName,
    cardName,
    bankName,
    amount,
    dueDay,
    daysDiff,
  } = data || {};

  if (
    typeof userName !== 'string' ||
    !userName.trim() ||
    userName.length > 80 ||
    typeof cardName !== 'string' ||
    !cardName.trim() ||
    cardName.length > 80 ||
    (bankName !== undefined && (typeof bankName !== 'string' || bankName.length > 80)) ||
    typeof amount !== 'number' ||
    isNaN(amount) ||
    amount <= 0 ||
    !isFinite(amount) ||
    typeof dueDay !== 'number' ||
    !Number.isInteger(dueDay) ||
    dueDay < 1 ||
    dueDay > 31 ||
    typeof daysDiff !== 'number' ||
    !Number.isInteger(daysDiff) ||
    daysDiff < 0 ||
    daysDiff > 30
  ) {
    throw new functions.https.HttpsError('invalid-argument', 'Dados inválidos.');
  }

  const rateLimitOk = await checkFunctionRateLimit(context.auth.uid);
  if (!rateLimitOk) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Limite de envios excedido. Tente novamente mais tarde.'
    );
  }

  const safeUserName = escapeHtml(userName.trim());
  const safeCardName = escapeHtml(cardName.trim());
  const safeBankName = bankName ? escapeHtml((bankName as string).trim()) : undefined;

  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const dueDateFormatted = `${String(dueDay).padStart(2, '0')}/${currentMonth.split('-')[1]}/${currentMonth.split('-')[0]}`;

  const subject = daysDiff === 0
    ? `🚨 URGENTE: Fatura do cartão ${safeCardName} vence HOJE (${formatBRL(amount)})`
    : `⏰ Lembrete: Fatura do cartão ${safeCardName} vence dia ${dueDay} (${formatBRL(amount)})`;

  const html = generateBillEmailHtml({
    userName: safeUserName,
    cardName: safeCardName,
    bankName: safeBankName,
    amount,
    dueDay,
    dueDateFormatted,
    daysDiff,
    statusText: 'Lembrete automático para controle de gastos e pontualidade no pagamento.',
  });

  const result = await sendEmailNotification({
    to: targetEmail,
    subject,
    html,
  });

  return {
    success: true,
    targetEmail,
    messageId: result.messageId,
    simulated: result.simulated,
    sentAt: new Date().toISOString(),
  };
});
