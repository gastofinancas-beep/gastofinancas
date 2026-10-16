import { auth } from '../lib/firebase';

export interface SendBillEmailParams {
  userName?: string;
  cardName: string;
  bankName?: string;
  amount: number;
  dueDay: number;
  daysDiff?: number;
}

export interface SendBillEmailResponse {
  success: boolean;
  targetEmail: string;
  message?: string;
  error?: string;
  provider?: string;
  requiresConfiguration?: boolean;
  htmlPreview?: string;
}

export async function sendBillNotificationEmail(params: SendBillEmailParams): Promise<SendBillEmailResponse> {
  const user = auth.currentUser;
  if (!user) {
    return {
      success: false,
      targetEmail: '',
    };
  }

  const isPasswordUser = user.providerData.some((p) => p.providerId === 'password');
  if (isPasswordUser) {
    try {
      await user.reload();
    } catch (reloadErr) {
      console.error('Falha ao recarregar dados do usuário:', reloadErr);
    }
    if (!user.emailVerified) {
      return {
        success: false,
        targetEmail: '',
      };
    }
  }

  let token = '';
  try {
    token = user.emailVerified ? await user.getIdToken(true) : await user.getIdToken();
  } catch (err) {
    console.error('Falha ao obter token:', err);
    return {
      success: false,
      targetEmail: '',
    };
  }

  try {
    const endpoints = ['/api/send-bill-notification', '/.netlify/functions/send-bill-notification'];
    let lastData: any = null;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            userName: params.userName,
            cardName: params.cardName,
            bankName: params.bankName,
            amount: params.amount,
            dueDay: params.dueDay,
            daysDiff: params.daysDiff,
          }),
        });

        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          lastData = data;
          if (data.success) {
            return {
              success: true,
              targetEmail: user.email || '',
              provider: data.provider,
              message: data.message || 'E-mail enviado com sucesso.',
            };
          }
        }
      } catch (e) {
        console.error('Falha ao tentar endpoint de notificação:', e);
      }
    }

    return {
      success: false,
      targetEmail: user.email || '',
      error: lastData?.error || 'Erro ao processar envio.',
    };
  } catch (err: any) {
    return {
      success: false,
      targetEmail: user.email || '',
      error: err?.message || 'Erro ao processar envio.',
    };
  }
}
