import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PaymentProvider } from './contexts/PaymentContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PaymentProvider>
      <App />
    </PaymentProvider>
  </React.StrictMode>
);