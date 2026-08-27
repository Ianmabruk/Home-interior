import { prisma, withRetry } from '../config/database.js'
import { failure } from '../utils/response.js'
import { VALID_CIRCULAR_KEYS } from '../constants/circularTabs.js'
import { getCached, setCached, invalidateCachePattern } from '../utils/cache.js'

const CIRCULAR_TABS_CACHE_TTL = 60000 // 1 minute

function mapCircularTab(tab) {
  return {
    id: tab.id,
    key: tab.key,
    title: tab.title,
    imageUrl: tab.imageUrl,
    imageKey: tab.imageKey,
    active: tab.active,
    displayOrder: tab.displayOrder,
    createdAt: tab.createdAt,
    updatedAt: tab.updatedAt,
  }
}

async function listCircularTabs() {
  const tabs = await withRetry(() => prisma.circularTab.findMany({
    orderBy: { displayOrder: 'asc' },
  }))
  return tabs.map(mapCircularTab)
}

async function getCircularTab(key) {
  const tab = await withRetry(() => prisma.circularTab.findUnique({
    where: { key },
  }))
  return tab ? mapCircularTab(tab) : null
}

async function updateCircularTab(key, data) {
  if (!VALID_CIRCULAR_KEYS.has(key)) {
    throw failure(400, `Invalid circular tab key: ${key}`)
  }

  const existing = await withRetry(() => prisma.circularTab.findUnique({
    where: { key },
  }))

  if (!existing) {
    throw failure(404, `Circular tab not found: ${key}`)
  }

  const updateData = {}
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
  if (data.imageKey !== undefined) updateData.imageKey = data.imageKey
  if (data.title !== undefined) updateData.title = data.title
  if (data.active !== undefined) updateData.active = data.active
  if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder

  const updated = await withRetry(() => prisma.circularTab.update({
    where: { key },
    data: updateData,
  }))

  // Invalidate circular tabs cache after update (prefix match clears all circular tab cache keys)
  invalidateCachePattern('circularTabs:')
  return mapCircularTab(updated)
}

async function getHomepageCircularTabs() {
  const cacheKey = 'circularTabs:homepage'
  const cached = getCached(cacheKey)
  if (cached) return cached

  const tabs = await withRetry(() => prisma.circularTab.findMany({
    where: { active: true },
    orderBy: { displayOrder: 'asc' },
  }))

  const result = {}
  for (const tab of tabs) {
    result[tab.key] = {
      key: tab.key,
      title: tab.title,
      imageUrl: tab.imageUrl,
      imageKey: tab.imageKey,
    }
  }
  setCached(cacheKey, result, CIRCULAR_TABS_CACHE_TTL)
  return result
}

export const circularTabService = {
  listCircularTabs,
  getCircularTab,
  updateCircularTab,
  getHomepageCircularTabs,
}
