import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/stores/auth'
import Home from '@/views/Home.vue'
import Auth from '@/views/Auth.vue'
import Schedule from '@/views/Schedule.vue'
import Reservations from '@/views/Reservations.vue'
import Settings from '@/views/Settings.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/login',
      name: 'login',
      component: Auth,
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: Schedule,
    },
    {
      path: '/reservations',
      name: 'reservations',
      component: Reservations,
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const { isLoggedIn } = useAuth()

  if (to.meta.requiresAuth && !isLoggedIn.value) {
    next('/login')
  } else {
    next()
  }
})

export default router
