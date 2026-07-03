import mongoose from 'mongoose'

const colorVariantSchema = new mongoose.Schema(
  {
    colorName: { type: String, required: true },
    colorHex: { type: String, default: '' },
    imageUrl: { type: String, required: true },
    imagePublicId: { type: String, default: '' },
    stock: { type: Number, default: 0 },
  },
  { _id: false },
)

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    images: [{ url: String, publicId: String }],
    colorVariants: [colorVariantSchema],
    category: {
      type: String,
      enum: ['Living Room', 'Kitchen', 'Bedroom', 'Dining', 'Outdoor', 'Commercial', 'Decor', 'Lighting', 'Office', 'Custom Designs'],
      required: true,
    },
    vendor: { type: String, trim: true, default: '' },
    stock: { type: Number, required: true, min: 0 },
    sku: { type: String, required: true, unique: true },
    tags: [String],
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
)

productSchema.index({ name: 'text', description: 'text', category: 'text', sku: 'text', vendor: 'text' })

export const Product = mongoose.model('Product', productSchema)
