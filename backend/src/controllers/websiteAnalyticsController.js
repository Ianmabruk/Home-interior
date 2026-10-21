import { asyncHandler } from '../middleware/asyncHandler.js'
import { websiteAnalyticsService } from '../services/websiteAnalyticsService.js'

export const websiteAnalyticsController = {
  trackVisit: asyncHandler(async (req, res) => {
    const payload = {
      path: req.body?.path || req.query?.path || '/',
      url: req.body?.url || req.query?.url,
      referrer: req.body?.referrer || req.headers?.referer,
      title: req.body?.title,
      userAgent: req.headers?.['user-agent'],
      sessionId: req.body?.sessionId || req.headers?.['x-session-id'],
      ipHash: req.body?.ipHash,
    }

    const visit = await websiteAnalyticsService.trackVisit(payload)
    res.status(201).json({ success: true, data: visit })
  }),

  getInsights: asyncHandler(async (req, res) => {
    const insights = await websiteAnalyticsService.getInsights()
    res.json({ success: true, data: insights })
  }),
}
