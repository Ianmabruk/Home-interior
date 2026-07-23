import { supabase, isSupabaseConfigured } from '../config/supabase.js'
import { uploadToCloudinary, deleteFromCloudinary, deleteManyFromCloudinary } from '../config/cloudinary.js'
import { failure } from '../utils/response.js'

export async function uploadFile(buffer, mimetype, folder) {
  if (isSupabaseConfigured()) {
    return uploadToSupabase(buffer, mimetype, folder)
  }
  const uploaded = await uploadToCloudinary(buffer, mimetype, folder)
  return { url: uploaded.url, path: uploaded.publicId, mimeType: mimetype }
}

async function uploadToSupabase(buffer, mimetype, folder) {
  const ext = mimetype.split('/')[1] || 'bin'
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, buffer, {
      contentType: mimetype,
      upsert: false,
    })

  if (error) throw failure(500, `Upload failed: ${error.message}`)

  const { data: publicData } = supabase.storage.from('uploads').getPublicUrl(fileName)

  return { url: publicData.publicUrl, path: fileName, mimeType: mimetype }
}

export async function deleteFile(storagePath) {
  if (!storagePath) return
  if (isSupabaseConfigured()) {
    await deleteFromSupabase(storagePath)
  } else {
    await deleteFromCloudinary(storagePath)
  }
}

async function deleteFromSupabase(storagePath) {
  await supabase.storage.from('uploads').remove([storagePath])
}

export async function deleteFiles(storagePaths) {
  if (!Array.isArray(storagePaths) || storagePaths.length === 0) return
  const valid = storagePaths.filter(Boolean)
  if (valid.length === 0) return
  if (isSupabaseConfigured()) {
    await Promise.allSettled(valid.map(deleteFromSupabase))
  } else {
    await deleteManyFromCloudinary(valid)
  }
}
