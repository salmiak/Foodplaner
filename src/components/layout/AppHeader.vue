<script setup lang="ts">
import AvatarStack from '@/components/ui/AvatarStack.vue'
import type { PresenceUser } from '@/types/app.types'

defineProps<{
  title?: string
  presentUsers?: PresenceUser[]
  showBack?: boolean
}>()

const emit = defineEmits<{ back: [] }>()
</script>

<template>
  <header class="sticky top-0 z-30 bg-white border-b border-gray-100 pt-safe-top">
    <div class="grid grid-cols-3 items-center h-14 px-2">

      <!-- Left -->
      <div class="flex items-center">
        <button
          v-if="showBack"
          class="p-2 rounded-full hover:bg-gray-100 text-gray-600"
          @click="emit('back')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <AvatarStack v-if="presentUsers?.length" :users="presentUsers" class="ml-1" />
      </div>

      <!-- Center -->
      <div class="flex justify-center items-center">
        <h1 v-if="title" class="font-semibold text-gray-900 truncate text-base">{{ title }}</h1>
        <slot name="center" />
      </div>

      <!-- Right -->
      <div class="flex items-center justify-end gap-1">
        <slot name="actions" />
      </div>

    </div>
  </header>
</template>
