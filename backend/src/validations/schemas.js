import { z } from 'zod'

const idParam = z.object({ id: z.string().min(1, 'id is required') })
const email = z.string().min(1, 'Email is required').email('Invalid email address')

export const authSchemas = {
  login: z.object({
    email,
    password: z.string().min(1, 'Password is required'),
  }),
  register: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email,
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
  forgotPassword: z.object({ email }),
  resetPassword: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
  updateProfile: z.object({
    fullName: z.string().min(1, 'Full name is required').optional(),
  }),
}

export const contentSchemas = {
  newsletter: z.object({ email }),
}

export const contactSchemas = {
  post: z.object({
    fullName: z.string().min(1, 'Full name is required').optional(),
    email: z.string().min(1, 'Email is required').optional(),
    phone: z.string().optional(),
    subject: z.string().optional(),
    message: z.string().min(1, 'Message is required'),
  }),
  inquiry: z.object({
    fullName: z.string().min(1, 'Full name is required').optional(),
    email: z.string().min(1, 'Email is required').optional(),
    phone: z.string().optional(),
    projectSummary: z.string().min(1, 'Project summary is required'),
  }),
}

export const consultationSchemas = {
  publicCreate: z.object({
    name: z.string().min(1, 'Name is required'),
    email,
    message: z.string().min(1, 'Message is required'),
    phone: z.string().optional(),
    budget: z.string().optional(),
    timeline: z.string().optional(),
    projectType: z.string().optional(),
    type: z.enum(['consultation', 'e-design']).optional(),
    packageName: z.string().optional(),
    packagePrice: z.coerce.number().optional(),
    paymentStatus: z.string().optional(),
    orderId: z.string().optional(),
    purchaseDate: z.string().optional(),
  }),
  updateStatus: z.object({
    status: z.string().min(1, 'Status is required'),
  }),
}

export const messageSchemas = {
  create: z.object({
    name: z.string().min(1, 'Name is required'),
    email,
    subject: z.string().optional(),
    content: z.string().min(1, 'Content is required'),
  }),
  reply: z.object({ reply: z.string().min(1, 'Reply is required') }),
}

export const blogSchemas = {
  create: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.union([
      z.array(z.string()),
      z.string().transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean)),
    ]).optional(),
    published: z.union([z.boolean(), z.string()]).optional(),
    featured: z.union([z.boolean(), z.string()]).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
  }),
  update: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    published: z.union([z.boolean(), z.string()]).optional(),
    featured: z.union([z.boolean(), z.string()]).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
  }),
}

export const serviceSchemas = {
  create: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    icon: z.string().optional(),
    featured: z.union([z.boolean(), z.string()]).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    isActive: z.union([z.boolean(), z.string()]).optional(),
    buttonText: z.string().optional(),
    buttonUrl: z.string().optional(),
  }),
  update: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    featured: z.union([z.boolean(), z.string()]).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    isActive: z.union([z.boolean(), z.string()]).optional(),
    buttonText: z.string().optional(),
    buttonUrl: z.string().optional(),
  }),
  reorder: z.object({
    order: z.array(z.object({ id: z.string(), displayOrder: z.coerce.number().int() })).min(1),
  }),
}

export const portfolioSchemas = {
  create: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    category: z.string().optional(),
    featured: z.union([z.boolean(), z.string()]).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    published: z.union([z.boolean(), z.string()]).optional(),
    mediaUrls: z.array(z.string()).optional(),
    imageUrl: z.string().optional(),
  }),
  update: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    featured: z.union([z.boolean(), z.string()]).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    published: z.union([z.boolean(), z.string()]).optional(),
    mediaUrls: z.array(z.string()).optional(),
  }),
}

export const virtualDesignSchemas = {
  create: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    category: z.string().optional(),
    mediaType: z.enum(['image', 'video']).optional(),
    featured: z.union([z.boolean(), z.string()]).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    published: z.union([z.boolean(), z.string()]).optional(),
    mediaUrls: z.array(z.string()).optional(),
  }),
  update: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    mediaType: z.enum(['image', 'video']).optional(),
    featured: z.union([z.boolean(), z.string()]).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    published: z.union([z.boolean(), z.string()]).optional(),
    mediaUrls: z.array(z.string()).optional(),
  }),
}

export const testimonialSchemas = {
  create: z.object({
    clientName: z.string().min(1, 'Client name is required'),
    testimonial: z.string().optional(),
    content: z.string().optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    isActive: z.union([z.boolean(), z.string()]).optional(),
  }),
  update: z.object({
    clientName: z.string().optional(),
    testimonial: z.string().optional(),
    content: z.string().optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    isActive: z.union([z.boolean(), z.string()]).optional(),
  }),
}

export const heroMediaSchemas = {
  create: z.object({
    title: z.string().min(1, 'Title is required'),
    subtitle: z.string().optional(),
    isActive: z.union([z.boolean(), z.string()]).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
  }),
  update: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    isActive: z.union([z.boolean(), z.string()]).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
  }),
}

export const aboutSchemas = {
  update: z.object({
    story: z.string().optional(),
    companyDescription: z.string().optional(),
    mission: z.string().optional(),
    vision: z.string().optional(),
    location: z.string().optional(),
    contactEmail: z.string().email('Invalid email').optional(),
    socials: z.any().optional(),
    values: z.string().optional(),
    statistics: z.string().optional(),
  }),
}

export const productSchemas = {
  create: z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().optional(),
    price: z.coerce.number().min(0).optional(),
    discountPrice: z.coerce.number().min(0).optional(),
    category: z.string().optional(),
    vendor: z.string().optional(),
    stock: z.coerce.number().int().nonnegative().optional(),
    sku: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isFeatured: z.union([z.boolean(), z.string()]).optional(),
    isPublished: z.union([z.boolean(), z.string()]).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    variants: z.array(z.any()).optional(),
  }),
  update: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.coerce.number().min(0).optional(),
    discountPrice: z.coerce.number().min(0).optional(),
    category: z.string().optional(),
    vendor: z.string().optional(),
    stock: z.coerce.number().int().nonnegative().optional(),
    sku: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isFeatured: z.union([z.boolean(), z.string()]).optional(),
    isPublished: z.union([z.boolean(), z.string()]).optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    variants: z.array(z.any()).optional(),
  }),
}

export const orderSchemas = {
  create: z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email'),
    name: z.string().min(1, 'Name is required'),
    phone: z.string().optional(),
    items: z.union([z.array(z.any()), z.string()]).optional(),
    shipping: z.any().optional(),
    shippingMethod: z.string().optional(),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    paymentDetails: z.any().optional(),
    total: z.coerce.number().min(0).optional(),
  }),
  updateStatus: z.object({
    status: z.string().min(1, 'Status is required'),
  }),
}

export const paymentSchemas = {
  mpesa: z.object({
    phone: z.string().min(1, 'Phone is required'),
    amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
    orderData: z.any().optional(),
  }),
  card: z.object({
    cardHolder: z.string().min(1, 'Card holder is required'),
    expiry: z.string().min(1, 'Expiry is required'),
    amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
    orderData: z.any().optional(),
  }),
  verify: z.object({
    reference: z.string().min(1, 'Reference is required'),
  }),
}

export const chatSchemas = {
  post: z.object({ message: z.string().min(1, 'Message is required') }),
}

export const userSchemas = {
  wishlistAdd: z.object({ productId: z.string().min(1, 'productId is required') }),
  cartAdd: z.object({
    productId: z.string().min(1, 'productId is required'),
    quantity: z.coerce.number().int().positive().optional(),
    variant: z.any().optional(),
    variantId: z.string().optional(),
  }),
  cartUpdate: z.object({
    productId: z.string().min(1, 'productId is required'),
    quantity: z.coerce.number().int().positive().optional(),
    variant: z.any().optional(),
    variantId: z.string().optional(),
  }),
}

export { idParam }
