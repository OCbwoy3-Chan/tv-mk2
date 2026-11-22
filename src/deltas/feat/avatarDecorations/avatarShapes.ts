export const AVATAR_SHAPES = [
  'circle',
  'square',
  'squircle',
  'hexagon',
  'triangle',
] as const

export type AvatarShape = (typeof AVATAR_SHAPES)[number]

export function isAvatarShape(value: unknown): value is AvatarShape {
  return (
    typeof value === 'string' &&
    (AVATAR_SHAPES as readonly string[]).includes(value)
  )
}

/**
 * A flat-sided hexagon, with each vertex optionally rounded by a fraction of
 * its edge. `inset` keeps a stroked copy of the path inside the avatar bounds.
 */
export function hexagonPath(size: number, rounded: boolean, inset = 0) {
  return polygonPath(size, rounded, inset, [
    [0.25, 0.067],
    [0.75, 0.067],
    [1, 0.5],
    [0.75, 0.933],
    [0.25, 0.933],
    [0, 0.5],
  ])
}

/** An upward-pointing triangle with optional rounded corners. */
export function trianglePath(size: number, rounded: boolean, inset = 0) {
  return polygonPath(size, rounded, inset, [
    [0.5, 0],
    [1, 1],
    [0, 1],
  ])
}

function polygonPath(
  size: number,
  rounded: boolean,
  inset: number,
  points: number[][],
) {
  const width = size - inset * 2
  const vertices = points.map(([x, y]) => [
    inset + x * width,
    inset + y * width,
  ])
  const amount = rounded ? 0.12 : 0
  const point = (from: number[], to: number[]) =>
    `${from[0] + (to[0] - from[0]) * amount} ${from[1] + (to[1] - from[1]) * amount}`
  return (
    vertices
      .map((vertex, index) => {
        const previous =
          vertices[(index + vertices.length - 1) % vertices.length]
        const next = vertices[(index + 1) % vertices.length]
        return `${index === 0 ? 'M' : 'L'} ${point(vertex, previous)} Q ${vertex[0]} ${vertex[1]} ${point(vertex, next)}`
      })
      .join(' ') + ' Z'
  )
}
