import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    useLocation: () => ({ state: {} }),
  }
})

vi.mock('@services/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

import { api } from '@services/api'
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
    api.get.mockResolvedValue({ data: null })
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

  it('login submits with email and password', async () => {
    api.post.mockResolvedValue({
      data: { accessToken: 'token', user: { id: '1', email: 'test@test.com', role: 'USER' } },
    })
    renderWithProviders(<LoginPage />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/email address/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'test@test.com', password: 'password' })
  })

  it('displays error on failure', async () => {
    api.post.mockRejectedValue(new Error('Invalid credentials'))
    renderWithProviders(<LoginPage />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/email address/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^password$/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Invalid credentials')).toBeDefined()
  })

  it('shows loading state during submission', async () => {
    let resolveLogin
    api.post.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve
      })
    )
    renderWithProviders(<LoginPage />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/email address/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByText(/signing in/i)).toBeDefined()
    resolveLogin({ data: { accessToken: 'token', user: { id: '1', email: 'test@test.com', role: 'USER' } } })
  })
})
