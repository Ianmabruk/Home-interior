export function normalizeKenyanPhone(value) {
  if (!value) return null
  const digits = String(value).replace(/\D/g, '')
  if (digits.length === 0) return null
  let normalized = digits
  if (normalized.startsWith('254')) {
    normalized = normalized.slice(3)
  } else if (normalized.startsWith('00254')) {
    normalized = normalized.slice(5)
  } else if (normalized.startsWith('0')) {
    normalized = normalized.slice(1)
  }
  const national = normalized
  if (/^7\d{8}$/.test(national) || /^1\d{8}$/.test(national)) {
    return `254${national}`
  }
  return null
}
