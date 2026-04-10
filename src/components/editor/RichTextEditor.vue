<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  modelValue: string | null
  placeholder?: string
  editable?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()

const isEditable = computed(() => props.editable !== false)

const rendered = computed(() => {
  if (!props.modelValue?.trim()) return ''
  return marked.parse(props.modelValue) as string
})

function onInput(e: Event) {
  const val = (e.target as HTMLTextAreaElement).value
  emit('update:modelValue', val || null)
}
</script>

<template>
  <div class="w-full">
    <!-- Edit mode: plain textarea accepting Markdown -->
    <textarea
      v-if="isEditable"
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      rows="4"
      class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
      @input="onInput"
    />

    <!-- Read-only mode: rendered Markdown -->
    <div
      v-else-if="rendered"
      class="prose prose-sm max-w-none"
      v-html="rendered"
    />
  </div>
</template>

<style>
.prose { color: #374151; line-height: 1.6; }
.prose p { margin: 0 0 0.5em; }
.prose p:last-child { margin-bottom: 0; }
.prose strong { font-weight: 600; }
.prose em { font-style: italic; }
.prose ul { list-style-type: disc; padding-left: 1.5em; margin: 0.25em 0; }
.prose ol { list-style-type: decimal; padding-left: 1.5em; margin: 0.25em 0; }
.prose li { margin: 0.1em 0; }
.prose h1, .prose h2, .prose h3 { font-weight: 600; margin: 0.5em 0 0.25em; }
.prose h1 { font-size: 1.2em; }
.prose h2 { font-size: 1.1em; }
.prose h3 { font-size: 1em; }
.prose a { color: #16a34a; text-decoration: underline; }
.prose code { background: #f3f4f6; padding: 0.1em 0.3em; border-radius: 3px; font-size: 0.9em; }
.prose pre { background: #f3f4f6; padding: 0.75em 1em; border-radius: 8px; overflow-x: auto; }
.prose pre code { background: none; padding: 0; }
.prose blockquote { border-left: 3px solid #d1d5db; padding-left: 1em; color: #6b7280; margin: 0.5em 0; }
.prose hr { border: none; border-top: 1px solid #e5e7eb; margin: 0.75em 0; }
</style>
