import request from 'supertest'
import { jest } from '@jest/globals'
import { getApp } from './lazyApp.js'
import { createTestAdmin, getAuthToken, generateTestEmail } from './helpers.js'
import cloudinary from '../src/config/cloudinary.js'
import { uploadFile } from '../src/uploads/uploadService.js'
import { blogService } from '../src/services/blogService.js'

let app = null

beforeAll(async () => {
  app = await getApp()
})

const API = '/api'

const makeFakeImage = (name = 'test.png') => {
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#ccc"/></svg>',
  )
  return { buffer: svg, name }
}

describe('Blog uploads and publishing', () => {
  let adminToken
  let csrfToken
  let adminEmail

  beforeEach(async () => {
    adminEmail = generateTestEmail()
    await createTestAdmin(adminEmail)
    const auth = await getAuthToken(adminEmail)
    adminToken = auth.accessToken
    csrfToken = auth.csrfToken
  })

  it('should create a text-only blog post as admin', async () => {
    const res = await request(app)
      .post(`${API}/admin/blog`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ title: 'test_Blog Alpha', description: 'Test desc', content: 'Content', category: 'Design', published: true })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.title).toBe('test_Blog Alpha')
    expect(res.body.data.published).toBe(true)
  })

  it('should reject unsupported media types before upload', async () => {
    const res = await request(app)
      .post(`${API}/admin/blog`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .attach('image', Buffer.from('not-an-image'), { filename: 'bad.txt', contentType: 'text/plain' })
      .field('title', 'Bad upload blog')

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(String(res.body.message)).toMatch(/Invalid file type|Unsupported/i)
  })

  it('should persist a Cloudinary-backed video record and metadata', async () => {
    const uploadSpy = jest.spyOn(cloudinary.uploader, 'upload_stream').mockImplementation((options, callback) => {
      const fakeResult = {
        secure_url: 'https://res.cloudinary.com/demo/video/upload/v123/hok-interiors/blog-video.mp4',
        public_id: 'hok-interiors/blog-video',
        resource_type: 'video',
        format: 'mp4',
        width: 1280,
        height: 720,
        duration: 12.6,
        bytes: 900000,
        eager: [{ secure_url: 'https://res.cloudinary.com/demo/video/upload/v123/hok-interiors/blog-video.mp4', format: 'mp4' }],
      }
      const stream = {
        end: (buffer) => callback(null, fakeResult),
      }
      return stream
    })

    const item = await blogService.createBlog(
      { title: 'Cloudinary video post', slug: 'cloudinary-video-post', content: 'Video content', published: true },
      null,
      { buffer: Buffer.from('fake-video-data'), mimetype: 'video/mp4', originalname: 'blog-video.mp4' },
    )

    expect(item.videoUrl).toContain('res.cloudinary.com')
    expect(item.videoCloudinaryId).toBe('hok-interiors/blog-video')
    expect(item.videoResourceType).toBe('video')
    expect(item.videoFormat).toBe('mp4')
    expect(item.videoDuration).toBe(12.6)
    uploadSpy.mockRestore()
  })

  it('should publish and update blog media references without sending binary files', async () => {
    const imageAsset = {
      secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/blogs/cover.webp',
      publicId: 'blogs/cover',
      resourceType: 'image',
      format: 'webp',
      mimeType: 'image/webp',
      bytes: 12000,
    }
    const initialMedia = [
      {
        secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/blogs/gallery.webp',
        publicId: 'blogs/gallery',
        resourceType: 'image',
        format: 'webp',
        mimeType: 'image/webp',
        originalName: 'gallery.webp',
        bytes: 15000,
      },
      {
        secureUrl: 'https://res.cloudinary.com/demo/video/upload/v1/blogs/walkthrough.mp4',
        publicId: 'blogs/walkthrough',
        resourceType: 'video',
        format: 'mp4',
        mimeType: 'video/mp4',
        originalName: 'walkthrough.mp4',
        duration: 12.5,
        width: 1280,
        height: 720,
        bytes: 75000,
      },
    ]
    const createRes = await request(app)
      .post(`${API}/admin/blog`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({
        title: 'test_Blog Media References',
        published: true,
        imageAsset,
        mediaAssets: initialMedia,
      })

    expect(createRes.status).toBe(201)
    expect(createRes.body.data.image).toBe(imageAsset.secureUrl)
    expect(createRes.body.data.cloudinaryId).toBe(imageAsset.publicId)
    expect(createRes.body.data.mediaUrls).toEqual(initialMedia.map((asset) => asset.secureUrl))
    expect(createRes.body.data.mediaAssets).toEqual(initialMedia)

    const addedVideo = {
      secureUrl: 'https://res.cloudinary.com/demo/video/upload/v1/blogs/second-room.mp4',
      publicId: 'blogs/second-room',
      resourceType: 'video',
      format: 'mp4',
      mimeType: 'video/mp4',
      originalName: 'second-room.mp4',
      duration: 8,
      width: 1280,
      height: 720,
      bytes: 43000,
    }
    const updateRes = await request(app)
      .patch(`${API}/admin/blog/${createRes.body.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ mediaAssets: [addedVideo] })

    expect(updateRes.status).toBe(200)
    expect(updateRes.body.data.mediaUrls).toEqual([...initialMedia.map((asset) => asset.secureUrl), addedVideo.secureUrl])
    expect(updateRes.body.data.mediaAssets).toEqual([...initialMedia, addedVideo])
    expect(updateRes.body.data.videoUrl).toBeNull()
  })

  it('should accept 74 images and six videos as media references', async () => {
    const mediaAssets = [
      ...Array.from({ length: 74 }, (_, index) => ({
        secureUrl: `https://res.cloudinary.com/demo/image/upload/v1/blogs/bulk-image-${index}.webp`,
        publicId: `blogs/bulk-image-${index}`,
        resourceType: 'image',
        format: 'webp',
        mimeType: 'image/webp',
        originalName: `bulk-image-${index}.webp`,
        bytes: 12000,
      })),
      ...Array.from({ length: 6 }, (_, index) => ({
        secureUrl: `https://res.cloudinary.com/demo/video/upload/v1/blogs/bulk-video-${index}.mp4`,
        publicId: `blogs/bulk-video-${index}`,
        resourceType: 'video',
        format: 'mp4',
        mimeType: 'video/mp4',
        originalName: `bulk-video-${index}.mp4`,
        duration: 10,
        width: 1280,
        height: 720,
        bytes: 50000,
      })),
    ]

    const res = await request(app)
      .post(`${API}/admin/blog`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ title: 'test_Blog Large Media Batch', published: true, mediaAssets })

    expect(res.status).toBe(201)
    expect(res.body.data.mediaAssets).toHaveLength(80)
    expect(res.body.data.mediaUrls).toHaveLength(80)
    expect(res.body.data.mediaAssets.filter((asset) => asset.resourceType === 'image')).toHaveLength(74)
    expect(res.body.data.mediaAssets.filter((asset) => asset.resourceType === 'video')).toHaveLength(6)
  })

  it('should reject media references that are not Cloudinary assets', async () => {
    const res = await request(app)
      .post(`${API}/admin/blog`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({
        title: 'test_Blog Invalid Media Reference',
        mediaAssets: [{
          secureUrl: 'https://example.invalid/anything.jpg',
          publicId: 'external',
          resourceType: 'image',
        }],
      })

    expect(res.status).toBe(422)
    expect(res.body.message).toMatch(/Invalid media reference/i)
  })

  it('should not silently replace a failed Cloudinary upload with local storage in production', async () => {
    const originalEnv = process.env.NODE_ENV
    const originalCloudName = process.env.CLOUDINARY_CLOUD_NAME
    const originalKey = process.env.CLOUDINARY_API_KEY
    const originalSecret = process.env.CLOUDINARY_API_SECRET
    process.env.NODE_ENV = 'production'
    process.env.CLOUDINARY_CLOUD_NAME = 'demo'
    process.env.CLOUDINARY_API_KEY = 'demo-key'
    process.env.CLOUDINARY_API_SECRET = 'demo-secret'

    jest.spyOn(cloudinary.uploader, 'upload_stream').mockImplementation((options, callback) => {
      const stream = {
        end: () => callback(new Error('Cloudinary upload timed out after 120000ms'), null),
      }
      return stream
    })

    await expect(
      uploadFile(Buffer.from('large-data'), 'image/png', 'blogs', 'photo.png')
    ).rejects.toMatchObject({ status: 408 })

    process.env.NODE_ENV = originalEnv
    process.env.CLOUDINARY_CLOUD_NAME = originalCloudName
    process.env.CLOUDINARY_API_KEY = originalKey
    process.env.CLOUDINARY_API_SECRET = originalSecret
  })

  it('should update an existing blog without clobbering unrelated fields', async () => {
    const createRes = await request(app)
      .post(`${API}/admin/blog`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ title: 'test_Blog Update', description: 'Old content', content: 'Initial content', category: 'Design', published: false })

    const id = createRes.body.data.id
    const updateRes = await request(app)
      .patch(`${API}/admin/blog/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .send({ title: 'test_Blog Update Revised', content: 'Updated content', category: 'Architecture' })

    expect(updateRes.status).toBe(200)
    expect(updateRes.body.data.title).toBe('test_Blog Update Revised')
    expect(updateRes.body.data.category).toBe('Architecture')
    expect(updateRes.body.data.description).toBe('Old content')
  })
})
