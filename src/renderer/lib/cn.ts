import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * `twMerge` told about the launcher's theme (ADR 0026): `text-2xs` is a font size (not a colour,
 * which it would otherwise drop against `text-black`), `nav-env` / `nav-full` are breakpoints.
 */
const twMerge = extendTailwindMerge({
  extend: { theme: { text: ['2xs'], breakpoint: ['nav-env', 'nav-full'] } }
})

/** Composes class names and resolves conflicting Tailwind utilities (last one wins). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
