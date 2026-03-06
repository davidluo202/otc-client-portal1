import { createRouter, createWebHistory } from 'vue-router'

const LoginView = () => import('../views/LoginView.vue')

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: LoginView },
  ],
})
