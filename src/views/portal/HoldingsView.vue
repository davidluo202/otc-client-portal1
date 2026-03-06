<script setup lang="ts">
import { computed } from 'vue'

type HoldingStatus = 'ACTIVE' | 'EXPIRED' | 'EXERCISED'

interface OptionHolding {
  id: string
  code: string
  underlyingName: string
  structure: string
  expiryDate: string // YYYY-MM-DD
  notional: number
  currency: 'HKD' | 'USD' | 'CNY'
  premiumPaid: number
  estPnl: number
  status: HoldingStatus
}

// Demo holdings — replace with real API
const holdings = computed<OptionHolding[]>(() => {
  return [
    {
      id: 'H001',
      code: '700 HK',
      underlyingName: '腾讯控股',
      structure: '雪球 (Snowball)',
      expiryDate: '2026-04-15',
      notional: 2000000,
      currency: 'HKD',
      premiumPaid: 68000,
      estPnl: 12500,
      status: 'ACTIVE',
    },
    {
      id: 'H002',
      code: 'AAPL US',
      underlyingName: 'Apple Inc',
      structure: '欧式看涨 (Call)',
      expiryDate: '2026-03-01',
      notional: 150000,
      currency: 'USD',
      premiumPaid: 2100,
      estPnl: -350,
      status: 'EXPIRED',
    },
  ]
})

function fmtMoney(n: number, ccy: string) {
  return `${ccy} ${n.toLocaleString('zh-HK', { maximumFractionDigits: 2 })}`
}

function todayIso() {
  // local date in YYYY-MM-DD
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function isExpired(h: OptionHolding) {
  return h.expiryDate < todayIso() || h.status === 'EXPIRED'
}

function canExercise(h: OptionHolding) {
  if (h.status === 'EXERCISED') return false
  return !isExpired(h)
}

function statusText(h: OptionHolding) {
  if (h.status === 'EXERCISED') return '已行权'
  if (isExpired(h)) return '已过期'
  return '进行中'
}

function statusClass(h: OptionHolding) {
  if (h.status === 'EXERCISED') return 'status-ok'
  if (isExpired(h)) return 'status-expired'
  return 'status-wait'
}

function calcExercisePnlPreview(h: OptionHolding) {
  // Placeholder: in real life depends on payoff + settlement
  // Here we show a simple preview: estPnl - premiumPaid
  return h.estPnl - h.premiumPaid
}

async function exercise(h: OptionHolding) {
  if (!canExercise(h)) return

  const ok = confirm(
    `确认对该笔持仓行权？\n\n标的：${h.code}\n结构：${h.structure}\n到期日：${h.expiryDate}\n\n注意：到期日前方可行权。`
  )
  if (!ok) return

  const pnlPreview = calcExercisePnlPreview(h)

  try {
    const resp = await fetch('/api/holdings/exercise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holdingId: h.id, code: h.code }),
    })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data?.error || '提交失败')

    alert(`已提交后台处理（Demo）。\n预估行权后盈亏：${fmtMoney(pnlPreview, h.currency)}`)
  } catch (e: any) {
    alert(e?.message || '提交失败')
  }
}
</script>

<template>
  <div class="module-page">
    <div class="module-title">客户持仓</div>

    <div class="card-list">
      <div class="holding-card" v-for="h in holdings" :key="h.id">
        <div class="holding-top">
          <div>
            <div>
              <span class="holding-code">{{ h.code }}</span>
              <span class="holding-name">{{ h.underlyingName }}</span>
            </div>
            <div class="holding-name" style="margin-top: 2px">
              {{ h.structure }} · 到期日 {{ h.expiryDate }}
            </div>
          </div>
          <span :class="['rfq-status', statusClass(h)]">{{ statusText(h) }}</span>
        </div>

        <div class="holding-row" style="grid-template-columns: repeat(2, 1fr)">
          <div class="holding-cell">
            <div class="cell-label">名义本金</div>
            <div class="cell-val">{{ fmtMoney(h.notional, h.currency) }}</div>
          </div>
          <div class="holding-cell">
            <div class="cell-label">已付权利金</div>
            <div class="cell-val">{{ fmtMoney(h.premiumPaid, h.currency) }}</div>
          </div>
          <div class="holding-cell">
            <div class="cell-label">当前盈亏（估算）</div>
            <div :class="['cell-val', h.estPnl >= 0 ? 'pnl-up' : 'pnl-down']">
              {{ h.estPnl >= 0 ? '+' : '' }}{{ fmtMoney(h.estPnl, h.currency) }}
            </div>
          </div>
          <div class="holding-cell">
            <div class="cell-label">行权后盈亏（初算）</div>
            <div :class="['cell-val', calcExercisePnlPreview(h) >= 0 ? 'pnl-up' : 'pnl-down']">
              {{ calcExercisePnlPreview(h) >= 0 ? '+' : '' }}{{ fmtMoney(calcExercisePnlPreview(h), h.currency) }}
            </div>
          </div>
        </div>

        <div style="margin-top: 12px; display: flex; gap: 10px">
          <button class="btn btn-primary" style="flex: 1" :disabled="!canExercise(h)" @click="exercise(h)">
            行权
          </button>
          <button class="btn btn-secondary" style="flex: 1" disabled>
            明细（预留）
          </button>
        </div>

        <div v-if="isExpired(h)" class="helper" style="margin-top: 10px">
          该笔交易已过期，交易终结。
        </div>
      </div>
    </div>

    <div v-if="holdings.length === 0" class="empty-tip">暂无持仓数据</div>
  </div>
</template>
