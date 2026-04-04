/**
 * Lightweight toast notification utility.
 * Provides a sonner-compatible API using native DOM notifications.
 * Replace with `import { toast } from 'sonner'` when sonner is added as a dependency.
 */

const TOAST_DURATION_MS = 3000;

function createToastContainer(): HTMLDivElement {
  const existing = document.getElementById('toast-container');
  if (existing) return existing as HTMLDivElement;

  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText = `
    position: fixed;
    bottom: 16px;
    right: 16px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  `;
  document.body.appendChild(container);
  return container;
}

function showToast(message: string, variant: 'success' | 'error' | 'info' = 'info'): void {
  const container = createToastContainer();
  const el = document.createElement('div');

  const bgColor = variant === 'success'
    ? 'rgba(126,153,213,0.95)'
    : variant === 'error'
      ? 'rgba(214,133,2,0.95)'
      : 'rgba(138,138,138,0.95)';

  el.style.cssText = `
    padding: 10px 16px;
    border-radius: 8px;
    background: ${bgColor};
    color: white;
    font-size: 14px;
    font-weight: 500;
    pointer-events: auto;
    opacity: 1;
    transition: opacity 0.3s ease;
  `;
  el.textContent = message;
  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, TOAST_DURATION_MS);
}

export const toast = {
  success: (message: string) => showToast(message, 'success'),
  error: (message: string) => showToast(message, 'error'),
  info: (message: string) => showToast(message, 'info'),
};
