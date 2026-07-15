export const productsSeed = [
  {
    name: 'Aurora Arch Mirror',
    description: 'Slim arched floor mirror in brushed gold metal with a full-length reflective surface.',
    price: 1890,
    discountPrice: 1590,
    category: 'Mirrors',
    stock: 12,
    sku: 'HOK-MIR-001',
    tags: ['mirror', 'gold', 'floor'],
    colorVariants: [],
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
        publicId: 'seed/hok-mir-001',
      },
    ],
  },
  {
    name: 'Gallery Frame Set',
    description: 'Set of 3 minimalist oak picture frames with acid-free matting for gallery wall styling.',
    price: 420,
    category: 'Frames',
    stock: 40,
    sku: 'HOK-FRM-002',
    tags: ['frame', 'oak', 'set'],
    colorVariants: [],
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&w=1200&q=80',
        publicId: 'seed/hok-frm-002',
      },
    ],
  },
  {
    name: 'Linen Throw Pillow',
    description: 'Stonewashed Belgian linen pillow with hidden zipper and hypoallergenic insert.',
    price: 180,
    discountPrice: 145,
    category: 'Throw Pillows',
    stock: 80,
    sku: 'HOK-PIL-003',
    tags: ['pillow', 'linen', 'stone'],
    colorVariants: [
      { colorName: 'Sand', colorHex: '#D6CEC8', stockQuantity: 20, isDefault: true },
      { colorName: 'Charcoal', colorHex: '#3E3C38', stockQuantity: 15, isDefault: false },
      { colorName: 'Terracotta', colorHex: '#C67A5B', stockQuantity: 10, isDefault: false },
    ],
    isFeatured: true,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1200&q=80',
        publicId: 'seed/hok-pil-003',
      },
    ],
  },
  {
    name: 'Round convex mirror',
    description: 'Convex wall mirror with a slim black metal frame. Expands light and adds depth to any entryway or living space.',
    price: 1240,
    category: 'Mirrors',
    stock: 14,
    sku: 'HOK-MIR-004',
    tags: ['mirror', 'convex', 'wall'],
    colorVariants: [],
    isFeatured: false,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
        publicId: 'seed/hok-mir-004',
      },
    ],
  },
  {
    name: 'Brass Frame 8x10',
    description: 'Hand-finished brass picture frame with glass front. Perfect for portraits and art prints.',
    price: 760,
    category: 'Frames',
    stock: 30,
    sku: 'HOK-FRM-005',
    tags: ['frame', 'brass', 'photo'],
    colorVariants: [],
    isFeatured: false,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?auto=format&fit=crop&w=1200&q=80',
        publicId: 'seed/hok-frm-005',
      },
    ],
  },
  {
    name: 'Velvet Cushion',
    description: 'Premium velvet throw cushion with piped edges and feather-down insert for luxury comfort.',
    price: 210,
    category: 'Throw Pillows',
    stock: 60,
    sku: 'HOK-PIL-006',
    tags: ['pillow', 'velvet', 'luxury'],
    colorVariants: [
      { colorName: 'Emerald', colorHex: '#2A6B5E', stockQuantity: 20, isDefault: true },
      { colorName: 'Ivory', colorHex: '#F3EFE8', stockQuantity: 20, isDefault: false },
    ],
    isFeatured: false,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=1200&q=80',
        publicId: 'seed/hok-pil-006',
      },
    ],
  },
]

export const projectsSeed = [
  {
    title: 'Belgravia Townhouse',
    description: 'A layered neutral renovation balancing contemporary flow and artisanal detail.',
    category: 'Residential',
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80',
        publicId: 'seed/project-belgravia-image',
      },
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80',
    order: 1,
    isPublished: true,
  },
  {
    title: 'Monarch Penthouse',
    description: 'Soft monochrome interiors with sculptural lighting and gallery-worthy composition.',
    category: 'Residential',
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80',
        publicId: 'seed/project-monarch-image',
      },
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80',
    order: 2,
    isPublished: true,
  },
]

export const portfolioSeed = [
  {
    title: 'Travertine Kitchen',
    category: 'Kitchen',
    imageUrl: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=1200&q=80',
    imagePublicId: 'seed/portfolio-kitchen-1',
    order: 1,
    isPublished: true,
  },
  {
    title: 'Gallery Living Room',
    category: 'Living Room',
    imageUrl: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1200&q=80',
    imagePublicId: 'seed/portfolio-living-1',
    order: 2,
    isPublished: true,
  },
  {
    title: 'Calm Suite',
    category: 'Bedroom',
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    imagePublicId: 'seed/portfolio-bedroom-1',
    order: 3,
    isPublished: true,
  },
]

export const aboutSeed = {
  story:
    'Founded as a boutique interiors studio, HOK blends architectural discipline with tactile styling to craft spaces that feel deeply personal and quietly luxurious.',
  companyDescription:
    'HOK Interior Designs is a modern luxury interior studio creating deeply personal, timeless spaces through refined material palettes and practical elegance.',
  mission:
    'To transform every home into a sanctuary through intentional design and architectural clarity.',
  vision:
    'To become the most trusted digital-first premium interior design platform globally.',
  location: 'Nairobi, Kenya',
  contactEmail: 'info@hokinterior.com',
  aboutImageUrl:
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=80',
  aboutImagePublicId: 'seed/about-hero',
  socials: {
    instagram: 'https://instagram.com/hokinterior',
    tiktok: 'https://tiktok.com/@hokinterior',
    pinterest: 'https://pinterest.com/hokinterior',
    facebook: 'https://facebook.com/hokinterior',
  },
}

export const virtualDesignSeed = []

export const testimonialsSeed = [
  {
    clientName: 'Amara Okeke',
    position: 'Homeowner',
    company: 'Kilimani Residence',
    testimonial:
      'HOK transformed our living space into something straight out of a magazine. The attention to detail and calm, luxurious palette exceeded every expectation.',
    rating: 5,
    displayOrder: 0,
    isActive: true,
  },
  {
    clientName: 'Daniel Mwangi',
    position: 'CEO',
    company: 'Savannah Group',
    testimonial:
      'Working with HOK on our office interior was seamless. They listened, delivered on time, and the result is both elegant and functional.',
    rating: 5,
    displayOrder: 1,
    isActive: true,
  },
  {
    clientName: 'Lilian Achieng',
    position: 'Interior Enthusiast',
    company: 'Lavington',
    testimonial:
      'The cinematic project showcase sold me immediately. Their team turned our vague ideas into a home we are genuinely proud of.',
    rating: 4,
    displayOrder: 2,
    isActive: true,
  },
]

export const analyticsSeed = [
  { date: new Date('2026-01-01'), visits: 1240, revenue: 18300, orders: 21, newUsers: 55 },
  { date: new Date('2026-02-01'), visits: 1650, revenue: 22400, orders: 27, newUsers: 70 },
  { date: new Date('2026-03-01'), visits: 2010, revenue: 29800, orders: 35, newUsers: 84 },
  { date: new Date('2026-04-01'), visits: 2260, revenue: 34100, orders: 43, newUsers: 95 },
  { date: new Date('2026-05-01'), visits: 2450, revenue: 37850, orders: 49, newUsers: 104 },
  { date: new Date('2026-06-01'), visits: 2680, revenue: 41220, orders: 53, newUsers: 118 },
]

export const settingsSeed = {
  siteName: 'HOK Interior Designs',
  supportEmail: 'info@hokinterior.com',
  maintenanceMode: false,
  currency: 'USD',
  shippingPolicy: 'Ships within 3-7 business days depending on product category.',
  returnPolicy: 'Returns accepted within 14 days for eligible items.',
}
