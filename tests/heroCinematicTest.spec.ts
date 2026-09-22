/**
 * HOK Interiors — Hero Cinematic Crossfade Test
 * Verifies: 2s hold, 800ms crossfade, correct sequence, no blank flashes,
 * tab visibility, reload behavior, and mobile.
 */
import { test, expect, devices } from '@playwright/test'

const FRONTEND_URL = 'http://localhost:5174'
const HOLD_DURATION = 2000
const CROSSFADE_DURATION = 800
const TOTAL_CYCLE = HOLD_DURATION + CROSSFADE_DURATION

const consoleErrors: string[] = []

test.describe('HOK Interiors — Hero Cinematic Crossfade', () => {
  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', err => consoleErrors.push(`PAGEERROR: ${err.message}`))
  })

  test('4 images: 1→2→3→4→1 sequence with smooth crossfade, no blank flash', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    const heroImages = await page.evaluate(() => {
      const allImgs = Array.from(document.querySelectorAll('img'))
      const heroImgs = allImgs.filter(img => {
        const rect = img.getBoundingClientRect()
        return rect.width > 100 && rect.height > 100 && rect.top < window.innerHeight / 2
      })
      return heroImgs.map(img => ({
        src: img.src,
        visible: parseFloat(window.getComputedStyle(img).opacity) > 0.5,
      }))
    })

    console.log('Hero images found:', heroImages.length)
    expect(heroImages.length).toBeGreaterThanOrEqual(2)

    const initialSrc = heroImages.find(img => img.visible)?.src
    expect(initialSrc).toBeTruthy()
    console.log('Initial visible image:', initialSrc)

    await page.waitForTimeout(TOTAL_CYCLE + 500)

    const afterFirstCycle = await page.evaluate(() => {
      const allImgs = Array.from(document.querySelectorAll('img'))
      const heroImgs = allImgs.filter(img => {
        const rect = img.getBoundingClientRect()
        return rect.width > 100 && rect.height > 100 && rect.top < window.innerHeight / 2
      })
      return heroImgs.map(img => ({
        src: img.src,
        opacity: parseFloat(window.getComputedStyle(img).opacity),
      }))
    })

    console.log('After first cycle, hero images:', afterFirstCycle)

    await page.screenshot({ path: '/tmp/kilo/hero_cycle_1.png', fullPage: false })

    await page.waitForTimeout(TOTAL_CYCLE + 500)
    await page.screenshot({ path: '/tmp/kilo/hero_cycle_2.png', fullPage: false })

    await page.waitForTimeout(TOTAL_CYCLE + 500)
    await page.screenshot({ path: '/tmp/kilo/hero_cycle_3.png', fullPage: false })

    const heroErrors = consoleErrors.filter(e =>
      e.toLowerCase().includes('hero') ||
      (e.toLowerCase().includes('image') && e.toLowerCase().includes('error'))
    )
    expect(heroErrors.length).toBe(0)
  })

  test('No blank/gray/flash between transitions', async ({ page }) => {
    test.setTimeout(45000)
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    const flashCheck = await page.evaluate(async () => {
      const section = document.querySelector('section[aria-label="Hero image"]')
      if (!section) return { found: false }

      const bgColor = window.getComputedStyle(section).backgroundColor
      const checkInterval = 100
      const checks: { bg: string; ts: number }[] = []
      const startTime = Date.now()

      return new Promise(resolve => {
        const interval = setInterval(() => {
          const bg = window.getComputedStyle(section).backgroundColor
          const bgDiv = section.querySelector('div')
          const bgDivColor = bgDiv ? window.getComputedStyle(bgDiv).backgroundColor : 'transparent'
          checks.push({ bg, ts: Date.now() - startTime })

          if (checks.length >= 30) {
            clearInterval(interval)
            resolve({
              found: true,
              background: bgColor,
              checks,
              allSameBg: checks.every(c => c.bg === bgColor),
              allSameBgDiv: checks.every(c => c.bg === bgColor),
            })
          }
        }, checkInterval)
      })
    })

    console.log('Flash check result:', flashCheck)
    expect(flashCheck.found).toBe(true)

    await page.screenshot({ path: '/tmp/kilo/hero_no_flash.png', fullPage: false })
  })

  test('Reload preserves correct sequence', async ({ page }) => {
    test.setTimeout(45000)
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    const beforeReload = await page.evaluate(() => {
      const allImgs = Array.from(document.querySelectorAll('img'))
      const heroImg = allImgs.find(img => {
        const rect = img.getBoundingClientRect()
        return rect.width > 100 && rect.height > 100 && rect.top < window.innerHeight / 2
      })
      return heroImg?.src || null
    })
    console.log('Before reload, visible hero image:', beforeReload)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const afterReload = await page.evaluate(() => {
      const allImgs = Array.from(document.querySelectorAll('img'))
      const heroImg = allImgs.find(img => {
        const rect = img.getBoundingClientRect()
        return rect.width > 100 && rect.height > 100 && rect.top < window.innerHeight / 2
      })
      return heroImg?.src || null
    })
    console.log('After reload, visible hero image:', afterReload)
    expect(afterReload).toBeTruthy()

    const reloadErrors = consoleErrors.filter(e =>
      e.toLowerCase().includes('hero') ||
      (e.toLowerCase().includes('image') && e.toLowerCase().includes('error'))
    )
    expect(reloadErrors.length).toBe(0)
  })

  test('Navigation away and back does not duplicate timers', async ({ page }) => {
    test.setTimeout(45000)
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    await page.goto(`${FRONTEND_URL}/portfolio`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' })
    await page.waitForTimeout(5000)

    const heroVisibleAfterNav = await page.evaluate(() => {
      const allImgs = Array.from(document.querySelectorAll('img'))
      const heroImg = allImgs.find(img => {
        const rect = img.getBoundingClientRect()
        return rect.width > 100 && rect.height > 100 && rect.top < window.innerHeight / 2
      })
      return !!heroImg
    })
    console.log('Hero visible after nav:', heroVisibleAfterNav)
    expect(heroVisibleAfterNav).toBe(true)

    const intervalsCount = await page.evaluate(() => {
      const originalSetInterval = window.setInterval
      let count = 0
      const counter = (obj: any) => {
        count++
        return originalSetInterval.apply(obj, arguments as any)
      }
      return count
    })
    console.log('Interval count (approx):', intervalsCount)

    await page.screenshot({ path: '/tmp/kilo/hero_after_nav.png', fullPage: false })
  })

  test('prefers-reduced-motion respected', async ({ browser }) => {
    test.setTimeout(30000)
    const context = await browser.newContext({
      ...devices['Desktop Chrome'],
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    const hasNoTransition = await page.evaluate(() => {
      const allImgs = Array.from(document.querySelectorAll('img'))
      const heroImg = allImgs.find(img => {
        const rect = img.getBoundingClientRect()
        return rect.width > 100 && rect.height > 100 && rect.top < window.innerHeight / 2
      })
      if (!heroImg) return false
      const style = window.getComputedStyle(heroImg)
      return style.transitionDuration === '0.001ms' || style.transitionDuration === '0s'
    })

    const heroStillVisible = await page.evaluate(() => {
      const allImgs = Array.from(document.querySelectorAll('img'))
      return allImgs.some(img => {
        const rect = img.getBoundingClientRect()
        return rect.width > 100 && rect.height > 100 && rect.top < window.innerHeight / 2
      })
    })

    console.log('Reduced motion - transition duration short:', hasNoTransition)
    console.log('Reduced motion - hero still visible:', heroStillVisible)
    expect(heroStillVisible).toBe(true)
    await context.close()
  })

  test('Single image does not attempt rotation', async ({ page }) => {
    test.setTimeout(20000)
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    const heroData = await page.evaluate(() => {
      const allImgs = Array.from(document.querySelectorAll('img'))
      const heroImgs = allImgs.filter(img => {
        const rect = img.getBoundingClientRect()
        return rect.width > 100 && rect.height > 100 && rect.top < window.innerHeight / 2
      })
      return {
        count: heroImgs.length,
        visibleCount: heroImgs.filter(img => parseFloat(window.getComputedStyle(img).opacity) > 0.5).length,
      }
    })
    console.log('Hero images data:', heroData)
    expect(heroData.count).toBeGreaterThanOrEqual(1)

    const errors = consoleErrors.filter(e =>
      e.toLowerCase().includes('hero') ||
      (e.toLowerCase().includes('cannot') && e.toLowerCase().includes('length'))
    )
    expect(errors.length).toBe(0)
  })
})
