/**
 * Service Worker for ActionFlows Dashboard
 * Provides offline caching for critical assets and app shell
 *
 * Cache strategy:
 * - App shell (HTML, CSS, JS) - cached indefinitely with version management
 * - API responses - network-first, fallback to cache
 * - Images/assets - cache-first with network fallback
 * - Monaco Editor - cached on first load
 */

const CACHE_VERSION = 'afd-v1';
const CRITICAL_CACHE = `${CACHE_VERSION}-critical`;
const ASSETS_CACHE = `${CACHE_VERSION}-assets`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Files to cache on install (app shell)
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/styles/themes/index.css',
  '/styles/animations/index.css',
];

/**
 * Install event - cache critical assets
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CRITICAL_CACHE)
      .then((cache) => {
        // Cache app shell
        return cache.addAll(CRITICAL_ASSETS)
          .catch((err) => {
            console.warn('Failed to cache critical assets:', err);
          });
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * Activate event - clean up old cache versions
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Remove old versions
              const isOldVersion = name.startsWith('afd-') && !name.startsWith(CACHE_VERSION);
              return isOldVersion;
            })
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

/**
 * Fetch event - implement cache strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and external protocols
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // API requests - network first with fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(API_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cached response
          return caches.match(request)
            .then((cached) => cached || new Response('Offline - no cached response', { status: 503 }));
        })
    );
    return;
  }

  // WebSocket connections - skip
  if (url.pathname.startsWith('/ws')) {
    return;
  }

  // Monaco Editor chunks - cache first
  if (url.pathname.includes('monaco') || url.pathname.includes('language')) {
    event.respondWith(
      caches.match(request)
        .then((cached) => cached || fetch(request)
          .then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }

            const responseClone = response.clone();
            caches.open(ASSETS_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });

            return response;
          })
        )
    );
    return;
  }

  // Static assets (JS, CSS, images) - cache first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/i) ||
    url.pathname.includes('chunks') ||
    url.pathname.includes('assets')
  ) {
    event.respondWith(
      caches.match(request)
        .then((cached) => cached || fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            const responseClone = response.clone();
            caches.open(ASSETS_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });

            return response;
          })
          .catch(() => {
            // Fallback for assets
            return caches.match(request)
              .then((cached) => cached || new Response('Not found', { status: 404 }));
          })
        )
    );
    return;
  }

  // HTML pages - network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type !== 'error') {
          const responseClone = response.clone();
          caches.open(CRITICAL_CACHE)
            .then((cache) => {
              cache.put(request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then((cached) => cached || new Response('Offline', { status: 503 }));
      })
  );
});

/**
 * Handle messages from client
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys()
      .then((names) => Promise.all(names.map((name) => caches.delete(name))))
      .then(() => {
        console.log('All caches cleared');
      });
  }
});
