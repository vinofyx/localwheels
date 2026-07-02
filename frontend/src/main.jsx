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

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {CLERK_KEY && CLERK_KEY !== 'pk_test_REPLACE_WITH_YOUR_KEY' ? (
        <ClerkProvider publishableKey={CLERK_KEY}>
          <App />
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </ClerkProvider>
      ) : (
        <>
          <App />
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </>
      )}
    </BrowserRouter>
  </ErrorBoundary>
);
