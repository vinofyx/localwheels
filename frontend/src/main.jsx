import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ClerkProvider } from '@clerk/react';
import App from './App';
import ClerkAuthBridge from './components/ClerkAuthBridge';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import './index.css';
import 'leaflet/dist/leaflet.css';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const CLERK_ENABLED = !!(CLERK_KEY && CLERK_KEY.startsWith('pk_'));

const router = (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <App />
    <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
  </BrowserRouter>
);

// AuthProvider must wrap ClerkAuthBridge so useAuth() is available inside it.
// ClerkAuthBridge must be inside ClerkProvider so useClerk hooks work.
// ErrorBoundary wraps everything so runtime crashes show a recovery UI.
ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <AuthProvider>
      {CLERK_ENABLED ? (
        <ClerkProvider publishableKey={CLERK_KEY}>
          <ClerkAuthBridge>{router}</ClerkAuthBridge>
        </ClerkProvider>
      ) : router}
    </AuthProvider>
  </ErrorBoundary>
);
