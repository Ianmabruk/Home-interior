import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ShopProvider } from '../context/ShopContext'
import { Navbar } from '../components/layout/Navbar'

vi.mock('@services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import { api } from '@services/api'

const renderWithProviders = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test', route)
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ShopProvider>{ui}</ShopProvider>
      </AuthProvider>
    </BrowserRouter>,
  )
}

describe('Navbar — public profile menu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    api.get.mockResolvedValue({ data: null })
  })

  it('shows Sign Up and Login (not Admin Dashboard / Admin Access) when logged out', async () => {
    renderWithProviders(<Navbar />)

    fireEvent.click(screen.getAllByRole('button', { name: /user menu/i })[0])

    await waitFor(() => {
      expect(screen.getAllByText('Sign Up').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText('Login').length).toBeGreaterThan(0)
    expect(screen.queryByText('Admin Dashboard')).toBeNull()
    expect(screen.queryByText('Admin Access')).toBeNull()
  })

  it('does not expose Admin Dashboard to a logged-in customer', async () => {
    localStorage.setItem('hok_access_token', 'mock-token')
    api.get.mockResolvedValue({ data: { id: 'c1', email: 'c@hok.co.ke', role: 'CUSTOMER' } })

    renderWithProviders(<Navbar />)

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/auth/me')
    })

    fireEvent.click(screen.getAllByRole('button', { name: /user menu/i })[0])

    await waitFor(() => {
      expect(screen.getAllByText('Orders').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText('Logout').length).toBeGreaterThan(0)
    expect(screen.queryByText('Admin Dashboard')).toBeNull()
  })
})

describe('Navbar — cart authentication gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    api.get.mockResolvedValue({ data: null })
  })

  it('prompts authentication instead of showing the cart when logged out', async () => {
    renderWithProviders(<Navbar />)

    fireEvent.click(screen.getAllByRole('button', { name: /shopping cart/i })[0])

    await waitFor(() => {
      expect(screen.getByText(/sign up or log in to view your shopping cart/i)).toBeDefined()
    })
    expect(screen.getAllByText('Sign Up').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Login').length).toBeGreaterThan(0)
  })
})
