/**
 * Where the launcher's in-place update stands (ADR 0050), pushed by main on
 * `launcher:update-state`. `unsupported`: this run cannot update itself (deb, rpm, macOS, not
 * packaged), the download link stays.
 */
export type LauncherUpdateState =
  | { status: 'unsupported' }
  | { status: 'checking' }
  | { status: 'idle' }
  | { status: 'downloading'; version: string; percent: number }
  | { status: 'ready'; version: string }
  | { status: 'error' }
