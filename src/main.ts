import { createApp } from 'vue'
import './style.scss'
import App from './App.vue'
import { router } from './router'
import { pinia } from './store'
import { i18n } from './i18n'

createApp(App).use(router).use(pinia).use(i18n).mount('#app')
