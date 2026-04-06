<script setup lang="ts">
import { computed } from 'vue'
import { getInitials } from '@/lib/utils'
import type { PresenceUser } from '@/types/app.types'

const props = defineProps<{ users: PresenceUser[]; max?: number }>()

const visible = computed(() => props.users.slice(0, props.max ?? 4))
const overflow = computed(() => Math.max(0, props.users.length - (props.max ?? 4)))
</script>

<template>
  <div class="flex items-center -space-x-2">
    <div
      v-for="user in visible"
      :key="user.user_id"
      class="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      :style="{ backgroundColor: user.color }"
      :title="user.display_name || user.email"
    >
      {{ getInitials(user.display_name || user.email) }}
    </div>
    <div
      v-if="overflow > 0"
      class="w-8 h-8 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-xs font-bold text-white"
    >
      +{{ overflow }}
    </div>
  </div>
</template>
