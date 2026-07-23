const UPDATE_EVENT = 'opp-pulse-sw-update';

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').then((registration) => {
      const announceUpdate = () => window.dispatchEvent(new Event(UPDATE_EVENT));

      if (registration.waiting && navigator.serviceWorker.controller) announceUpdate();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) announceUpdate();
        });
      });
    }).catch((error: unknown) => {
      if (import.meta.env.DEV) console.warn('[OpportunityPulse] service worker unavailable', error);
    });
  });
}

export function subscribeToServiceWorkerUpdates(onUpdate: () => void): () => void {
  window.addEventListener(UPDATE_EVENT, onUpdate);
  return () => window.removeEventListener(UPDATE_EVENT, onUpdate);
}

export function applyServiceWorkerUpdate(): void {
  if (!('serviceWorker' in navigator)) return;
  void navigator.serviceWorker.getRegistration().then((registration) => {
    registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
}
