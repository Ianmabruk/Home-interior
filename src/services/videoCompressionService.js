const MAX_VIDEO_BYTES = 500 * 1024 * 1024

export function isVideoCompressionSupported() {
  return typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined'
}

export async function compressVideoInWorker(file, handlers = {}) {
  if (!isVideoCompressionSupported()) {
    throw new Error('This browser cannot safely compress video. Try current Safari or Chrome.')
  }
  if (!file?.size) throw new Error('The selected video is empty.')
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error(`This video is larger than the ${Math.round(MAX_VIDEO_BYTES / 1024 / 1024)} MB processing limit. Choose a smaller source video.`)
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/videoCompressor.worker.js', import.meta.url), { type: 'module' })
    let settled = false

    const finishError = (message) => {
      if (settled) return
      settled = true
      worker.terminate()
      reject(new Error(message))
    }

    worker.onmessage = ({ data }) => {
      if (data?.type === 'error') {
        finishError(data.message)
        return
      }
      if (data?.type === 'preparing' || data?.type === 'compressing') {
        handlers.onProgress?.({
          phase: data.type,
          progress: data.progress,
          originalBytes: data.originalBytes,
        })
        return
      }
      if (data?.type === 'complete') {
        settled = true
        worker.terminate()
        resolve({
          file: data.file,
          contentHash: data.contentHash,
          originalBytes: data.originalBytes,
          compressedBytes: data.compressedBytes,
          reencoded: data.reencoded,
        })
      }
    }

    worker.onerror = (event) => finishError(event?.message || 'The video worker failed to start.')

    file.arrayBuffer().then((arrayBuffer) => {
      worker.postMessage({
        type: 'compress',
        arrayBuffer,
        name: file.name,
        mimeType: file.type,
      }, [arrayBuffer])
    }).catch((error) => finishError(error?.message || 'The selected video could not be read.'))

    handlers.setCancel?.(() => finishError('Compression cancelled'))
  })
}
