import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../services/api', () => ({
  api: { post: vi.fn() },
}))

import { api } from '../services/api'
import * as videoService from '../services/cloudinaryVideoService'

class MockXMLHttpRequest {
  static instances = []

  constructor() {
    this.upload = {}
    MockXMLHttpRequest.instances.push(this)
  }

  open(method, url) {
    this.method = method
    this.url = url
  }

  send() {
    queueMicrotask(() => {
      this.status = this.status || 200
      this.responseText = JSON.stringify({
        asset_id: 'cloudinary-asset-id',
        public_id: 'hok-interiors/blog-videos/hok-blog-video123',
        resource_type: 'video',
        type: 'upload',
        secure_url: 'https://res.cloudinary.com/demo/video/upload/v123/hok-interiors/blog-videos/hok-blog-video123.mp4',
        version: 123,
        format: 'mp4',
        bytes: 42,
      })
      this.onload?.()
    })
  }

  abort() {
    this.onabort?.()
  }
}

describe('Cloudinary direct video upload', () => {
  afterEach(() => {
    api.post.mockReset()
    MockXMLHttpRequest.instances = []
    vi.unstubAllGlobals()
  })

  it('does not expose or call the separate verification endpoint', () => {
    expect(videoService.verifyUploadedVideo).toBeUndefined()
  })

  it('returns successful upload metadata directly from the Cloudinary upload response', async () => {
    vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest)
    api.post.mockResolvedValue({
      data: {
        cloudName: 'demo',
        apiKey: 'api-key',
        signature: 'signature',
        timestamp: 123,
        folder: 'hok-interiors/blog-videos',
        publicId: 'hok-blog-video123',
      },
    })

    const result = await videoService.uploadOptimizedVideo(
      new File(['video'], 'optimized.mp4', { type: 'video/mp4' }),
      'a'.repeat(64),
    )

    expect(result).toMatchObject({
      assetId: 'cloudinary-asset-id',
      publicId: 'hok-interiors/blog-videos/hok-blog-video123',
      resourceType: 'video',
      secureUrl: expect.stringContaining('/video/upload/'),
    })
    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.post).toHaveBeenCalledWith('/admin/blog/cloudinary/signature', expect.any(Object))
  })
})
