import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../services/api', () => ({
  api: { post: vi.fn() },
}))

import { api } from '../services/api'
import { verifyUploadedVideo } from '../services/cloudinaryVideoService'

const uploadedAsset = {
  assetId: 'cloudinary-asset-id',
  publicId: 'hok-interiors/blog-videos/hok-blog-video123',
  resourceType: 'video',
  type: 'upload',
  secureUrl: 'https://res.cloudinary.com/demo/video/upload/v123/hok-interiors/blog-videos/hok-blog-video123.mp4',
  version: 123,
  format: 'mp4',
  bytes: 42,
}

describe('Cloudinary video verification service', () => {
  afterEach(() => {
    api.post.mockReset()
    vi.useRealTimers()
  })

  it('sends the complete Cloudinary upload response to the verifier', async () => {
    api.post.mockResolvedValue({ data: uploadedAsset })

    await expect(verifyUploadedVideo(uploadedAsset)).resolves.toMatchObject(uploadedAsset)
    expect(api.post).toHaveBeenCalledWith(
      '/admin/blog/cloudinary/verify',
      expect.objectContaining(uploadedAsset),
    )
  })

  it('retries temporary failures a bounded number of times while preserving uploaded metadata', async () => {
    vi.useFakeTimers()
    const error = new Error('Verification unavailable')
    error.status = 503
    error.response = { status: 503, data: { code: 'CLOUDINARY_VERIFY_TEMPORARY' } }
    api.post.mockRejectedValue(error)

    const pending = expect(verifyUploadedVideo(uploadedAsset)).rejects.toMatchObject({
      uploadedAsset,
      response: { data: { code: 'CLOUDINARY_VERIFY_TEMPORARY' } },
    })
    await vi.runAllTimersAsync()
    await pending

    expect(api.post).toHaveBeenCalledTimes(3)
  })

  it('does not retry permanent Cloudinary authentication errors', async () => {
    const error = new Error('Cloudinary authentication failed')
    error.status = 502
    error.response = { status: 502, data: { code: 'CLOUDINARY_AUTHENTICATION_FAILED' } }
    api.post.mockRejectedValue(error)

    await expect(verifyUploadedVideo(uploadedAsset)).rejects.toMatchObject({
      uploadedAsset,
      response: { data: { code: 'CLOUDINARY_AUTHENTICATION_FAILED' } },
    })
    expect(api.post).toHaveBeenCalledTimes(1)
  })
})
