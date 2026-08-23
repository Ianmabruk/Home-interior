import { asyncHandler } from '../middleware/asyncHandler.js'
import { getBuildVersion } from '../middleware/buildVersion.js'

export const publicConfigController = {
  getConfig: asyncHandler(async (req, res) => {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || ''
    res.json({
      success: true,
      data: {
        buildVersion: getBuildVersion(),
        pwa: {
          name: 'HOK Interior Designs',
          shortName: 'HOK',
          startUrl: '/',
          display: 'standalone',
        },
        push: {
          enabled: Boolean(vapidPublicKey),
          vapidPublicKey: vapidPublicKey,
        },
      },
    })
  }),
}

export default publicConfigController
