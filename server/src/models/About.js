import mongoose from 'mongoose'

const aboutSchema = new mongoose.Schema(
  {
    aboutImageUrl: String,
    aboutImagePublicId: String,
    story: { type: String, required: true },
    companyDescription: { type: String, required: true },
    mission: { type: String, required: true },
    vision: { type: String, required: true },
    location: { type: String, required: true },
    contactEmail: { type: String, required: true },
    socials: {
      instagram: String,
      tiktok: String,
      pinterest: String,
      facebook: String,
    },
  },
  { timestamps: true },
)

export const About = mongoose.model('About', aboutSchema)
