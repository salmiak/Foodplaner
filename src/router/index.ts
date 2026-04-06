import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/views/AuthView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      redirect: () => {
        // Will be redirected to the current week by the auth guard
        return '/plan'
      },
    },
    {
      path: '/plan',
      name: 'plan-redirect',
      component: () => import('@/views/WeekView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/plan/:planId/week/:year/:week',
      name: 'week',
      component: () => import('@/views/WeekView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/plan/:planId/recipes',
      name: 'recipes',
      component: () => import('@/views/RecipeLibraryView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/plan/:planId/settings',
      name: 'settings',
      component: () => import('@/views/PlanSettingsView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Wait for auth to be initialized
  if (!authStore.initialized) {
    await authStore.initialize()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'auth' }
  }

  if (to.name === 'auth' && authStore.isAuthenticated) {
    return { name: 'plan-redirect' }
  }
})

export default router
