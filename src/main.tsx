import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'Inter, system-ui, sans-serif', maxWidth: 640, margin: '40px auto' }}>
          <h2 style={{ color: '#0f172a', marginTop: 0 }}>Something went wrong loading the portal</h2>
          <pre style={{ background: '#fff1f2', color: '#9f1239', padding: 14, borderRadius: 10, overflow: 'auto', fontSize: 12 }}>
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ marginTop: 14, padding: '8px 16px', borderRadius: 8, background: '#0f172a', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
