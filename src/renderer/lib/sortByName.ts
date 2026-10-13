/**
 * Sorts items by name the way people read lists: letters before case and accents ("émile" by
 * "Emma"), numbers by value ("Pilot 2" before "Pilot 10"). Returns a new array.
 */
export function sortByName<T extends { name: string }>(items: readonly T[], locale?: string): T[] {
  const collator = new Intl.Collator(locale, { sensitivity: 'base', numeric: true })
  return [...items].sort((a, b) => collator.compare(a.name, b.name))
}
