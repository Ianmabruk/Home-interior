import dotenv from 'dotenv'

dotenv.config()

import bcrypt from 'bcryptjs'
import { supabase } from '../config/supabase.js'
import { env } from '../config/env.js'

const seedAdmin = async () => {
  try {
    const adminEmail = env.seedAdminEmail.toLowerCase()
    const adminPassword = env.seedAdminPassword
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12)

    console.log(`[AUTO-SEED] Seeding admin: ${adminEmail} | passwordLen=${adminPassword.length}`)

    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }

    if (data) {
      const updateResult = await supabase
        .from('users')
        .update({
          full_name: 'HOK Platform Admin',
          email: adminEmail,
          role: 'admin',
          is_active: true,
          password_hash: adminPasswordHash,
        })
        .eq('id', data.id)

      if (updateResult.error) {
        throw new Error(updateResult.error.message)
      }

      console.log(`[AUTO-SEED] Admin user updated successfully (id=${data.id})`)
    } else {
      const insertResult = await supabase
        .from('users')
        .insert([{
          full_name: 'HOK Platform Admin',
          email: adminEmail,
          role: 'admin',
          is_active: true,
          password_hash: adminPasswordHash,
        }])

      if (insertResult.error) {
        throw new Error(insertResult.error.message)
      }

      console.log('[AUTO-SEED] Admin user created successfully')
    }

    console.log('[AUTO-SEED] Admin seed completed successfully')
    console.log(`[AUTO-SEED] Login with: ${adminEmail} / ${adminPassword}`)
  } catch (error) {
    console.error('[AUTO-SEED] Admin seed failed', error)
    throw error
  }
}

const isMain = import.meta.url === `file://${process.argv[1]}`

if (isMain) {
  seedAdmin().catch((err) => {
    console.error('Admin seed failed', err)
    process.exit(1)
  })
}

export default seedAdmin
