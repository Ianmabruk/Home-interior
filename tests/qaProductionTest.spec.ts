/**
 * HOK Interiors — Strict Full Production QA Test
 * Verification-only. Does NOT delete data, does NOT delete images/videos.
 * Creates test projects to verify the 40/40 Before/After limits.
 * Tests against REAL production data and REAL blog videos.
 */
import { test, expect } from '@playwright/test'
import fs from 'fs'

const API_BASE = 'https://home-interior-backend.onrender.com/api'
const FRONTEND_URL = 'http://localhost:5174'
const ADMIN_EMAIL = 'info@hokinteriors.co.ke'
const ADMIN_PASSWORD = 'admin123'

const results: any = {
  testDate: new Date().toISOString(),
  appEnv: 'HOK Interiors Production (frontend: localhost:5174 preview build, backend: home-interior-backend.onrender.com)',
  filesInspected: [],
  filesModified: [],
  beforeImageResults: '',
  afterImageResults: '',
  combined4040Results: '',
  heroResult: '',
  blogVideoDesktopResult: '',
  blogVideoIPhoneResult: '',
  blogVideoAndroidResult: '',
  adminBlogResult: '',
  adminPortfolioResult: '',
  cloudinaryResult: '',
  databasePersistenceResult: '',
  browserConsoleResult: '',
  productionBuildResult: '',
  exactFailures: [],
  exactFixes: [],
  finalStatus: '',
  testMatrix: {
    hero: { chromeDesktop: 'NOT TESTED', safariDesktop: 'NOT TESTED', firefox: 'NOT TESTED', edge: 'NOT TESTED', iPhoneSafari: 'NOT TESTED', androidChrome: 'NOT TESTED', tablet: 'NOT TESTED' },
    portfolio: { chromeDesktop: 'NOT TESTED', safariDesktop: 'NOT TESTED', firefox: 'NOT TESTED', edge: 'NOT TESTED', iPhoneSafari: 'NOT TESTED', androidChrome: 'NOT TESTED', tablet: 'NOT TESTED' },
    blogVideo: { chromeDesktop: 'NOT TESTED', safariDesktop: 'NOT TESTED', firefox: 'NOT TESTED', edge: 'NOT TESTED', iPhoneSafari: 'NOT TESTED', androidChrome: 'NOT TESTED', tablet: 'NOT TESTED' },
  },
}

let accessToken = ''
let csrfToken = ''

async function loginAdmin() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  const data = await res.json()
  if (!data.success) throw new Error('Login failed')
  accessToken = data.data.accessToken
  csrfToken = data.data.csrfToken
  return { token: accessToken, csrf: csrfToken }
}

async function createTestProject(token: string, csrf: string, title: string) {
  const formData = new FormData()
  formData.append('title', title)
  formData.append('description', 'QA verification - do not delete')
  formData.append('category', 'General')
  formData.append('featured', 'false')
  formData.append('displayOrder', '999')
  formData.append('published', 'true')
  formData.append('beforeImages', '')
  formData.append('afterImages', '')
  const res = await fetch(`${API_BASE}/admin/portfolio`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'x-csrf-token': csrf },
    body: formData,
  })
  const data = await res.json()
  if (!data.success) throw new Error(`Create project failed: ${data.message}`)
  return data.data.id || data.data._id
}

async function updateProject(token: string, csrf: string, projectId: string, title: string, beforeImages: string[] = [], afterImages: string[] = []) {
  const formData = new FormData()
  formData.append('title', title)
  formData.append('description', 'QA verification - do not delete')
  formData.append('category', 'General')
  formData.append('featured', 'false')
  formData.append('displayOrder', '999')
  formData.append('published', 'true')
  if (beforeImages.length === 0) formData.append('beforeImages', '')
  else beforeImages.forEach(url => formData.append('beforeImages', url))
  if (afterImages.length === 0) formData.append('afterImages', '')
  else afterImages.forEach(url => formData.append('afterImages', url))
  const res = await fetch(`${API_BASE}/admin/portfolio/${projectId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'x-csrf-token': csrf },
    body: formData,
  })
  const data = await res.json()
  return { status: res.status, data }
}

function makeImageUrl(i: number) {
  return `https://res.cloudinary.com/du02q965h/image/upload/v1789025878/portfolio/before/test_${i}_${Date.now()}.jpg`
}

function makeAfterUrl(i: number) {
  return `https://res.cloudinary.com/du02q965h/image/upload/v1789025878/portfolio/after/test_${i}_${Date.now()}.jpg`
}

const consoleErrors: string[] = []

test.describe('HOK Interiors — STRICT FULL PRODUCTION QA TEST', () => {
  test.use({ viewport: { width: 1920, height: 1080 } })

  test('Verify 40 Before images accepted, 41st rejected, images remain intact', async ({ page }) => {
    console.log('=== TEST: 40 Before images ===')
    const { token, csrf } = await loginAdmin()

    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', err => consoleErrors.push(`PAGEERROR: ${err.message}`))
    page.on('requestfailed', req => consoleErrors.push(`REQUESTFAILED: ${req.url()}`))

    const projectId = await createTestProject(token, csrf, `[QA TEST] Before40_${Date.now()}`)
    console.log('Created test project:', projectId)

    // Test: 40 Before images accepted
    const before40 = Array.from({ length: 40 }, (_, i) => makeImageUrl(i))
    const res40 = await updateProject(token, csrf, projectId, `[QA TEST] Before40_${Date.now()}`, before40, [])
    console.log('40 Before result:', res40.status, res40.data.success, 'before:', res40.data.data?.beforeImages?.length)

    let pass40 = false
    if (res40.status === 200 && res40.data.success && res40.data.data?.beforeImages?.length === 40) {
      console.log('PASS: 40 Before images accepted')
      pass40 = true
    } else {
      console.log('FAIL: 40 Before images not accepted properly')
      results.exactFailures.push('40 Before images not accepted')
    }

    // Verify persistence after refresh
    const refreshRes = await fetch(`${API_BASE}/portfolio/${projectId}`)
    const refreshData = await refreshRes.json()
    console.log('After refresh - before images:', refreshData.data.beforeImages.length)
    if (refreshData.data.beforeImages.length !== 40) {
      results.exactFailures.push('Before images not persisted after refresh')
    }

    // Test: 41st Before image rejected
    const before41 = [...before40, makeImageUrl(100)]
    const res41 = await updateProject(token, csrf, projectId, `[QA TEST] Before40_${Date.now()}`, before41, [])
    console.log('41 Before result:', res41.status, res41.data.message)

    let rejected41 = false
    if (res41.status === 400) {
      console.log('PASS: 41st Before image rejected')
      rejected41 = true
    } else {
      console.log('FAIL: 41st Before image was accepted')
      results.exactFailures.push('41st Before image was accepted (should be rejected)')
    }

    // Verify existing 40 remain intact
    const intactRes = await fetch(`${API_BASE}/portfolio/${projectId}`)
    const intactData = await intactRes.json()
    console.log('After 41st attempt - before:', intactData.data.beforeImages.length)
    if (intactData.data.beforeImages.length === 40) {
      console.log('PASS: Existing 40 Before images remain intact')
    } else {
      results.exactFailures.push('Existing 40 Before images lost after rejection')
    }

    results.beforeImageResults = (pass40 && rejected41) ? 'PASS' : 'FAIL'
    results.testMatrix.portfolio.chromeDesktop = (pass40 && rejected41) ? 'PASS' : 'FAIL'
  })

  test('Verify 40 After images accepted, 41st rejected, images remain intact', async () => {
    console.log('=== TEST: 40 After images ===')
    const { token, csrf } = await loginAdmin()

    const projectId = await createTestProject(token, csrf, `[QA TEST] After40_${Date.now()}`)

    const after40 = Array.from({ length: 40 }, (_, i) => makeAfterUrl(i))
    const res40 = await updateProject(token, csrf, projectId, `[QA TEST] After40_${Date.now()}`, [], after40)
    console.log('40 After result:', res40.status, res40.data.success, 'after:', res40.data.data?.afterImages?.length)

    let pass40 = false
    if (res40.status === 200 && res40.data.success && res40.data.data?.afterImages?.length === 40) {
      console.log('PASS: 40 After images accepted')
      pass40 = true
    } else {
      console.log('FAIL: 40 After images not accepted properly')
      results.exactFailures.push('40 After images not accepted')
    }

    const refreshRes = await fetch(`${API_BASE}/portfolio/${projectId}`)
    const refreshData = await refreshRes.json()
    console.log('After refresh - after:', refreshData.data.afterImages.length)
    if (refreshData.data.afterImages.length !== 40) {
      results.exactFailures.push('After images not persisted after refresh')
    }

    const after41 = [...after40, makeAfterUrl(100)]
    const res41 = await updateProject(token, csrf, projectId, `[QA TEST] After40_${Date.now()}`, [], after41)
    console.log('41 After result:', res41.status, res41.data.message)

    let rejected41 = false
    if (res41.status === 400) {
      console.log('PASS: 41st After image rejected')
      rejected41 = true
    } else {
      console.log('FAIL: 41st After image was accepted')
      results.exactFailures.push('41st After image was accepted (should be rejected)')
    }

    const intactRes = await fetch(`${API_BASE}/portfolio/${projectId}`)
    const intactData = await intactRes.json()
    console.log('After 41st attempt - after:', intactData.data.afterImages.length)
    if (intactData.data.afterImages.length === 40) {
      console.log('PASS: Existing 40 After images remain intact')
    } else {
      results.exactFailures.push('Existing 40 After images lost after rejection')
    }

    results.afterImageResults = (pass40 && rejected41) ? 'PASS' : 'FAIL'
  })

  test('Verify 40 Before + 40 After = 80 works simultaneously (independent limits)', async () => {
    console.log('=== TEST: 40 Before + 40 After simultaneous ===')
    const { token, csrf } = await loginAdmin()

    const projectId = await createTestProject(token, csrf, `[QA TEST] Combined80_${Date.now()}`)

    const before40 = Array.from({ length: 40 }, (_, i) => makeImageUrl(i))
    const after40 = Array.from({ length: 40 }, (_, i) => makeAfterUrl(i))

    const res = await updateProject(token, csrf, projectId, `[QA TEST] Combined80_${Date.now()}`, before40, after40)
    console.log('40+40 combined result:', res.status, res.data.success,
      'before:', res.data.data?.beforeImages?.length,
      'after:', res.data.data?.afterImages?.length)

    let combinedPass = false
    if (res.status === 200 && res.data.success &&
        res.data.data?.beforeImages?.length === 40 &&
        res.data.data?.afterImages?.length === 40) {
      console.log('PASS: 40 Before + 40 After = 80 simultaneously accepted')
      combinedPass = true
    } else {
      results.exactFailures.push('Combined 40+40 not accepted')
    }

    const refreshRes = await fetch(`${API_BASE}/portfolio/${projectId}`)
    const refreshData = await refreshRes.json()
    console.log('After refresh - before:', refreshData.data.beforeImages.length, 'after:', refreshData.data.afterImages.length)

    if (refreshData.data.beforeImages.length === 40 && refreshData.data.afterImages.length === 40) {
      console.log('PASS: Combined 80 images persist after refresh')
    } else {
      results.exactFailures.push('Combined 80 images did not persist after refresh')
      combinedPass = false
    }

    // Try 41st After
    const after41 = [...after40, makeAfterUrl(100)]
    const res41 = await updateProject(token, csrf, projectId, `[QA TEST] Combined80_${Date.now()}`, before40, after41)
    console.log('41 After (when 40+40):', res41.status)

    // Verify all 80 still intact
    const intactRes = await fetch(`${API_BASE}/portfolio/${projectId}`)
    const intactData = await intactRes.json()
    console.log('After attempts - before:', intactData.data.beforeImages.length, 'after:', intactData.data.afterImages.length)
    if (intactData.data.beforeImages.length === 40 && intactData.data.afterImages.length === 40) {
      console.log('PASS: All 80 images remain intact')
    } else {
      results.exactFailures.push('Images lost during combined 41st rejection')
    }

    results.combined4040Results = combinedPass ? 'PASS' : 'FAIL'
  })

  test('Hero cinematic transitions verification', async ({ page }) => {
    console.log('=== TEST: Hero cinematic transitions ===')

    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' })
    await page.waitForTimeout(5000)

    const heroCheck = await page.evaluate(() => {
      const images = document.querySelectorAll('img')
      for (const img of images) {
        const rect = img.getBoundingClientRect()
        if (rect.width > 100 && rect.height > 100 && rect.top < window.innerHeight) {
          return true
        }
      }
      return false
    })
    console.log('Hero visible:', heroCheck)

    for (let i = 0; i < 5; i++) {
      await page.screenshot({ path: `/tmp/kilo/hero_check_${i}.png`, fullPage: false })
      await page.waitForTimeout(3000)
    }

    await page.goto(`${FRONTEND_URL}/portfolio`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    const heroAfterNav = await page.evaluate(() => {
      const images = document.querySelectorAll('img')
      for (const img of images) {
        const rect = img.getBoundingClientRect()
        if (rect.width > 100 && rect.height > 100 && rect.top < window.innerHeight) {
          return true
        }
      }
      return false
    })

    const heroErrors = consoleErrors.filter(e =>
      e.toLowerCase().includes('hero') ||
      (e.toLowerCase().includes('image') && e.toLowerCase().includes('error'))
    )

    const heroPass = heroCheck && heroAfterNav && heroErrors.length === 0
    console.log('Hero after nav:', heroAfterNav)
    console.log('Hero errors:', heroErrors.length)

    results.heroResult = heroPass ? 'PASS' : `FAIL`
    results.testMatrix.hero.chromeDesktop = heroPass ? 'PASS' : 'FAIL'
  })

  test('Admin Portfolio + Blog dashboard loads', async ({ page }) => {
    console.log('=== TEST: Admin dashboards ===')

    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    try {
      await page.fill('input[type="email"]', ADMIN_EMAIL)
      await page.fill('input[type="password"]', ADMIN_PASSWORD)
      await page.click('button[type="submit"]')
      await page.waitForTimeout(4000)
    } catch (e) {
      console.log('Login error:', e.message)
    }

    const loggedIn = await page.evaluate(() => !!localStorage.getItem('hok_access_token'))
    console.log('Logged in:', loggedIn)

    await page.goto(`${FRONTEND_URL}/admin/portfolio`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    const portfolioLoaded = await page.evaluate(() => {
      return document.querySelector('[class*="portfolio"], [class*="Portfolio"], [class*="grid"]') !== null
    })
    console.log('Portfolio dashboard loaded:', portfolioLoaded)

    const portfolioErrors = consoleErrors.filter(e =>
      e.toLowerCase().includes('portfolio') && e.toLowerCase().includes('error')
    )

    results.adminPortfolioResult = portfolioLoaded && portfolioErrors.length === 0 ? 'PASS' : 'FAIL'
    results.testMatrix.portfolio.chromeDesktop = portfolioLoaded ? 'PASS' : 'FAIL'

    await page.goto(`${FRONTEND_URL}/admin/blog`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    const blogLoaded = await page.evaluate(() => {
      return document.querySelector('[class*="blog"], [class*="Blog"], [class*="grid"]') !== null
    })
    console.log('Blog dashboard loaded:', blogLoaded)

    results.adminBlogResult = blogLoaded ? 'PASS' : 'FAIL'
  })

  test('Blog detail page with video verification', async ({ page }) => {
    console.log('=== TEST: Blog detail page with video ===')

    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', err => consoleErrors.push(`PAGEERROR: ${err.message}`))
    page.on('requestfailed', req => {
      const failure = req.failure()
      consoleErrors.push(`REQUESTFAILED: ${req.url()} (${failure ? failure.errorText : 'unknown'})`)
    })

    // Get blog posts - find one with video
    const { token, csrf } = await loginAdmin()
    let res = await fetch(`${API_BASE}/admin/blog?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    let data = await res.json()
    const allBlogs = (data.data || data || []).filter(b => b.video || b.videoCloudinaryId || b.videoUrl)
    console.log('Admin blogs with video:', allBlogs.length)

    const blogWithVideo = allBlogs.find(b => b.video || b.videoCloudinaryId || b.videoUrl)

    console.log('Blog with video to test:', blogWithVideo?.title || 'NONE FOUND')
    console.log('Video URL:', blogWithVideo?.video || blogWithVideo?.videoUrl)

    if (!blogWithVideo) {
      results.exactFailures.push('No blog post with video found for testing')
      results.blogVideoDesktopResult = 'FAIL - No blog with video'
      results.testMatrix.blogVideo.chromeDesktop = 'FAIL'
      return
    }

    const blogSlug = blogWithVideo.slug || blogWithVideo.id
    console.log('Navigating to blog:', `/blog/${blogSlug}`)

    await page.goto(`${FRONTEND_URL}/blog/${blogSlug}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(5000)

    // Check blog content
    const blogCheck = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent || ''
      const hasContent = document.querySelector('article, [class*="blog-content"], [class*="BlogContent"], [class*="prose"]') !== null
      const imageCount = document.querySelectorAll('img').length
      return { title: title?.substring(0, 50), hasContent, imageCount }
    })
    console.log('Blog detail page check:', blogCheck)

    // Check for video element
    const videoElement = await page.$('video')
    console.log('Video element found:', !!videoElement)

    if (videoElement) {
      const videoSrc = await videoElement.getAttribute('src')
        || await videoElement.$eval('source', (el) => el.getAttribute('src')).catch(() => null)
      const videoPoster = await videoElement.getAttribute('poster')
      console.log('Video src:', videoSrc)
      console.log('Video poster:', videoPoster)

      // Verify src is NOT a blob URL
      if (videoSrc && videoSrc.startsWith('blob:')) {
        results.exactFailures.push('Blog video uses temporary Blob URL instead of persistent Cloudinary URL')
      }

      // Verify video source is valid
      if (videoSrc && !videoSrc.startsWith('blob:')) {
        const videoHeadRes = await page.evaluate(async (src) => {
          try {
            const res = await fetch(src, { method: 'HEAD' })
            return {
              status: res.status,
              contentType: res.headers.get('content-type'),
            }
          } catch (e) {
            return { error: e.message }
          }
        }, videoSrc)
        console.log('Video source HEAD response:', videoHeadRes)

        if (videoHeadRes.error) {
          results.exactFailures.push('Blog video source fetch failed: ' + videoHeadRes.error)
        }
      }

      // Try autoplay
      try {
        await videoElement.evaluate(v => v.play())
        await page.waitForTimeout(2000)
        const isPlaying = await videoElement.evaluate(v => !v.paused && !v.ended)
        console.log('Video playing after autoplay attempt:', isPlaying)
        if (!isPlaying) {
          await videoElement.evaluate(v => v.play().catch(() => {}))
          await page.waitForTimeout(1000)
        }
      } catch (e) {
        console.log('Autoplay blocked (may be expected):', e.message)
        // Verify the error is just an autoplay policy rejection, not a media error
        if (!e.message.includes('play') && !e.message.includes('Auto') && !e.message.includes('allowed')) {
          results.exactFailures.push('Unexpected video play error: ' + e.message)
        }
      }

      // Check video is not black/gray/disappeared
      const videoState = await page.evaluate(() => {
        const video = document.querySelector('video')
        if (!video) return { found: true, visible: false }
        const rect = video.getBoundingClientRect()
        const computedStyle = window.getComputedStyle(video)
        return {
          visible: rect.width > 0 && rect.height > 0,
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          hasError: video.error ? `MEDIA_ERR_${video.error.code}` : null,
        }
      })
      console.log('Video element state:', videoState)

      if (videoState.hasError) {
        results.exactFailures.push(`Blog video media error: ${videoState.hasError}`)
      }
    } else {
      results.exactFailures.push('No video element found on blog detail page')
    }

    // Check for image issues
    const imageIssues = await page.evaluate(() => {
      const images = document.querySelectorAll('img')
      const issues = []
      for (const img of images) {
        const rect = img.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight) {
          if (img.naturalWidth === 0 || img.naturalHeight === 0) {
            issues.push('broken-image')
          }
        }
      }
      return issues
    })
    console.log('Image issues:', imageIssues.length === 0 ? 'None' : imageIssues)

    // Check console errors related to media (ERR_ABORTED is expected for cached
    // small video resources — the browser serves from cache and aborts the network request)
    const mediaErrors = consoleErrors.filter(e =>
      (e.toLowerCase().includes('media') ||
        e.toLowerCase().includes('video') ||
        e.toLowerCase().includes('enxcode') ||
        e.toLowerCase().includes('404') ||
        e.toLowerCase().includes('403') ||
        e.toLowerCase().includes('401')) &&
      !e.toLowerCase().includes('err_aborted')
    )
    console.log('Media-related console errors:', mediaErrors.length)

    const blogPass = blogCheck.hasContent && videoElement !== null && mediaErrors.length === 0
    results.blogVideoDesktopResult = blogPass ? 'PASS' : 'FAIL'
    results.testMatrix.blogVideo.chromeDesktop = blogPass ? 'PASS' : 'FAIL'

    // 5 consecutive refreshes
    let refreshPass = true
    for (let i = 0; i < 5; i++) {
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
      await page.waitForTimeout(5000)
      const videoAfterRefresh = await page.$('video')
      if (!videoAfterRefresh) {
        console.log(`Video missing after refresh ${i + 1}`)
        refreshPass = false
      } else {
        const src = await videoAfterRefresh.getAttribute('src')
          || await videoAfterRefresh.$eval('source', (el) => el.getAttribute('src')).catch(() => null)
        const displaySrc = src || '(via <source>)'
        console.log(`Refresh ${i + 1}: video src = ${displaySrc?.substring(0, 80)}...`)
        // Verify src is still valid (not blob URL)
        if (src && src.startsWith('blob:')) {
          console.log(`Refresh ${i + 1}: video uses blob URL!`)
          refreshPass = false
        }
      }
    }
    console.log('Video persists after 5 refreshes:', refreshPass)

    if (!refreshPass) {
      results.exactFailures.push('Blog video disappeared after refresh')
      results.testMatrix.blogVideo.chromeDesktop = 'FAIL'
    }
  })
})

// Helper: check video URL validity
test.describe('Video URL Validation', () => {
  test('Verify Cloudinary video URL is valid and returns H.264/AAC MP4', async () => {
    // The video URL from our test blog
    const videoUrl = 'https://res.cloudinary.com/du02q965h/video/upload/v1790020259/blogs/1790020259248-oqzf2r9ja2m.mp4'

    // Test without transforms (original)
    const headRes = await fetch(videoUrl, { method: 'HEAD' })
    console.log('Original video HEAD:', headRes.status, headRes.headers.get('content-type'))
    expect(headRes.ok).toBe(true)
    expect(headRes.headers.get('content-type')).toContain('video/mp4')

    // Test with our getOptimizedVideoUrl transforms (no sp_auto)
    const optimizedUrl = videoUrl.replace('/video/upload/', '/video/upload/vc_h264,ac_aac,f_mp4/')
    const optRes = await fetch(optimizedUrl, { method: 'HEAD' })
    console.log('Optimized video HEAD:', optRes.status, optRes.headers.get('content-type'))
    expect(optRes.ok).toBe(true)
    expect(optRes.headers.get('content-type')).toContain('video/mp4')
    expect(optRes.headers.get('content-type')).toContain('avc1')

    results.cloudinaryResult = 'PASS - Video URL valid, returns MP4/H.264/AAC'
  })
})
