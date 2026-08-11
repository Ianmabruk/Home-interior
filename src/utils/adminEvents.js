import { useEffect } from 'react'

export const ADMIN_DATA_CHANGED_EVENT = 'admin-data-changed'

export function dispatchAdminDataChanged(type, data = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ADMIN_DATA_CHANGED_EVENT, { detail: { type, ...data } }))
  }
}

export function getAdminDataChangedPayload(event) {
  return event?.detail || null
}

export function useAdminDataChangedListener(types, callback) {
  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (!payload) return
      if (types && !types.includes(payload.type)) return
      callback(payload)
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [types, callback])
}

export const ADMIN_EVENT_TYPES = {
  PORTFOLIO_CHANGED: 'portfolio-changed',
  SERVICES_CHANGED: 'services-changed',
  VIRTUAL_CHANGED: 'virtual-changed',
  HERO_IMAGES_CHANGED: 'hero-images-changed',
  CONTACT_CHANGED: 'contact-changed',
  PRODUCTS_CHANGED: 'products-changed',
  ABOUT_CHANGED: 'about-changed',
  TEAM_CHANGED: 'team-changed',
  SOCIALS_CHANGED: 'socials-changed',
  SETTINGS_CHANGED: 'settings-changed',
  BLOG_CHANGED: 'blog-changed',
  ORDERS_CHANGED: 'orders-changed',
}