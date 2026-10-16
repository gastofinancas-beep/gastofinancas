import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Unhandled error and promise rejection global logger for production reliability
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event?.message || (event?.error && event.error.message) || '';
    if (typeof msg === 'string' && msg.includes('fetch') && msg.includes('only a getter')) {
      event.preventDefault();
      return;
    }
    console.error('[Gastô Global Error]:', event.error || event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = (event?.reason && (event.reason.message || String(event.reason))) || '';
    if (typeof reasonMsg === 'string' && reasonMsg.includes('fetch') && reasonMsg.includes('only a getter')) {
      event.preventDefault();
      return;
    }
    console.warn('[Gastô Unhandled Rejection]:', event.reason);
  });

  // Capture beforeinstallprompt for direct "Adicionar à Tela Inicial" action
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as any).deferredInstallPrompt = e;
    window.dispatchEvent(new CustomEvent('gasto_install_prompt_ready'));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Register Service Worker for PWA offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.warn('SW registration failed:', err));
  });
}
