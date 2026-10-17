// Service Worker com estratégia Cache-First para assets críticos e Network-First para app shell
const STATIC_CACHE_NAME = 'gastofinance-static-v3';
const ASSETS_CACHE_NAME = 'gastofinance-assets-v3';
const CURRENT_CACHES = [STATIC_CACHE_NAME, ASSETS_CACHE_NAME];

// Arquivos estruturais essenciais do app shell
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
];

// Assets visuais críticos com estratégia Cache-First:
// Carregados instantaneamente do cache para eliminar tráfego de rede e acelerar o primeiro carregamento
const CRITICAL_CACHE_FIRST_ASSETS = [
  '/favicon.svg',
  '/images/welcome_pos_art.webp',
  '/images/pos_card_payment.webp',
  '/images/finance_tracking.webp',
  '/images/finance_tracking.png',
  '/images/welcome_pos_art_1789480598545.jpg',
  '/images/pos_card_payment_1788377058638.jpg',
  '/images/finance_tracking_1788382586326.jpg',
  '/images/finances_partnership_1788377696421.jpg',
];

// Instalação: Pré-cacheia app shell e assets críticos com tolerância a falhas individuais
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Precache do app shell
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return Promise.allSettled(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch((err) => console.warn(`[SW] Precache falhou para ${url}:`, err))
          )
        );
      }),
      // Precache dos assets críticos Cache-First (/images/ e /favicon.svg)
      caches.open(ASSETS_CACHE_NAME).then((cache) => {
        return Promise.allSettled(
          CRITICAL_CACHE_FIRST_ASSETS.map((url) =>
            cache.add(url).catch((err) => console.warn(`[SW] Precache falhou para asset ${url}:`, err))
          )
        );
      }),
    ])
  );
  self.skipWaiting();
});

// Ativação: Limpa caches obsoletos e assume controle imediato
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !CURRENT_CACHES.includes(key))
          .map((key) => {
            console.log(`[SW] Removendo cache obsoleto: ${key}`);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: Gerenciamento inteligente de requisições por tipo de recurso
self.addEventListener('fetch', (event) => {
  // Ignora requests que não são GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignora requests para APIs externas (Firebase, Google Fonts, etc.)
  const isExternal =
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  if (isExternal) return;

  // ============================================================================
  // 1. ESTRATÉGIA CACHE-FIRST: Para /images/* e /favicon.svg
  // ============================================================================
  // Verifica primeiro se o asset existe no cache local para entrega instantânea
  // sem latência de rede. Se não existir, busca na rede, armazena no cache e retorna.
  const isCacheFirstAsset =
    url.pathname === '/favicon.svg' ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/public/images/');

  if (isCacheFirstAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Cache hit: retorna imediatamente da memória/disco local
          return cachedResponse;
        }

        // Cache miss: busca da rede, grava no cache de assets e retorna
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(ASSETS_CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch((err) => {
            console.warn('[SW] Falha ao recuperar asset da rede:', event.request.url, err);
            // Fallback se estiver offline e não houver cache
            return new Response('Asset indisponível offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({ 'Content-Type': 'text/plain' })
            });
          });
      })
    );
    return;
  }

  // ============================================================================
  // 2. ESTRATÉGIA NETWORK-FIRST: Para App Shell, rotas e dados da aplicação
  // ============================================================================
  // Garante a versão mais recente quando online, com fallback offline transparente
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Salva cópia atualizada no cache se for resposta válida 200
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Modo offline: recupera do cache estático
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Se for navegação de página (HTML SPA), retorna a raiz '/'
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// ============================================================================
// PUSH NOTIFICATIONS API & NOTIFICAÇÕES LOCAIS (LEMBRETES DE FATURAS)
// ============================================================================

// Listener para eventos de Push enviados pelo servidor ou disparados via Push API
self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload = { title: 'Gastô Finanças', body: event.data.text() };
    }
  }

  const title = payload.title || 'Gastô';
  const options = {
    body: payload.body || 'Você tem uma fatura de cartão com vencimento próximo.',
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/favicon.svg',
    tag: payload.tag || 'gasto-bill-notification',
    renotify: payload.renotify !== false,
    vibrate: payload.vibrate || [200, 100, 200, 100, 200],
    data: {
      url: payload.url || '/?tab=cards',
      dateOfArrival: Date.now(),
      ...(payload.data || {})
    },
    actions: payload.actions || [
      { action: 'view_cards', title: 'Ver faturas' },
      { action: 'close', title: 'Dispensar' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Clique na notificação: abre o app e navega para a aba de cartões
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/?tab=cards';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já houver uma aba aberta do app, foca nela e envia mensagem
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: notificationData,
            tag: event.notification.tag,
            action: event.action
          });
          return client.focus();
        }
      }
      // Se nenhuma janela estiver aberta, abre uma nova diretamente no destino
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Listener para mensagens diretas do app cliente (para disparar notificações nativas via Service Worker)
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data.payload || {};
    if (title && self.registration) {
      self.registration.showNotification(title, {
        icon: '/pwa-192x192.png',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
        ...options,
        actions: options?.actions || [
          { action: 'view_cards', title: 'Ver faturas' },
          { action: 'close', title: 'Dispensar' }
        ]
      });
    }
  }

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

