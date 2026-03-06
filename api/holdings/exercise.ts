import type { VercelRequest, VercelResponse } from '@vercel/node'

function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method Not Allowed' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const { holdingId, code } = body || {}
  if (!holdingId) return json(res, 400, { error: 'Missing holdingId' })

  // TODO: forward to back-office exercise endpoint
  console.log('[EXERCISE request]', { holdingId, code, at: new Date().toISOString() })

  return json(res, 200, { ok: true, status: 'SUBMITTED' })
}
