import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { SoundProvider } from './context/SoundContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <SoundProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SoundProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
