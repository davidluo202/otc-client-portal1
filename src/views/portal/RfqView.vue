<script setup lang="ts">
import { ref, reactive } from 'vue'

interface Quote {
  code: string; name: string; currency: string
  prevClose: number|null; open: number|null
  high: number|null; low: number|null
  last: number|null; volume: number|null
  week52High: number|null; week52Low: number|null
  marketState: string|null
}

// ─── Step state ───────────────────────────────────────────────
type Step = 'input' | 'quote' | 'rfq'
const step = ref<Step>('input')

// ─── Code input ───────────────────────────────────────────────
const codeInput = ref('')
const loading = ref(false)
const quoteError = ref('')
const quote = ref<Quote | null>(null)

// ─── RFQ form ─────────────────────────────────────────────────
const STRUCTURES = ['欧式看涨 (Call)', '欧式看跌 (Put)', '雪球 (Snowball)', '凤凰 (Phoenix)', '鲨鱼鳍 (Shark Fin)', '安全气囊 (Airbag)', '其他']
const TENORS = ['1个月', '2个月', '3个月', '6个月', '12个月', '18个月', '24个月']
const CURRENCIES = ['HKD', 'USD', 'CNY', 'EUR']

function detectCurrency(code: string): string {
  const c = code.trim().toUpperCase()
  if (c.endsWith(' SH') || c.endsWith('.SS') || c.endsWith(' SZ') || c.endsWith('.SZ')) return 'CNY'
  if (c.endsWith(' HK') || c.endsWith('.HK')) return 'HKD'
  if (c.endsWith(' US')) return 'USD'
  return 'HKD'
}

const rfq = reactive({
  structure: '',
  tenor: '',
  ratio: '',
  notional: '',
  currency: 'HKD',
})

const submitting = ref(false)
const submittedId = ref('')

// ─── Helpers ──────────────────────────────────────────────────
function fmt(v: number | null, digits = 2) {
  if (v == null) return '--'
  return v.toLocaleString('zh-HK', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}
function fmtVol(v: number | null) {
  if (v == null) return '--'
  if (v >= 1e8) return (v / 1e8).toFixed(2) + '亿'
  if (v >= 1e4) return (v / 1e4).toFixed(2) + '万'
  return String(v)
}

// ─── Actions ──────────────────────────────────────────────────
async function fetchQuote() {
  const code = codeInput.value.trim()
  if (!code) return
  loading.value = true
  quoteError.value = ''
  quote.value = null
  try {
    const resp = await fetch(`/api/market/quote?code=${encodeURIComponent(code)}`)
    const data = await resp.json()
    if (!resp.ok) throw new Error(data?.error || '获取行情失败')
    quote.value = data
    step.value = 'quote'
  } catch (e: any) {
    quoteError.value = e?.message || '获取行情失败，请检查标的代码'
  } finally {
    loading.value = false
  }
}

function goRfq() {
  rfq.structure = ''; rfq.tenor = ''; rfq.ratio = ''; rfq.notional = ''
  rfq.currency = detectCurrency(quote.value?.code ?? '')
  step.value = 'rfq'
}

function backToQuote() { step.value = 'quote' }
function reset() { step.value = 'input'; codeInput.value = ''; quote.value = null; submittedId.value = '' }

async function submitRfq() {
  if (!rfq.structure || !rfq.tenor || !rfq.notional) {
    alert('请填写完整询价信息'); return
  }
  submitting.value = true
  try {
    const resp = await fetch('/api/rfq/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: quote.value?.code,
        name: quote.value?.name,
        last: quote.value?.last,
        prevClose: quote.value?.prevClose,
        week52High: quote.value?.week52High,
        week52Low: quote.value?.week52Low,
        structure: rfq.structure,
        tenor: rfq.tenor,
        ratio: rfq.ratio,
        notional: rfq.notional,
        currency: rfq.currency,
      }),
    })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data?.error || '提交失败')
    submittedId.value = data.rfqId
    step.value = 'input'
    alert(`询价单已成功发出！\n询价单号：${data.rfqId}`)
  } catch (e: any) {
    alert(e?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="module-page">
    <div class="module-title">客户询价</div>

    <!-- ── Step 1: code input ── -->
    <template v-if="step === 'input'">
      <section class="card rfq-form">
        <div class="form-row">
          <div class="label">标的代码</div>
          <div class="code-row">
            <input class="input" v-model="codeInput"
              placeholder="如 700 HK · AAPL US · 600519 SH"
              @keyup.enter="fetchQuote" />
            <button class="btn btn-primary" :disabled="loading || !codeInput.trim()" @click="fetchQuote">
              {{ loading ? '查询中…' : '查询行情' }}
            </button>
          </div>
          <div class="helper" v-if="quoteError" style="color:#dc2626">{{ quoteError }}</div>
          <div class="helper" v-else>支持港股（700 HK）、美股（AAPL US）、A股（600519 SH）</div>
        </div>
      </section>
    </template>

    <!-- ── Step 2: market quote display ── -->
    <template v-else-if="step === 'quote' && quote">
      <section class="card" style="padding:16px;margin-bottom:12px">
        <div class="quote-header">
          <div>
            <div class="holding-code" style="font-size:18px">{{ quote.code }}</div>
            <div class="holding-name" style="margin-top:2px">{{ quote.name }}</div>
          </div>
          <div style="text-align:right">
            <div class="cell-val" style="font-size:22px">{{ fmt(quote.last) }}</div>
            <div class="holding-name">{{ quote.currency }} · {{ quote.marketState }}</div>
          </div>
        </div>

        <div class="quote-grid">
          <div class="quote-cell"><div class="cell-label">昨收</div><div class="cell-val">{{ fmt(quote.prevClose) }}</div></div>
          <div class="quote-cell"><div class="cell-label">开盘</div><div class="cell-val">{{ fmt(quote.open) }}</div></div>
          <div class="quote-cell"><div class="cell-label">最高</div><div class="cell-val pnl-up">{{ fmt(quote.high) }}</div></div>
          <div class="quote-cell"><div class="cell-label">最低</div><div class="cell-val pnl-down">{{ fmt(quote.low) }}</div></div>
          <div class="quote-cell"><div class="cell-label">成交量</div><div class="cell-val">{{ fmtVol(quote.volume) }}</div></div>
          <div class="quote-cell"><div class="cell-label">52周高</div><div class="cell-val pnl-up">{{ fmt(quote.week52High) }}</div></div>
          <div class="quote-cell"><div class="cell-label">52周低</div><div class="cell-val pnl-down">{{ fmt(quote.week52Low) }}</div></div>
        </div>
      </section>

      <div style="display:flex;gap:10px">
        <button class="btn btn-secondary" style="flex:1" @click="reset">重新查询</button>
        <button class="btn btn-primary"   style="flex:2" @click="goRfq">发起询价 →</button>
      </div>
    </template>

    <!-- ── Step 3: RFQ form ── -->
    <template v-else-if="step === 'rfq'">
      <div class="quote-mini-bar">
        <span class="holding-code">{{ quote?.code }}</span>
        <span class="holding-name"> {{ quote?.name }}</span>
        <span style="flex:1"/>
        <span class="cell-val">{{ fmt(quote?.last ?? null) }} {{ quote?.currency }}</span>
      </div>

      <section class="card rfq-form">
        <div class="form-row">
          <div class="label">期权结构</div>
          <select class="input" v-model="rfq.structure">
            <option value="" disabled>请选择期权结构</option>
            <option v-for="s in STRUCTURES" :key="s">{{ s }}</option>
          </select>
        </div>
        <div class="form-row">
          <div class="label">期限</div>
          <select class="input" v-model="rfq.tenor">
            <option value="" disabled>请选择期限</option>
            <option v-for="t in TENORS" :key="t">{{ t }}</option>
          </select>
        </div>
        <div class="form-row">
          <div class="label">参与比例 <span class="hint">（可选，如 100%）</span></div>
          <input class="input" v-model="rfq.ratio" placeholder="如 100%（可不填）" />
        </div>
        <div class="form-row">
          <div class="label">名义本金</div>
          <div class="code-row">
            <input class="input" v-model="rfq.notional" placeholder="请输入金额" inputmode="decimal" />
            <select class="input" style="flex:0 0 90px" v-model="rfq.currency">
              <option v-for="c in CURRENCIES" :key="c">{{ c }}</option>
            </select>
          </div>
        </div>

        <div style="display:flex;gap:10px;margin-top:6px">
          <button class="btn btn-secondary" style="flex:1" @click="backToQuote">← 返回</button>
          <button class="btn btn-primary" style="flex:2"
            :disabled="submitting || !rfq.structure || !rfq.tenor || !rfq.notional"
            @click="submitRfq">
            {{ submitting ? '提交中…' : '发出询价' }}
          </button>
        </div>
      </section>
    </template>
  </div>
</template>
