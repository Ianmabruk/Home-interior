import { useCallback, useEffect, useRef, useState } from 'react'
import { getVideoSourceType } from '@utils/cloudinaryHelpers'

const MAX_BLOB_BYTES = 50 * 1024 * 1024
const STALL_TIMEOUT_MS = 20000

const describeMediaError = (code) => {
  switch (code) {
    case 1: return 'Playback was aborted.'
    case 2: return 'A network error interrupted video playback.'
    case 3: return 'This video could not be decoded on this device.'
    case 4: return 'This video format is not supported on this device.'
    default: return 'The video could not be loaded.'
  }
}

export default function LazyVideo({
  src,
  downloadSrc,
  poster,
  className = '',
  loop = false,
  muted = false,
  playsInline = true,
  controls = true,
  preload = 'metadata',
  sources = [],
  fallbackSrc,
  maxHeight = '75vh',
}) {
  const videoRef = useRef(null)
  const objectUrlRef = useRef(null)
  const fetchControllerRef = useRef(null)
  const mountedRef = useRef(true)
  const retryCountRef = useRef(0)

  const [effectiveSrc, setEffectiveSrc] = useState('')
  const [hasStarted, setHasStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [hasError, setHasError] = useState(false)
  const [errorDetail, setErrorDetail] = useState('')
  const [hasDimensions, setHasDimensions] = useState(false)

  const sourceCandidates = [
    src,
    fallbackSrc,
    ...sources.map((item) => typeof item === 'string' ? item : item?.src),
  ].filter(Boolean)
  const primarySrc = sourceCandidates[0] || ''

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  const resetPlayer = useCallback(() => {
    fetchControllerRef.current?.abort()
    fetchControllerRef.current = null
    revokeObjectUrl()
    retryCountRef.current = 0
    setEffectiveSrc('')
    setHasStarted(false)
    setIsLoading(false)
    setDownloadProgress(0)
    setHasError(false)
    setErrorDetail('')
    setHasDimensions(false)
  }, [revokeObjectUrl])

  useEffect(() => {
    mountedRef.current = true
    resetPlayer()
    return () => {
      mountedRef.current = false
      fetchControllerRef.current?.abort()
      revokeObjectUrl()
    }
  }, [src, fallbackSrc, resetPlayer, revokeObjectUrl])

  useEffect(() => {
    if (!effectiveSrc || !videoRef.current) return
    const video = videoRef.current
    video.src = effectiveSrc
    video.load()
  }, [effectiveSrc])

  const waitForCanPlay = useCallback((video) => new Promise((resolve, reject) => {
    if (video.readyState >= 3) {
      resolve()
      return
    }
    const timeout = setTimeout(() => reject(new Error('The video took too long to initialize.')), STALL_TIMEOUT_MS)
    const cleanup = () => {
      clearTimeout(timeout)
      video.removeEventListener('canplay', onCanPlay)
      video.removeEventListener('error', onError)
    }
    const onCanPlay = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error(describeMediaError(video.error?.code)))
    }
    video.addEventListener('canplay', onCanPlay, { once: true })
    video.addEventListener('error', onError, { once: true })
  }), [])

  const startPlaying = useCallback(async (video) => {
    try {
      await waitForCanPlay(video)
      if (!mountedRef.current) return
      await video.play()
      if (!mountedRef.current) return
      setIsLoading(false)
      setHasStarted(true)
    } catch (error) {
      if (!mountedRef.current) return
      if (error?.name === 'NotAllowedError') {
        setErrorDetail('Your browser blocked autoplay. Press Play again or use the player controls.')
        setHasError(true)
      } else if (error?.name !== 'AbortError') {
        setErrorDetail(error?.message || 'Playback could not start.')
        setHasError(true)
      }
      setIsLoading(false)
    }
  }, [waitForCanPlay])

  const setProgressiveSource = useCallback((source) => {
    const video = videoRef.current
    if (!video) return
    revokeObjectUrl()
    setEffectiveSrc(source)
    setHasStarted(true)
    setIsLoading(true)
    setDownloadProgress(100)
    startPlaying(video)
  }, [revokeObjectUrl, startPlaying])

  const fetchAsBlob = useCallback(async (source) => {
    const controller = new AbortController()
    fetchControllerRef.current = controller
    setIsLoading(true)
    setDownloadProgress(0)

    try {
      const response = await fetch(source, {
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        redirect: 'follow',
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`Video request failed with HTTP ${response.status}.`)

      const contentType = response.headers.get('content-type') || ''
      if (contentType && !contentType.includes('video/') && !contentType.includes('application/octet-stream')) {
        throw new Error(`Invalid video response (${contentType}).`)
      }

      if (!response.body || typeof response.body.getReader !== 'function') {
        const blob = await response.blob()
        if (!blob.size) throw new Error('The video response was empty.')
        return blob
      }

      const reader = response.body.getReader()
      const chunks = []
      let received = 0
      const contentLength = Number(response.headers.get('content-length')) || 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        received += value.byteLength
        if (contentLength) setDownloadProgress(Math.min(99, Math.round(received * 100 / contentLength)))
        if (received > MAX_BLOB_BYTES) throw new Error('This video is too large for in-memory playback.')
      }
      const blob = new Blob(chunks, { type: contentType.includes('video/') ? contentType : 'video/mp4' })
      if (!blob.size) throw new Error('The video response was empty.')
      return blob
    } finally {
      if (fetchControllerRef.current === controller) fetchControllerRef.current = null
    }
  }, [])

  const handlePlay = useCallback(async () => {
    if (!primarySrc) return
    setHasError(false)
    setErrorDetail('')
    setHasStarted(true)
    setIsLoading(true)

    try {
      const blob = await fetchAsBlob(primarySrc)
      if (!mountedRef.current) return
      revokeObjectUrl()
      const objectUrl = URL.createObjectURL(blob)
      objectUrlRef.current = objectUrl
      setDownloadProgress(100)
      setEffectiveSrc(objectUrl)

      const video = videoRef.current
      if (video) {
        video.src = objectUrl
        video.load()
        await startPlaying(video)
      }
    } catch (error) {
      if (!mountedRef.current) return
      if (error?.name === 'AbortError') return
      setEffectiveSrc('')
      setHasStarted(true)
      setIsLoading(true)
      setErrorDetail('')
      setProgressiveSource(primarySrc)
    }
  }, [fetchAsBlob, primarySrc, revokeObjectUrl, setProgressiveSource, startPlaying])

  const retry = useCallback(() => {
    resetPlayer()
    setTimeout(() => handlePlay(), 0)
  }, [handlePlay, resetPlayer])

  const onLoadedMetadata = useCallback((event) => {
    const video = event.currentTarget
    if (video.videoWidth > 0 && video.videoHeight > 0) setHasDimensions(true)
  }, [])

  const onCanPlay = useCallback(() => {
    setIsLoading(false)
  }, [])

  const onPlaying = useCallback(() => {
    setIsLoading(false)
    setHasStarted(true)
  }, [])

  const onWaiting = useCallback(() => {
    if (hasStarted) setIsLoading(true)
  }, [hasStarted])

  const onError = useCallback(() => {
    const video = videoRef.current
    if (!video?.error) return
    if (video.error.code === 1) return

    if (retryCountRef.current < 1) {
      retryCountRef.current += 1
      setProgressiveSource(primarySrc)
      return
    }
    setIsLoading(false)
    setErrorDetail(describeMediaError(video.error.code))
    setHasError(true)
  }, [primarySrc, setProgressiveSource])

  if (!primarySrc) return null
  const sourceType = getVideoSourceType(effectiveSrc || primarySrc) || 'video/mp4'

  return (
    <div className={`relative w-full ${className}`}>
      <video
        ref={videoRef}
        poster={poster}
        className="block w-full"
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        controls={controls}
        preload={preload}
        onLoadedMetadata={onLoadedMetadata}
        onCanPlay={onCanPlay}
        onPlaying={onPlaying}
        onWaiting={onWaiting}
        onError={onError}
        style={{
          width: '100%',
          height: 'auto',
          aspectRatio: hasDimensions ? 'auto' : '16 / 9',
          maxHeight,
          objectFit: 'contain',
          display: 'block',
          backgroundColor: '#000',
        }}
      >
        {effectiveSrc && <source src={effectiveSrc} type={sourceType} />}
        Your browser does not support HTML video.
      </video>

      {!hasStarted && !hasError && (
        <button
          type="button"
          onClick={handlePlay}
          className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/70 text-white shadow-lg backdrop-blur-sm transition hover:scale-105 hover:bg-black/85"
          aria-label="Play video"
        >
          <span className="ml-1 block h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-white" />
        </button>
      )}

      {isLoading && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/75 px-4 py-2 text-center text-xs text-white" role="status">
          <span>Loading video</span>
          {downloadProgress > 0 && <span className="ml-2">{downloadProgress}%</span>}
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/65 px-4 text-center text-white">
          <p className="text-sm font-semibold">Video unavailable</p>
          {errorDetail && <p className="text-xs text-white/75">{errorDetail}</p>}
          <button type="button" onClick={retry} className="rounded-full border border-white/50 px-4 py-1.5 text-xs font-semibold hover:bg-white/10">
            Retry
          </button>
        </div>
      )}

      <a
        href={downloadSrc || primarySrc}
        download
        className="absolute bottom-3 right-3 z-10 rounded-full border border-white/30 bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-black/85"
      >
        Download
      </a>
    </div>
  )
}
