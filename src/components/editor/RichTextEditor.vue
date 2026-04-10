<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { watch } from 'vue'
import { getExtensions } from '@/lib/tiptap'
import type { JSONContent } from '@tiptap/vue-3'

const props = defineProps<{
  modelValue: JSONContent | null
  placeholder?: string
  editable?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: JSONContent | null] }>()

const editor = useEditor({
  content: props.modelValue ?? undefined,
  editable: props.editable !== false,
  extensions: getExtensions(props.placeholder),
  onUpdate({ editor }) {
    emit('update:modelValue', editor.isEmpty ? null : editor.getJSON())
  },
})

watch(
  () => props.modelValue,
  (val) => {
    if (!editor.value) return
    const current = editor.value.getJSON()
    if (JSON.stringify(current) !== JSON.stringify(val)) {
      if (val) {
        editor.value.commands.setContent(val)
      } else {
        editor.value.commands.clearContent()
      }
    }
  },
)

watch(
  () => props.editable,
  (val) => editor.value?.setEditable(val !== false),
)
</script>

<template>
  <div
    class="tiptap-wrapper"
    :class="editable !== false ? 'ring-1 ring-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-primary-500 bg-white' : ''"
  >
    <!-- Toolbar (only when editable) -->
    <div
      v-if="editable !== false && editor"
      class="flex items-center gap-1 px-2 py-1.5 border-b border-gray-100 flex-wrap"
    >
      <button
        type="button"
        class="p-1.5 rounded hover:bg-gray-100 text-gray-600 font-bold text-sm min-w-[30px]"
        :class="{ 'bg-gray-100': editor.isActive('bold') }"
        @click="editor.chain().focus().toggleBold().run()"
        title="Bold"
      >B</button>
      <button
        type="button"
        class="p-1.5 rounded hover:bg-gray-100 text-gray-600 italic text-sm min-w-[30px]"
        :class="{ 'bg-gray-100': editor.isActive('italic') }"
        @click="editor.chain().focus().toggleItalic().run()"
        title="Italic"
      >I</button>
      <button
        type="button"
        class="p-1.5 rounded hover:bg-gray-100 text-gray-600 text-sm min-w-[30px]"
        :class="{ 'bg-gray-100': editor.isActive('bulletList') }"
        @click="editor.chain().focus().toggleBulletList().run()"
        title="Bullet list"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </button>
      <button
        type="button"
        class="p-1.5 rounded hover:bg-gray-100 text-gray-600 text-sm min-w-[30px]"
        :class="{ 'bg-gray-100': editor.isActive('orderedList') }"
        @click="editor.chain().focus().toggleOrderedList().run()"
        title="Numbered list"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h10M7 16h10M3 8h.01M3 12h.01M3 16h.01" />
        </svg>
      </button>
      <button
        type="button"
        class="p-1.5 rounded hover:bg-gray-100 text-gray-600 text-sm min-w-[30px]"
        :class="{ 'bg-gray-100': editor.isActive('heading', { level: 2 }) }"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        title="Heading"
      >H</button>
    </div>

    <EditorContent
      :editor="editor"
      class="prose prose-sm max-w-none px-3 py-2 min-h-[80px] focus:outline-none"
    />
  </div>
</template>

<style>
.tiptap-wrapper .ProseMirror {
  outline: none;
  min-height: 80px;
}
.tiptap-wrapper .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: #9ca3af;
  float: left;
  pointer-events: none;
  height: 0;
}
.tiptap-wrapper .ProseMirror > * + * {
  margin-top: 0.5em;
}
.tiptap-wrapper .ProseMirror ul, .tiptap-wrapper .ProseMirror ol {
  padding-left: 1.5em;
}
.tiptap-wrapper .ProseMirror ul { list-style-type: disc; }
.tiptap-wrapper .ProseMirror ol { list-style-type: decimal; }
.tiptap-wrapper .ProseMirror h2 { font-size: 1.1em; font-weight: 600; }
.tiptap-wrapper .ProseMirror a { color: #16a34a; text-decoration: underline; }
</style>
