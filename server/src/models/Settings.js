import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: 'HOK Interior Designs' },
    supportEmail: { type: String, default: 'info@hokinterior.com' },
    maintenanceMode: { type: Boolean, default: false },
    currency: { type: String, default: 'USD' },
    shippingPolicy: { type: String, default: '' },
    returnPolicy: { type: String, default: '' },
  },
  { timestamps: true },
)

export const Settings = mongoose.model('Settings', settingsSchema)
