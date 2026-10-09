/** Normalized hat center and size, relative to the square avatar. */
export type HatPlacement = {
  x: number
  y: number
  size: number
  rotation: number
}

export const INITIAL_HAT_PLACEMENT: HatPlacement = {
  x: 0.5,
  y: 0.38,
  size: 0.5,
  rotation: 0,
}
export const DEFAULT_HAT_COLOR = '#ED5345'
export const AVATAR_SIZE = 1000

export function isOctober(date = new Date()) {
  return date.getMonth() === 9
}

export function moveHat(
  start: HatPlacement,
  dx: number,
  dy: number,
  previewSize: number,
): HatPlacement {
  if (previewSize <= 0) return start
  return {
    ...start,
    x: Math.max(0, Math.min(1, start.x + dx / previewSize)),
    y: Math.max(0, Math.min(1, start.y + dy / previewSize)),
  }
}
