export const CIRCULAR_TAB_DEFINITIONS = [
  { key: 'portfolio', title: 'Portfolio', displayOrder: 0 },
  { key: 'services', title: 'Services', displayOrder: 1 },
  { key: 'virtual_design', title: 'Virtual Design', displayOrder: 2 },
  { key: 'shop_with_us', title: 'Shop With Us', displayOrder: 3 },
  { key: 'blog', title: 'Blog', displayOrder: 4 },
  { key: 'about_us', title: 'About Us', displayOrder: 5 },
  { key: 'socials', title: 'Socials', displayOrder: 6 },
  { key: 'testimonials', title: 'Testimonials', displayOrder: 7 },
  { key: 'work_with_us', title: 'Work With Us', displayOrder: 8 },
]

export const VALID_CIRCULAR_KEYS = new Set(CIRCULAR_TAB_DEFINITIONS.map(t => t.key))
