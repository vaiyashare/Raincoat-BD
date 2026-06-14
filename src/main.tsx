import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safety net: redefine window.fetch as a writable/configurable property to prevent "Cannot set property fetch of #<Window> which has only a getter" crashes.
try {
  const originalFetch = window.fetch;
  let currentFetch = originalFetch;
  Object.defineProperty(window, 'fetch', {
    get() {
      return currentFetch;
    },
    set(newFetch) {
      currentFetch = newFetch;
    },
    configurable: true,
    enumerable: true
  });
} catch (e) {
  console.warn("Could not patch window.fetch with writable property inside ES module:", e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
