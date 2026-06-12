import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Strict client-side override: Completely disable local disk caching for all components in accordance with:
// "Dont save any of data in Localstore, customers or users background. All data save in cloud and show all in Admin panel."
const memoryStorageMap = new Map<string, string>();
const memoryStorage: Storage = {
  get length() { return memoryStorageMap.size; },
  clear() { memoryStorageMap.clear(); },
  getItem(key: string) { return memoryStorageMap.get(key) || null; },
  key(index: number) { return Array.from(memoryStorageMap.keys())[index] || null; },
  removeItem(key: string) { memoryStorageMap.delete(key); },
  setItem(key: string, value: string) { memoryStorageMap.set(key, value); }
};

Object.defineProperty(window, 'localStorage', {
  value: memoryStorage,
  writable: false,
  configurable: true
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
