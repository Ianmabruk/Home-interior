import sgMail from '@sendgrid/mail'
import { env } from './env.js'

if (env.sendGridApiKey) {
  sgMail.setApiKey(env.sendGridApiKey)
}

export const sendEmail = async ({ to, subject, html }) => {
  if (!env.sendGridApiKey) {
    return { sent: false, reason: 'SENDGRID_API_KEY is not configured' }
  }

  await sgMail.send({
    to,
    from: env.emailFrom,
    subject,
    html,
  })

  return { sent: true }
}

export const buildAdminTestEmailTemplate = ({ adminEmail, timestamp }) => {
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background:#f7f4ef; padding:32px;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <div style="background:linear-gradient(135deg, #111111 0%, #2a2a2a 100%); color:#ffffff; padding:28px 32px; text-align:center;">
          <h1 style="margin:0; font-size:26px; letter-spacing:0.1em; font-weight:300;">HOK</h1>
          <p style="margin:6px 0 0; color:#c25b3f; font-size:11px; letter-spacing:0.25em; text-transform:uppercase;">Interior Designs</p>
        </div>
        <div style="padding:32px; color:#252525;">
          <p style="margin:0 0 16px; font-size:15px; line-height:1.6;">This confirms your SendGrid integration is active and ready to send transactional emails.</p>
          <table style="width:100%; border-collapse:collapse; margin:20px 0; border-radius:12px; overflow:hidden; border:1px solid #e8e1d5;">
            <tr>
              <td style="padding:12px 16px; background:#faf8f5; font-size:12px; color:#8a7f70; text-transform:uppercase; letter-spacing:0.08em; width:40%;">Admin</td>
              <td style="padding:12px 16px; font-size:14px; color:#2c2c2c;">${adminEmail}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px; background:#faf8f5; font-size:12px; color:#8a7f70; text-transform:uppercase; letter-spacing:0.08em;">Timestamp</td>
              <td style="padding:12px 16px; font-size:14px; color:#2c2c2c;">${timestamp}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px; background:#faf8f5; font-size:12px; color:#8a7f70; text-transform:uppercase; letter-spacing:0.08em;">Status</td>
              <td style="padding:12px 16px; font-size:14px; color:#16a34a; font-weight:600;">Delivered</td>
            </tr>
          </table>
          <p style="margin:0; font-size:12px; color:#8a7f70; line-height:1.6;">If this message was unexpected, review Admin access and API keys immediately. Contact support if you need assistance.</p>
        </div>
        <div style="padding:20px 32px; text-align:center; border-top:1px solid #e8e1d5;">
          <p style="margin:0; font-size:11px; color:#b8a99a; letter-spacing:0.05em;">HOK Interior Designs &mdash; Timeless spaces, elevated living.</p>
        </div>
      </div>
    </div>
  `
}
