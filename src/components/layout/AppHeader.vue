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
  <header class="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 pt-safe-top">
    <div class="flex items-center justify-between h-14">
      <div class="flex items-center gap-2">
        <button
          v-if="showBack"
          class="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600"
          @click="emit('back')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 v-if="title" class="font-semibold text-gray-900 truncate">{{ title }}</h1>
      </div>

      <div class="flex items-center gap-3">
        <AvatarStack v-if="presentUsers?.length" :users="presentUsers" />
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
