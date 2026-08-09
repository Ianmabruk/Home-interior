import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { SocialIcons } from '../components/common/SocialIcons'

vi.mock('@services/api', () => ({
  api: {
    get: vi.fn(),
  },
}))

import { api } from '@services/api'
import * as socialLinks from '../constants/socialLinks'

describe('SocialIcons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: [] })
  })

  it('renders nothing when no items and no defaults', async () => {
    vi.spyOn(socialLinks, 'getDefaultSocialItems').mockReturnValue([])
    const { container } = render(<SocialIcons />)
    await waitFor(() => expect(container.querySelector('a')).toBeNull())
  })

  it('renders default items when no items prop provided', async () => {
    const defaults = [
      { id: '1', name: 'Instagram', platform: 'instagram', link: 'https://instagram.com/test', isDefault: true },
    ]
    api.get.mockResolvedValue({ data: [] })
    vi.spyOn(socialLinks, 'getDefaultSocialItems').mockReturnValue(defaults)
    render(<SocialIcons />)
    await waitFor(() => expect(screen.getByLabelText('Follow us on Instagram')).toBeDefined())
  })

  it('renders provided items', async () => {
    const items = [
      { id: '1', name: 'Instagram', platform: 'instagram', link: 'https://instagram.com/test' },
      { id: '2', name: 'Facebook', platform: 'facebook', link: 'https://facebook.com/test' },
    ]
    render(<SocialIcons items={items} />)
    expect(screen.getByLabelText('Follow us on Instagram')).toBeDefined()
    expect(screen.getByLabelText('Follow us on Facebook')).toBeDefined()
  })

  it('filters out items without URLs', async () => {
    const items = [
      { id: '1', name: 'Instagram', platform: 'instagram', link: 'https://instagram.com/test' },
      { id: '2', name: 'Bad', platform: 'instagram', link: '' },
    ]
    render(<SocialIcons items={items} />)
    expect(screen.getByLabelText('Follow us on Instagram')).toBeDefined()
    expect(screen.queryByLabelText('Follow us on Bad')).toBeNull()
  })

  it('renders brand icons for known platforms', async () => {
    const items = [
      { id: '1', name: 'Instagram', platform: 'instagram', link: 'https://instagram.com/test' },
      { id: '2', name: 'YouTube', platform: 'youtube', link: 'https://youtube.com/test' },
    ]
    render(<SocialIcons items={items} />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
    expect(links[0].href).toContain('instagram.com')
    expect(links[1].href).toContain('youtube.com')
  })
})
