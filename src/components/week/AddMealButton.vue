<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useMealStore } from '@/stores/meal.store'
import { useWeekStore } from '@/stores/week.store'

const props = defineProps<{
  planId: string
  dayOfWeek: number | null
}>()

const mealStore = useMealStore()
const weekStore = useWeekStore()

const open = ref(false)
const title = ref('')
const saving = ref(false)

async function submit() {
  if (!title.value.trim() || !weekStore.weekId) return
  saving.value = true
  try {
    await mealStore.createMeal({
      weekId: weekStore.weekId,
      planId: props.planId,
      title: title.value.trim(),
      dayOfWeek: props.dayOfWeek,
    })
    title.value = ''
    open.value = false
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <button
    class="w-full flex items-center justify-center gap-1 mt-1 px-2 py-2 rounded-xl border border-dashed border-gray-300 text-gray-500 bg-white hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-colors min-h-[44px] text-xs font-medium"
    @click="open = true"
  >
    <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
    </svg>
    Lägg till
  </button>

  <BaseModal v-if="open" title="Lägg till måltid" @close="open = false">
    <div class="p-4 space-y-4">
      <BaseInput
        v-model="title"
        label="Namn på måltid"
        placeholder="t.ex. Pasta med tomatsås"
        @keyup.enter="submit"
      />
    </div>
    <template #footer>
      <div class="flex gap-2">
        <BaseButton variant="secondary" class="flex-1" @click="open = false">Avbryt</BaseButton>
        <BaseButton class="flex-1" :loading="saving" @click="submit">Lägg till</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
