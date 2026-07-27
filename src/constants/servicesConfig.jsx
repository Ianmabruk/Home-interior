export const SERVICES_CONFIG = [
  { key: 'residential', label: 'Residential Design', icon: 'Brush' },
  { key: 'commercial', label: 'Commercial Design', icon: 'LayoutGrid' },
  { key: 'virtual', label: 'Virtual Designs', icon: 'MonitorSmartphone' },
  { key: 'furniture', label: 'Furniture Curation', icon: 'Armchair' },
  { key: 'space', label: 'Space Planning', icon: 'Search' },
  { key: 'styling', label: 'Styling Consultation', icon: 'Sparkles' },
]

export const SERVICE_ICONS = {
  Brush: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 4 9 9 0 1 1-9-9Z" />
      <line x1="21" y1="9" x2="15.5" y2="14.5" />
      <line x1="15" y1="15" x2="14" y2="16" />
    </svg>
  ),
  LayoutGrid: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  MonitorSmartphone: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8V5a2 2 0 0 0-2-2H4" />
      <path d="M17 9h.01" />
      <rect width="6" height="10" x="16" y="12" rx="2" />
      <path d="M6 12h.01" />
      <rect width="6" height="12" x="4" y="8" rx="2" />
    </svg>
  ),
  Armchair: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
      <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5" />
      <path d="M5 18v2" />
      <path d="M19 18v2" />
    </svg>
  ),
  Search: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Sparkles: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v2.2" />
      <path d="M16.38 4.74l1.06 1.06" />
      <path d="M18 12h2.2" />
      <path d="M21 16.38l-1.06 1.06" />
      <path d="M12 21v-2.2" />
      <path d="M7.64 19.34l1.06-1.06" />
      <path d="M3 12h-2.2" />
      <path d="M4.74 4.74l-1.06 1.06" />
    </svg>
  ),
}

export const CIRCULAR_CARD_SIZE = {
  base: 300,
  md: 400,
  lg: 500,
  max: 320,
}