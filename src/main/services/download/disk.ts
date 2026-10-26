import * as fs from 'fs'

/** Bytes free for the launcher on the disk holding `dir` (ADR 0047). */
export async function freeBytes(dir: string): Promise<number> {
  const stats = await fs.promises.statfs(dir)
  return stats.bavail * stats.bsize
}

/** Not enough space on the disk for a step of the install, in bytes (ADR 0047). */
export class DiskFullError extends Error {
  readonly needed: number
  readonly available: number

  constructor(needed: number, available: number) {
    super(`Not enough disk space: ${needed} bytes needed, ${available} free`)
    this.needed = needed
    this.available = available
  }
}

/** Whether a file system error says the disk is full. */
export function isNoSpace(err: unknown): boolean {
  return (err as NodeJS.ErrnoException | null)?.code === 'ENOSPC'
}
