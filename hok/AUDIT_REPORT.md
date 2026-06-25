# Homepage Loading Performance Audit Report

**Date:** 2026-06-25  
**Auditor:** Kilo (Performance Engineering)  
**Scope:** Full-stack homepage loading analysis  
**Project:** HOK Interior Designs  

---

## Executive Summary

The homepage suffers from **redundant API calls, missing cache headers, Supabase URL resolution bugs, and unoptimized media delivery**. The root cause of all 8 reported issues traces back to: (1) no HTTP caching on backend responses, (2) Supabase media URLs breaking when env vars are missing, (3) HeroProjectShowcase making duplicate portfolio fetches, and (4) video delivery using raw progressive download instead of streaming.

---

## Phase 1 — Detailed Findings

### 1. Redundant API Calls on Homepage Load

| Caller | Endpoint | Query Key | Trigger |
|--------|----------|-----------|---------|
| `Home.jsx` | `/api/portfolio` | `['portfolio']` | `usePortfolio()` |
| `HeroProjectShowcase.jsx` | `/api/projects` | (no React Query key) | `projectsApi.getAll()` on mount |
| `HeroProjectShowcase.jsx` | `/api/portfolio` | (no React Query key) | `portfolioApi.getAll()` fallback |
| `HeroProjectShowcase.jsx` | `/api/before-after` | (no React Query key) | `beforeAfterApi.getAll()` fallback |
| `Home.jsx` | `/api/site-settings/about` | `['site-settings','about']` | `useAbout()` |
| `Home.jsx` | `/api/site-settings/category-showcase` | `['site-settings','category-showcase']` | `useCategoryShowcase()` |
| `Home.jsx` | `/api/products` | `['products',...]` | `useProducts({limit:48})` |
| `useCategoryShowcaseSettings.js` | `/api/site-settings/category-showcase` | (direct `siteSettingsApi.getCategoryShowcase()`) | useEffect on mount |

**Impact:** On homepage load, **7–8 API requests** fire simultaneously. `/api/portfolio` is fetched at least twice. `/api/projects` is fetched once but combines 3 table queries server-side. Render cold starts add 5–30s latency per request.

### 2. Cache-Control Headers Missing on All API Routes

**Files:** `HOK-backend/routes/*.py`, `HOK-backend/app.py`  
**Severity:** CRITICAL

No route sets `Cache-Control`, `ETag`, or `Last-Modified` headers. Every browser request hits the backend, even for static public data like portfolio, site-settings, and products. Render's free tier has cold starts; without caching, every reload after inactivity waits 5–30s for the server to wake up.

### 3. Supabase Media URL Resolution Bug

**File:** `interior/src/services/supabase.js:57-73`  
**Severity:** CRITICAL

```javascript
export function resolveStorageUrl(path, bucket = SUPABASE_MEDIA_BUCKET) {
  const rawPath = String(path || '').trim()
  if (!rawPath) return ''
  if (/^(data:|blob:)/i.test(rawPath)) return rawPath
  if (/^https?:\/\//i.test(rawPath)) return rawPath
  const normalizedPath = normalizeStoragePath(rawPath, bucket)
  if (!normalizedPath) return ''
  if (LEGACY_MEDIA_PUBLIC_URL) {
    return `${LEGACY_MEDIA_PUBLIC_URL}/${normalizedPath}`
  }
  const supabaseUrl = SUPABASE_URL || ''
  if (supabaseUrl) {
    return `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${bucket}/${normalizedPath}`
  }
  return normalizedPath  // <-- BUG: returns relative path when SUPABASE_URL is empty
}
```

When `VITE_SUPABASE_URL` is not set (or empty), `resolveStorageUrl` returns a relative path like `media/images/abc.jpg`. The browser cannot resolve this, so **all Supabase-stored media fails to load**. This explains the About section image disappearing and portfolio images vanishing after refresh when the frontend env is misconfigured.

### 4. Hero Video Loading Optimization Failures

**File:** `interior/src/components/showcase/HeroProjectShowcase.jsx`  
**Severity:** HIGH

- **`preload="auto"`** (line 459): Instructs browser to download the entire video file. For a 50MB+ Cloudinary video, this blocks the page and can take 2+ minutes on slow connections.
- **No HLS/DASH adaptive streaming:** Videos are delivered as raw MP4/WebM. No `sp=auto` streaming profile is applied to hero MP4 URLs (only in `getAdaptiveVideoSources` for WebM fallback).
- **`getAdaptiveVideoSources` inconsistency:** Adds `q=auto,w=1080,vc=auto` but omits `sp=auto`, `co=auto`, and `f=auto` that `optimizeCloudinaryUrl` would add.
- **`VIDEO_FIRST_FRAME_TIMEOUT_MS = 2000`** (line 8): If video hasn't loaded first frame in 2s, it marks video as ready and shows poster — but the video download continues in the background, consuming bandwidth.
- **Random rotation interval** (25–30s): Videos switch frequently, causing repeated network requests.
- **No retry logic:** If a video fails to load, it stays failed until the next rotation.

### 5. Portfolio Image Disappearance After Refresh

**Files:** `interior/src/pages/Home.jsx:68-89`, `interior/src/hooks/api/usePortfolio.js`  
**Severity:** HIGH

Root causes:
1. **`staleTime: 15 * 1000`** in `usePortfolio` (15 seconds). After 15s, React Query considers data stale and refetches. If the refetch hits a cold Render instance or network blip, it may return empty array or error. `placeholderData` shows previous data during loading, but once the refetch completes with empty data, images vanish.
2. **`normalizePortfolioProject` filters aggressively:**
   ```javascript
   .filter((p) => p.id && (p.image || p.video))
   ```
   If `image_url` is an empty string (common after partial DB updates), `firstMediaUrl` returns `''`, and the project is filtered out.
3. **`firstMediaUrl` returns empty string for falsy values:** If `project.image_url` is `''`, `project.media_public_id` is checked next, but if that's also missing, the result is `''`.
4. **Cache clearing on admin events:** `Home.jsx` line 206 calls `clearApiCache('portfolio')` then `queryClient.invalidateQueries({ queryKey: ['portfolio'] })`. This forces an immediate refetch. During the refetch window, if the user has `placeholderData` from a previous session, it shows old data, but if the refetch fails, the query enters an error state.

### 6. About Section Image Failure

**File:** `interior/src/pages/About.jsx:73`  
**Severity:** MEDIUM

```javascript
const imageUrl = hasValidImage(about) ? getOptimizedImageUrl(about.imageUrl, 900) : null
```

If `about.imageUrl` is stored as a Supabase path (e.g., `media/images/about.jpg`) and `VITE_SUPABASE_URL` is missing:
1. `resolveStorageUrl` returns the relative path
2. `getOptimizedImageUrl` calls `optimizeCloudinaryUrl` which returns the path as-is (no Cloudinary domain)
3. Browser tries to load `https://hok-interior.netlify.app/media/images/about.jpg` — **404**
4. `handleImageError` tries the Unsplash fallback, but if that also fails (network issue), the image disappears entirely

### 7. Race Conditions in Data Fetching

**Files:** `interior/src/components/showcase/HeroProjectShowcase.jsx:194-244`, `interior/src/pages/Home.jsx:199-202`  
**Severity:** MEDIUM

- `HeroProjectShowcase` and `Home.jsx` fetch portfolio data independently with no shared state
- `HeroProjectShowcase.loadProjects` uses `AbortController` but doesn't coordinate with React Query
- If `HeroProjectShowcase` finishes loading after `Home.jsx`'s portfolio query, there's a brief visual flash where portfolio data appears to "reset"
- The `admin:data-changed` event triggers cache clear in both components independently, causing sequential rather than parallel invalidation

### 8. Inconsistent Cloudinary URL Generation

**Files:** `interior/src/utils/mediaUrl.js`, `interior/src/components/showcase/HeroProjectShowcase.jsx:124-160`  
**Severity:** MEDIUM

Duplicated logic:
- `mediaUrl.js` has `optimizeCloudinaryUrl`, `getWebMUrl`, `getOptimizedImageUrl`
- `HeroProjectShowcase.jsx` has its own `generateWebMUrl`, `generateMp4Url`, `getAdaptiveVideoSources`

`getAdaptiveVideoSources` (HeroProjectShowcase) vs `optimizeCloudinaryUrl` (mediaUrl):
| Param | mediaUrl.js | HeroProjectShowcase.jsx |
|-------|------------|------------------------|
| `f=auto` | ✅ (images only) | ❌ (MP4) |
| `q=auto` | ✅ | ✅ |
| `w=1080` | ✅ (if width>0) | ✅ |
| `vc=auto` | ✅ (videos) | ✅ |
| `sp=auto` | ✅ (videos) | ❌ |
| `co=auto` | ✅ (videos) | ❌ |
| `fl=progressive` | ✅ (images) | ❌ |

This inconsistency means hero videos miss streaming profiles and codec optimization that other media URLs receive.

### 9. Backend `/api/projects` Endpoint Performance

**File:** `HOK-backend/routes/projects.py:37-147`  
**Severity:** MEDIUM

The `/api/projects` endpoint:
1. Queries `BeforeAfterProject` table
2. Queries `PortfolioProject` table  
3. Queries `VirtualProject` table
4. Maps all results to dicts in Python
5. Sorts combined list by `created_at`

This is **3 sequential queries + Python-level serialization**. On Render with cold starts, this can take 2–5s. No server-side caching, no query result pagination (returns ALL records).

### 10. Missing Environment Variable Validation

**File:** `interior/src/services/supabase.js:13-15`  
**Severity:** MEDIUM

```javascript
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables not configured')
}
```

Only a console warning is emitted. The app continues to run with broken media URLs. No fallback to Cloudinary or direct URLs is attempted.

### 11. SendGrid Keys in Frontend .env

**File:** `interior/.env:7-9`  
**Severity:** LOW (Current behavior is safe, but risky)

```
SENDGRID_API_KEY=SG.K8SnZ2EZSS-wW_pcv9EeYg...
FROM_EMAIL=ianmabruk3@gmail.com
EMAIL_FROM_NAME=HOK Interior Designs
```

Vite only bundles `VITE_*` prefixed variables, so these are NOT exposed to the browser. However, storing backend secrets in the frontend `.env` is confusing and risks accidental exposure if someone adds a `VITE_` prefix. The backend reads these via `python-dotenv` from the same file.

---

## Phase 2 — Root Cause Analysis

### Primary Root Causes

| # | Root Cause | Affects Issues |
|---|-----------|---------------|
| 1 | **No HTTP caching on backend API responses** | 1, 4, 5, 6 |
| 2 | **`resolveStorageUrl` returns relative path when `SUPABASE_URL` is empty** | 3, 5, 6 |
| 3 | **HeroProjectShowcase makes duplicate portfolio/before-after fetches** | 1, 4 |
| 4 | **Videos use `preload="auto"` without adaptive streaming** | 1 |
| 5 | **`usePortfolio` staleTime is 15s, causing aggressive refetches** | 2, 5 |
| 6 | **No Cache-Control headers on Cloudinary URLs from backend** | 1, 4 |
| 7 | **Inconsistent Cloudinary optimization between mediaUrl.js and HeroProjectShowcase.jsx** | 1, 4 |

### Issue-to-File Mapping

| Issue | Primary File(s) | Secondary File(s) |
|-------|-----------------|-------------------|
| Hero videos slow | `HeroProjectShowcase.jsx`, `mediaUrl.js` | `api.js`, `media_storage.py` |
| Portfolio images vanish | `Home.jsx`, `usePortfolio.js` | `api.js`, `portfolio.py` |
| About image fails | `About.jsx`, `supabase.js` | `.env` |
| Partial homepage load | `Home.jsx`, `HeroProjectShowcase.jsx` | `api.js`, `main.jsx` |
| Inconsistent loading | `api.js`, `usePortfolio.js` | `useSiteSettings.js` |
| Cloudinary integration | `mediaUrl.js`, `HeroProjectShowcase.jsx` | `media_storage.py` |
| SendGrid integration | `email_service.py` | `config.py`, `.env` |

---

## Phase 3 — Recommended Fixes (Priority Order)

### P0 — CRITICAL (Implement Immediately)

1. **Fix `resolveStorageUrl` to never return relative paths**
   - File: `interior/src/services/supabase.js`
   - If `SUPABASE_URL` is missing, fall back to Cloudinary direct URL or throw a clear error
   - Add runtime validation in `mediaValidation.js`

2. **Add `Cache-Control` headers to all public API routes**
   - Files: `HOK-backend/routes/portfolio.py`, `projects.py`, `site_settings.py`, `products.py`, `before_after.py`
   - Add `@app.after_request` handler or blueprint-level `@bp.after_request`
   - Set `Cache-Control: public, max-age=300, stale-while-revalidate=60` for public GET routes

3. **Eliminate duplicate portfolio fetch in HeroProjectShowcase**
   - File: `interior/src/components/showcase/HeroProjectShowcase.jsx`
   - Share React Query cache with `Home.jsx` by using the same query key `['portfolio']` or accept portfolio data as a prop
   - Remove the `projectsApi.getAll()` → `portfolioApi.getAll()` fallback chain; use a single `/api/projects` call with longer timeout

### P1 — HIGH (Implement Within 24h)

4. **Increase `usePortfolio` staleTime and add retry logic**
   - File: `interior/src/hooks/api/usePortfolio.js`
   - Change `staleTime` from `15 * 1000` to `5 * 60 * 1000`
   - Add `retry: 2` and `retryDelay: exponential`
   - Use `keepPreviousData: true` instead of `placeholderData`

5. **Optimize hero video delivery**
   - File: `interior/src/components/showcase/HeroProjectShowcase.jsx`
   - Change `preload="auto"` to `preload="metadata"`
   - Add `sp=auto` (streaming profile) to Cloudinary video URLs
   - Increase `VIDEO_FIRST_FRAME_TIMEOUT_MS` from 2000 to 5000
   - Add `loading="lazy"` to offscreen videos

6. **Unify Cloudinary URL optimization**
   - File: `interior/src/utils/mediaUrl.js`
   - Export a single `getCloudinaryVideoUrl(url, width)` function
   - Replace inline URL manipulation in `HeroProjectShowcase.jsx` with calls to the unified function

### P2 — MEDIUM (Implement Within 1 Week)

7. **Add backend response compression**
   - File: `HOK-backend/app.py`
   - Add `flask-compress` middleware for gzip/brotli compression

8. **Add React Query deduplication for homepage data**
   - File: `interior/src/pages/Home.jsx`
   - Use `useQueries` or a single batched endpoint to reduce waterfall requests

9. **Add retry with exponential backoff for media loads**
   - Files: `Home.jsx`, `About.jsx`
   - Implement `useMediaWithRetry` hook that retries failed images/videos up to 3 times

10. **Move SendGrid env vars to backend-only .env**
    - File: `HOK-backend/.env` (create if missing)
    - Remove from `interior/.env` to avoid confusion

### P3 — LOW (Nice to Have)

11. **Add service worker for offline media caching**
12. **Add Web Vitals monitoring**
13. **Add skeleton loaders for HeroProjectShowcase**
14. **Implement HLS.js for adaptive video streaming**

---

## Phase 4 — Validation Checklist

### Performance Metrics

| Metric | Target | Current (Estimated) | Measurement Method |
|--------|--------|---------------------|-------------------|
| **Homepage Load Time (LCP)** | < 2.5s | 4–8s | Lighthouse / Web Vitals |
| **First Contentful Paint** | < 1.2s | 2–4s | Lighthouse |
| **API Response Time (avg)** | < 300ms | 500ms–5s (cold) | Backend logging / New Relic |
| **Video Start Time** | < 1.5s | 3–120s | Network tab / `video.play()` timing |
| **Image Load Success Rate** | > 99% | ~85% | Error boundary logging |
| **Network Request Count (homepage)** | < 10 | 15–25 | Chrome DevTools Network tab |
| **Total Page Weight** | < 3MB | 5–15MB | Lighthouse |

### Functional Validation

- [ ] Homepage loads within 3s on 3G connection
- [ ] Portfolio images remain visible after 10 consecutive refreshes
- [ ] About section image loads on first visit and after refresh
- [ ] Hero video begins playing within 2s on fast connection
- [ ] Hero video shows poster within 500ms on slow connection
- [ ] No 404s for media URLs in Network tab
- [ ] No CORS errors in Console
- [ ] SendGrid emails still send correctly (register, order confirmation)
- [ ] Admin data changes still invalidate cache and refetch
- [ ] Products page loads correctly with images
- [ ] Before/After projects display correctly
- [ ] Category showcase images load on homepage shop section
- [ ] Mobile performance score > 70 (Lighthouse)
- [ ] Desktop performance score > 90 (Lighthouse)

### Regression Tests

```bash
# Run existing test suite
npm run test -- src/__tests__/portfolioReload.test.js
node src/__tests__/portfolioReload.node.test.js
```

---

## Appendix: Code Smells & Technical Debt

1. **Duplicated media URL logic** across `mediaUrl.js`, `HeroProjectShowcase.jsx`, `Projects.jsx`, `Portfolio.jsx`
2. **Hardcoded Unsplash fallback URLs** in 4+ files — should be centralized
3. **`firstMediaUrl` in Home.jsx** is a 15-line function doing JSON.parse on strings — fragile
4. **`normalizePortfolioProject`** exists in both `Home.jsx` and `Portfolio.jsx` with slight differences
5. **No TypeScript** — media URL types are inferred, leading to runtime errors
6. **`useEffect` cleanup patterns** vary wildly between components (some use `mountedRef`, some use `live` flag, some use neither)
7. **Magic numbers** throughout: `15 * 1000`, `30 * 60 * 1000`, `VIDEO_ROTATION_MIN_MS = 25000`

---

*Report compiled. Proceeding to implementation phase.*
