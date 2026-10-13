import { useId } from 'react'
import Button from '@components/atoms/Button'
import { Field, FieldError, FieldLabel } from '@components/ui/field'
import { Input } from '@components/ui/input'

type InputFieldAction = {
  label: string
  onClick: () => void
  /** Waiting for the action's answer: spinner in the button (ADR 0018). */
  loading?: boolean
}

type InputFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  action?: InputFieldAction
  disabled?: boolean
  readOnly?: boolean
  /** Field name, for forms (ADR 0022). */
  name?: string
  onBlur?: () => void
  maxLength?: number
  /** Validation message, already translated; marks the input invalid. */
  error?: string
}

/** Labelled text input with an optional action button: shadcn's Field and Input (ADR 0027). */
export default function InputField({
  label,
  value,
  onChange,
  placeholder,
  action,
  disabled = false,
  readOnly = false,
  name,
  onBlur,
  maxLength,
  error
}: InputFieldProps): React.JSX.Element {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex gap-2">
        <Input
          id={id}
          type="text"
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className="flex-1"
        />
        {action && (
          <Button
            variant="outline"
            size="sm"
            onClick={action.onClick}
            disabled={disabled}
            loading={action.loading}
          >
            {action.label}
          </Button>
        )}
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </Field>
  )
}
