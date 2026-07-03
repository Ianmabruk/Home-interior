import mongoose from 'mongoose'

const analyticsSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true },
    visits: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    orders: { type: Number, default: 0 },
    newUsers: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export const Analytics = mongoose.model('Analytics', analyticsSchema)
