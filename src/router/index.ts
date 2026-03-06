import { createRouter, createWebHistory } from 'vue-router'

const LoginView   = () => import('../views/LoginView.vue')
const PortalLayout = () => import('../views/portal/PortalLayout.vue')
const HoldingsView  = () => import('../views/portal/HoldingsView.vue')
const RfqView       = () => import('../views/portal/RfqView.vue')
const WatchlistView = () => import('../views/portal/WatchlistView.vue')

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: LoginView },
    {
      path: '/portal',
      component: PortalLayout,
      redirect: '/portal/holdings',
      children: [
        { path: 'holdings',  name: 'holdings',  component: HoldingsView },
        { path: 'rfq',       name: 'rfq',       component: RfqView },
        { path: 'watchlist', name: 'watchlist', component: WatchlistView },
        // 🔖 RESERVED: add new modules here
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})
