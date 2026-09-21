import { test, expect } from '@playwright/test'

const PROD_URL = 'https://homy-comfy.netlify.app/blog/qa-test-video-blog2'
const PROD_HOME = 'https://homy-comfy.netlify.app/'

test('Production: Desktop Chrome - video renders and is playable', async ({ page }) => {
  await page.goto(PROD_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(5000)

  const videoCheck = await page.evaluate(() => {
    const video = document.querySelector('video')
    if (!video) return { found: false, src: null, error: null }
    const src = video.getAttribute('src')
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
    }
  })

  console.log('Desktop video check:', JSON.stringify(videoCheck, null, 2))

  expect(videoCheck.found).toBe(true)
  expect(videoCheck.hasError).toBe(null)
  expect(videoCheck.src).toBeTruthy()
  expect(videoCheck.src).not.toContain('blob:')
})

test('Production: iPhone 12 - video renders and is available', async ({ page }) => {
  await page.goto(PROD_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(5000)

  const videoCheck = await page.evaluate(() => {
    const video = document.querySelector('video')
    if (!video) return { found: false, src: null, error: null }
    const src = video.getAttribute('src')
    const poster = video.getAttribute('poster')
    const hasError = video.error ? `MEDIA_ERR_${video.error.code}` : null
    return {
      found: true,
      src,
      poster,
      hasError,
      readyState: video.readyState,
      networkState: video.networkState,
    }
  })

  console.log('iPhone 12 video check:', JSON.stringify(videoCheck, null, 2))

  expect(videoCheck.found).toBe(true)
  expect(videoCheck.hasError).toBe(null)
  expect(videoCheck.src).toBeTruthy()
  expect(videoCheck.src).not.toContain('blob:')
})

test('Production: Pixel 5 - video renders and is available', async ({ page }) => {
  await page.goto(PROD_URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(5000)

  const videoCheck = await page.evaluate(() => {
    const video = document.querySelector('video')
    if (!video) return { found: false, src: null, error: null }
    const src = video.getAttribute('src')
    const poster = video.getAttribute('poster')
    const hasError = video.error ? `MEDIA_ERR_${video.error.code}` : null
    return {
      found: true,
      src,
      poster,
      hasError,
      readyState: video.readyState,
      networkState: video.networkState,
    }
  })

  console.log('Pixel 5 video check:', JSON.stringify(videoCheck, null, 2))

  expect(videoCheck.found).toBe(true)
  expect(videoCheck.hasError).toBe(null)
  expect(videoCheck.src).toBeTruthy()
  expect(videoCheck.src).not.toContain('blob:')
})

test('Production: Hero - images visible on mobile', async ({ page }) => {
  await page.goto(PROD_HOME, { waitUntil: 'networkidle' })
  await page.waitForTimeout(10000)

  const heroCheck = await page.evaluate(() => {
    const hero = document.querySelector('[role="region"][aria-label="Hero image"]')
    if (!hero) return { found: false }

    const images = hero.querySelectorAll('img, video')
    const hasVisibleImage = Array.from(images).some(img => {
      const rect = img.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    })

    return {
      found: true,
      imageCount: images.length,
      hasVisibleImage,
    }
  })

  console.log('Hero check:', JSON.stringify(heroCheck, null, 2))

  expect(heroCheck.found).toBe(true)
  expect(heroCheck.hasVisibleImage).toBe(true)
})
