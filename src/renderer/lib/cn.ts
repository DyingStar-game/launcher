import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Composes class names and resolves conflicting Tailwind utilities (last one wins). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
