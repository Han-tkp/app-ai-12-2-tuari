import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log to backend logging system (if available)
    fetch('http://localhost:8000/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // Backend might be offline, that's ok
    });
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleReset = () => {
    // Clear localStorage and reload
    localStorage.clear();
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--bg-window)]">
          <div
            className="max-w-md w-full p-6 rounded-lg border mac-dialog-shadow"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-strong)',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(239, 68, 68, 0.1)' }}
              >
                <AlertTriangle size={24} style={{ color: 'var(--mac-red)' }} />
              </div>
              <div>
                <h1 className="text-lg font-semibold" style={{ color: 'var(--text1)' }}>
                  Oops! Something went wrong
                </h1>
                <p className="text-sm" style={{ color: 'var(--text3)' }}>
                  The workspace encountered an error
                </p>
              </div>
            </div>

            {/* Error Details (dev mode) */}
            {this.state.error && (
              <div
                className="mb-4 p-3 rounded text-xs font-mono overflow-auto max-h-40"
                style={{
                  background: 'var(--bg-surface2)',
                  color: 'var(--text3)',
                }}
              >
                <strong>Error:</strong> {this.state.error.message}
                {this.state.errorInfo && (
                  <>
                    <br />
                    <br />
                    <strong>Component:</strong>
                    <br />
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={this.handleReload}
                className="flex-1 h-10 rounded-lg flex items-center justify-center gap-2 font-medium text-sm transition-colors"
                style={{
                  background: 'var(--accent)',
                  color: '#fff',
                }}
              >
                <RefreshCw size={16} />
                Reload Workspace
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 h-10 rounded-lg flex items-center justify-center gap-2 font-medium text-sm transition-colors border"
                style={{
                  borderColor: 'var(--border-strong)',
                  background: 'var(--bg-surface2)',
                  color: 'var(--text2)',
                }}
              >
                <Bug size={16} />
                Reset & Reload
              </button>
            </div>

            {/* Help Text */}
            <p className="mt-4 text-xs text-center" style={{ color: 'var(--text4)' }}>
              If the problem persists, try clearing your browser cache or contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
