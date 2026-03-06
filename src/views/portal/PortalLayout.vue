<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// Bottom tab nav config — add new modules here (reserved slots already included)
const tabs = [
  { name: 'holdings',  label: '持仓',   icon: '📊' },
  { name: 'rfq',       label: '询价',   icon: '💬' },
  { name: 'watchlist', label: '关注',   icon: '⭐' },
  // 🔖 RESERVED slot 4
  // { name: 'orders',  label: '订单',   icon: '📋' },
  // 🔖 RESERVED slot 5
  // { name: 'profile', label: '我的',   icon: '👤' },
]

function logout() {
  router.push('/login')
}
</script>

<template>
  <div class="portal-page">
    <!-- Top header -->
    <header class="portal-header">
      <img src="/assets/logo.png" alt="诚港金融（场外）" class="portal-logo" />
      <span class="portal-header-title">诚港金融场外服务公司客户端</span>
      <button class="logout-btn" @click="logout">退出</button>
    </header>

    <!-- Page content -->
    <main class="portal-content">
      <RouterView />
    </main>

    <!-- Bottom tab bar -->
    <nav class="tab-bar">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.name"
        :to="`/portal/${tab.name}`"
        class="tab-item"
        active-class="tab-item--active"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>
