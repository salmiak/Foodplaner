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
    class="w-full flex items-center gap-1.5 px-2 py-2 rounded-xl text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors text-sm min-h-[44px]"
    @click="open = true"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>
    Add meal
  </button>

  <BaseModal v-if="open" title="Add meal" @close="open = false">
    <div class="p-4 space-y-4">
      <BaseInput
        v-model="title"
        label="Meal name"
        placeholder="e.g. Pasta with tomato sauce"
        @keyup.enter="submit"
      />
    </div>
    <template #footer>
      <div class="flex gap-2">
        <BaseButton variant="secondary" class="flex-1" @click="open = false">Cancel</BaseButton>
        <BaseButton class="flex-1" :loading="saving" @click="submit">Add</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
