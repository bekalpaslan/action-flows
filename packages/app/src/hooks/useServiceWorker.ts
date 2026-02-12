/**
 * useServiceWorker - Hook for registering and managing the service worker
 *
 * Handles:
 * - Service worker registration
 * - Update checking
 * - Cache management
 * - Offline state notifications
 */

import { useEffect, useState } from 'react';

export interface ServiceWorkerStatus {
  isRegistered: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
}

export const useServiceWorker = (): ServiceWorkerStatus => {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    isRegistered: false,
    isOnline: true,
    hasUpdate: false,
  });

  useEffect(() => {
    // Check if browser supports service workers
    if (!('serviceWorker' in navigator)) {
      console.log('Service workers not supported');
      return;
    }

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
        setStatus((prev) => ({ ...prev, isRegistered: true }));

        // Check for updates periodically
        const updateCheckInterval = setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour

        return () => clearInterval(updateCheckInterval);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });

    // Listen for controller change (update available)
    const handleControllerChange = () => {
      console.log('Service Worker update available');
      setStatus((prev) => ({ ...prev, hasUpdate: true }));
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Monitor online/offline status
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
      console.log('Back online');
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
      console.log('Going offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
};

/**
 * Update service worker and reload
 */
export const useServiceWorkerUpdate = () => {
  return () => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });

    // Reload when new service worker activates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  };
};

/**
 * Clear all caches
 */
export const useClearCache = () => {
  return async () => {
    if (!('serviceWorker' in navigator)) return;

    // Notify service worker to clear caches
    navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_CACHE' });

    // Also clear via Cache API directly
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }

    console.log('Caches cleared');
  };
};

export default useServiceWorker;
