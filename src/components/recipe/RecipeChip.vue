<script setup lang="ts">
import type { Recipe } from '@/types/app.types'

defineProps<{ recipe: Recipe; removable?: boolean }>()
defineEmits<{ remove: [] }>()
</script>

<template>
  <span
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium max-w-[120px]"
    :class="{
      'bg-blue-100 text-blue-800': recipe.kind === 'url',
      'bg-purple-100 text-purple-800': recipe.kind === 'image',
      'bg-gray-100 text-gray-700': recipe.kind === 'text',
    }"
  >
    <!-- URL icon -->
    <svg v-if="recipe.kind === 'url'" class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
    <!-- Image icon -->
    <svg v-else-if="recipe.kind === 'image'" class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    <!-- Text icon -->
    <svg v-else class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <span class="truncate">{{ recipe.title }}</span>
    <button
      v-if="removable"
      class="ml-0.5 hover:text-red-600"
      @click.stop="$emit('remove')"
    >×</button>
  </span>
</template>
