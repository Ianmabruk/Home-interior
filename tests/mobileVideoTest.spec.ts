import { test, expect } from '@playwright/test'

const LOCAL_URL = 'http://localhost:5174/blog/qa-test-video-blog2'

test('iPhone 12 - video renders with correct source', async ({ page }) => {
  await page.goto(LOCAL_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(8000)

  const videoCheck = await page.evaluate(() => {
    const video = document.querySelector('video')
    if (!video) {
      const fallback = document.querySelector('div')?.textContent || ''
      return { found: false, hasErrorFallback: fallback.includes('Video unavailable') }
    }
    const src = video.getAttribute('src') || video.querySelector('source')?.getAttribute('src')
    const poster = video.getAttribute('poster')
    const hasError = video.error ? `MEDIA_ERR_${video.error.code}` : null
    return {
      found: true,
      src,
      poster,
      hasError,
      readyState: video.readyState,
      networkState: video.networkState,
      paused: video.paused,
      ended: video.ended,
      controls: video.controls,
      muted: video.muted,
      playsInline: video.playsInline,
    }
  })

  console.log('iPhone 12 video check:', JSON.stringify(videoCheck, null, 2))

  if (!videoCheck.found) {
    throw new Error(`Video element not found. Error fallback: ${videoCheck.hasErrorFallback}`)
  }
  expect(videoCheck.hasError).toBe(null)
  expect(videoCheck.src).toBeTruthy()
  expect(videoCheck.src).not.toContain('blob:')
})

test('iPhone 12 - video element visible (not hidden by CSS)', async ({ page }) => {
  await page.goto(LOCAL_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(5000)

  const layoutCheck = await page.evaluate(() => {
    const video = document.querySelector('video')
    if (!video) return { found: false }
    const rect = video.getBoundingClientRect()
    const style = window.getComputedStyle(video)
    return {
      found: true,
      width: rect.width,
      height: rect.height,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      objectFit: style.objectFit,
      position: style.position,
    }
  })

  console.log('iPhone 12 layout check:', JSON.stringify(layoutCheck, null, 2))

  if (!layoutCheck.found) {
    throw new Error('Video element not found for layout check')
  }
  expect(layoutCheck.display).not.toBe('none')
  expect(layoutCheck.visibility).not.toBe('hidden')
  expect(layoutCheck.width).toBeGreaterThan(0)
  expect(layoutCheck.height).toBeGreaterThan(0)
})

test('Pixel 5 - video renders and is playable', async ({ page }) => {
  await page.goto(LOCAL_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(5000)

  const videoCheck = await page.evaluate(() => {
    const video = document.querySelector('video')
    if (!video) return { found: false }
    const src = video.getAttribute('src') || video.querySelector('source')?.getAttribute('src')
    const poster = video.getAttribute('poster')
    const hasError = video.error ? `MEDIA_ERR_${video.error.code}` : null
    return {
      found: true,
      src,
      poster,
      hasError,
      controls: video.controls,
      muted: video.muted,
      playsInline: video.playsInline,
      preload: video.preload,
    }
  })

  console.log('Pixel 5 video check:', JSON.stringify(videoCheck, null, 2))

  expect(videoCheck.found).toBe(true)
  expect(videoCheck.hasError).toBe(null)
})

test('iPhone 12 Landscape - video renders correctly', async ({ page }) => {
  await page.goto(LOCAL_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(5000)

  const videoCheck = await page.evaluate(() => {
    const video = document.querySelector('video')
    if (!video) return { found: false }
    const rect = video.getBoundingClientRect()
    return {
      found: true,
      src: video.getAttribute('src'),
      hasError: video.error ? `MEDIA_ERR_${video.error.code}` : null,
      width: rect.width,
      height: rect.height,
    }
  })

  console.log('iPhone 12 Landscape video check:', JSON.stringify(videoCheck, null, 2))

  expect(videoCheck.found).toBe(true)
  expect(videoCheck.hasError).toBe(null)
  expect(videoCheck.width).toBeGreaterThan(0)
  expect(videoCheck.height).toBeGreaterThan(0)
})
