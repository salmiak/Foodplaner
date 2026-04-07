<script setup lang="ts">
import { ref } from 'vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()

const email = ref('')
const sent = ref(false)
const error = ref<string | null>(null)

async function submit() {
  error.value = null
  try {
    await authStore.sendMagicLink(email.value)
    sent.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Something went wrong'
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
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

        <!-- Sent confirmation -->
        <div v-if="sent" class="text-center space-y-3">
          <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 class="font-semibold text-gray-900">Kolla din e-post</h2>
          <p class="text-sm text-gray-500">
            Vi har skickat en inloggningslänk till <strong>{{ email }}</strong>. Klicka på länken för att logga in.
          </p>
          <button
            class="text-sm text-primary-600 hover:underline mt-2"
            @click="sent = false"
          >
            Använd en annan e-postadress
          </button>
        </div>

        <!-- Email form -->
        <div v-else class="space-y-4">
          <h2 class="font-semibold text-gray-900">Logga in</h2>

          <BaseInput
            v-model="email"
            label="E-postadress"
            type="email"
            placeholder="du@exempel.se"
            @keyup.enter="submit"
          />

          <p v-if="error" class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{{ error }}</p>

          <BaseButton
            class="w-full"
            size="lg"
            :loading="authStore.loading"
            @click="submit"
          >
            Skicka inloggningslänk
          </BaseButton>

          <p class="text-xs text-center text-gray-400">
            Du får en länk via e-post — inget lösenord behövs.
          </p>
        </div>

      </div>
    </div>
  </div>
</template>
