import mongoose from 'mongoose'

const portfolioSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    images: [{ url: String, publicId: String }],
    imageUrl: String,
    imagePublicId: String,
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const Portfolio = mongoose.model('Portfolio', portfolioSchema)
