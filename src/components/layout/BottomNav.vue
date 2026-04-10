<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlanStore } from '@/stores/plan.store'
import { useWeekStore } from '@/stores/week.store'

const appVersion = __APP_VERSION__
const appCommit = __APP_COMMIT__

const route = useRoute()
const router = useRouter()
const planStore = usePlanStore()
const weekStore = useWeekStore()

// planId from route takes priority; fall back to store
const planId = computed(
  () => (route.params.planId as string) || planStore.currentPlan?.id || null,
)

function navigate(to: object) {
  if (!planId.value) return
  router.push(to)
}

const tabs = computed(() => [
  {
    name: 'week',
    label: 'Plan',
    icon: 'calendar',
    active: route.name === 'week' || route.name === 'plan-redirect',
    onClick: () => navigate({
      name: 'week',
      params: {
        planId: planId.value,
        year: weekStore.currentYear,
        week: weekStore.currentWeekNumber,
      },
    }),
  },
  {
    name: 'recipes',
    label: 'Recept',
    icon: 'book',
    active: route.name === 'recipes',
    onClick: () => navigate({ name: 'recipes', params: { planId: planId.value } }),
  },
  {
    name: 'settings',
    label: 'Inställningar',
    icon: 'cog',
    active: route.name === 'settings',
    onClick: () => navigate({ name: 'settings', params: { planId: planId.value } }),
  },
])
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 pb-safe-bottom">
    <div class="flex">
    <button
      v-for="tab in tabs"
      :key="tab.name"
      class="flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] transition-colors"
      :class="tab.active ? 'text-primary-600' : 'text-gray-500'"
      @click="tab.onClick"
    >
      <svg v-if="tab.icon === 'calendar'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <svg v-if="tab.icon === 'book'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <svg v-if="tab.icon === 'cog'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span class="text-xs mt-0.5">{{ tab.label }}</span>
    </button>
    </div>
    <p class="text-center text-[10px] text-gray-300 leading-none pb-1">v{{ appVersion }} · {{ appCommit }}</p>
  </nav>
</template>
