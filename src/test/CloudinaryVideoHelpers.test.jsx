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

    // Regression guard for the phone-only playback failure: appending codec
    // transforms to an already-MP4 asset makes Cloudinary build a derived
    // asset on the first viewer's request. That request blocks while
    // transcoding, and mobile Safari abandons it (MEDIA_ERR_NETWORK) where
    // desktop waits it out. The eager derivative is created at upload time, so
    // an MP4 must be served untouched.
    it('returns an already-MP4 Cloudinary URL untouched (no on-demand transcode)', () => {
      const result = getOptimizedVideoUrl(videoUrl)
      expect(result).toBe(videoUrl)
      expect(result).not.toContain('vc_h264')
      expect(result).not.toContain('sp_auto')
    })

    it('does not add codec transforms to MP4 URLs even when a width is requested', () => {
      const result = getOptimizedVideoUrl(videoUrl, { width: 640 })
      expect(result).toBe(videoUrl)
      expect(result).not.toContain('w_640')
      expect(result).not.toContain('vc_h264')
    })

    it('still transcodes legacy non-MP4 Cloudinary assets to H.264/AAC/MP4', () => {
      const legacy = 'https://res.cloudinary.com/demo/video/upload/v1234567890/oldclip.mov'
      const result = getOptimizedVideoUrl(legacy)
      expect(result).toContain('vc_h264')
      expect(result).toContain('ac_aac')
      expect(result).toContain('f_mp4')
      expect(result).not.toBe(legacy)
      expect(result).not.toContain('sp_auto')
    })

    it('applies width-based resize alongside codec transforms for non-MP4 assets', () => {
      const legacy = 'https://res.cloudinary.com/demo/video/upload/v1234567890/oldclip.mov'
      const result = getOptimizedVideoUrl(legacy, { width: 640 })
      expect(result).toMatch(/^https:\/\/.*\/video\/upload\/w_640,c_limit,f_mp4,vc_h264,ac_aac\//)
      expect(result).not.toContain('https:/res')
      expect(result).not.toContain('sp_auto')
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
