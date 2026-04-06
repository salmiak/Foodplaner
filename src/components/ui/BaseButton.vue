<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>()
</script>

<template>
  <button
    :type="type ?? 'button'"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]',
      {
        'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500':
          !variant || variant === 'primary',
        'bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-gray-400':
          variant === 'secondary',
        'hover:bg-gray-100 text-gray-700 focus:ring-gray-400':
          variant === 'ghost',
        'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500':
          variant === 'danger',
      },
      {
        'px-3 py-1.5 text-sm': size === 'sm',
        'px-4 py-2 text-sm': !size || size === 'md',
        'px-6 py-3 text-base': size === 'lg',
      },
    ]"
  >
    <svg
      v-if="loading"
      class="animate-spin -ml-1 mr-2 h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
    <slot />
  </button>
</template>
