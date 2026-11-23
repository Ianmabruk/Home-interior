import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals'

const resourceByAssetId = jest.fn()
const resourceByPublicId = jest.fn()
const cloudinaryMock = {
  config: jest.fn(),
  api: {
    resource_by_asset_id: resourceByAssetId,
    resource: resourceByPublicId,
  },
  utils: { api_sign_request: jest.fn() },
  uploader: {},
}

process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
process.env.CLOUDINARY_API_KEY = 'test-key'
process.env.CLOUDINARY_API_SECRET = 'test-secret'

jest.unstable_mockModule('cloudinary', () => ({ v2: cloudinaryMock }))

const { verifyCloudinaryVideo } = await import('../src/config/cloudinary.js')

const asset = {
  asset_id: 'asset-123',
  public_id: 'hok-interiors/blog-videos/hok-blog-video123',
  resource_type: 'video',
  type: 'upload',
  secure_url: 'https://res.cloudinary.com/test-cloud/video/upload/v123/hok-interiors/blog-videos/hok-blog-video123.mp4',
  version: 123,
  format: 'mp4',
  bytes: 42,
  access_mode: 'public',
}

describe('verifyCloudinaryVideo', () => {
  let originalFetch

  beforeEach(() => {
    resourceByAssetId.mockReset()
    resourceByPublicId.mockReset()
    originalFetch = globalThis.fetch
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'video/mp4' }),
    })
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it('uses the asset ID first and returns authoritative video metadata', async () => {
    resourceByAssetId.mockResolvedValue(asset)
    const result = await verifyCloudinaryVideo({
      assetId: asset.asset_id,
      publicId: 'hok-blog-video123',
      resourceType: 'video',
      type: 'upload',
      secureUrl: asset.secure_url,
      version: 123,
      format: 'mp4',
      bytes: 42,
    })

    expect(resourceByAssetId).toHaveBeenCalledWith(asset.asset_id)
    expect(resourceByPublicId).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      assetId: asset.asset_id,
      publicId: asset.public_id,
      resourceType: 'video',
      type: 'upload',
      version: 123,
      format: 'mp4',
      bytes: 42,
      deliveryAccessible: true,
    })
  })

  it('looks up the folder-qualified public ID for legacy clients', async () => {
    resourceByPublicId.mockResolvedValue(asset)
    const result = await verifyCloudinaryVideo({
      publicId: 'hok-blog-video123',
      secureUrl: asset.secure_url,
    })

    expect(resourceByPublicId).toHaveBeenCalledWith(asset.public_id, {
      resource_type: 'video',
      type: 'upload',
    })
    expect(result.publicId).toBe(asset.public_id)
  })

  it('returns a retryable error for Admin API network failures without delivery-only verification', async () => {
    const networkError = new Error('DNS lookup failed')
    networkError.code = 'ENOTFOUND'
    resourceByAssetId.mockRejectedValue(networkError)
    resourceByPublicId.mockRejectedValue(networkError)
    const logError = jest.spyOn(console, 'error').mockImplementation(() => {})
    const logWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(verifyCloudinaryVideo({
      assetId: asset.asset_id,
      publicId: 'hok-blog-video123',
      secureUrl: asset.secure_url,
    })).rejects.toMatchObject({
      status: 503,
      code: 'CLOUDINARY_VERIFY_TEMPORARY',
    })

    expect(globalThis.fetch).not.toHaveBeenCalled()
    expect(logError).toHaveBeenCalled()
    expect(logWarn).not.toHaveBeenCalled()
  })

  it('rejects a Cloudinary resource returned for a different public ID', async () => {
    resourceByAssetId.mockResolvedValue({ ...asset, public_id: 'another/video' })

    await expect(verifyCloudinaryVideo({
      assetId: asset.asset_id,
      publicId: 'hok-blog-video123',
      secureUrl: asset.secure_url,
    })).rejects.toMatchObject({
      status: 502,
      code: 'CLOUDINARY_ASSET_MISMATCH',
    })
  })

  it('does not report verification success when the delivery URL returns an HTTP failure', async () => {
    resourceByAssetId.mockResolvedValue(asset)
    const logWarn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    globalThis.fetch.mockResolvedValue({
      ok: false,
      status: 403,
      headers: new Headers({ 'x-cld-error': 'Not authorized' }),
    })

    await expect(verifyCloudinaryVideo({
      assetId: asset.asset_id,
      publicId: 'hok-blog-video123',
      secureUrl: asset.secure_url,
    })).rejects.toMatchObject({
      status: 422,
      code: 'CLOUDINARY_VIDEO_NOT_PUBLIC',
    })
    expect(logWarn).toHaveBeenCalledWith(
      '[Cloudinary] Secondary video delivery check returned an HTTP failure',
      expect.objectContaining({ status: 403, cloudinaryError: 'Not authorized' }),
    )
  })
})
