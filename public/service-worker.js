// Service Worker for Push Notifications
// This enables browser notifications even when the app is closed

const CACHE_NAME = 'rdcredits-notifications-v1';
const urlsToCache = [
  '/',
  '/favicon.svg',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim all clients immediately
  return self.clients.claim();
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {

  let notificationData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'notification',
    requireInteraction: false,
    data: {},
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || 'New Notification',
        body: data.body || data.message || data.notification_message || 'You have a new notification',
        icon: data.icon || '/favicon.svg',
        badge: data.badge || '/favicon.svg',
        tag: data.tag || 'notification',
        requireInteraction: data.requireInteraction || false,
        data: data,
      };
    } catch (error) {
      console.error('[Service Worker] Error parsing push data:', error);
      // Use text data if JSON parsing fails
      notificationData.body = event.data.text();
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'open',
          title: 'Open',
        },
        {
          action: 'close',
          title: 'Close',
        },
      ],
    }
  );

  event.waitUntil(promiseChain);
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {

  event.notification.close();

  if (event.action === 'close') {
    // User clicked close, just close the notification
    return;
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === self.location.origin + '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Message event - handle messages from the app
self.addEventListener('message', (event) => {

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Handle custom notification requests from the app
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, data } = event.data;
    self.registration.showNotification(title || 'Notification', {
      body: body || '',
      icon: icon || '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'app-notification',
      data: data || {},
    });
  }
});

