import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ShopProvider } from '../context/ShopContext'

vi.mock('lucide-react', () => ({
  ArrowRight: () => <span data-testid="arrow-right">→</span>,
  Mail: () => <span data-testid="mail">Mail</span>,
  Lock: () => <span data-testid="lock">Lock</span>,
  Eye: () => <span data-testid="eye">Eye</span>,
  EyeOff: () => <span data-testid="eye-off">EyeOff</span>,
  Loader2: () => <span data-testid="loader">Loader</span>,
  AlertCircle: () => <span data-testid="alert-circle">Alert</span>,
  CheckCircle: () => <span data-testid="check-circle">Check</span>,
  UserPlus: () => <span data-testid="user-plus">UserPlus</span>,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Link: ({ children }) => <span>{children}</span>,
    useNavigate: () => vi.fn(),
  }
})

vi.mock('@services/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

import { LoginPage } from '../pages/auth/LoginPage'

const renderWithProviders = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test', route)
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ShopProvider>
          {ui}
        </ShopProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders login form labels', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByText('Email Address')).toBeDefined()
    expect(screen.getByText('Password')).toBeDefined()
  })

  it('renders sign in button', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined()
  })
})
