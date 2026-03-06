import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'node:crypto'

function json(res: VercelResponse, status: number, body: any) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function sign(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method Not Allowed' })

  const otpSecret = process.env.OTP_SIGNING_SECRET
  if (!otpSecret) return json(res, 500, { error: 'Server not configured (missing env)' })

  const { email, code, challenge } = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as {
    email?: string
    code?: string
    challenge?: string
  }

  const normalized = (email || '').trim().toLowerCase()
  const codeTrim = (code || '').trim()
  if (!/^\S+@\S+\.\S+$/.test(normalized)) return json(res, 400, { error: 'Invalid email' })
  if (!/^\d{6}$/.test(codeTrim)) return json(res, 400, { error: 'Invalid code' })
  if (!challenge) return json(res, 400, { error: 'Missing challenge' })

  let decoded: string
  try {
    decoded = Buffer.from(challenge, 'base64url').toString('utf8')
  } catch {
    return json(res, 400, { error: 'Invalid challenge' })
  }

  const parts = decoded.split('|')
  if (parts.length !== 3) return json(res, 400, { error: 'Invalid challenge' })
  const [chEmail, chExpStr, chSig] = parts

  if (chEmail !== normalized) return json(res, 401, { error: 'Email mismatch' })

  const exp = Number(chExpStr)
  if (!Number.isFinite(exp)) return json(res, 400, { error: 'Invalid challenge exp' })
  if (Math.floor(Date.now() / 1000) > exp) return json(res, 401, { error: 'Code expired' })

  const payload = `${normalized}|${exp}|${codeTrim}`
  const expectedSig = sign(otpSecret, payload)
  if (!crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(chSig))) {
    return json(res, 401, { error: 'Code incorrect' })
  }

  // TODO: integrate with real auth system
  return json(res, 200, { ok: true })
}
