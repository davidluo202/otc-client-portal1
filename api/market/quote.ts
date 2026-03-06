import type { VercelRequest, VercelResponse } from '@vercel/node'
import yahooFinance from 'yahoo-finance2'

function json(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

/**
 * Map user-friendly codes like "700 HK" or "AAPL US" to Yahoo Finance tickers.
 * Heuristic: trailing " HK" → ".HK", trailing " US" → no suffix (NASDAQ/NYSE).
 */
function toYahooTicker(raw: string): string {
  const s = raw.trim().toUpperCase()
  if (s.endsWith(' HK')) return s.replace(' HK', '.HK')
  if (s.endsWith(' US')) return s.replace(' US', '')
  if (s.endsWith(' SH')) return s.replace(' SH', '.SS')
  if (s.endsWith(' SZ')) return s.replace(' SZ', '.SZ')
  return s
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method Not Allowed' })

  const raw = String(req.query.code || '').trim()
  if (!raw) return json(res, 400, { error: 'Missing code' })

  const ticker = toYahooTicker(raw)

  try {
    const q = await yahooFinance.quote(ticker)
    const s = await yahooFinance.quoteSummary(ticker, {
      modules: ['summaryDetail', 'price'],
    })

    const sd = s.summaryDetail ?? {}
    const pr = s.price ?? {}

    return json(res, 200, {
      code: raw.toUpperCase(),
      ticker,
      name:            pr.longName ?? pr.shortName ?? ticker,
      currency:        pr.currency ?? 'HKD',
      prevClose:       q.regularMarketPreviousClose ?? null,
      open:            q.regularMarketOpen ?? null,
      high:            q.regularMarketDayHigh ?? null,
      low:             q.regularMarketDayLow ?? null,
      last:            q.regularMarketPrice ?? null,
      volume:          q.regularMarketVolume ?? null,
      week52High:      q.fiftyTwoWeekHigh ?? sd.fiftyTwoWeekHigh ?? null,
      week52Low:       q.fiftyTwoWeekLow  ?? sd.fiftyTwoWeekLow  ?? null,
      marketState:     q.marketState ?? null,
    })
  } catch (e: any) {
    return json(res, 502, { error: 'Quote fetch failed', detail: e?.message })
  }
}
