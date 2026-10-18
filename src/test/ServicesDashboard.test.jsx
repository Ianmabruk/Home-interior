import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ServicesDashboard } from '../components/admin/ServicesDashboard'
import { ServicesPage } from '../pages/public/ServicesPage'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
}))

vi.mock('@services/api', () => ({
  api: {
    get: mocks.get,
    patch: mocks.patch,
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('react-hot-toast', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

vi.mock('@hooks/usePageMeta', () => ({
  PageMeta: () => null,
}))

describe('ServicesDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.get.mockResolvedValue({
      data: [
        { id: 's1', title: 'Design', description: 'A', imageUrl: 'https://example.com/1.jpg', displayOrder: 0, isActive: true, featured: false, buttonText: 'Request', buttonUrl: '' },
        { id: 's2', title: 'Styling', description: 'B', imageUrl: 'https://example.com/2.jpg', displayOrder: 1, isActive: true, featured: false, buttonText: 'Request', buttonUrl: '' },
        { id: 's3', title: 'Build', description: 'C', imageUrl: 'https://example.com/3.jpg', displayOrder: 2, isActive: true, featured: false, buttonText: 'Request', buttonUrl: '' },
        { id: 's4', title: 'Renovation', description: 'D', imageUrl: 'https://example.com/4.jpg', displayOrder: 3, isActive: true, featured: false, buttonText: 'Request', buttonUrl: '' },
        { id: 's5', title: 'Decoration', description: 'E', imageUrl: 'https://example.com/5.jpg', displayOrder: 4, isActive: true, featured: false, buttonText: 'Request', buttonUrl: '' },
      ],
    })
    mocks.patch.mockResolvedValue({ data: { success: true } })
  })

  it('offers first/last move controls and persists a reorder', async () => {
    render(<ServicesDashboard />)

    await waitFor(() => expect(screen.getByText('Design')).toBeInTheDocument())

    const moveToFirstButtons = screen.getAllByRole('button', { name: /move to first/i })
    const lastMoveToFirstButton = moveToFirstButtons[moveToFirstButtons.length - 1]
    expect(lastMoveToFirstButton).toBeTruthy()
    fireEvent.click(lastMoveToFirstButton)

    await waitFor(() => {
      expect(mocks.patch).toHaveBeenCalledWith('/admin/services/reorder', {
        order: [
          { id: 's5', displayOrder: 0 },
          { id: 's1', displayOrder: 1 },
          { id: 's2', displayOrder: 2 },
          { id: 's3', displayOrder: 3 },
          { id: 's4', displayOrder: 4 },
        ],
      })
    })

    expect(screen.getAllByRole('button', { name: /move to first/i }).length).toBeGreaterThan(0)
  })

  it('shows public services in persisted display order', async () => {
    mocks.get.mockResolvedValueOnce({
      data: [
        { id: 's2', title: 'Styling', description: 'B', imageUrl: 'https://example.com/2.jpg', displayOrder: 1, isActive: true, featured: false, buttonText: 'Request', buttonUrl: '' },
        { id: 's1', title: 'Design', description: 'A', imageUrl: 'https://example.com/1.jpg', displayOrder: 0, isActive: true, featured: false, buttonText: 'Request', buttonUrl: '' },
      ],
    })

    const { container } = render(
      <MemoryRouter>
        <ServicesPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      const serviceCards = Array.from(container.querySelectorAll('article')).map((card) => card.querySelector('h3')?.textContent)
      expect(serviceCards).toEqual(['Design', 'Styling'])
    })
  })
})
