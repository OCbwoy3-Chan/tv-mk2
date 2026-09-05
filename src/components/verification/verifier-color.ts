/** Stable across sessions and platforms, independent of mutable handles. */
export function verifierColor(did: string): string {
  let hash = 2166136261
  for (const char of did) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  }
  return `hsl(${(hash >>> 0) % 360}, 65%, 45%)`
}
