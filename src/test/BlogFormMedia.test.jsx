import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../services/api', () => ({
  api: { post: vi.fn(), patch: vi.fn() },
}))

vi.mock('../services/blogMediaUploadService', () => ({
  createBlogUploadId: vi.fn(() => `upload-${Math.random().toString(36).slice(2)}`),
  uploadBlogMediaFile: vi.fn(),
}))

vi.mock('../services/videoCompressionService', () => ({
  compressVideoInWorker: vi.fn(),
}))

vi.mock('../services/cloudinaryVideoService', () => ({
  uploadOptimizedVideo: vi.fn(),
}))

import BlogForm from '../components/blog/BlogForm'
import { api } from '../services/api'
import { uploadBlogMediaFile } from '../services/blogMediaUploadService'
import { compressVideoInWorker } from '../services/videoCompressionService'
import { uploadOptimizedVideo } from '../services/cloudinaryVideoService'

let blobUrlCount = 0

function mediaAsset(file) {
  const resourceType = file.type.startsWith('video/') ? 'video' : 'image'
  return {
    secureUrl: `https://res.cloudinary.com/demo/${resourceType}/upload/v1/blogs/${file.name}`,
    publicId: `blogs/${file.name}`,
    resourceType,
    format: resourceType === 'video' ? 'mp4' : 'webp',
    mimeType: file.type,
    originalName: file.name,
    bytes: file.size,
    ...(resourceType === 'video' ? { duration: 5, width: 1280, height: 720 } : {}),
  }
}

function selectGalleryFiles(files) {
  fireEvent.change(document.querySelector('input[multiple]'), { target: { files } })
}

function fillTitle(title = 'Media workflow test') {
  fireEvent.change(screen.getByPlaceholderText('Enter blog title'), { target: { value: title } })
}

describe('BlogForm media publishing', () => {
  beforeEach(() => {
    blobUrlCount = 0
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => `blob:test-${++blobUrlCount}`),
    })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
    api.post.mockReset()
    api.patch.mockReset()
    uploadBlogMediaFile.mockReset()
    compressVideoInWorker.mockReset()
    uploadOptimizedVideo.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uploads 74 images and six videos separately and publishes references only', async () => {
    let activeUploads = 0
    let maxConcurrentUploads = 0
    uploadBlogMediaFile.mockImplementation(async (file) => {
      activeUploads += 1
      maxConcurrentUploads = Math.max(maxConcurrentUploads, activeUploads)
      await Promise.resolve()
      activeUploads -= 1
      return mediaAsset(file)
    })
    api.post.mockResolvedValue({ data: { id: 'published-blog' } })

    render(<BlogForm />)
    fillTitle()
    const files = [
      ...Array.from({ length: 74 }, (_, index) => new File(['image'], `image-${index}.jpg`, { type: 'image/jpeg' })),
      ...Array.from({ length: 6 }, (_, index) => new File(['video'], `video-${index}.mp4`, { type: 'video/mp4' })),
    ]
    selectGalleryFiles(files)
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1), { timeout: 10000 })
    expect(uploadBlogMediaFile).toHaveBeenCalledTimes(80)
    expect(maxConcurrentUploads).toBeLessThanOrEqual(3)

    const [url, payload] = api.post.mock.calls[0]
    expect(url).toBe('/admin/blog')
    expect(payload.mediaAssets).toHaveLength(80)
    expect(payload.mediaAssets.filter((asset) => asset.resourceType === 'image')).toHaveLength(74)
    expect(payload.mediaAssets.filter((asset) => asset.resourceType === 'video')).toHaveLength(6)
    expect(Object.values(payload).some((value) => value instanceof File || value instanceof FormData)).toBe(false)
  }, 15000)

  it('retries only the failed file and retains uploaded references after a publish failure', async () => {
    const firstUploadIds = []
    let failOnce = true
    uploadBlogMediaFile.mockImplementation(async (file, uploadId) => {
      if (file.name === 'retry.jpg') {
        firstUploadIds.push(uploadId)
        if (failOnce) {
          failOnce = false
          throw new Error('Temporary network error')
        }
      }
      return mediaAsset(file)
    })
    api.post
      .mockRejectedValueOnce(new Error('Database temporarily unavailable'))
      .mockResolvedValueOnce({ data: { id: 'saved-blog' } })

    render(<BlogForm />)
    fillTitle()
    selectGalleryFiles([
      new File(['image'], 'retry.jpg', { type: 'image/jpeg' }),
      new File(['image'], 'keep.jpg', { type: 'image/jpeg' }),
    ])
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))

    await screen.findByText(/Retry the failed file/)
    expect(api.post).not.toHaveBeenCalled()
    expect(uploadBlogMediaFile).toHaveBeenCalledTimes(2)

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(screen.getByText('Media uploaded: 2/2')).toBeTruthy())
    expect(uploadBlogMediaFile).toHaveBeenCalledTimes(3)
    expect(firstUploadIds[0]).toBe(firstUploadIds[1])

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1))
    expect(screen.getByText('Database temporarily unavailable')).toBeTruthy()
    expect(uploadBlogMediaFile).toHaveBeenCalledTimes(3)

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2))
    expect(uploadBlogMediaFile).toHaveBeenCalledTimes(3)
    expect(api.post.mock.calls[1][1].mediaAssets.map((asset) => asset.secureUrl)).toContain(
      'https://res.cloudinary.com/demo/image/upload/v1/blogs/keep.jpg',
    )
  })

  it('updates an existing blog using JSON media references', async () => {
    uploadBlogMediaFile.mockImplementation(async (file) => mediaAsset(file))
    api.patch.mockResolvedValue({ data: { id: 'existing-blog' } })
    render(<BlogForm blog={{ id: 'existing-blog', title: 'Existing article', published: true, mediaUrls: [] }} />)
    selectGalleryFiles([new File(['video'], 'room-tour.mp4', { type: 'video/mp4' })])

    fireEvent.click(screen.getByRole('button', { name: 'Update & Publish' }))

    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1))
    expect(api.patch.mock.calls[0][0]).toBe('/admin/blog/existing-blog')
    expect(api.patch.mock.calls[0][1].mediaAssets[0].resourceType).toBe('video')
    expect(api.patch.mock.calls[0][1]).not.toBeInstanceOf(FormData)
  })

  it('allows the failed video upload to be retried without verification', async () => {
    compressVideoInWorker.mockResolvedValue({
      file: new File(['video'], 'optimized.mp4', { type: 'video/mp4' }),
      compressedBytes: 10,
      contentHash: 'test',
    })
    uploadOptimizedVideo
      .mockRejectedValueOnce(new Error('Cloudinary upload timed out'))
      .mockResolvedValueOnce({
        assetId: 'cloudinary-asset-id',
        publicId: 'hok-interiors/blog-videos/hok-blog-test',
        resourceType: 'video',
        type: 'upload',
        secureUrl: 'https://res.cloudinary.com/demo/video/upload/v123/hok-interiors/blog-videos/hok-blog-test.mp4',
        version: 123,
        format: 'mp4',
        bytes: 10,
      })

    render(<BlogForm />)
    fillTitle()
    fireEvent.change(document.querySelector('input[accept^="video/"]'), {
      target: { files: [new File(['video'], 'room-tour.mp4', { type: 'video/mp4' })] },
    })

    await screen.findByText(/Cloudinary upload timed out/i)
    expect(uploadOptimizedVideo).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(screen.getByText('Videos uploaded: 1/1')).toBeTruthy())
    expect(uploadOptimizedVideo).toHaveBeenCalledTimes(2)
  })
})
