import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'node:crypto'
import sgMail from '@sendgrid/mail'

function json(res: VercelResponse, status: number, body: any) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function randomCode(): string {
  // 6-digit numeric
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
}

function sign(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method Not Allowed' })

  const apiKey = process.env.SENDGRID_API_KEY
  const fromEmail = process.env.SENDGRID_FROM_EMAIL
  const fromName = process.env.SENDGRID_FROM_NAME || '诚港金融场外服务公司'
  const otpSecret = process.env.OTP_SIGNING_SECRET

  if (!apiKey || !fromEmail || !otpSecret) {
    return json(res, 500, { error: 'Server not configured (missing env)' })
  }

  const { email } = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as { email?: string }
  const normalized = (email || '').trim().toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(normalized)) {
    return json(res, 400, { error: 'Invalid email' })
  }

  const code = randomCode()
  const ttlSeconds = 90
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds

  // Stateless challenge token:
  // challenge = base64url(email|exp|sig)
  const payload = `${normalized}|${exp}|${code}`
  const sig = sign(otpSecret, payload)
  const challenge = Buffer.from(`${normalized}|${exp}|${sig}`).toString('base64url')

  sgMail.setApiKey(apiKey)

  const subject = '【诚港金融场外服务公司】邮箱验证码'
  const text = `您的验证码为：${code}\n\n有效期：${ttlSeconds} 秒。\n若非本人操作，请忽略此邮件。`

  try {
    await sgMail.send({
      to: normalized,
      from: { email: fromEmail, name: fromName },
      subject,
      text,
    })

    return json(res, 200, { ok: true, exp, ttlSeconds, challenge })
  } catch (e: any) {
    return json(res, 502, { error: 'SendGrid send failed', detail: e?.message })
  }
}
