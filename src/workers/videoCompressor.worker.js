import { FFmpeg } from '@ffmpeg/ffmpeg'

const ffmpeg = new FFmpeg()
let loaded = false

async function ensureLoaded() {
  if (loaded) return
  await ffmpeg.load({
    coreURL: new URL('/ffmpeg/ffmpeg-core.js', self.location.origin).href,
    wasmURL: new URL('/ffmpeg/ffmpeg-core.wasm', self.location.origin).href,
  })
  loaded = true
}

function sendProgress(type, progress, extra = {}) {
  self.postMessage({ type, progress, ...extra })
}

async function hashBytes(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

function extensionFor(name, type) {
  const ext = String(name || '').split('.').pop()?.toLowerCase()
  if (ext && /^[a-z0-9]{2,5}$/i.test(ext)) return ext
  if (type?.includes('webm')) return 'webm'
  if (type?.includes('quicktime')) return 'mov'
  return 'mp4'
}

self.onmessage = async ({ data }) => {
  if (data?.type !== 'compress') return

  const { arrayBuffer, name, mimeType } = data
  const bytes = new Uint8Array(arrayBuffer)
  const inputName = `input.${extensionFor(name, mimeType)}`
  const outputName = 'output.mp4'

  try {
    sendProgress('preparing', 5, { originalBytes: bytes.byteLength })
    await ensureLoaded()
    await ffmpeg.writeFile(inputName, bytes)

    sendProgress('preparing', 15)
    await ffmpeg.writeFile('probe.json', new Uint8Array())
    await ffmpeg.ffprobe([
      '-v', 'error',
      '-show_entries', 'stream=index,codec_type,codec_name,pix_fmt,width,height',
      '-show_entries', 'format=format_name,duration',
      '-of', 'json',
      inputName,
      '-o', 'probe.json',
    ])
    const probeText = await ffmpeg.readFile('probe.json')
    const probe = JSON.parse(new TextDecoder().decode(probeText))
    const video = (probe.streams || []).find((stream) => stream.codec_type === 'video')
    const audio = (probe.streams || []).find((stream) => stream.codec_type === 'audio')

    if (!video) throw new Error('The selected file does not contain a playable video track.')

    const width = Number(video.width) || 0
    const height = Number(video.height) || 0
    const mp4Compatible =
      String(probe.format?.format_name || '').split(',').includes('mp4') ||
      String(probe.format?.format_name || '').includes('mov')
    const compatible =
      mp4Compatible &&
      video.codec_name === 'h264' &&
      (!audio || audio.codec_name === 'aac') &&
      video.pix_fmt === 'yuv420p' &&
      width > 0 &&
      height > 0 &&
      width <= 1080 &&
      height <= 1080

    ffmpeg.on('progress', ({ progress }) => {
      if (Number.isFinite(progress)) {
        sendProgress('compressing', Math.min(95, Math.max(20, Math.round(progress * 100))))
      }
    })
    const ffmpegLogs = []
    ffmpeg.on('log', ({ message }) => {
      ffmpegLogs.push(String(message || '').slice(0, 500))
      if (ffmpegLogs.length > 20) ffmpegLogs.shift()
    })

    let exitCode
    if (compatible) {
      exitCode = await ffmpeg.exec([
        '-i', inputName,
        '-map', '0:v:0',
        '-map', '0:a?',
        '-c', 'copy',
        '-movflags', '+faststart',
        '-sn', '-dn',
        outputName,
      ])
    } else {
      const args = [
        '-i', inputName,
        '-map', '0:v:0',
        '-map', '0:a?',
        '-vf', "scale=w='min(1080,iw)':h=-2,setsar=1",
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '27',
        '-pix_fmt', 'yuv420p',
        '-profile:v', 'high',
        '-level', '4.1',
        '-sn', '-dn',
      ]
      if (audio) args.push('-c:a', 'aac', '-b:a', '128k')
      args.push('-movflags', '+faststart', outputName)
      exitCode = await ffmpeg.exec(args)
    }

    if (exitCode !== 0) {
      throw new Error(`Video compression failed (FFmpeg exit code ${exitCode}). ${ffmpegLogs.slice(-8).join(' ')}`)
    }

    const output = await ffmpeg.readFile(outputName)
    if (!(output instanceof Uint8Array) || output.byteLength < 1024) {
      throw new Error('Compression produced an invalid or empty MP4 file.')
    }

    const contentHash = await hashBytes(output)
    sendProgress('compressing', 100)
    self.postMessage({
      type: 'complete',
      file: new Blob([output], { type: 'video/mp4' }),
      contentHash,
      originalBytes: bytes.byteLength,
      compressedBytes: output.byteLength,
      reencoded: !compatible,
      width,
      height,
    }, [])
  } catch (error) {
    sendProgress('error', 0, {
      message: error?.message || 'The video could not be compressed.',
    })
  } finally {
    try { await ffmpeg.deleteFile(inputName) } catch (error) { console.debug(error) }
    try { await ffmpeg.deleteFile(outputName) } catch (error) { console.debug(error) }
    try { await ffmpeg.deleteFile('probe.json') } catch (error) { console.debug(error) }
  }
}
