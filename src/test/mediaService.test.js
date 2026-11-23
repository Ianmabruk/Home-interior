import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../services/api', () => ({
  api: { post: vi.fn() },
}))

import { api } from '../services/api'
import { mediaService } from '../services/mediaService'

describe('mediaService.upload', () => {
  beforeEach(() => {
    api.post.mockReset()
  })

  it('sends the backend multipart field and returns the media asset from its response envelope', async () => {
    const file = new File(['image'], 'room.jpg', { type: 'image/jpeg' })
    const asset = {
      secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/blogs/room.jpg',
      publicId: 'blogs/room',
      resourceType: 'image',
    }
    api.post.mockResolvedValue({ data: { success: true, data: asset } })

    await expect(mediaService.upload(file, 'blogs', {}, 'stable-upload-id-1234')).resolves.toEqual(asset)

    const [url, formData] = api.post.mock.calls[0]
    expect(url).toBe('/media/upload')
    expect(formData.get('media')).toBe(file)
    expect(formData.get('file')).toBeNull()
    expect(formData.get('folder')).toBe('blogs')
    expect(formData.get('uploadId')).toBe('stable-upload-id-1234')
  })
})
