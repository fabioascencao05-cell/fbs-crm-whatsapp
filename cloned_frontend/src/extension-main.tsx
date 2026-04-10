import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// FBS CRM - WhatsApp Web Injector
const initExtension = () => {
  const rootId = 'fbs-crm-extension-root';
  if (document.getElementById(rootId)) return;

  const container = document.createElement('div');
  container.id = rootId;
  
  // Usamos Shadow DOM para isolar o CSS do Tailwind e não quebrar o WhatsApp
  const shadow = container.attachShadow({ mode: 'open' });
  const shadowRoot = document.createElement('div');
  shadowRoot.id = 'fbs-shadow-root';
  shadowRoot.className = 'dark'; // Forçar dark mode se preferir
  
  // Injetar estilos no Shadow DOM
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = chrome.runtime.getURL('assets/index.css');
  shadow.appendChild(styleLink);
  
  shadow.appendChild(shadowRoot);
  document.body.appendChild(container);

  const root = ReactDOM.createRoot(shadowRoot);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Aguarda o WhatsApp Web carregar
const observer = new MutationObserver((mutations, obs) => {
  const app = document.querySelector('#app');
  if (app) {
    initExtension();
    obs.disconnect();
  }
});

observer.observe(document.body, { childList: true, subtree: true });
