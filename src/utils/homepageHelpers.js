import { api } from '@services/api'

export const getProjectImage = (item) => {
  if (!item) return null
  return (
    item.imageUrl ||
    item.mediaUrl ||
    item.mediaUrls?.[0] ||
    item.galleryImages?.[0] ||
    item.beforeImages?.[0] ||
    item.afterImages?.[0] ||
    null
  )
}

export const fetchHomepageData = async () => {
  try {
    const res = await api.get('/homepage')
    return res.data || {}
  } catch (err) {
    console.warn('[HOME] Failed to load data:', err?.message)
    return {}
  }
}