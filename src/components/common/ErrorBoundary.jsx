import { Component } from 'react'
import { Link } from 'react-router-dom'
import { Home, RefreshCw, AlertTriangle } from 'lucide-react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="flex min-h-screen items-center justify-center px-4 bg-[var(--bg)] text-[var(--primary)]">
          <div className="text-center max-w-md">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[var(--error)]/10 text-[var(--error)]">
              <AlertTriangle size={32} strokeWidth={1.5} />
            </div>
            <h1 className="font-display text-3xl font-semibold text-[var(--primary)] mb-3">Something went wrong</h1>
            <p className="text-sm text-[var(--primary)]/55 mb-6">
              We encountered an unexpected error. Our team has been notified.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="group inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--bg)] transition-all duration-300 hover:bg-[var(--accent)] hover:shadow-[0_8px_30px_rgba(232,154,67,0.15)] hover:-translate-y-0.5"
              >
                <RefreshCw size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:rotate-12" />
                Try Again
              </button>
              <Link
                to="/"
                className="group inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--primary)] transition-all duration-300 hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <Home size={14} strokeWidth={1.5} />
                Go Home
              </Link>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-8 text-left p-4 bg-[var(--bg)]/50 rounded-xl border border-[var(--border)]">
                <summary className="font-medium text-sm text-[var(--primary)] cursor-pointer">Error Details</summary>
                <pre className="mt-3 text-[10px] text-[var(--error)] overflow-auto max-h-64">{this.state.error?.toString()}</pre>
                {this.state.errorInfo && (
                  <pre className="mt-3 text-[10px] text-[var(--primary)]/60 overflow-auto max-h-64">{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary