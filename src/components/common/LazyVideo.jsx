import { useCallback, useEffect, useRef, useState } from 'react'
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
  const candidates = [src, fallbackSrc, ...sources.map((item) => typeof item === 'string' ? item : item?.src)]
    .filter((candidate, index, list) => candidate && list.indexOf(candidate) === index)
  const [sourceIndex, setSourceIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorDetail, setErrorDetail] = useState('')
  const [hasDimensions, setHasDimensions] = useState(false)
  const activeSource = candidates[sourceIndex]

  useEffect(() => {
    setSourceIndex(0)
    setIsLoading(false)
    setHasError(false)
    setErrorDetail('')
    setHasDimensions(false)
  }, [src, fallbackSrc])

  const handlePlay = useCallback(() => {
    const video = videoRef.current
    if (!video || !activeSource) return
    setHasError(false)
    setErrorDetail('')
    setIsLoading(true)
    video.play()?.catch((error) => {
      if (error?.name === 'NotAllowedError') {
        setErrorDetail('Autoplay is restricted by your browser. Use the player controls to play.')
        setIsLoading(false)
      } else {
        setErrorDetail(error?.message || 'Playback could not start.')
        setHasError(true)
        setIsLoading(false)
      }
    })
  }, [activeSource])

  const handleError = useCallback(() => {
    const video = videoRef.current
    if (video?.error?.code === 1) return
    if (sourceIndex + 1 < candidates.length) {
      setSourceIndex((index) => index + 1)
      setHasError(false)
      setIsLoading(true)
      return
    }
    setIsLoading(false)
    setErrorDetail(describeMediaError(video?.error?.code))
    setHasError(true)
  }, [candidates.length, sourceIndex])

  if (!activeSource) return null

  return (
    <div className={`relative w-full ${className}`}>
      <video
        ref={videoRef}
        src={activeSource}
        poster={poster}
        className="block w-full"
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        controls={controls}
        preload={preload}
        onLoadStart={() => setIsLoading(true)}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget
          if (video.videoWidth > 0 && video.videoHeight > 0) setHasDimensions(true)
        }}
        onCanPlay={() => setIsLoading(false)}
        onPlaying={() => {
          setIsLoading(false)
          setHasError(false)
        }}
        onWaiting={() => setIsLoading(true)}
        onError={handleError}
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
        Your browser does not support HTML video.
      </video>

      {isLoading && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/75 px-4 py-2 text-center text-xs text-white" role="status">
          Loading video
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/65 px-4 text-center text-white">
          <p className="text-sm font-semibold">Video unavailable</p>
          {errorDetail && <p className="text-xs text-white/75">{errorDetail}</p>}
        </div>
      )}

      <button
        type="button"
        onClick={handlePlay}
        disabled={isLoading}
        className="absolute bottom-3 right-3 z-10 rounded-full border border-white/30 bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-black/85 disabled:opacity-60"
        aria-label="Play"
      >
        Play
      </button>
    </div>
  )
}
