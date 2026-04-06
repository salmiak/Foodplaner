<script setup lang="ts">
import { ref } from 'vue'
import { useMealStore } from '@/stores/meal.store'

const props = defineProps<{ mealId: string }>()
const emit = defineEmits<{ transferred: [] }>()

const mealStore = useMealStore()
const loading = ref<'prev' | 'next' | null>(null)
const error = ref<string | null>(null)

async function transfer(direction: 'prev' | 'next') {
  loading.value = direction
  error.value = null
  try {
    await mealStore.transferMeal(props.mealId, direction)
    emit('transferred')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Transfer failed'
  } finally {
    loading.value = null
  }
}
</script>

<template>
  <div class="space-y-2">
    <p class="text-sm font-medium text-gray-700">Move meal to</p>
    <div class="flex gap-2">
      <button
        type="button"
        class="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-primary-400 hover:bg-primary-50 transition-colors min-h-[44px] disabled:opacity-50"
        :disabled="loading !== null"
        @click="transfer('prev')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Previous week
      </button>
      <button
        type="button"
        class="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-primary-400 hover:bg-primary-50 transition-colors min-h-[44px] disabled:opacity-50"
        :disabled="loading !== null"
        @click="transfer('next')"
      >
        Next week
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
    <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
  </div>
</template>
