/**
 * Godot option placing a barrier between Vulkan breadcrumbs, so that a GPU crash (device lost)
 * names the command that caused it in the game's output.
 */
const ACCURATE_BREADCRUMBS = '--accurate-breadcrumbs'

/** Command-line arguments the game executable is started with. */
export function gameArgs(token: string): string[] {
  return [`--token=${token}`, ACCURATE_BREADCRUMBS]
}
