import { Handler } from '@netlify/functions';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function ensureAdminInitialized(): boolean {
  if (!getApps().length) {
    try {
      const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (!serviceAccountStr) {
        console.error('FIREBASE_SERVICE_ACCOUNT não configurado.');
        return false;
      }
      const serviceAccount = JSON.parse(serviceAccountStr);
      initializeApp({
        credential: cert(serviceAccount),
      });
      return true;
    } catch (error) {
      console.error('Erro ao inicializar o Firebase Admin:', error);
      return false;
    }
  }
  return true;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatBRL(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

async function checkRateLimit(uid: string): Promise<boolean> {
  const db = getFirestore(getApp(), process.env.FIREBASE_DATABASE_ID || 'ai-studio-financegastos220-81373407-56dc-4fe4-8f86-a49bec9a9867');
  const ref = db.collection('rateLimits').doc(uid);
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_DAY = 24 * 60 * 60 * 1000;

  return await db.runTransaction(async (transaction) => {
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

function generateEmailHtml(params: {
  userName: string;
  cardName: string;
  bankName?: string;
  amount: number;
  dueDay: number;
  dueDateFormatted: string;
  daysDiff: number;
}): string {
  const {
    userName,
    cardName,
    bankName,
    amount,
    dueDay,
    dueDateFormatted,
    daysDiff,
  } = params;

  let alertBadgeColor = '#F59E0B';
  let alertBadgeBg = '#FEF3C7';
  let alertTitle = `Lembrete: Fatura do cartão ${cardName} vence em ${daysDiff} dia(s)`;

  if (daysDiff === 0) {
    alertBadgeColor = '#DC2626';
    alertBadgeBg = '#FEE2E2';
    alertTitle = `🚨 URGENTE: Fatura do cartão ${cardName} vence HOJE!`;
  } else if (daysDiff === 1) {
    alertBadgeColor = '#EA580C';
    alertBadgeBg = '#FFEDD5';
    alertTitle = `⏰ ATENÇÃO: Fatura do cartão ${cardName} vence AMANHÃ!`;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aviso de Fatura - Gastô Finanças</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 24px auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #E2E8F0;">
    <tr>
      <td style="padding: 24px 30px; background: linear-gradient(135deg, #059669 0%, #10B981 100%); text-align: left;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">
                Gastô Finanças
              </h1>
              <p style="margin: 3px 0 0 0; color: #D1FAE5; font-size: 12px; font-weight: 500;">
                Alerta Inteligente de Vencimento de Fatura
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding: 28px 30px;">
        <div style="background-color: ${alertBadgeBg}; border-left: 4px solid ${alertBadgeColor}; border-radius: 10px; padding: 12px 16px; margin-bottom: 22px;">
          <p style="margin: 0; color: ${alertBadgeColor}; font-size: 14px; font-weight: 700;">
            ${alertTitle}
          </p>
          <p style="margin: 3px 0 0 0; color: #475569; font-size: 12px;">
            Lembrete automático para evitar juros de atraso ou multas rotativas.
          </p>
        </div>

        <p style="font-size: 14px; line-height: 22px; color: #334155; margin: 0 0 18px 0;">
          Olá, <strong>${userName}</strong>! Seguem os detalhes da fatura do seu cartão cadastrado no <strong>Gastô</strong>:
        </p>

        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 18px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 10px; color: #64748B; font-size: 12px; font-weight: 600;">
                    Cartão / Emissor:
                  </td>
                  <td align="right" style="padding-bottom: 10px; color: #0F172A; font-size: 13px; font-weight: 700;">
                    ${cardName} ${bankName ? `(${bankName})` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 10px; color: #64748B; font-size: 12px; font-weight: 600;">
                    Vencimento:
                  </td>
                  <td align="right" style="padding-bottom: 10px; color: #0F172A; font-size: 13px; font-weight: 700;">
                    Dia ${dueDay} (${dueDateFormatted})
                  </td>
                </tr>
                <tr style="border-top: 1px dashed #CBD5E1;">
                  <td style="padding-top: 12px; color: #0F172A; font-size: 14px; font-weight: 800;">
                    Valor Previsto da Fatura:
                  </td>
                  <td align="right" style="padding-top: 12px; color: #059669; font-size: 18px; font-weight: 800;">
                    ${formatBRL(amount)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 10px auto 20px auto;">
          <tr>
            <td align="center" style="border-radius: 12px; background-color: #059669;">
              <a href="https://gastofinancas.netlify.app" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 13px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 12px;">
                Acessar Aplicativo Gastô
              </a>
            </td>
          </tr>
        </table>

        <p style="font-size: 11px; line-height: 16px; color: #94A3B8; text-align: center; margin: 0;">
          Para pagar a fatura, acesse o aplicativo do seu banco ou internet banking.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding: 16px 30px; background-color: #F1F5F9; border-top: 1px solid #E2E8F0; text-align: center;">
        <p style="margin: 0; font-size: 11px; color: #64748B;">
          Gastô Finanças • Gestão Financeira Pessoal & Familiar
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const adminReady = ensureAdminInitialized();
  if (!adminReady) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Erro interno no servidor.' }),
    };
  }

  const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Não autorizado.' }),
    };
  }

  const idToken = authHeader.slice(7).trim();
  if (!idToken) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Não autorizado.' }),
    };
  }

  let decodedToken;
  try {
    decodedToken = await getAuth().verifyIdToken(idToken);
  } catch (err) {
    console.error('Falha na validação do token Firebase:', err);
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Não autorizado.' }),
    };
  }

  const targetEmail = decodedToken.email;
  if (!targetEmail) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Token não possui e-mail associado.' }),
    };
  }

  if (!decodedToken.email_verified) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'E-mail não verificado.' }),
    };
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    console.error('Falha ao decodificar payload JSON:', err);
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Payload inválido.' }),
    };
  }

  const { userName, cardName, bankName, amount, dueDay, daysDiff } = payload;

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
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Dados inválidos.' }),
    };
  }

  try {
    const rateLimitOk = await checkRateLimit(decodedToken.uid);
    if (!rateLimitOk) {
      return {
        statusCode: 429,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Limite de envios excedido. Tente novamente mais tarde.' }),
      };
    }
  } catch (err) {
    console.error('Erro ao verificar limite de taxa no Firestore:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Erro interno no servidor.' }),
    };
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

  const htmlContent = generateEmailHtml({
    userName: safeUserName,
    cardName: safeCardName,
    bankName: safeBankName,
    amount,
    dueDay,
    dueDateFormatted,
    daysDiff,
  });

  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const fromEmail = process.env.NOTIFICATION_SENDER_EMAIL || 'Gastô Finanças <onboarding@resend.dev>';
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [targetEmail],
          subject,
          html: htmlContent,
        }),
      });

      if (resendRes.ok) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            message: 'E-mail enviado com sucesso.',
          }),
        };
      }
      const resendData = await resendRes.json().catch(() => ({}));
      console.error('Erro na API do Resend:', resendData);
    } catch (err) {
      console.error('Falha de conexão com o Resend:', err);
    }
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Erro ao processar envio de e-mail.' }),
    };
  }

  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey) {
    try {
      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Gastô Finanças', email: process.env.NOTIFICATION_SENDER_EMAIL || 'notificacoes@gastofinancas.com' },
          to: [{ email: targetEmail, name: safeUserName }],
          subject,
          htmlContent,
        }),
      });

      if (brevoRes.ok) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            message: 'E-mail enviado com sucesso.',
          }),
        };
      }
      const brevoData = await brevoRes.json().catch(() => ({}));
      console.error('Erro na API do Brevo:', brevoData);
    } catch (err) {
      console.error('Falha de conexão com o Brevo:', err);
    }
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Erro ao processar envio de e-mail.' }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: false,
      message: 'Serviço de e-mail não configurado.',
    }),
  };
};
