import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

export const baseExtensions = [
  StarterKit.configure({
    link: {
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
    },
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
