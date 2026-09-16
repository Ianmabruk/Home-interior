import { describe, it, expect } from 'vitest'
import { getOptimizedVideoUrl, getVideoPosterUrl } from '@utils/cloudinaryHelpers'

describe('cloudinaryHelpers - video', () => {
  const videoUrl =
    'https://res.cloudinary.com/demo/video/upload/v1234567890/myvideo.mp4'
  const videoUrlWithFormat =
    'https://res.cloudinary.com/demo/video/upload/f_auto,q_auto/f_myvideo.mp4'

  describe('getOptimizedVideoUrl', () => {
    it('preserves https:// protocol (does not corrupt to https:/)', () => {
      const result = getOptimizedVideoUrl(videoUrl)
      expect(result).toContain('https://')
      expect(result).not.toContain('https:/res')
    })

    it('returns a string with valid protocol and video segment', () => {
      const result = getOptimizedVideoUrl(videoUrl)
      expect(result).toMatch(/^https:\/\/.*\/video\/upload\//)
    })

    it('injects f_mp4 transformation', () => {
      const result = getOptimizedVideoUrl(videoUrl)
      expect(result).toContain('f_mp4')
    })

    it('strips existing f_auto and inserts f_mp4', () => {
      const result = getOptimizedVideoUrl(videoUrlWithFormat)
      expect(result).not.toContain('f_auto')
      expect(result).toContain('f_mp4')
      expect(result).toMatch(/^https:\/\/.*\/video\/upload\//)
    })

    it('returns null for non-string input', () => {
      expect(getOptimizedVideoUrl(null)).toBeNull()
      expect(getOptimizedVideoUrl(undefined)).toBeNull()
      expect(getOptimizedVideoUrl(123)).toBeNull()
    })

    it('returns non-Cloudinary URLs unchanged', () => {
      const result = getOptimizedVideoUrl('https://example.com/video.mp4')
      expect(result).toBe('https://example.com/video.mp4')
    })
  })

  describe('getVideoPosterUrl', () => {
    it('preserves https:// protocol', () => {
      const result = getVideoPosterUrl(videoUrl)
      expect(result).toContain('https://')
      expect(result).not.toContain('https:/res')
    })

    it('returns a .jpg poster URL', () => {
      const result = getVideoPosterUrl(videoUrl)
      expect(result).toMatch(/\.jpg(\?.*)?$/)
    })

    it('returns undefined for non-Cloudinary URLs', () => {
      expect(getVideoPosterUrl('https://example.com/video.mp4')).toBeUndefined()
      expect(getVideoPosterUrl(null)).toBeUndefined()
    })
  })
})
