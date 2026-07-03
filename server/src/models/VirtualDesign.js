import mongoose from 'mongoose'

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false },
)

const virtualDesignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    videoUrl: { type: String, required: true },
    videoPublicId: { type: String, required: true },
    services: [serviceSchema],
    ctaPrimary: { type: String, default: 'Start Your Project' },
    ctaSecondary: { type: String, default: 'Learn More' },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const VirtualDesign = mongoose.model('VirtualDesign', virtualDesignSchema)
