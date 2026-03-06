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
      passwordLabel: '密码',
      password2Label: '再次输入密码',
      sendCode: '获取验证码',
      sending: '发送中…',
      resendIn: '后重试',
      submit: '下一步',
      submitPasswordLogin: '密码登录',
      submitSetPassword: '设置密码并登录',
      emailPlaceholder: '请输入邮箱',
      codePlaceholder: '请输入验证码',
      passwordPlaceholder: '请输入密码',
      password2Placeholder: '请再次输入密码',
      tip: '验证码将发送至您的邮箱，请注意查收。',
      passwordTip: '密码规则：至少8位，包含大小写字母、数字和特殊符号。',
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
      passwordLabel: 'Password',
      password2Label: 'Confirm password',
      sendCode: 'Send code',
      sending: 'Sending…',
      resendIn: 'Retry in',
      submit: 'Next',
      submitPasswordLogin: 'Sign in with password',
      submitSetPassword: 'Set password & sign in',
      emailPlaceholder: 'Enter your email',
      codePlaceholder: 'Enter code',
      passwordPlaceholder: 'Enter password',
      password2Placeholder: 'Re-enter password',
      tip: 'A verification code will be sent to your email.',
      passwordTip: 'Min 8 chars incl. upper/lowercase, number and special char.',
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
