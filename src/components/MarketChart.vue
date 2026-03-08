<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createChart, type IChartApi, type ISeriesApi, LineSeries, CandlestickSeries } from 'lightweight-charts'

type Period = 'intraday' | '1d' | '1w' | '1m' | '1y'

const props = defineProps<{ symbol: string; period: Period }>()

const el = ref<HTMLDivElement | null>(null)
let chart: IChartApi | null = null
let candleSeries: ISeriesApi<'Candlestick'> | null = null
let lineSeries: ISeriesApi<'Line'> | null = null

const loading = ref(false)
const error = ref('')

function resetSeries() {
  if (!chart) return
  if (candleSeries) { chart.removeSeries(candleSeries); candleSeries = null }
  if (lineSeries) { chart.removeSeries(lineSeries); lineSeries = null }
}

async function load() {
  if (!chart) return
  if (!props.symbol) return

  loading.value = true
  error.value = ''

  try {
    const resp = await fetch(`/api/market/kline?symbol=${encodeURIComponent(props.symbol)}&period=${encodeURIComponent(props.period)}`)
    const data = await resp.json()
    if (!resp.ok) throw new Error(data?.error || '图表数据获取失败')

    resetSeries()

    if (props.period === 'intraday') {
      lineSeries = chart.addSeries(LineSeries, { color: '#2563eb', lineWidth: 2 })
      lineSeries.setData((data.data || []).map((p: any) => ({ time: p.time, value: p.price })))
    } else {
      candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#16a34a', downColor: '#dc2626',
        wickUpColor: '#16a34a', wickDownColor: '#dc2626',
        borderVisible: false,
      })
      candleSeries.setData((data.data || []).map((p: any) => ({
        time: p.time,
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
      })))
    }

    chart.timeScale().fitContent()
  } catch (e: any) {
    error.value = e?.message || '图表数据获取失败'
  } finally {
    loading.value = false
  }
}

function initChart() {
  if (!el.value) return
  chart = createChart(el.value, {
    height: 260,
    layout: { background: { color: '#ffffff' }, textColor: '#111827' },
    grid: { vertLines: { color: '#f3f4f6' }, horzLines: { color: '#f3f4f6' } },
    rightPriceScale: { borderVisible: false },
    timeScale: { borderVisible: false },
    crosshair: { mode: 0 },
  })
}

onMounted(() => {
  initChart()
  load()
})

watch(() => [props.symbol, props.period], () => {
  load()
})

onBeforeUnmount(() => {
  if (chart) {
    chart.remove()
    chart = null
  }
})
</script>

<template>
  <div class="chart-wrap">
    <div class="chart-el" ref="el" />
    <div v-if="loading" class="chart-mask">加载中…</div>
    <div v-else-if="error" class="chart-mask" style="color:#dc2626">{{ error }}</div>
  </div>
</template>

<style scoped>
.chart-wrap{position:relative;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden}
.chart-el{width:100%}
.chart-mask{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.72);font-size:13px}
</style>
