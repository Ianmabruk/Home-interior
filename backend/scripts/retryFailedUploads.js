#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { uploadToCloudinary } from '../src/config/cloudinary.js'
import { supabase, isSupabaseConfigured } from '../src/config/supabase.js'

const root = process.cwd()
const failuresFile = path.join(root, 'backups', 'upload-failures.jsonl')
const successLog = path.join(root, 'backups', 'upload-retries.jsonl')
const failedLog = path.join(root, 'backups', 'upload-retries-failed.jsonl')

function ensureBackupsDir() {
  try { fs.mkdirSync(path.join(root, 'backups'), { recursive: true }) } catch {}
}

async function reuploadEntry(entry) {
  const localPath = entry.localPath || entry.localPath
  if (!localPath) throw new Error('No localPath on entry')
  const abs = localPath.startsWith('/') ? path.join(root, localPath) : path.join(root, localPath)
  if (!fs.existsSync(abs)) throw new Error('Local file not found: ' + abs)
  const buffer = fs.readFileSync(abs)
  const mime = entry.mimeType || 'application/octet-stream'
  const folder = (entry.intended && entry.intended.folder) || 'misc'

  if (entry.intended && entry.intended.provider === 'supabase') {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
    const ext = mime.split('/')[1] || 'bin'
    const fileName = `${folder}/${Date.now()}-retry.${ext}`
    const { data, error } = await supabase.storage.from('uploads').upload(fileName, buffer, { contentType: mime, upsert: false })
    if (error) throw error
    const { data: publicData } = supabase.storage.from('uploads').getPublicUrl(fileName)
    return { provider: 'supabase', url: publicData.publicUrl, path: fileName }
  }

  // Default: attempt Cloudinary
  try {
    const uploaded = await uploadToCloudinary(buffer, mime, folder)
    return { provider: 'cloudinary', url: uploaded.url, path: uploaded.publicId }
  } catch (err) {
    throw err
  }
}

async function run() {
  ensureBackupsDir()
  if (!fs.existsSync(failuresFile)) {
    console.log('No failures file found at', failuresFile)
    process.exit(0)
  }

  const lines = fs.readFileSync(failuresFile, 'utf8').split('\n').filter(Boolean)
  console.log(`Found ${lines.length} entries to retry`)
  for (const l of lines) {
    let entry
    try {
      entry = JSON.parse(l)
    } catch (e) {
      console.error('Skipping invalid line:', e.message)
      continue
    }
    try {
      const res = await reuploadEntry(entry)
      const out = { time: new Date().toISOString(), original: entry, result: res }
      fs.appendFileSync(successLog, JSON.stringify(out) + '\n')
      console.log('Reuploaded:', res.url || res.path)
    } catch (err) {
      const out = { time: new Date().toISOString(), original: entry, error: String(err) }
      fs.appendFileSync(failedLog, JSON.stringify(out) + '\n')
      console.error('Reupload failed for', entry.localPath, String(err))
    }
  }
}

run().catch((e) => {
  console.error('Retry script failed:', e?.message || e)
  process.exit(1)
})
