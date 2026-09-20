import { describe, it, expect } from 'vitest'
import { getOptimizedVideoUrl, getVideoPosterUrl, getVideoSourceType, isCloudinaryVideo } from '@utils/cloudinaryHelpers'

describe('cloudinaryHelpers - video', () => {
  const videoUrl =
    'https://res.cloudinary.com/demo/video/upload/v1234567890/myvideo.mp4'

  describe('getOptimizedVideoUrl - streamability contract', () => {
    it('preserves https:// protocol (does not corrupt to https:/)', () => {
      const result = getOptimizedVideoUrl(videoUrl)
      expect(result).toContain('https://')
      expect(result).not.toContain('https:/res')
    })

    it('forces H.264 video, AAC audio, MP4 container for mobile compatibility', () => {
      const result = getOptimizedVideoUrl(videoUrl)
      expect(result).toContain('vc_h264')
      expect(result).toContain('ac_aac')
      expect(result).toContain('f_mp4')
    })

    it('applies width-based resize when width is requested', () => {
      const result = getOptimizedVideoUrl(videoUrl, { width: 640 })
      expect(result).toContain('w_640')
      expect(result).toContain('c_limit')
      // codec/format forcing still applied
      expect(result).toContain('vc_h264')
      expect(result).toContain('ac_aac')
      expect(result).toContain('f_mp4')
    })

    it('preserves video segment and valid https for width transform', () => {
      const result = getOptimizedVideoUrl(videoUrl, { width: 640 })
      expect(result).toMatch(/^https:\/\/.*\/video\/upload\/vc_h264,ac_aac,f_mp4,w_640,c_limit\//)
      expect(result).not.toContain('https:/res')
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

    it('returns empty string URLs unchanged', () => {
      const result = getOptimizedVideoUrl('')
      expect(result).toBe('')
    })
  })

  describe('getVideoSourceType', () => {
    it('returns video/mp4 for Cloudinary video URLs', () => {
      expect(getVideoSourceType(videoUrl)).toBe('video/mp4')
    })

    it('returns video/mp4 for .mp4 extension', () => {
      expect(getVideoSourceType('https://example.com/video.mp4')).toBe('video/mp4')
    })

    it('returns video/webm for .webm', () => {
      expect(getVideoSourceType('https://example.com/video.webm')).toBe('video/webm')
    })

    it('returns video/quicktime for .mov', () => {
      expect(getVideoSourceType('https://example.com/video.mov')).toBe('video/quicktime')
    })

    it('returns undefined for empty/non-string', () => {
      expect(getVideoSourceType('')).toBeUndefined()
      expect(getVideoSourceType(null)).toBeUndefined()
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

    it('uses f_jpg for poster format (not f_auto)', () => {
      const result = getVideoPosterUrl(videoUrl)
      expect(result).toContain('f_jpg')
      expect(result).not.toContain('f_auto')
    })
  })

  describe('isCloudinaryVideo', () => {
    it('detects Cloudinary video URLs', () => {
      expect(isCloudinaryVideo(videoUrl)).toBe(true)
      expect(isCloudinaryVideo('https://res.cloudinary.com/demo/video/upload/v1/x.mp4')).toBe(true)
    })

    it('rejects non-cloudinary and image URLs', () => {
      expect(isCloudinaryVideo('https://example.com/video.mp4')).toBe(false)
      expect(isCloudinaryVideo('https://res.cloudinary.com/demo/image/upload/x.jpg')).toBe(false)
      expect(isCloudinaryVideo(null)).toBe(false)
    })
  })
})
