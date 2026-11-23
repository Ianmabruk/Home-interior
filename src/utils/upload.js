import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from './uploadConfig.js'

export { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB }

export function uploadFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload', true)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress((event.loaded / event.total) * 100)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch {
          resolve(xhr.responseText)
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error'))
    xhr.onabort = () => reject(new Error('Upload aborted'))

    const formData = new FormData()
    formData.append('file', file)
    xhr.send(formData)
  })
}

export function validateFile(file, options = {}) {
  const { maxSize = MAX_FILE_SIZE_BYTES, allowedTypes = ['image/', 'video/'] } = options

  if (file.size > maxSize) {
    return { valid: false, error: `File exceeds the maximum allowed size of ${maxSize / 1024 / 1024} MB.` }
  }

  const isAllowed = allowedTypes.some((type) => file.type.startsWith(type))
  if (!isAllowed) {
    return { valid: false, error: 'File type not allowed' }
  }

  return { valid: true }
}