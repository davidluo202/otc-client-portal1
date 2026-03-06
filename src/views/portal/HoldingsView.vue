<script setup lang="ts">
// Placeholder data — replace with real API
const holdings = [
  { code: '700 HK', name: '腾讯控股', qty: 1000, cost: 310.0, last: 318.4, pnl: 8400 },
  { code: '9988 HK', name: '阿里巴巴', qty: 500, cost: 72.5, last: 68.2, pnl: -2150 },
  { code: 'AAPL US', name: 'Apple Inc', qty: 200, cost: 165.0, last: 174.5, pnl: 1900 },
]

function fmt(n: number, digits = 2) {
  return n.toLocaleString('zh-HK', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}
</script>

<template>
  <div class="module-page">
    <div class="module-title">客户持仓</div>

    <div class="card-list">
      <div class="holding-card" v-for="h in holdings" :key="h.code">
        <div class="holding-top">
          <div>
            <span class="holding-code">{{ h.code }}</span>
            <span class="holding-name">{{ h.name }}</span>
          </div>
          <span :class="['holding-pnl', h.pnl >= 0 ? 'pnl-up' : 'pnl-down']">
            {{ h.pnl >= 0 ? '+' : '' }}{{ fmt(h.pnl) }}
          </span>
        </div>
        <div class="holding-row">
          <div class="holding-cell">
            <div class="cell-label">持仓量</div>
            <div class="cell-val">{{ fmt(h.qty, 0) }}</div>
          </div>
          <div class="holding-cell">
            <div class="cell-label">成本价</div>
            <div class="cell-val">{{ fmt(h.cost) }}</div>
          </div>
          <div class="holding-cell">
            <div class="cell-label">最新价</div>
            <div class="cell-val">{{ fmt(h.last) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- placeholder for empty state -->
    <div v-if="holdings.length === 0" class="empty-tip">暂无持仓数据</div>
  </div>
</template>
