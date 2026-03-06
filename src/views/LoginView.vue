<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { APP_VERSION } from '../version'

const { t } = useI18n()
const router = useRouter()

const email = ref('')
const code = ref('')
const password = ref('')
const password2 = ref('')

const sending = ref(false)
const secondsLeft = ref(0)
const challenge = ref<string | null>(null)

type Step = 'code' | 'setPassword' | 'passwordLogin'
const step = ref<Step>('code')

function lsKey(e: string) {
  return `otc-clientportal:pwd:${e.trim().toLowerCase()}`
}

function hasLocalPassword(e: string) {
  try {
    return !!localStorage.getItem(lsKey(e))
  } catch {
    return false
  }
}

function passwordRuleOk(p: string) {
  // >=8, contains upper, lower, digit, special
  return (
    p.length >= 8 &&
    /[a-z]/.test(p) &&
    /[A-Z]/.test(p) &&
    /\d/.test(p) &&
    /[^A-Za-z0-9]/.test(p)
  )
}

const canSend = computed(() => {
  if (sending.value) return false
  if (secondsLeft.value > 0) return false
  return /.+@.+\..+/.test(email.value.trim())
})

const emailNormalized = computed(() => email.value.trim().toLowerCase())

function refreshStepByEmail() {
  const e = emailNormalized.value
  if (!e) {
    step.value = 'code'
    return
  }
  if (hasLocalPassword(e)) {
    step.value = 'passwordLogin'
  } else {
    step.value = 'code'
  }
}

watch(emailNormalized, () => {
  // reset transient state when switching email
  code.value = ''
  challenge.value = null
  secondsLeft.value = 0
  password.value = ''
  password2.value = ''
  refreshStepByEmail()
})

// initial
refreshStepByEmail()

async function sendCode() {
  if (!canSend.value) return
  sending.value = true
  try {
    const resp = await fetch('/api/auth/email/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value.trim() }),
    })

    const data = await resp.json()
    if (!resp.ok) throw new Error(data?.error || 'send failed')

    challenge.value = data.challenge

    secondsLeft.value = Number(data.ttlSeconds) || 90
    const timer = setInterval(() => {
      secondsLeft.value -= 1
      if (secondsLeft.value <= 0) {
        secondsLeft.value = 0
        clearInterval(timer)
      }
    }, 1000)
  } catch (e: any) {
    alert(e?.message || '发送失败')
  } finally {
    sending.value = false
  }
}

async function verifyCode() {
  if (!challenge.value) throw new Error('请先获取验证码')

  const resp = await fetch('/api/auth/email/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.value.trim(),
      code: code.value.trim(),
      challenge: challenge.value,
    }),
  })

  const data = await resp.json()
  if (!resp.ok) throw new Error(data?.error || 'verify failed')
  return data
}

function saveLocalPassword() {
  const e = email.value.trim().toLowerCase()
  if (!e) throw new Error('请输入邮箱')
  if (!passwordRuleOk(password.value)) throw new Error('密码不符合规则')
  if (password.value !== password2.value) throw new Error('两次输入密码不一致')

  // NOTE: demo only. Real project should save hashed password on backend.
  localStorage.setItem(lsKey(e), password.value)
}

function loginWithLocalPassword() {
  const e = email.value.trim().toLowerCase()
  const saved = localStorage.getItem(lsKey(e))
  if (!saved) throw new Error('该邮箱未设置密码，请先用验证码登录并设置密码')
  if (password.value !== saved) throw new Error('密码错误')
}

async function submit() {
  try {
    const e = email.value.trim().toLowerCase()

    // auto decide step
    if (step.value === 'passwordLogin') {
      loginWithLocalPassword()
      router.push('/portal')
      return
    }

    if (step.value === 'code') {
      await verifyCode()
      if (hasLocalPassword(e)) {
        router.push('/portal')
      } else {
        step.value = 'setPassword'
        password.value = ''
        password2.value = ''
      }
      return
    }

    if (step.value === 'setPassword') {
      saveLocalPassword()
      router.push('/portal')
      return
    }
  } catch (e: any) {
    alert(e?.message || '操作失败')
  }
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
      <div class="page-title">{{ t('header.title') }}</div>

      <section class="card">
        <div class="form-row">
          <div class="label">{{ t('login.emailLabel') }}</div>
          <input class="input" v-model="email" :placeholder="t('login.emailPlaceholder')" inputmode="email" />
        </div>

        <!-- Step 1: code login -->
        <template v-if="step === 'code'">
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
        </template>

        <!-- Step 2: password login -->
        <template v-else-if="step === 'passwordLogin'">
          <div class="form-row">
            <div class="label">{{ t('login.passwordLabel') }}</div>
            <input class="input" v-model="password" type="password" :placeholder="t('login.passwordPlaceholder')" />
            <div class="helper">{{ t('login.passwordTip') }}</div>
          </div>
        </template>

        <!-- Step 3: set password after code verified -->
        <template v-else>
          <div class="form-row">
            <div class="label">{{ t('login.passwordLabel') }}</div>
            <input class="input" v-model="password" type="password" :placeholder="t('login.passwordPlaceholder')" />
          </div>
          <div class="form-row">
            <div class="label">{{ t('login.password2Label') }}</div>
            <input class="input" v-model="password2" type="password" :placeholder="t('login.password2Placeholder')" />
            <div class="helper">{{ t('login.passwordTip') }}</div>
          </div>
        </template>

        <button class="btn btn-primary" style="width: 100%" @click="submit">
          <template v-if="step === 'passwordLogin'">{{ t('login.submitPasswordLogin') }}</template>
          <template v-else-if="step === 'setPassword'">{{ t('login.submitSetPassword') }}</template>
          <template v-else>{{ t('login.submit') }}</template>
        </button>
      </section>
    </main>

    <footer class="footer">
      <div>© {{ new Date().getFullYear() }} {{ t('footer.copyright') }}</div>
      <div style="margin-top: 6px">v{{ APP_VERSION }}</div>
    </footer>
  </div>
</template>
