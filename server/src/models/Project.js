import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    media: [
      {
        type: { type: String, enum: ['video', 'image'], required: true },
        url: { type: String, required: true },
        publicId: { type: String },
        thumbnailUrl: { type: String },
      },
    ],
    videoUrl: String,
    videoPublicId: String,
    coverImageUrl: String,
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const Project = mongoose.model('Project', projectSchema)
