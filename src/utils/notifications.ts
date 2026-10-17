import { CreditCard, ExpenseItem, InvestmentBox, CardBillPayment, UserProfile } from '../types';
import { formatCurrency } from './financeCalculations';
import { sendBillNotificationEmail } from './billEmailNotifications';
import { toLocalISODate, toLocalMonth } from './dateUtils';
import { getCardBillTotal, getNextDue, isCardBillPaid } from './billReminders';

export type NotificationPermissionStatus = NotificationPermission | 'unsupported';

/**
 * Checks if the browser / platform supports Web Notifications and Service Workers.
 */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Checks if Push API (PushManager) is supported by the browser.
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return isNotificationSupported() && 'PushManager' in window;
}

/**
 * Returns the current notification permission status.
 */
export function getNotificationPermission(): NotificationPermissionStatus {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Requests native browser / mobile permission for Push Notifications.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported in this browser environment.');
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

/**
 * Gets or creates a Web Push subscription via ServiceWorkerRegistration.
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.pushManager) return null;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      // Create a subscription (local / user-visible)
      // If a public VAPID key is provided in env, use it; otherwise subscribe with userVisibleOnly
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      const options: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
      };

      if (vapidKey) {
        options.applicationServerKey = urlBase64ToUint8Array(vapidKey);
      }

      subscription = await registration.pushManager.subscribe(options).catch(async (e) => {
        console.warn('PushManager subscription without VAPID fallback:', e);
        return null;
      });
    }

    return subscription;
  } catch (err) {
    console.warn('Failed to subscribe to push notifications:', err);
    return null;
  }
}

export type ExtendedNotificationOptions = NotificationOptions & {
  url?: string;
  renotify?: boolean;
  vibrate?: number[];
  actions?: Array<{ action: string; title: string }>;
};

/**
 * Dispatches a native push notification through the active Service Worker
 * (fallback to Window Notification API if SW is not ready).
 */
export async function sendPushNotification(
  title: string,
  options: ExtendedNotificationOptions = {}
): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') {
    console.info('Cannot send notification: permission is', Notification.permission);
    return false;
  }

  const defaultOptions: ExtendedNotificationOptions = {
    icon: '/pwa-192x192.png',
    badge: '/favicon.svg',
    tag: 'gasto-app-notification',
    renotify: true,
    data: {
      url: options.url || '/',
      timestamp: Date.now(),
      ...options.data,
    },
  };

  const finalOptions: ExtendedNotificationOptions = {
    ...defaultOptions,
    ...options,
    actions: options.actions || [
      { action: 'view_cards', title: '💳 Ver Fatura' },
      { action: 'close', title: 'Dispensar' }
    ],
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, finalOptions as NotificationOptions);
        return true;
      }

      // If registration.showNotification is not directly available, send message to active SW controller
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload: {
            title,
            options: finalOptions
          }
        });
        return true;
      }
    }

    // Fallback: standard Window Notification
    new Notification(title, finalOptions as NotificationOptions);
    return true;
  } catch (err) {
    console.warn('Error displaying push notification via SW:', err);
    try {
      new Notification(title, finalOptions as NotificationOptions);
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// LEMBRETES DE FATURAS DE CARTÃO PRÓXIMAS A VENCER
// ============================================================================

export interface BillNotificationResult {
  cardId: string;
  cardName: string;
  amount: number;
  dueDay: number;
  daysDiff: number;
  status: 'today' | 'tomorrow' | 'soon' | 'overdue';
  notified: boolean;
}

/**
 * Checks all credit cards against expenses in the current active month and triggers
 * system push notifications for cards with upcoming or due bills.
 */
export async function checkAndTriggerUpcomingBillNotifications(
  cards: CreditCard[],
  expenses: ExpenseItem[],
  _currentMonth: string = '', // mantido por compatibilidade: o lembrete usa sempre o mês real
  paidBills: CardBillPayment[] = [],
  options: { force?: boolean; profile?: UserProfile } = {}
): Promise<BillNotificationResult[]> {
  const isPushAllowed = isNotificationSupported() && Notification.permission === 'granted';
  const shouldSendEmail = options.profile?.notifyCardBillsEmail && (options.profile.recoveryEmail || options.profile.email);

  if (!isPushAllowed && !shouldSendEmail) {
    return [];
  }

  const now = new Date();
  const todayStr = toLocalISODate(now);
  const results: BillNotificationResult[] = [];

  for (const card of cards) {
    // Sempre a data real de hoje (não o mês que a pessoa está navegando na tela).
    const { billMonth, daysDiff } = getNextDue(card.dueDay || 15, now, 3);

    // 1. Fatura já paga? Não avisa.
    if (isCardBillPaid(card, paidBills, billMonth)) continue;

    // 2. Total da fatura (únicas + parceladas + fixas)
    const billTotal = getCardBillTotal(card, expenses, billMonth);

    // Fatura zerada: nada a avisar
    if (billTotal <= 0) continue;

    const dueDay = card.dueDay || 15;

    let status: 'today' | 'tomorrow' | 'soon' | 'overdue' | null = null;

    if (daysDiff === 0) {
      status = 'today';
    } else if (daysDiff === 1) {
      status = 'tomorrow';
    } else if (daysDiff === 2 || daysDiff === 3) {
      status = 'soon';
    } else if (daysDiff < 0 && daysDiff >= -3) {
      status = 'overdue';
    }

    if (!status) continue;

    // Deduplication: prevent sending more than 1 notification per card on the same day unless forced
    const storageKey = `gasto_notif_bill_${card.id}_${todayStr}`;
    const alreadyNotified = localStorage.getItem(storageKey);

    if (alreadyNotified && !options.force) {
      results.push({
        cardId: card.id,
        cardName: card.name,
        amount: billTotal,
        dueDay,
        daysDiff,
        status,
        notified: false,
      });
      continue;
    }

    // Build notification message
    let title = '';
    let body = '';

    if (status === 'today') {
      title = `⚠️ Fatura do ${card.name} vence HOJE!`;
      body = `Valor total: ${formatCurrency(billTotal)}. Pague hoje até o horário limite para evitar juros.`;
    } else if (status === 'tomorrow') {
      title = `⏰ Fatura do ${card.name} vence amanhã!`;
      body = `Valor total: ${formatCurrency(billTotal)} (Vencimento dia ${dueDay}).`;
    } else if (status === 'soon') {
      title = `📅 Lembrete: Fatura do ${card.name} vence em ${daysDiff} dias`;
      body = `Valor total: ${formatCurrency(billTotal)} (Vencimento dia ${dueDay}). Fique atento ao saldo!`;
    } else if (status === 'overdue') {
      title = `🔴 Fatura do ${card.name} vencida há ${Math.abs(daysDiff)} dia(s)`;
      body = `Valor em aberto: ${formatCurrency(billTotal)}. Regularize para evitar encargos bancários.`;
    }

    let sent = false;
    if (isPushAllowed) {
      sent = await sendPushNotification(title, {
        body,
        tag: `card-bill-${card.id}-${todayStr}`,
        url: '/?tab=cards',
        data: {
          type: 'card_bill',
          cardId: card.id,
          dueDay,
          amount: billTotal,
        },
      });
    }

    // Trigger email if user opted in for bill email notifications
    if (shouldSendEmail && options.profile) {
      try {
        const emailSent = await sendBillNotificationEmail({
          userName: options.profile.nickname || options.profile.name || 'Titular',
          cardName: card.name,
          bankName: card.bank,
          amount: billTotal,
          dueDay,
          daysDiff,
        });
        if (emailSent.success) {
          sent = true;
        }
      } catch (e) {
        console.warn('Failed to send invoice notification email:', e);
      }
    }

    if (sent) {
      localStorage.setItem(storageKey, new Date().toISOString());
      results.push({
        cardId: card.id,
        cardName: card.name,
        amount: billTotal,
        dueDay,
        daysDiff,
        status,
        notified: true,
      });
    }
  }

  return results;
}

// ============================================================================
// AVISOS DE RENDIMENTOS EM CAIXINHAS
// ============================================================================

export interface YieldNotificationResult {
  totalYield: number;
  activeBoxesCount: number;
  topBoxTitle?: string;
  topBoxYieldPercent?: number;
  notified: boolean;
}

/**
 * Checks active investment boxes and notifies user about estimated monthly yields
 * and compound growth.
 */
export async function checkAndTriggerInvestmentYieldNotifications(
  boxes: InvestmentBox[],
  options: { force?: boolean } = {}
): Promise<YieldNotificationResult | null> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  // Filter boxes with positive balance and yield rate
  const yieldingBoxes = boxes.filter(
    (b) => b.currentBalance > 0 && b.monthlyYieldPercent > 0
  );

  if (yieldingBoxes.length === 0) {
    return null;
  }

  // Calculate estimated monthly yields
  let totalMonthlyYield = 0;
  let topBox: InvestmentBox | null = null;
  let topYieldAmount = 0;

  for (const box of yieldingBoxes) {
    const boxYield = box.currentBalance * (box.monthlyYieldPercent / 100);
    totalMonthlyYield += boxYield;
    if (boxYield > topYieldAmount) {
      topYieldAmount = boxYield;
      topBox = box;
    }
  }

  if (totalMonthlyYield <= 0) return null;

  const now = new Date();
  const yearMonth = toLocalMonth(now);
  // Break into 4 weekly checks per month (days 1-7, 8-14, 15-21, 22-end)
  const weekSegment = Math.floor((now.getDate() - 1) / 7) + 1;
  const storageKey = `gasto_notif_yield_${yearMonth}_w${weekSegment}`;
  const alreadyNotified = localStorage.getItem(storageKey);

  if (alreadyNotified && !options.force) {
    return {
      totalYield: totalMonthlyYield,
      activeBoxesCount: yieldingBoxes.length,
      topBoxTitle: topBox?.title,
      topBoxYieldPercent: topBox?.monthlyYieldPercent,
      notified: false,
    };
  }

  const topHighlight = topBox
    ? ` Destaque para "${topBox.title}" rendendo aprox. ${topBox.monthlyYieldPercent}% a.m.`
    : '';

  const title = `📈 Caixinhas: rendimento estimado de ${formatCurrency(totalMonthlyYield)}!`;
  const body = `Seu dinheiro está trabalhando para você nas suas caixinhas.${topHighlight}`;

  const sent = await sendPushNotification(title, {
    body,
    tag: `boxes-yield-${yearMonth}-w${weekSegment}`,
    url: '/?tab=investments',
    data: {
      type: 'investment_yield',
      totalYield: totalMonthlyYield,
      boxesCount: yieldingBoxes.length,
    },
  });

  if (sent) {
    localStorage.setItem(storageKey, new Date().toISOString());
    return {
      totalYield: totalMonthlyYield,
      activeBoxesCount: yieldingBoxes.length,
      topBoxTitle: topBox?.title,
      topBoxYieldPercent: topBox?.monthlyYieldPercent,
      notified: true,
    };
  }

  return null;
}

/**
 * Helper to convert Base64 URL to Uint8Array for VAPID applicationServerKey
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
