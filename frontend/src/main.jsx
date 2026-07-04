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

if (!CLERK_KEY || !CLERK_KEY.startsWith('pk_')) {
  throw new Error(
    '[LocalWheels] VITE_CLERK_PUBLISHABLE_KEY is missing or invalid.\n' +
    'Set it in frontend/.env (dev) or frontend/.env.production (prod).\n' +
    'Get your key at https://dashboard.clerk.com → API Keys.'
  );
}

const router = (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <App />
    <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
  </BrowserRouter>
);

// Hierarchy (order matters):
//   ErrorBoundary — catches any runtime crash, shows recovery UI
//   AuthProvider  — owns all LW session state; must wrap ClerkAuthBridge
//   ClerkProvider — initialises the Clerk SDK; must wrap ClerkAuthBridge
//   ClerkAuthBridge — reads Clerk state, pushes into AuthContext + injects token getter
ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <AuthProvider>
      <ClerkProvider publishableKey={CLERK_KEY}>
        <ClerkAuthBridge>{router}</ClerkAuthBridge>
      </ClerkProvider>
    </AuthProvider>
  </ErrorBoundary>
);
