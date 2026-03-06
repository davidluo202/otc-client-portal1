import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'node:crypto'

function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method Not Allowed' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const {
    code, name, structure, tenor, ratio,
    notional, currency, last, prevClose, week52High, week52Low,
  } = body

  if (!code || !structure || !tenor || !notional || !currency) {
    return json(res, 400, { error: '缺少必要字段' })
  }

  const rfqId = `RFQ${Date.now().toString(36).toUpperCase()}`

  // TODO: forward to back-office system / save to database
  console.log('[RFQ submitted]', {
    rfqId, code, name, structure, tenor, ratio,
    notional, currency, last, prevClose, week52High, week52Low,
    submittedAt: new Date().toISOString(),
  })

  return json(res, 200, { ok: true, rfqId })
}
