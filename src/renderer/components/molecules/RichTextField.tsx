import { useEffect, useId, useRef } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import { Color, TextStyle } from '@tiptap/extension-text-style'
import { Placeholder, UndoRedo } from '@tiptap/extensions'
import { Field, FieldDescription, FieldError, FieldLabel } from '@components/ui/field'
import { bbcodeToDocument, documentToBBCode } from '@lib/bbcodeDocument'
import RichTextToolbar, { type RichTextMark } from './RichTextToolbar'

export type RichTextFieldProps = {
  label: string
  /** The text, in BBCode. */
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  /** Longest BBCode accepted; shown as a counter under the field. */
  maxLength: number
  placeholder?: string
  disabled?: boolean
  /** Validation message, already translated; marks the field invalid. */
  error?: string
}

/** Only what the game reads (ADR 0014): pasted rich text keeps nothing else. */
const extensions = (placeholder: string): Parameters<typeof useEditor>[0]['extensions'] => [
  Document,
  Paragraph,
  Text,
  Bold,
  Italic,
  Underline,
  Strike,
  HorizontalRule,
  TextStyle,
  Color,
  UndoRedo,
  Placeholder.configure({ placeholder })
]

/**
 * A player text written as it will show (WYSIWYG, ADR 0030) and kept as BBCode: the editor reads
 * and writes the field's BBCode value, for React Hook Form (ADR 0022).
 */
export default function RichTextField({
  label,
  value,
  onChange,
  onBlur,
  maxLength,
  placeholder = '',
  disabled = false,
  error
}: RichTextFieldProps): React.JSX.Element {
  const id = useId()
  const labelId = `${id}-label`
  const errorId = `${id}-error`
  const descriptionId = `${id}-description`
  /** Attributes of the editable element: named by the label, described, invalid with an error. */
  const attributes = (message?: string): Record<string, string> => ({
    role: 'textbox',
    'aria-multiline': 'true',
    'aria-labelledby': labelId,
    'aria-describedby': [message && errorId, descriptionId].filter(Boolean).join(' '),
    ...(message ? { 'aria-invalid': 'true' } : {}),
    class:
      'min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base ' +
      'outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 ' +
      'focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 ' +
      'aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 whitespace-pre-wrap ' +
      '[overflow-wrap:anywhere] [&_hr]:my-2 [&_hr]:border-ds-border ' +
      // The placeholder of an empty text (TipTap's Placeholder marks the paragraph)
      '[&_p.is-editor-empty:first-child]:before:pointer-events-none ' +
      '[&_p.is-editor-empty:first-child]:before:float-left ' +
      '[&_p.is-editor-empty:first-child]:before:h-0 ' +
      '[&_p.is-editor-empty:first-child]:before:text-ds-muted ' +
      '[&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]'
  })
  // Last BBCode the editor sent: a different value comes from outside (a form reset)
  const written = useRef(value)

  const editor = useEditor({
    extensions: extensions(placeholder),
    content: bbcodeToDocument(value),
    editable: !disabled,
    onUpdate: ({ editor }) => {
      written.current = documentToBBCode(editor.getJSON())
      onChange(written.current)
    },
    onBlur: () => onBlur?.(),
    editorProps: { attributes: attributes(error) }
  })

  useEffect(() => {
    if (!editor || value === written.current) return
    written.current = value
    editor.commands.setContent(bbcodeToDocument(value), { emitUpdate: false })
  }, [editor, value])

  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [editor, disabled])

  useEffect(() => {
    editor?.setOptions({ editorProps: { attributes: attributes(error) } })
    // `attributes` only reads ids that never change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, error])

  const active = useEditorState({
    editor,
    selector: ({ editor }): Record<RichTextMark, boolean> => ({
      bold: editor?.isActive('bold') ?? false,
      italic: editor?.isActive('italic') ?? false,
      underline: editor?.isActive('underline') ?? false,
      strike: editor?.isActive('strike') ?? false
    })
  }) ?? { bold: false, italic: false, underline: false, strike: false }

  const chain = (): ReturnType<NonNullable<typeof editor>['chain']> | undefined =>
    editor?.chain().focus()

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel id={labelId} onClick={() => editor?.commands.focus()}>
        {label}
      </FieldLabel>
      <RichTextToolbar
        active={active}
        disabled={disabled}
        onToggle={(mark) => chain()?.toggleMark(mark).run()}
        onColor={(color) => (color ? chain()?.setColor(color).run() : chain()?.unsetColor().run())}
        onRule={() => chain()?.setHorizontalRule().run()}
      />
      <EditorContent editor={editor} />
      <FieldDescription id={descriptionId}>
        {value.length} / {maxLength}
      </FieldDescription>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </Field>
  )
}
