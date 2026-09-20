# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-blog.spec.cjs >> HOK Interiors Blog Dashboard Tests >> TEST 9: Cloudinary URL Direct Test
- Location: test-blog.spec.cjs:266:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForLoadState: Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e6]:
      - link "HOK Interiors - Home" [ref=e7] [cursor=pointer]:
        - /url: /
      - navigation "Main navigation" [ref=e10]:
        - generic [ref=e11]:
          - button "Shopping cart" [ref=e13] [cursor=pointer]
          - menu "User menu" [ref=e18]:
            - button "User menu" [ref=e19] [cursor=pointer]
  - main [ref=e25]:
    - main [ref=e26]:
      - generic [ref=e27]:
        - img "hetu" [ref=e30]
        - link "Back to Blog" [ref=e33] [cursor=pointer]:
          - /url: /blog
      - article [ref=e36]:
        - generic [ref=e37]:
          - generic [ref=e38]:
            - generic [ref=e39]: Color
            - heading "hetu" [level=1] [ref=e40]
            - generic [ref=e41]:
              - generic [ref=e42]: esther
              - time [ref=e46]: September 17, 2026
              - generic [ref=e49]: 1 min read
              - generic [ref=e53]: 13 views
            - generic [ref=e57]: luxury
          - paragraph [ref=e63]:
            - generic [ref=e64]: hujikoltrfedbunhjmi,ktgrfedwuhnjmi,ktg
          - generic [ref=e65]: Your browser does not support the video tag.
          - img "hetu — gallery 1" [ref=e70]
          - generic [ref=e71]:
            - paragraph [ref=e72]: Share this article
            - generic [ref=e73]:
              - button "Share" [ref=e74] [cursor=pointer]
              - link "Share on Facebook" [ref=e81] [cursor=pointer]:
                - /url: https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Flocalhost%3A5173%2Fblog%2Fh
              - link "Share on Twitter" [ref=e84] [cursor=pointer]:
                - /url: https://twitter.com/intent/tweet?url=http%3A%2F%2Flocalhost%3A5173%2Fblog%2Fh&text=hetu
              - link "Share on LinkedIn" [ref=e87] [cursor=pointer]:
                - /url: https://www.linkedin.com/sharing/share-offsite/?url=http%3A%2F%2Flocalhost%3A5173%2Fblog%2Fh
              - link "Share on Pinterest" [ref=e92] [cursor=pointer]:
                - /url: https://pinterest.com/pin/create/button/?url=http%3A%2F%2Flocalhost%3A5173%2Fblog%2Fh&description=hetu
              - button "Copy link" [ref=e95] [cursor=pointer]
          - generic [ref=e99]:
            - paragraph [ref=e100]: Explore more from HOK Interiors
            - generic [ref=e101]:
              - link "View Portfolio" [ref=e102] [cursor=pointer]:
                - /url: /portfolio
              - link "Our Services" [ref=e103] [cursor=pointer]:
                - /url: /services
              - link "Start a Project" [ref=e104] [cursor=pointer]:
                - /url: /contact
  - contentinfo [ref=e105]:
    - generic [ref=e107]:
      - link "HOK Interiors - Home" [ref=e109] [cursor=pointer]:
        - /url: /
        - paragraph [ref=e110]: HOK Interiors
      - generic [ref=e111]:
        - heading "Join Mailing List" [level=3] [ref=e112]
        - paragraph [ref=e113]: Subscribe to receive the latest updates and offers.
        - generic [ref=e114]:
          - textbox "Email Address" [ref=e115]
          - button "Join Mailing List" [ref=e116] [cursor=pointer]
      - generic [ref=e117]:
        - heading "Get in Touch" [level=3] [ref=e118]
        - generic [ref=e119]:
          - paragraph [ref=e120]:
            - generic [aria-hidden] [ref=e121]: 📞
            - link "07-23-05-74-87" [ref=e122] [cursor=pointer]:
              - /url: tel:+254723057487
          - paragraph [ref=e123]:
            - generic [aria-hidden] [ref=e124]: ✉
            - link "info@hokinteriors.co.ke" [ref=e125] [cursor=pointer]:
              - /url: mailto:info@hokinteriors.co.ke
      - generic [ref=e126]:
        - heading "Follow Us" [level=3] [ref=e127]
        - generic [ref=e128]:
          - link "Follow us on TikTok" [ref=e129] [cursor=pointer]:
            - /url: https://www.tiktok.com/@esther.k.musa?_r=1&_t=ZS-98PsIlPUwey
          - link "Follow us on Instagram" [ref=e133] [cursor=pointer]:
            - /url: https://www.instagram.com/hokinteriors?igsh=OG1tZ2xuOG9mMWRl&utm_source=qr
          - link "Follow us on Facebook" [ref=e137] [cursor=pointer]:
            - /url: https://www.facebook.com/profile.php?id=61589240250994
          - link "Follow us on Pinterest" [ref=e141] [cursor=pointer]:
            - /url: https://pin.it/47AUIIl9v
      - paragraph [ref=e146]: © 2026 HOK INTERIOR DESIGNS. All rights reserved.
```

# Test source

```ts
  183 |       console.log('Mobile video info after wait:', JSON.stringify(videoInfoAfter, null, 2));
  184 | 
  185 |       // Try manual play
  186 |       await videoElement.click();
  187 |       await page.waitForTimeout(2000);
  188 | 
  189 |       const videoInfoAfterClick = await getVideoInfo(page);
  190 |       console.log('Mobile video info after click:', JSON.stringify(videoInfoAfterClick, null, 2));
  191 | 
  192 |       const stillVisible = await videoElement.isVisible();
  193 |       console.log(`Mobile video still visible: ${stillVisible}`);
  194 |     }
  195 |   });
  196 | 
  197 |   test('TEST 6 & 7: Network and Video Element Check', async ({ page }) => {
  198 |     const videoRequests = [];
  199 |     const failedRequests = [];
  200 | 
  201 |     page.on('request', request => {
  202 |       if (request.resourceType() === 'media' || request.url().includes('.mp4') || request.url().includes('cloudinary.com/video')) {
  203 |         videoRequests.push({
  204 |           url: request.url(),
  205 |           method: request.method(),
  206 |         });
  207 |       }
  208 |     });
  209 | 
  210 |     page.on('response', response => {
  211 |       if (response.request().resourceType() === 'media' || response.url().includes('.mp4') || response.url().includes('cloudinary.com/video')) {
  212 |         videoRequests.push({
  213 |           url: response.url(),
  214 |           status: response.status(),
  215 |           contentType: response.headers()['content-type'],
  216 |         });
  217 |       }
  218 |       if (response.status() >= 400) {
  219 |         failedRequests.push({
  220 |           url: response.url(),
  221 |           status: response.status(),
  222 |         });
  223 |       }
  224 |     });
  225 | 
  226 |     await page.setViewportSize({ width: 1440, height: 900 });
  227 |     await page.goto(`${BASE_URL}/blog`);
  228 |     await page.waitForLoadState('networkidle');
  229 | 
  230 |     const blogLinks = page.locator('article a[href^="/blog/"]').first();
  231 |     await blogLinks.click();
  232 |     await page.waitForLoadState('networkidle');
  233 |     await page.waitForTimeout(3000);
  234 | 
  235 |     console.log('Video requests:', JSON.stringify(videoRequests, null, 2));
  236 |     console.log('Failed requests:', JSON.stringify(failedRequests, null, 2));
  237 | 
  238 |     const videoInfo = await getVideoInfo(page);
  239 |     console.log('Final video info:', JSON.stringify(videoInfo, null, 2));
  240 |   });
  241 | 
  242 |   test('TEST 8: Console Errors Check', async ({ page }) => {
  243 |     await page.setViewportSize({ width: 1440, height: 900 });
  244 |     await page.goto(`${BASE_URL}/blog`);
  245 |     await page.waitForLoadState('networkidle');
  246 | 
  247 |     const blogLinks = page.locator('article a[href^="/blog/"]').first();
  248 |     await blogLinks.click();
  249 |     await page.waitForLoadState('networkidle');
  250 |     await page.waitForTimeout(3000);
  251 | 
  252 |     const videoErrors = consoleErrors.filter(e =>
  253 |       e.toLowerCase().includes('video') ||
  254 |       e.toLowerCase().includes('media') ||
  255 |       e.toLowerCase().includes('cloudinary') ||
  256 |       e.toLowerCase().includes('cors') ||
  257 |       e.toLowerCase().includes('autoplay') ||
  258 |       e.toLowerCase().includes('codec') ||
  259 |       e.toLowerCase().includes('source')
  260 |     );
  261 | 
  262 |     console.log('All console errors:', consoleErrors);
  263 |     console.log('Video-related errors:', videoErrors);
  264 |   });
  265 | 
  266 |   test('TEST 9: Cloudinary URL Direct Test', async ({ page }) => {
  267 |     await page.setViewportSize({ width: 1440, height: 900 });
  268 |     await page.goto(`${BASE_URL}/blog`);
  269 |     await page.waitForLoadState('networkidle');
  270 | 
  271 |     const blogLinks = page.locator('article a[href^="/blog/"]').first();
  272 |     await blogLinks.click();
  273 |     await page.waitForLoadState('networkidle');
  274 |     await page.waitForTimeout(2000);
  275 | 
  276 |     const videoInfo = await getVideoInfo(page);
  277 |     console.log('Video src for direct test:', videoInfo.currentSrc);
  278 | 
  279 |     if (videoInfo.currentSrc && videoInfo.currentSrc.includes('cloudinary.com')) {
  280 |       // Open video URL directly
  281 |       const videoPage = await page.context().newPage();
  282 |       await videoPage.goto(videoInfo.currentSrc);
> 283 |       await videoPage.waitForLoadState('networkidle');
      |                       ^ Error: page.waitForLoadState: Test timeout of 30000ms exceeded.
  284 |       await videoPage.waitForTimeout(3000);
  285 | 
  286 |       const directVideoInfo = await videoPage.evaluate(() => {
  287 |         const v = document.querySelector('video');
  288 |         if (!v) return { exists: false };
  289 |         return {
  290 |           exists: true,
  291 |           src: v.src,
  292 |           readyState: v.readyState,
  293 |           networkState: v.networkState,
  294 |           paused: v.paused,
  295 |           duration: v.duration,
  296 |           error: v.error ? v.error.message : null,
  297 |         };
  298 |       });
  299 | 
  300 |       console.log('Direct Cloudinary video test:', JSON.stringify(directVideoInfo, null, 2));
  301 |       await videoPage.close();
  302 |     }
  303 |   });
  304 | });
```