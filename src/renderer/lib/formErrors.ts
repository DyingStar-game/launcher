import type { ControllerFieldState } from 'react-hook-form'

/**
 * Translated validation message of a field once the player has changed it (ADR 0022); schema
 * messages are i18n keys (`forms.errors.*`).
 */
export function fieldError(
  state: ControllerFieldState,
  translate: (key: string) => string
): string | undefined {
  const message = state.error?.message
  return state.isDirty && message ? translate(message) : undefined
}
