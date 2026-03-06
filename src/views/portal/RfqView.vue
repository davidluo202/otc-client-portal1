<script setup lang="ts">
import { ref } from 'vue'

const code = ref('')
const direction = ref<'buy' | 'sell'>('buy')
const qty = ref('')
const submitting = ref(false)

// Placeholder RFQ history
const history = [
  { id: 'RFQ240001', code: '700 HK', dir: '买入', qty: 500, status: '已报价', time: '09:35' },
  { id: 'RFQ240002', code: '9988 HK', dir: '卖出', qty: 200, status: '待报价', time: '10:12' },
]

async function submit() {
  if (!code.value || !qty.value) return
  submitting.value = true
  // TODO: call POST /api/rfq/submit
  await new Promise(r => setTimeout(r, 800))
  alert(`询价已提交（Demo）: ${direction.value === 'buy' ? '买入' : '卖出'} ${code.value} × ${qty.value}`)
  code.value = ''; qty.value = ''
  submitting.value = false
}
</script>

<template>
  <div class="module-page">
    <div class="module-title">客户询价</div>

    <section class="card rfq-form">
      <div class="form-row">
        <div class="label">标的代码</div>
        <input class="input" v-model="code" placeholder="如 700 HK / AAPL US" />
      </div>
      <div class="form-row">
        <div class="label">方向</div>
        <div class="btn-group">
          <button :class="['btn btn-dir', direction === 'buy' ? 'active-buy' : '']" @click="direction = 'buy'">买入</button>
          <button :class="['btn btn-dir', direction === 'sell' ? 'active-sell' : '']" @click="direction = 'sell'">卖出</button>
        </div>
      </div>
      <div class="form-row">
        <div class="label">数量</div>
        <input class="input" v-model="qty" placeholder="请输入数量" inputmode="numeric" />
      </div>
      <button class="btn btn-primary" style="width:100%" :disabled="submitting || !code || !qty" @click="submit">
        {{ submitting ? '提交中…' : '提交询价' }}
      </button>
    </section>

    <div class="module-title" style="margin-top:20px">询价记录</div>
    <div class="card-list">
      <div class="rfq-card" v-for="r in history" :key="r.id">
        <div class="rfq-top">
          <span class="holding-code">{{ r.code }}</span>
          <span :class="['rfq-status', r.status === '已报价' ? 'status-ok' : 'status-wait']">{{ r.status }}</span>
        </div>
        <div class="rfq-meta">{{ r.dir }} × {{ r.qty }} &nbsp;·&nbsp; {{ r.time }}</div>
      </div>
    </div>
    <div v-if="history.length === 0" class="empty-tip">暂无询价记录</div>
  </div>
</template>
