<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

defineProps<{ title?: string }>()
const emit = defineEmits<{ close: [] }>()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-sm"
        @click="emit('close')"
      />

      <!-- Panel -->
      <div
        class="relative z-10 w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[92vh] sm:max-h-[85vh]"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
          <h2 class="text-lg font-semibold text-gray-900">{{ title }}</h2>
          <button
            class="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
            @click="emit('close')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="overflow-y-auto flex-1">
          <slot />
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="flex-shrink-0 border-t border-gray-100 px-4 py-3 pb-safe-bottom">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
