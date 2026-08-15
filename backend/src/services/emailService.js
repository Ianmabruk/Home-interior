import SibApiV3Sdk from '@sendinblue/client'

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
const apiKey = apiInstance.authentications['apiKey']
apiKey.apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || ''

export async function sendOrderConfirmationEmail({ order, toEmail, siteName, supportEmail }) {
  if (!toEmail) {
    console.warn('[emailService] No recipient email provided for order confirmation')
    return { skipped: true, reason: 'no_recipient' }
  }

  if (!apiKey.apiKey) {
    console.warn('[emailService] Brevo API key not configured. Skipping order confirmation email.')
    return { skipped: true, reason: 'not_configured' }
  }

  const trackingUrl = `${process.env.CLIENT_URL || process.env.BASE_URL || 'https://hokinteriors.co.ke'}/track-order?tracking=${encodeURIComponent(order.trackingNumber || '')}`

  const html = buildHtmlEmail({
    order,
    trackingUrl,
    siteName: siteName || 'HOK Interiors',
    supportEmail: supportEmail || 'info@hokinteriors.co.ke',
  })

  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail({
      to: [{ email: toEmail, name: order.name || 'Customer' }],
      sender: { email: process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'info@hokinteriors.co.ke', name: siteName || 'HOK Interiors' },
      subject: `Order Confirmation ${order.trackingNumber || ''} — ${siteName || 'HOK Interiors'}`,
      htmlContent: html,
    })

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail)
    return { skipped: false, messageId: result?.messageId || null }
  } catch (err) {
    console.error('[emailService] Failed to send order confirmation:', err)
    return { skipped: true, reason: 'send_failed', error: err?.message }
  }
}

function buildHtmlEmail({ order, trackingUrl, siteName, supportEmail }) {
  const itemsHtml = buildItemRows(order.items)
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date()
  const formattedDate = orderDate.toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Nairobi',
  })

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmation</title>
</head>
<body style="margin:0;padding:0;background-color:#faf8f4;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#2a241f;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <div style="background:#ffffff;border-radius:24px;padding:28px;border:1px solid rgba(42,36,31,0.08);box-shadow:0 10px 40px rgba(42,36,31,0.06);">
      <div style="text-align:center;margin-bottom:18px;">
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;color:#2a241f;letter-spacing:0.02em;">HOK <span style="color:#e89a43;">Interiors</span></div>
        <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;margin-top:8px;">Order Confirmation</div>
      </div>

      <p style="margin:0 0 18px;font-size:15px;color:#2a241f;">Thank you for your order, ${order.name || 'valued customer'}.</p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf8f4;border-radius:16px;padding:14px 16px;margin-bottom:18px;">
        <tr>
          <td style="width:50%;padding:8px 12px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Order</div>
            <div style="font-size:14px;color:#2a241f;margin-top:6px;">#${String(order._id || order.id || '').slice(-8).toUpperCase()}</div>
          </td>
          <td style="width:50%;padding:8px 12px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Date</div>
            <div style="font-size:14px;color:#2a241f;margin-top:6px;">${formattedDate}</div>
          </td>
        </tr>
        <tr>
          <td style="width:50%;padding:8px 12px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Status</div>
            <div style="font-size:14px;color:#2a241f;margin-top:6px;text-transform:capitalize;">${order.status || 'Pending'}</div>
          </td>
          <td style="width:50%;padding:8px 12px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Tracking</div>
            <div style="font-size:14px;color:#e89a43;margin-top:6px;font-weight:700;">${order.trackingNumber || 'N/A'}</div>
          </td>
        </tr>
      </table>

      <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;margin-bottom:10px;">Items</div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${itemsHtml || '<tr><td style="padding:12px 0;color:#6b6055;font-size:14px;">No items</td></tr>'}
      </table>

      <hr style="border:0;border-top:1px solid #f0ebe3;margin:18px 0;" />

      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#6b6055;">Subtotal</td>
          <td style="padding:6px 0;font-size:13px;color:#2a241f;text-align:right;font-weight:600;">KSh ${Number(order.total || 0).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#6b6055;">Shipping</td>
          <td style="padding:6px 0;font-size:13px;color:#2a241f;text-align:right;font-weight:600;">Free</td>
        </tr>
      </table>

      <hr style="border:0;border-top:1px solid #f0ebe3;margin:18px 0;" />

      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:16px;color:#2a241f;font-weight:700;">Total</td>
          <td style="font-size:16px;color:#2a241f;font-weight:700;text-align:right;">KSh ${Number(order.total || 0).toLocaleString()}</td>
        </tr>
      </table>

      <div style="text-align:center;margin-top:24px;">
        <a href="${trackingUrl}" target="_blank" style="display:inline-block;padding:14px 22px;border-radius:9999px;background:#2a241f;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Track Your Order</a>
      </div>

      <div style="text-align:center;margin-top:12px;">
        <a href="${process.env.BASE_URL || 'https://hokinteriors.co.ke'}/shop" target="_blank" style="display:inline-block;padding:14px 22px;border-radius:9999px;background:#ffffff;color:#2a241f;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;border:1px solid rgba(42,36,31,0.15);">Continue Shopping</a>
      </div>

      <div style="text-align:center;margin-top:24px;font-size:12px;color:#a89f91;">
        ${siteName || 'HOK Interiors'} · Need help? Contact us at ${supportEmail || 'info@hokinteriors.co.ke'}
      </div>
    </div>
  </div>
</body>
</html>`
}

function buildItemRows(items) {
  const safeItems = Array.isArray(items) ? items : []
  return safeItems
    .map((item) => {
      const imageUrl = item.image || item.selectedVariant?.image || ''
      const name = item.name || item.productName || 'Product'
      const qty = Number(item.quantity || 1)
      const unitPrice = Number(item.price || item.discountPrice || 0)
      const total = unitPrice * qty
      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #f0ebe3;vertical-align:top;">
            <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
              <tr>
                <td style="width:72px;vertical-align:top;">
                  ${
                    imageUrl
                      ? `<img src="${imageUrl}" alt="${name}" width="64" height="64" style="display:block;width:64px;height:64px;border-radius:12px;object-fit:cover;background:#f0ebe3;" />`
                      : `<div style="width:64px;height:64px;border-radius:12px;background:#f0ebe3;color:#a89f91;text-align:center;line-height:64px;font-size:11px;">No img</div>`
                  }
                </td>
                <td style="padding-left:14px;vertical-align:top;">
                  <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;color:#2a241f;font-weight:600;">${name}</div>
                  ${
                    item.selectedVariant?.color
                      ? `<div style="font-family:system-ui,sans-serif;font-size:12px;color:#8b5e3c;margin-top:4px;">Variant: ${item.selectedVariant.color}</div>`
                      : ''
                  }
                  <div style="font-family:system-ui,sans-serif;font-size:12px;color:#6b6055;margin-top:6px;">Qty: ${qty}</div>
                </td>
                <td style="text-align:right;vertical-align:top;white-space:nowrap;">
                  <div style="font-family:system-ui,sans-serif;font-size:14px;color:#2a241f;font-weight:600;">KSh ${total.toLocaleString()}</div>
                  <div style="font-family:system-ui,sans-serif;font-size:11px;color:#a89f91;margin-top:4px;">${unitPrice.toLocaleString()} each</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `
    })
    .join('')
}

export default {
  sendOrderConfirmationEmail,
}
