<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { usePlanStore } from '@/stores/plan.store'
import { useAuthStore } from '@/stores/auth.store'
import { getInitials, stringToColor } from '@/lib/utils'

const route = useRoute()
const planStore = usePlanStore()
const authStore = useAuthStore()

const inviteEmail = ref('')
const inviting = ref(false)
const inviteError = ref<string | null>(null)
const inviteSuccess = ref(false)

const planId = computed(() => (route.params.planId as string) || planStore.currentPlan?.id || '')

onMounted(async () => {
  if (planId.value) {
    if (!planStore.currentPlan) await planStore.fetchPlan(planId.value)
    await planStore.fetchMembers(planId.value)
  }
})

async function invite() {
  if (!inviteEmail.value.trim()) return
  inviting.value = true
  inviteError.value = null
  inviteSuccess.value = false
  try {
    await planStore.inviteMember(planId.value, inviteEmail.value.trim())
    inviteEmail.value = ''
    inviteSuccess.value = true
  } catch (err) {
    inviteError.value = err instanceof Error ? err.message : 'Failed to invite member'
  } finally {
    inviting.value = false
  }
}

async function removeMember(userId: string) {
  if (!confirm('Remove this member?')) return
  await planStore.removeMember(planId.value, userId)
}
</script>

<template>
  <div class="flex flex-col h-screen bg-gray-50">
    <AppHeader title="Plan Settings" />

    <div class="flex-1 overflow-y-auto pb-[calc(56px+env(safe-area-inset-bottom))]">
      <div class="p-4 max-w-lg mx-auto space-y-6">

        <!-- Plan name -->
        <section class="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h2 class="font-semibold text-gray-900">Plan</h2>
          <div>
            <p class="text-sm text-gray-500">Name</p>
            <p class="font-medium text-gray-900">{{ planStore.currentPlan?.name }}</p>
          </div>
        </section>

        <!-- Members -->
        <section class="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
          <h2 class="font-semibold text-gray-900">Members</h2>

          <div v-if="planStore.loading" class="flex justify-center py-4">
            <BaseSpinner />
          </div>

          <ul v-else class="space-y-2">
            <li
              v-for="member in planStore.members"
              :key="member.id"
              class="flex items-center gap-3 py-2"
            >
              <div
                class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                :style="{ backgroundColor: stringToColor(member.user_id) }"
              >
                {{ getInitials(member.email || member.user_id) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ member.email || member.user_id }}
                </p>
                <p class="text-xs text-gray-400 capitalize">{{ member.role }}</p>
              </div>
              <div class="flex items-center gap-2">
                <span
                  v-if="member.user_id === authStore.userId"
                  class="text-xs text-primary-600 font-medium"
                >You</span>
                <button
                  v-else-if="planStore.members.find(m => m.user_id === authStore.userId)?.role === 'owner'"
                  class="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  @click="removeMember(member.user_id)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </li>
          </ul>

          <!-- Invite -->
          <div class="pt-2 border-t border-gray-100 space-y-2">
            <p class="text-sm font-medium text-gray-700">Invite member</p>
            <div class="flex gap-2">
              <BaseInput
                v-model="inviteEmail"
                type="email"
                placeholder="email@example.com"
                class="flex-1"
                @keyup.enter="invite"
              />
              <BaseButton :loading="inviting" @click="invite">Invite</BaseButton>
            </div>
            <p v-if="inviteError" class="text-xs text-red-600">{{ inviteError }}</p>
            <p v-if="inviteSuccess" class="text-xs text-green-600">Member invited!</p>
          </div>
        </section>

        <!-- Sign out -->
        <section class="bg-white rounded-2xl border border-gray-100 p-4">
          <BaseButton variant="danger" class="w-full" @click="useAuthStore().signOut()">
            Sign out
          </BaseButton>
        </section>

      </div>
    </div>

    <BottomNav />
  </div>
</template>
