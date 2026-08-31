const CACHE_NAME = 'facturacontrol-cache-v1';
const OFFLINE_URL = '/';

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.webmanifest',
        '/icon',
        '/apple-icon',
        '/icons/icon-192x192.svg',
        '/icons/icon-512x512.svg'
      ]);
    })
  );
  self.skipWaiting();
});

// Activación y limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Estrategia de Fetch: Network First con fallback a Cache
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
  }
});

// Soporte de Notificaciones Push Nativas
self.addEventListener('push', (event) => {
  let data = { title: 'FacturaControl', body: 'Tienes un nuevo movimiento o recordatorio financiero.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'FacturaControl', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Click en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
