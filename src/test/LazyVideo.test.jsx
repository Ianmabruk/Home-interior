import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LazyVideo from '@components/common/LazyVideo'

describe('LazyVideo', () => {
  beforeEach(() => {
    HTMLMediaElement.prototype.load = vi.fn()
    HTMLMediaElement.prototype.pause = vi.fn()
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(HTMLMediaElement.prototype, 'readyState', {
      configurable: true,
      get: () => 4,
    })
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:test-video')
    globalThis.URL.revokeObjectURL = vi.fn()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (name) => name.toLowerCase() === 'content-type' ? 'video/mp4' : null,
      },
      blob: () => Promise.resolve(new Blob(['video'], { type: 'video/mp4' })),
    })
  })

  it('renders an embedded player with native controls and a Play button', () => {
    const { container } = render(
      <LazyVideo
        src="https://res.cloudinary.com/demo/video/upload/v1/test.mp4"
        poster="https://res.cloudinary.com/demo/video/upload/so_0,w_1280/test.jpg"
        controls
      />,
    )

    const video = container.querySelector('video')
    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute('controls')
    expect(video).toHaveAttribute('playsinline')
    expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute('href', 'https://res.cloudinary.com/demo/video/upload/v1/test.mp4')
    expect(screen.getByRole('button', { name: 'Play video' })).toBeInTheDocument()
  })

  it('starts inline playback when Play is clicked', async () => {
    render(
      <LazyVideo
        src="https://res.cloudinary.com/demo/video/upload/v1/test.mp4"
        controls
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Play video' }))

    await waitFor(() => {
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalled()
    })
  })
})
