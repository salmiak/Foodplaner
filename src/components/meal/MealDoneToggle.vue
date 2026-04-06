<script setup lang="ts">
defineProps<{ isDone: boolean; loading?: boolean }>()
defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    class="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
    :class="isDone
      ? 'bg-primary-600 border-primary-600'
      : 'border-gray-300 hover:border-primary-400'"
    @click.stop="$emit('toggle')"
  >
    <svg v-if="isDone" class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
    </svg>
  </button>
</template>
