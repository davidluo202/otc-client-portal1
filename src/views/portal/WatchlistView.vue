<script setup lang="ts">
import { ref } from 'vue'

const newCode = ref('')

// Placeholder watchlist
const watchlist = ref([
  { code: '700 HK',  name: '腾讯控股', last: 318.4, chg: +1.2 },
  { code: 'BABA US', name: '阿里巴巴', last: 98.5,  chg: -0.8 },
  { code: 'NVDA US', name: 'Nvidia',   last: 875.0,  chg: +3.4 },
])

function addCode() {
  const c = newCode.value.trim().toUpperCase()
  if (!c) return
  if (watchlist.value.find(w => w.code === c)) { newCode.value = ''; return }
  watchlist.value.push({ code: c, name: '（待获取）', last: 0, chg: 0 })
  newCode.value = ''
  // TODO: call /api/market/quote to fetch live data
}

function remove(code: string) {
  watchlist.value = watchlist.value.filter(w => w.code !== code)
}
</script>

<template>
  <div class="module-page">
    <div class="module-title">客户关注标的</div>

    <section class="card rfq-form">
      <div class="code-row">
        <input class="input" v-model="newCode" placeholder="输入标的代码，如 700 HK" @keyup.enter="addCode" />
        <button class="btn btn-primary" @click="addCode">添加</button>
      </div>
    </section>

    <div class="card-list" style="margin-top:14px">
      <div class="watch-card" v-for="w in watchlist" :key="w.code">
        <div class="holding-top">
          <div>
            <span class="holding-code">{{ w.code }}</span>
            <span class="holding-name">{{ w.name }}</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span :class="['watch-chg', w.chg >= 0 ? 'pnl-up' : 'pnl-down']">
              {{ w.chg >= 0 ? '+' : '' }}{{ w.chg.toFixed(2) }}%
            </span>
            <button class="btn-remove" @click="remove(w.code)">✕</button>
          </div>
        </div>
        <div class="watch-last">最新价 <strong>{{ w.last.toFixed(2) }}</strong></div>
      </div>
    </div>
    <div v-if="watchlist.length === 0" class="empty-tip">暂无关注标的，请添加</div>
  </div>
</template>
