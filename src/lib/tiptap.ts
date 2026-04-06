import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'

export const baseExtensions = [
  StarterKit,
  Link.configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
  }),
]

export function getExtensions(placeholder?: string) {
  return [
    ...baseExtensions,
    ...(placeholder
      ? [Placeholder.configure({ placeholder })]
      : []),
  ]
}
