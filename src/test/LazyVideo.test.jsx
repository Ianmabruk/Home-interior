import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LazyVideo from '@components/common/LazyVideo'

describe('LazyVideo', () => {
  beforeEach(() => {
    HTMLMediaElement.prototype.load = vi.fn()
    HTMLMediaElement.prototype.pause = vi.fn()
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
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
    expect(screen.queryByRole('link', { name: /download/i })).not.toBeInTheDocument()
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

    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled()
  })
})
