import { Component } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, AlertTriangle, Home } from 'lucide-react'

const SectionFallback = ({ sectionName, onRetry }) => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
    <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[var(--error)]/10 text-[var(--error)]">
      <AlertTriangle size={32} strokeWidth={1.5} />
    </div>
    <p className="font-display text-2xl text-[var(--primary)] mb-3">Failed to load {sectionName}</p>
    <p className="text-sm text-[var(--primary)]/55 mb-6">
      This section encountered an error. The rest of the page loaded successfully.
    </p>
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      <button
        onClick={onRetry}
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
  </div>
)

SectionFallback.displayName = 'SectionFallback'

export class SectionErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[SectionErrorBoundary: ${this.props.sectionName}]`, error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return <SectionFallback sectionName={this.props.sectionName} onRetry={this.handleRetry} />
    }

    return this.props.children
  }
}

export default SectionErrorBoundary