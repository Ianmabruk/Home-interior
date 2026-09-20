const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';

async function logConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  return errors;
}

async function getVideoInfo(page) {
  return await page.evaluate(() => {
    const video = document.querySelector('video');
    if (!video) return { exists: false };
    return {
      exists: true,
      src: video.src,
      currentSrc: video.currentSrc,
      readyState: video.readyState,
      networkState: video.networkState,
      paused: video.paused,
      muted: video.muted,
      duration: video.duration,
      error: video.error ? video.error.message : null,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
    };
  });
}

test.describe('HOK Interiors Blog Dashboard Tests', () => {
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
    });
  });

  test('TEST 1: Desktop Blog Dashboard - 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE_URL}/blog`);
    await page.waitForLoadState('networkidle');

    // Check search bar exists and is above grid
    const searchInput = page.locator('input[placeholder="Search articles..."]');
    await expect(searchInput).toBeVisible();

    // Check blog grid - should have 3 columns on desktop
    const blogCards = page.locator('article').filter({ has: page.locator('h3') });
    const count = await blogCards.count();
    console.log(`Desktop blog cards found: ${count}`);

    // Check no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    console.log(`Body width: ${bodyWidth}, Viewport: ${viewportWidth}`);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // small tolerance

    // Check for console errors related to blog
    const blogErrors = consoleErrors.filter(e => e.toLowerCase().includes('blog') || e.toLowerCase().includes('video'));
    console.log('Console errors:', consoleErrors);
  });

  test('TEST 2: Mobile Blog Dashboard - 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`${BASE_URL}/blog`);
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder="Search articles..."]');
    await expect(searchInput).toBeVisible();

    // Check blog cards stack vertically
    const blogCards = page.locator('article').filter({ has: page.locator('h3') });
    const count = await blogCards.count();
    console.log(`Mobile blog cards found: ${count}`);

    // Check no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    console.log(`Mobile body width: ${bodyWidth}, Viewport: ${viewportWidth}`);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });

  test('TEST 3 & 4: Open real blog with video - Desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/blog`);
    await page.waitForLoadState('networkidle');

    // Find first blog with video (check for video poster or video element)
    const blogLinks = page.locator('article a[href^="/blog/"]').first();
    await expect(blogLinks).toBeVisible();

    const blogUrl = await blogLinks.getAttribute('href');
    console.log(`Opening blog: ${blogUrl}`);

    await blogLinks.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for video to load

    // Check content order: Image -> Description -> Video -> Images
    const videoElement = page.locator('video');
    const videoExists = await videoElement.count() > 0;
    console.log(`Video element exists: ${videoExists}`);

    if (videoExists) {
      // Get video info
      const videoInfo = await getVideoInfo(page);
      console.log('Video info:', JSON.stringify(videoInfo, null, 2));

      // Check video is visible
      const isVisible = await videoElement.isVisible();
      console.log(`Video is visible: ${isVisible}`);

      // Check video has valid source
      const hasSrc = videoInfo.currentSrc && videoInfo.currentSrc.length > 0;
      console.log(`Video has source: ${hasSrc}`);

      // Check not gray/black rectangle
      const hasDimensions = videoInfo.videoWidth > 0 || videoInfo.videoHeight > 0;
      console.log(`Video has dimensions: ${hasDimensions}`);

      // Check muted
      console.log(`Video muted: ${videoInfo.muted}`);

      // Check paused state
      console.log(`Video paused: ${videoInfo.paused}`);

      // Try clicking play
      await videoElement.click();
      await page.waitForTimeout(1000);

      const videoInfoAfterClick = await getVideoInfo(page);
      console.log('Video info after click:', JSON.stringify(videoInfoAfterClick, null, 2));

      // Video should still exist and be visible
      const stillExists = await page.locator('video').count() > 0;
      const stillVisible = await page.locator('video').isVisible();
      console.log(`Video still exists: ${stillExists}, still visible: ${stillVisible}`);
    }

    // Check content order
    const sections = await page.locator('article, section').all();
    console.log(`Page sections count: ${sections.length}`);
  });

  test('TEST 5: Mobile Video Test - 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/blog`);
    await page.waitForLoadState('networkidle');

    const blogLinks = page.locator('article a[href^="/blog/"]').first();
    const blogUrl = await blogLinks.getAttribute('href');
    await blogLinks.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const videoElement = page.locator('video');
    const videoExists = await videoElement.count() > 0;
    console.log(`Mobile video exists: ${videoExists}`);

    if (videoExists) {
      const videoInfo = await getVideoInfo(page);
      console.log('Mobile video info:', JSON.stringify(videoInfo, null, 2));

      // Wait and observe
      await page.waitForTimeout(5000);

      const videoInfoAfter = await getVideoInfo(page);
      console.log('Mobile video info after wait:', JSON.stringify(videoInfoAfter, null, 2));

      // Try manual play
      await videoElement.click();
      await page.waitForTimeout(2000);

      const videoInfoAfterClick = await getVideoInfo(page);
      console.log('Mobile video info after click:', JSON.stringify(videoInfoAfterClick, null, 2));

      const stillVisible = await videoElement.isVisible();
      console.log(`Mobile video still visible: ${stillVisible}`);
    }
  });

  test('TEST 6 & 7: Network and Video Element Check', async ({ page }) => {
    const videoRequests = [];
    const failedRequests = [];

    page.on('request', request => {
      if (request.resourceType() === 'media' || request.url().includes('.mp4') || request.url().includes('cloudinary.com/video')) {
        videoRequests.push({
          url: request.url(),
          method: request.method(),
        });
      }
    });

    page.on('response', response => {
      if (response.request().resourceType() === 'media' || response.url().includes('.mp4') || response.url().includes('cloudinary.com/video')) {
        videoRequests.push({
          url: response.url(),
          status: response.status(),
          contentType: response.headers()['content-type'],
        });
      }
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/blog`);
    await page.waitForLoadState('networkidle');

    const blogLinks = page.locator('article a[href^="/blog/"]').first();
    await blogLinks.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('Video requests:', JSON.stringify(videoRequests, null, 2));
    console.log('Failed requests:', JSON.stringify(failedRequests, null, 2));

    const videoInfo = await getVideoInfo(page);
    console.log('Final video info:', JSON.stringify(videoInfo, null, 2));
  });

  test('TEST 8: Console Errors Check', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/blog`);
    await page.waitForLoadState('networkidle');

    const blogLinks = page.locator('article a[href^="/blog/"]').first();
    await blogLinks.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const videoErrors = consoleErrors.filter(e =>
      e.toLowerCase().includes('video') ||
      e.toLowerCase().includes('media') ||
      e.toLowerCase().includes('cloudinary') ||
      e.toLowerCase().includes('cors') ||
      e.toLowerCase().includes('autoplay') ||
      e.toLowerCase().includes('codec') ||
      e.toLowerCase().includes('source')
    );

    console.log('All console errors:', consoleErrors);
    console.log('Video-related errors:', videoErrors);
  });

  test('TEST 9: Cloudinary URL Direct Test', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/blog`);
    await page.waitForLoadState('networkidle');

    const blogLinks = page.locator('article a[href^="/blog/"]').first();
    await blogLinks.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const videoInfo = await getVideoInfo(page);
    console.log('Video src for direct test:', videoInfo.currentSrc);

    if (videoInfo.currentSrc && videoInfo.currentSrc.includes('cloudinary.com')) {
      // Open video URL directly
      const videoPage = await page.context().newPage();
      await videoPage.goto(videoInfo.currentSrc);
      await videoPage.waitForLoadState('networkidle');
      await videoPage.waitForTimeout(3000);

      const directVideoInfo = await videoPage.evaluate(() => {
        const v = document.querySelector('video');
        if (!v) return { exists: false };
        return {
          exists: true,
          src: v.src,
          readyState: v.readyState,
          networkState: v.networkState,
          paused: v.paused,
          duration: v.duration,
          error: v.error ? v.error.message : null,
        };
      });

      console.log('Direct Cloudinary video test:', JSON.stringify(directVideoInfo, null, 2));
      await videoPage.close();
    }
  });
});