import dotenv from 'dotenv'
import { verifyAccessToken, signAccessToken } from '../utils/tokens.js'

dotenv.config()

const { SENDGRID_API_KEY, EMAIL_FROM } = process.env

async function main() {
  console.log('SendGrid configuration check:')
  console.log(`  API key configured: ${Boolean(SENDGRID_API_KEY)}`)
  console.log(`  From email: ${EMAIL_FROM || '(not set — will use fallback)'}`)

  if (!SENDGRID_API_KEY) {
    console.log('\nSENDGRID_API_KEY is missing. Add it to your .env file to run email tests.')
    process.exit(1)
  }

  const { sendEmail, buildAdminTestEmailTemplate } = await import('../config/sendgrid.js')
  const to = process.argv[2] || process.env.SEED_ADMIN_EMAIL || 'admin@hokinterior.com'

  console.log(`\nSending test email to: ${to}`)
  const html = buildAdminTestEmailTemplate({
    adminEmail: to,
    timestamp: new Date().toISOString(),
  })

  const result = await sendEmail({
    to,
    subject: 'HOK Admin Dashboard — SendGrid Test',
    html,
  })

  if (result.sent) {
    console.log('SUCCESS: Test email sent via SendGrid.')
  } else {
    console.log(`FAILED: ${result.reason}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('SendGrid test failed:', err)
  process.exit(1)
})
