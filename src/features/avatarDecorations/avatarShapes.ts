export const AVATAR_SHAPES = [
  'circle',
  'square',
  'squircle',
  'hexagon',
] as const
export type AvatarShape = (typeof AVATAR_SHAPES)[number]

/** A flat-sided hexagon, with each vertex rounded by a fraction of its edge. */
export function hexagonPath(size: number, rounded: boolean, inset = 0) {
  const width = size - inset * 2
  const vertices = [
    [0.25, 0.067],
    [0.75, 0.067],
    [1, 0.5],
    [0.75, 0.933],
    [0.25, 0.933],
    [0, 0.5],
  ].map(([x, y]) => [inset + x * width, inset + y * width])
  const amount = rounded ? 0.12 : 0
  const point = (a: number[], b: number[]) =>
    `${a[0] + (b[0] - a[0]) * amount} ${a[1] + (b[1] - a[1]) * amount}`
  return (
    vertices
      .map((vertex, i) => {
        const previous = vertices[(i + vertices.length - 1) % vertices.length]
        const next = vertices[(i + 1) % vertices.length]
        return `${i === 0 ? 'M' : 'L'} ${point(vertex, previous)} Q ${vertex[0]} ${vertex[1]} ${point(vertex, next)}`
      })
      .join(' ') + ' Z'
  )
}
