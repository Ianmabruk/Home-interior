import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ShopProvider } from '../context/ShopContext'

vi.mock('lucide-react', () => ({
  ArrowRight: () => <span data-testid="arrow-right">→</span>,
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

import { RegisterPage } from '../pages/auth/RegisterPage'

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

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders registration form inputs', () => {
    renderWithProviders(<RegisterPage />)
    expect(screen.getByText('Full Name')).toBeDefined()
    expect(screen.getByText('Email Address')).toBeDefined()
    expect(screen.getByText('Password')).toBeDefined()
    expect(screen.getByText('Confirm Password')).toBeDefined()
  })

  it('renders create account button', () => {
    renderWithProviders(<RegisterPage />)
    expect(screen.getByRole('button', { name: /create account/i })).toBeDefined()
  })
})
