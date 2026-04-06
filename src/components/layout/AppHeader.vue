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
      <div class="flex items-center gap-3">
        <button
          v-if="showBack"
          class="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600"
          @click="emit('back')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div v-if="!showBack" class="flex items-center gap-2">
          <div class="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span class="font-semibold text-gray-900">Matplanering</span>
        </div>
        <h1 v-if="title" class="font-semibold text-gray-900 truncate">{{ title }}</h1>
      </div>

      <div class="flex items-center gap-3">
        <AvatarStack v-if="presentUsers?.length" :users="presentUsers" />
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
