import type { VercelRequest, VercelResponse } from '@vercel/node'
import yahooFinance from 'yahoo-finance2'

function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function toYahooTicker(raw: string): string {
  const s = raw.trim().toUpperCase()
  if (s.endsWith('.SH')) return s.replace('.SH', '.SS')
  if (s.endsWith('.SZ')) return s
  if (s.endsWith('.HK')) return s

  if (s.endsWith(' HK')) return s.replace(' HK', '.HK')
  if (s.endsWith(' US')) return s.replace(' US', '')
  if (s.endsWith(' SH')) return s.replace(' SH', '.SS')
  if (s.endsWith(' SZ')) return s.replace(' SZ', '.SZ')
  return s
}

type Period = 'intraday' | '1d' | '1w' | '1m' | '1y'

function toYahooInterval(p: Period): { range: string; interval: string } {
  switch (p) {
    case 'intraday':
      return { range: '1d', interval: '5m' }
    case '1d':
      return { range: '6mo', interval: '1d' }
    case '1w':
      return { range: '2y', interval: '1wk' }
    case '1m':
      return { range: '10y', interval: '1mo' }
    case '1y':
      return { range: 'max', interval: '3mo' }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method Not Allowed' })

  const raw = String(req.query.symbol || req.query.code || '').trim()
  if (!raw) return json(res, 400, { error: 'Missing symbol' })

  const period = String(req.query.period || 'intraday') as Period
  if (!['intraday', '1d', '1w', '1m', '1y'].includes(period)) {
    return json(res, 400, { error: 'Invalid period' })
  }

  const ticker = toYahooTicker(raw)
  const { range, interval } = toYahooInterval(period)

  try {
    const chart = await yahooFinance.chart(ticker, { range, interval })
    const result = chart?.quotes ?? []

    if (period === 'intraday') {
      // time/price/volume
      const data = result
        .filter(q => q?.date && typeof q?.close === 'number')
        .map(q => ({
          time: Math.floor(new Date(q.date as any).getTime() / 1000),
          price: q.close as number,
          volume: (q.volume ?? null) as number | null,
        }))
      return json(res, 200, { symbol: raw.toUpperCase(), ticker, period, data })
    }

    // OHLCV
    const data = result
      .filter(q => q?.date && typeof q?.open === 'number' && typeof q?.high === 'number' && typeof q?.low === 'number' && typeof q?.close === 'number')
      .map(q => ({
        time: Math.floor(new Date(q.date as any).getTime() / 1000),
        open: q.open as number,
        high: q.high as number,
        low: q.low as number,
        close: q.close as number,
        volume: (q.volume ?? null) as number | null,
      }))

    return json(res, 200, { symbol: raw.toUpperCase(), ticker, period, data })
  } catch (e: any) {
    return json(res, 502, { error: 'Kline fetch failed', detail: e?.message })
  }
}
