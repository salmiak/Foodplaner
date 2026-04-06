<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const mode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const error = ref<string | null>(null)

async function submit() {
  error.value = null
  try {
    if (mode.value === 'signin') {
      await authStore.signIn(email.value, password.value)
    } else {
      await authStore.signUp(email.value, password.value)
    }
    router.push({ name: 'plan-redirect' })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Authentication failed'
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">Matplanering</h1>
        <p class="text-gray-500 mt-1">Planera veckans mat tillsammans</p>
      </div>

      <!-- Card -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 class="text-lg font-semibold text-gray-900">
          {{ mode === 'signin' ? 'Sign in' : 'Create account' }}
        </h2>

        <BaseInput
          v-model="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
        />

        <BaseInput
          v-model="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          @keyup.enter="submit"
        />

        <p v-if="error" class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{{ error }}</p>

        <BaseButton
          class="w-full"
          size="lg"
          :loading="authStore.loading"
          @click="submit"
        >
          {{ mode === 'signin' ? 'Sign in' : 'Create account' }}
        </BaseButton>

        <p class="text-center text-sm text-gray-500">
          {{ mode === 'signin' ? "Don't have an account?" : 'Already have an account?' }}
          <button
            class="text-primary-600 font-medium hover:underline ml-1"
            @click="mode = mode === 'signin' ? 'signup' : 'signin'"
          >
            {{ mode === 'signin' ? 'Sign up' : 'Sign in' }}
          </button>
        </p>
      </div>
    </div>
  </div>
</template>
