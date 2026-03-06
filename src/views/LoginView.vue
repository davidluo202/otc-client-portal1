<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { APP_VERSION } from '../version'

const { t } = useI18n()

const email = ref('')
const code = ref('')

const sending = ref(false)
const secondsLeft = ref(0)

const canSend = computed(() => {
  if (sending.value) return false
  if (secondsLeft.value > 0) return false
  return /.+@.+\..+/.test(email.value.trim())
})

async function sendCode() {
  if (!canSend.value) return
  sending.value = true
  try {
    // TODO: replace with real API call
    // await fetch('/auth/email/send-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.value.trim() }) })

    secondsLeft.value = 60
    const timer = setInterval(() => {
      secondsLeft.value -= 1
      if (secondsLeft.value <= 0) {
        secondsLeft.value = 0
        clearInterval(timer)
      }
    }, 1000)
  } finally {
    sending.value = false
  }
}

async function submit() {
  // TODO: replace with real API call
  // await fetch('/auth/email/verify-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.value.trim(), code: code.value.trim() }) })
  alert(`login: ${email.value} / ${code.value}`)
}
</script>

<template>
  <div class="page">
    <header class="topbar">
      <div class="brand" aria-label="brand">
        <img src="/assets/logo.png" alt="诚港金融（场外）" />
      </div>
      <div class="topbar-title">{{ t('header.title') }}</div>
      <div class="topbar-right" aria-label="lang">CN/EN</div>
    </header>

    <main class="container">
      <section class="card">
        <div class="card-title">{{ t('login.title') }}</div>

        <div class="form-row">
          <div class="label">{{ t('login.emailLabel') }}</div>
          <input class="input" v-model="email" :placeholder="t('login.emailPlaceholder')" inputmode="email" />
        </div>

        <div class="form-row">
          <div class="label">{{ t('login.codeLabel') }}</div>
          <div class="code-row">
            <input class="input" v-model="code" :placeholder="t('login.codePlaceholder')" inputmode="numeric" />
            <button class="btn btn-secondary" :disabled="!canSend" @click="sendCode">
              <template v-if="sending">{{ t('login.sending') }}</template>
              <template v-else-if="secondsLeft > 0">{{ secondsLeft }}s {{ t('login.resendIn') }}</template>
              <template v-else>{{ t('login.sendCode') }}</template>
            </button>
          </div>
          <div class="helper">{{ t('login.tip') }}</div>
        </div>

        <button class="btn btn-primary" style="width: 100%" @click="submit">{{ t('login.submit') }}</button>
      </section>
    </main>

    <footer class="footer">
      <div>© {{ new Date().getFullYear() }} {{ t('footer.copyright') }}</div>
      <div style="margin-top: 6px">v{{ APP_VERSION }}</div>
    </footer>
  </div>
</template>
