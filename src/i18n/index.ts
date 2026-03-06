import { createI18n } from 'vue-i18n'

const messages = {
  zh: {
    appName: '客户端门户',
    header: {
      title: '诚港金融场外服务公司客户端',
    },
    login: {
      title: '欢迎登录',
      emailLabel: '邮箱',
      codeLabel: '验证码',
      sendCode: '获取验证码',
      sending: '发送中…',
      resendIn: '后重试',
      submit: '登录',
      emailPlaceholder: '请输入邮箱',
      codePlaceholder: '请输入验证码',
      tip: '验证码将发送至您的邮箱，请注意查收。',
    },
    footer: {
      copyright: '诚港金融场外服务公司',
    },
  },
  en: {
    appName: 'Client Portal',
    header: {
      title: 'Chenggang Financial OTC Services - Client',
    },
    login: {
      title: 'Sign in',
      emailLabel: 'Email',
      codeLabel: 'Verification code',
      sendCode: 'Send code',
      sending: 'Sending…',
      resendIn: 'Retry in',
      submit: 'Sign in',
      emailPlaceholder: 'Enter your email',
      codePlaceholder: 'Enter code',
      tip: 'A verification code will be sent to your email.',
    },
    footer: {
      copyright: 'Chenggang Financial OTC Services Company',
    },
  },
} as const

export const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'zh',
  messages,
})
