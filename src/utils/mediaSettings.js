export const DEFAULT_MEDIA_SETTINGS = {
  fit: 'cover',
  position: 'center',
  zoom: 100,
}

export const FIT_OPTIONS = [
  { value: 'cover', label: 'Cover' },
  { value: 'contain', label: 'Contain' },
  { value: 'fill', label: 'Fill' },
  { value: 'none', label: 'None' },
  { value: 'scale-down', label: 'Scale Down' },
]

export const POSITION_OPTIONS = [
  { value: 'center', label: 'Center', x: 50, y: 50 },
  { value: 'top', label: 'Top', x: 50, y: 0 },
  { value: 'bottom', label: 'Bottom', x: 50, y: 100 },
  { value: 'left', label: 'Left', x: 0, y: 50 },
  { value: 'right', label: 'Right', x: 100, y: 50 },
  { value: 'top-left', label: 'Top Left', x: 0, y: 0 },
  { value: 'top-right', label: 'Top Right', x: 100, y: 0 },
  { value: 'bottom-left', label: 'Bottom Left', x: 0, y: 100 },
  { value: 'bottom-right', label: 'Bottom Right', x: 100, y: 100 },
]

export function normalizeMediaSettings(settings) {
  if (!settings) return { ...DEFAULT_MEDIA_SETTINGS }
  return {
    fit: settings.fit || DEFAULT_MEDIA_SETTINGS.fit,
    position: settings.position || DEFAULT_MEDIA_SETTINGS.position,
    zoom: Math.min(Math.max(settings.zoom || DEFAULT_MEDIA_SETTINGS.zoom, 100), 300),
  }
}

export function positionToObjectPosition(position) {
  const pos = POSITION_OPTIONS.find((p) => p.value === position) || POSITION_OPTIONS[0]
  return `${pos.x}% ${pos.y}%`
}

export function getPositionFromCoords(x, y) {
  return POSITION_OPTIONS.find((p) => p.x === x && p.y === y)?.value || 'center'
}