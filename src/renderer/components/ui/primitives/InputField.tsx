import React from 'react'

type InputFieldAction = {
  label: string
  onClick: () => void
}

type InputFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  action?: InputFieldAction
  disabled?: boolean
  readOnly?: boolean
}

/** Labeled text input with optional action button (used in social forms). */
export default function InputField({
  label,
  value,
  onChange,
  placeholder,
  action,
  disabled = false,
  readOnly = false
}: InputFieldProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold text-[var(--color-ds-muted)] uppercase tracking-[0.2em]">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className="
            flex-1 min-w-0
            bg-[var(--color-ds-bg)]
            border border-[var(--color-ds-border)]
            rounded-lg px-3 py-2
            text-sm text-[var(--color-ds-text)]
            placeholder:text-[var(--color-ds-muted)]/40
            focus:outline-none focus:border-[var(--color-ds-accent)]
            transition-colors duration-150
            disabled:opacity-40 disabled:cursor-not-allowed
            read-only:cursor-default
          "
        />
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            disabled={disabled}
            className="
              shrink-0 px-3 py-2
              bg-[var(--color-ds-surface)]
              border border-[var(--color-ds-border)]
              rounded-lg
              text-sm text-[var(--color-ds-muted)]
              hover:border-[var(--color-ds-accent)]/60
              hover:text-[var(--color-ds-text)]
              transition-colors duration-150
              disabled:opacity-40 disabled:cursor-not-allowed
              whitespace-nowrap
            "
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}
