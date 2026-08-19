const MAX_WIDTH = 1920
const MAX_HEIGHT = 1920
const QUALITY = 0.82

export async function compressImage(file, options = {}) {
  const { maxWidth = MAX_WIDTH, maxHeight = MAX_HEIGHT, quality = QUALITY, format = 'image/webp' } = options

  if (!file || !file.type.startsWith('image/')) return file
  if (file.type === 'image/avif' || file.type === 'image/webp' || file.type === 'image/gif') {
    if (file.size <= 500 * 1024) return file
  } else if (file.size <= 300 * 1024) {
    return file
  }

  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d', { alpha: false })
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file)
            return
          }
          const optimized = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
            type: format,
            lastModified: file.lastModified,
          })
          resolve(optimized)
        },
        format,
        quality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }

    img.src = objectUrl
  })
}

export async function compressImages(files, options = {}) {
  if (!files || files.length === 0) return []
  const results = await Promise.all(files.map((f) => compressImage(f, options)))
  return results.filter(Boolean)
}
