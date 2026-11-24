# Cloudinary Account Separation Audit Report
## HOK Interior Design - Production System

---

## Executive Summary

This audit documents the current dual-Cloudinary + Hyperserve media architecture and identifies the changes required to permanently separate image and video uploads into two independent Cloudinary accounts while preserving all existing production data.

---

## 1. Current Cloudinary Configuration

### Account 1: IMAGE CLOUDINARY (Configured ✅)
**Environment Variables (backend/.env):**
- `CLOUDINARY_CLOUD_NAME=du02q965h` ✅
- `CLOUDINARY_API_KEY=242841727892945` ✅
- `CLOUDINARY_API_SECRET=UYvJYQILpLivuXY5S_EvHMB-y_s` ✅

**Backend Config:** `backend/src/config/cloudinary.js`
- Initializes global `cloudinary.v2` config with image credentials
- `uploadToCloudinary()` - only accepts `image/` mimetypes (rejects videos)
- `deleteFromCloudinary()` - supports both image/video resource types
- Used by: `uploadService.js` → `uploadFile()` → all image uploads

**Responsibilities:**
- Blog images (featured, content gallery, homepage circular)
- Portfolio images (main, before/after, homepage circular)
- Virtual Design images (main, gallery, homepage circular)
- Hero media images
- About images
- Service images
- Testimonial images
- Social images
- WorkWithUs images
- Product images

### Account 2: VIDEO CLOUDINARY (NOT Configured ❌)
**Environment Variables (backend/.env.example only):**
- `CLOUDINARY_VIDEO_CLOUD_NAME=your-video-cloud-name` ❌ (placeholder)
- `CLOUDINARY_VIDEO_API_KEY=your-video-api-key` ❌ (placeholder)
- `CLOUDINARY_VIDEO_API_SECRET=your-video-api-secret` ❌ (placeholder)

**Backend Config:** `backend/src/config/cloudinaryVideo.js`
- Initializes SEPARATE `cloudinary.v2` config with video credentials
- `uploadVideoToCloudinary()` - only accepts `video/` mimetypes, uses `resource_type: 'video'`
- `deleteVideoFromCloudinary()` - uses `resource_type: 'video'`
- Used by: `mediaRoutes.js` → `/video/upload` endpoint

**Responsibilities (Intended):**
- Blog videos
- Virtual Design videos
- All new video uploads

---

## 2. Hyperserve Integration (Legacy - To Be Removed From New Uploads)

**Configuration:** `backend/.env`
- `HYPERSERVE_API_KEY=7312829d5359bb8baeddf55687b7e821665f3d67f057341a7c77aae426857f6c` ✅
- `HYPERSERVE_API_BASE_URL=https://api.hyperserve.io/api` ✅

**Backend Service:** `backend/src/services/hyperserveService.js`
- `createHyperserveVideo()` - Creates video upload session
- `completeHyperserveUpload()` - Completes upload
- `getHyperserveVideo()` - Gets playback URLs
- `validateHyperserveVideo()` - Validates file type/size

**Routes:** `backend/src/routes/mediaRoutes.js`
- `POST /hyperserve/create` - Create video upload
- `POST /hyperserve/:id/complete` - Complete upload
- `GET /hyperserve/:id/status` - Get status
- `DELETE /hyperserve/:id` - Disabled (preservation)

**Frontend:** `src/services/mediaService.js`
- `upload()` detects video files → calls `/media/video/upload` (Cloudinary video) NOT Hyperserve
- `delete()` supports `resourceType: 'hyperserve'` for legacy cleanup

**Status:** Hyperserve endpoints exist but frontend video uploads now use Cloudinary Video directly. Hyperserve is only used for existing published videos.

---

## 3. Upload Flow Analysis

### Image Upload Path (WORKING ✅)
```
Frontend: mediaService.upload(image) 
  → POST /media/upload (mediaRoutes.js:115)
  → uploadService.uploadFile()
  → cloudinary.uploadToCloudinary() [resource_type: 'image']
  → Returns { url, publicId, resourceType: 'image' }
```

### Video Upload Path (PARTIAL - Blog Disabled, Virtual Design Works)
```
Frontend: mediaService.upload(video)
  → POST /media/video/upload (mediaRoutes.js:70)
  → cloudinaryVideo.uploadVideoToCloudinary() [resource_type: 'video']
  → Returns { url, publicId, resourceType: 'video' }
```

**BlogForm.jsx:** Video uploads EXPLICITLY DISABLED (lines 143-146, 264-266)
**VirtualDesignDashboard.jsx:** Video uploads WORK via mediaService.upload()

---

## 4. Database Schema Analysis

### Blog Model (Prisma) - Full Video Support
```prisma
model Blog {
  video                   String?
  videoCloudinaryId       String?
  videoAssetId            String?
  videoResourceType       String?
  videoCloudinaryType     String?
  videoCloudinaryVersion  Int?
  videoFormat             String?
  videoMimeType           String?
  videoDuration           Float?
  videoWidth              Int?
  videoHeight             Int?
  videoBytes              Int?
  videoOriginalBytes      Int?
  videoOriginalName       String?
  videoStorageProvider    String?  // 'cloudinary' | 'hyperserve'
  videoPlaybackUrl        String?
  videoThumbnailUrl       String?
  videoUploadStatus       String?
  // ... image fields
}
```

### VirtualDesign Model - Basic Media Support
```prisma
model VirtualDesign {
  mediaType    String   @default("image")  // 'image' | 'video'
  mediaUrls    String[] @default([])
  mediaAssets  Json     @default("[]")
  imageUrl     String?
  cloudinaryId String?
  // No dedicated video metadata fields
}
```

### Portfolio Model - Images Only
```prisma
model PortfolioProject {
  imageUrl                String?
  cloudinaryId            String?
  beforeImages            String[] @default([])
  afterImages             String[] @default([])
  // No video fields
}
```

---

## 5. Frontend Components Using Video Upload

| Component | Status | Upload Method |
|-----------|--------|---------------|
| `BlogForm.jsx` | ❌ DISABLED | `mediaService.upload()` via `blogMediaUploadService` |
| `VirtualDesignDashboard.jsx` | ✅ WORKING | `mediaService.upload()` direct |
| `PortfolioDashboard.jsx` | N/A (images only) | `portfolioUploadService` |

---

## 6. Required Changes Summary

### Configuration
1. ✅ Image Cloudinary: Already configured in `.env`
2. ❌ Video Cloudinary: **NEEDS REAL CREDENTIALS** in `.env` and Render
3. ⚠️ Hyperserve: Keep for existing video playback, remove from new upload path

### Backend Services (New Structure)
```
services/
├── cloudinaryImageService.js  ← NEW: Image-only operations
├── cloudinaryVideoService.js  ← NEW: Video-only operations
└── (legacy cloudinary.js, cloudinaryVideo.js → deprecate)
```

### Route Updates (`mediaRoutes.js`)
- Remove `/hyperserve/*` from new video upload flow
- Keep `/video/upload` using video service
- Keep `/upload` using image service
- Preserve Hyperserve endpoints for existing video status/check only

### Frontend Updates
1. **BlogForm.jsx**: Re-enable video uploads (remove "temporarily unavailable" blocks)
2. **VirtualDesignDashboard.jsx**: Continue working (already uses video Cloudinary)
3. **mediaService.js**: Ensure videos route to `/media/video/upload`

### Data Preservation (CRITICAL)
- ❌ NO database migrations that drop columns
- ❌ NO deletion of existing Cloudinary/Hyperserve assets
- ❌ NO URL changes for published content
- ✅ Existing video URLs (Cloudinary + Hyperserve) must continue working
- ✅ New videos → Video Cloudinary only
- ✅ New images → Image Cloudinary only

---

## 7. Testing Checklist

### Image Tests
- [ ] Upload new blog featured image → appears in Image Cloudinary
- [ ] Upload portfolio before/after images → appears in Image Cloudinary
- [ ] Upload Virtual Design gallery images → appears in Image Cloudinary
- [ ] Verify NO images appear in Video Cloudinary
- [ ] Verify existing published images still display

### Video Tests
- [ ] Upload new blog video → appears in Video Cloudinary
- [ ] Upload Virtual Design video → appears in Video Cloudinary
- [ ] Verify NO new videos appear in Image Cloudinary
- [ ] Verify NO Hyperserve API calls for new uploads
- [ ] Verify database stores correct `videoCloudinaryId`, `videoStorageProvider: 'cloudinary'`
- [ ] Verify video plays on website (HTTPS, no auto-download)
- [ ] Verify existing Hyperserve videos still play
- [ ] Verify existing Cloudinary videos still play

### Publishing Tests
- [ ] Publish blog with image only
- [ ] Publish blog with video only
- [ ] Publish blog with both image and video
- [ ] Failed video upload → publication fails safely
- [ ] Duplicate publish clicks prevented
- [ ] Expired signatures handled

### Build & Deploy
- [ ] Backend lint passes: `npx eslint src/ --max-warnings=0`
- [ ] Backend syntax check: `node --check` on modified files
- [ ] Frontend build: `npx vite build`
- [ ] Frontend tests: `npx vitest run`
- [ ] Backend tests: `npx jest` (if DB available)

---

## 8. Environment Variables Required for Production (Render)

### Image Cloudinary (Already Set)
```
CLOUDINARY_CLOUD_NAME=du02q965h
CLOUDINARY_API_KEY=242841727892945
CLOUDINARY_API_SECRET=UYvJYQILpLivuXY5S_EvHMB-y_s
```

### Video Cloudinary (NEED TO CONFIGURE IN RENDER)
```
CLOUDINARY_VIDEO_CLOUD_NAME=<video-cloud-name>
CLOUDINARY_VIDEO_API_KEY=<video-api-key>
CLOUDINARY_VIDEO_API_SECRET=<video-api-secret>
```

### Hyperserve (Keep for Legacy Playback)
```
HYPERSERVE_API_KEY=7312829d5359bb8baeddf55687b7e821665f3d67f057341a7c77aae426857f6c
HYPERSERVE_API_BASE_URL=https://api.hyperserve.io/api
```

---

## 9. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Video credentials not in .env | Video uploads fail | Add real credentials before testing |
| BlogForm video disabled | Admin can't upload blog videos | Re-enable in BlogForm.jsx |
| Hyperserve fallback in code | New videos go to Hyperserve | Audit all upload paths, remove fallbacks |
| Database schema mismatch | Video metadata not saved | Verify Blog model has all needed fields |
| Existing video URLs break | Published content breaks | Preserve all existing URLs, don't migrate |

---

## 10. Implementation Priority

1. **CRITICAL**: Add Video Cloudinary credentials to `.env`
2. **CRITICAL**: Create `cloudinaryImageService.js` and `cloudinaryVideoService.js`
3. **CRITICAL**: Update `mediaRoutes.js` to use new services
4. **HIGH**: Re-enable video uploads in `BlogForm.jsx`
5. **HIGH**: Update `uploadService.js` to delegate properly
6. **HIGH**: Update `virtualDesignService.js` for video support
7. **MEDIUM**: Remove Hyperserve from new upload paths
8. **MEDIUM**: Test complete workflow
9. **MEDIUM**: Run lint/tests/build
10. **LOW**: Document deployment steps

---

*Audit completed: 2026-11-24*
*Auditor: Kilo AI Assistant*