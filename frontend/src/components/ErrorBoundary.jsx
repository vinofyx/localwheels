import React from 'react';

/**
 * Global ErrorBoundary — wraps the entire app in main.jsx.
 *
 * Prevents a blank white screen when an unhandled JS error bubbles up.
 * Displays a friendly recovery UI with a reload button instead.
 *
 * Usage (already wired in main.jsx):
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console in dev; swap for a real error-reporting service in prod
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        background: '#f8fafc',
        padding: '1.5rem',
      }}>
        <div style={{
          maxWidth: 480,
          textAlign: 'center',
          background: 'white',
          borderRadius: 12,
          padding: '2.5rem 2rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}>
          {/* Truck icon */}
          <div style={{ fontSize: 48, marginBottom: '1rem' }}>🚚</div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            An unexpected error occurred. This is usually temporary — try refreshing the page.
          </p>

          {/* Show error message in dev mode */}
          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              textAlign: 'left',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 6,
              padding: '0.75rem 1rem',
              fontSize: '0.78rem',
              color: '#dc2626',
              overflowX: 'auto',
              marginBottom: '1.5rem',
            }}>
              {this.state.error.message}
            </pre>
          )}

          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#0b8fd3',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '0.65rem 1.5rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
