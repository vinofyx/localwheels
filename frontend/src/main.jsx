import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ClerkProvider } from '@clerk/react';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import 'leaflet/dist/leaflet.css';
// bootstrap removed — Tailwind CSS is the sole styling system

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const CLERK_ENABLED = !!(CLERK_KEY && CLERK_KEY.startsWith('pk_'));

const app = (
  <ErrorBoundary>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </BrowserRouter>
  </ErrorBoundary>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  CLERK_ENABLED ? <ClerkProvider publishableKey={CLERK_KEY}>{app}</ClerkProvider> : app
);
