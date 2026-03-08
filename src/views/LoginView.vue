<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { APP_VERSION } from '../version'

const { t } = useI18n()
const router = useRouter()

// ─── Tab: 'code' (验证码登录) | 'password' (密码登录) ──────────
type LoginTab = 'code' | 'password'
const loginTab = ref<LoginTab>('code')

const email = ref('')
const code = ref('')
const password = ref('')
const password2 = ref('')

const sending = ref(false)
const secondsLeft = ref(0)
const challenge = ref<string | null>(null)

// sub-step for code tab: 'input' | 'setPassword' (first time set pwd after code verify)
type CodeStep = 'input' | 'setPassword'
const codeStep = ref<CodeStep>('input')

// sub-step for password tab: 'login' | 'forgot' (reset via code)
type PwdStep = 'login' | 'forgot' | 'resetPwd'
const pwdStep = ref<PwdStep>('login')

// ─── local password helpers (demo-grade; real prod should use backend) ──
function lsKey(e: string) { return `otc-clientportal:pwd:${e.trim().toLowerCase()}` }
function hasLocalPassword(e: string) {
  try { return !!localStorage.getItem(lsKey(e)) } catch { return false }
}
function getLocalPassword(e: string) {
  try { return localStorage.getItem(lsKey(e)) ?? '' } catch { return '' }
}
function saveLocalPassword(e: string, p: string) {
  localStorage.setItem(lsKey(e), p)
}

// ─── Password rules ─────────────────────────────────────────────
function passwordRuleOk(p: string) {
  return (
    p.length >= 8 &&
    /[a-z]/.test(p) &&
    /[A-Z]/.test(p) &&
    /\d/.test(p) &&
    /[^A-Za-z0-9]/.test(p)
  )
}
const pwdStrengthMsg = computed(() => {
  const p = password.value
  if (!p) return ''
  const issues: string[] = []
  if (p.length < 8) issues.push('至少8位')
  if (!/[a-z]/.test(p)) issues.push('缺小写字母')
  if (!/[A-Z]/.test(p)) issues.push('缺大写字母')
  if (!/\d/.test(p)) issues.push('缺数字')
  if (!/[^A-Za-z0-9]/.test(p)) issues.push('缺符号')
  return issues.length ? '❌ ' + issues.join('  ') : '✅ 密码强度符合'
})

// ─── Email computed ─────────────────────────────────────────────
const emailNormalized = computed(() => email.value.trim().toLowerCase())
const emailValid = computed(() => /.+@.+\..+/.test(emailNormalized.value))
const canSend = computed(() => !sending.value && secondsLeft.value === 0 && emailValid.value)

// reset transient state on tab switch or email change
watch([loginTab, emailNormalized], () => {
  code.value = ''; challenge.value = null; secondsLeft.value = 0
  password.value = ''; password2.value = ''
  codeStep.value = 'input'; pwdStep.value = 'login'
})

// ─── Send OTP ───────────────────────────────────────────────────
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
    if (!resp.ok) throw new Error(data?.error || '发送失败')
    challenge.value = data.challenge
    secondsLeft.value = Number(data.ttlSeconds) || 90
    const timer = setInterval(() => {
      secondsLeft.value -= 1
      if (secondsLeft.value <= 0) { secondsLeft.value = 0; clearInterval(timer) }
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
    body: JSON.stringify({ email: email.value.trim(), code: code.value.trim(), challenge: challenge.value }),
  })
  const data = await resp.json()
  if (!resp.ok) throw new Error(data?.error || '验证码错误')
  return data
}

// ─── Submit ─────────────────────────────────────────────────────
async function submit() {
  try {
    if (loginTab.value === 'code') {
      if (codeStep.value === 'input') {
        await verifyCode()
        if (hasLocalPassword(emailNormalized.value)) {
          router.push('/portal')
        } else {
          codeStep.value = 'setPassword'
          password.value = ''; password2.value = ''
        }
        return
      }
      if (codeStep.value === 'setPassword') {
        if (!passwordRuleOk(password.value)) throw new Error('密码不符合规则')
        if (password.value !== password2.value) throw new Error('两次密码不一致')
        saveLocalPassword(emailNormalized.value, password.value)
        router.push('/portal')
        return
      }
    }

    if (loginTab.value === 'password') {
      if (pwdStep.value === 'login') {
        if (!emailValid.value) throw new Error('请输入有效邮箱')
        if (!password.value) throw new Error('请输入密码')
        const saved = getLocalPassword(emailNormalized.value)
        if (!saved) throw new Error('该邮箱尚未设置密码，请先用验证码登录并设置密码，或使用"忘记密码"重置')
        if (password.value !== saved) throw new Error('密码错误')
        router.push('/portal')
        return
      }

      if (pwdStep.value === 'forgot') {
        // send code for reset
        await sendCode()
        pwdStep.value = 'resetPwd'
        return
      }

      if (pwdStep.value === 'resetPwd') {
        await verifyCode()
        if (!passwordRuleOk(password.value)) throw new Error('密码不符合规则')
        if (password.value !== password2.value) throw new Error('两次密码不一致')
        saveLocalPassword(emailNormalized.value, password.value)
        alert('密码已重置，请重新登录')
        pwdStep.value = 'login'
        password.value = ''; password2.value = ''; code.value = ''
        return
      }
    }
  } catch (e: any) {
    alert(e?.message || '操作失败')
  }
}

function startForgot() {
  pwdStep.value = 'forgot'
  code.value = ''; challenge.value = null; secondsLeft.value = 0
  password.value = ''; password2.value = ''
  sendCode()
}
function cancelForgot() { pwdStep.value = 'login'; password.value = '' }
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
        <!-- Tab switcher -->
        <div class="login-tabs">
          <button class="login-tab" :class="{active: loginTab==='code'}" @click="loginTab='code'">验证码登录</button>
          <button class="login-tab" :class="{active: loginTab==='password'}" @click="loginTab='password'">密码登录</button>
        </div>

        <!-- Email (always visible) -->
        <div class="form-row">
          <div class="label">{{ t('login.emailLabel') }}</div>
          <input class="input" v-model="email" :placeholder="t('login.emailPlaceholder')" inputmode="email" autocomplete="email" />
        </div>

        <!-- ══ Tab: 验证码登录 ══ -->
        <template v-if="loginTab === 'code'">
          <template v-if="codeStep === 'input'">
            <div class="form-row">
              <div class="label">{{ t('login.codeLabel') }}</div>
              <div class="code-row">
                <input class="input" v-model="code" :placeholder="t('login.codePlaceholder')" inputmode="numeric" />
                <button class="btn btn-secondary" :disabled="!canSend" @click="sendCode">
                  <template v-if="sending">发送中…</template>
                  <template v-else-if="secondsLeft > 0">{{ secondsLeft }}s 后重发</template>
                  <template v-else>获取验证码</template>
                </button>
              </div>
              <div class="helper">验证码将发送到您的邮箱，有效期90秒</div>
            </div>
            <button class="btn btn-primary" style="width:100%" :disabled="!code || !challenge" @click="submit">验证并登录</button>
          </template>

          <template v-else-if="codeStep === 'setPassword'">
            <div class="helper" style="margin-bottom:10px">首次登录，请设置登录密码（之后可用密码直接登录）</div>
            <div class="form-row">
              <div class="label">设置密码</div>
              <input class="input" v-model="password" type="password" placeholder="请输入密码" />
              <div class="helper" :style="{ color: passwordRuleOk(password) ? '#16a34a' : '#b45309' }">{{ pwdStrengthMsg }}</div>
            </div>
            <div class="form-row">
              <div class="label">确认密码</div>
              <input class="input" v-model="password2" type="password" placeholder="再次输入密码" />
              <div class="helper" v-if="password2 && password !== password2" style="color:#dc2626">两次密码不一致</div>
            </div>
            <button class="btn btn-primary" style="width:100%" :disabled="!passwordRuleOk(password) || password !== password2" @click="submit">完成设置并登录</button>
          </template>
        </template>

        <!-- ══ Tab: 密码登录 ══ -->
        <template v-else-if="loginTab === 'password'">
          <template v-if="pwdStep === 'login'">
            <div class="form-row">
              <div class="label">{{ t('login.passwordLabel') }}</div>
              <input class="input" v-model="password" type="password" :placeholder="t('login.passwordPlaceholder')" autocomplete="current-password" />
            </div>
            <button class="btn btn-primary" style="width:100%" :disabled="!emailValid || !password" @click="submit">登录</button>
            <div style="text-align:center;margin-top:10px">
              <a href="#" style="font-size:13px;color:var(--muted)" @click.prevent="startForgot">忘记密码？</a>
            </div>
          </template>

          <template v-else-if="pwdStep === 'forgot' || pwdStep === 'resetPwd'">
            <div class="helper" style="margin-bottom:8px">重置密码：验证码已发送到邮箱</div>
            <div class="form-row">
              <div class="label">验证码</div>
              <div class="code-row">
                <input class="input" v-model="code" placeholder="输入验证码" inputmode="numeric" />
                <button class="btn btn-secondary" :disabled="!canSend" @click="sendCode">
                  <template v-if="secondsLeft > 0">{{ secondsLeft }}s 后重发</template>
                  <template v-else>重新发送</template>
                </button>
              </div>
            </div>
            <div class="form-row">
              <div class="label">新密码</div>
              <input class="input" v-model="password" type="password" placeholder="请输入新密码" />
              <div class="helper" :style="{ color: passwordRuleOk(password) ? '#16a34a' : '#b45309' }">{{ pwdStrengthMsg }}</div>
            </div>
            <div class="form-row">
              <div class="label">确认新密码</div>
              <input class="input" v-model="password2" type="password" placeholder="再次输入新密码" />
            </div>
            <div style="display:flex;gap:10px">
              <button class="btn btn-secondary" style="flex:1" @click="cancelForgot">取消</button>
              <button class="btn btn-primary" style="flex:2"
                :disabled="!code || !passwordRuleOk(password) || password !== password2"
                @click="submit">确认重置密码</button>
            </div>
          </template>
        </template>
      </section>
    </main>

    <footer class="footer">
      <div>© {{ new Date().getFullYear() }} {{ t('footer.copyright') }}</div>
      <div style="margin-top: 6px">v{{ APP_VERSION }}</div>
    </footer>
  </div>
</template>
