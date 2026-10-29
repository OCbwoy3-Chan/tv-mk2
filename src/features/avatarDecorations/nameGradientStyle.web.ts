/** Adapted from eurosky-social/eurosky-social-app (MIT). */
import {type TextStyle} from 'react-native'

import {type NameGradient} from './nameGradients'

/**
 * Paints the name with a real gradient via background-clip: text. The text
 * itself is transparent and reveals the gradient behind it. Placed last in a
 * style array so `color: transparent` overrides the theme text color.
 *
 * `outline` draws a dark stroke around the letters (the bubbly-logo look).
 * Stroke width is in `em` so it scales with the name's font size, and
 * `paint-order: stroke` puts the stroke behind the fill so the gradient stays
 * crisp. The outline doubles as a contrast guarantee - a gradient name reads
 * on any background once it has a hard edge.
 */

export function nameGradientTextStyle(
  gradient: NameGradient,
  opts?: {outline?: boolean},
): TextStyle {
  const stops = gradient.segmented
    ? gradient.colors
        .map((color, index) => {
          const start = (index / gradient.colors.length) * 100
          const end = ((index + 1) / gradient.colors.length) * 100
          return `${color} ${start}% ${end}%`
        })
        .join(', ')
    : gradient.colors.join(', ')

  const base: Record<string, unknown> = {
    backgroundImage: `linear-gradient(90deg, ${stops})`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
  }

  if (opts?.outline) {
    const color = '#050408'
    const width = 2

    return {
      ...base,
      filter: [
        `drop-shadow(${width}px 0 0 ${color})`,
        `drop-shadow(-${width}px 0 0 ${color})`,
        `drop-shadow(0 ${width}px 0 ${color})`,
        `drop-shadow(0 -${width}px 0 ${color})`,
      ].join(' '),
    } as TextStyle
  }

  return {
    ...base,
    textShadow: '0 0 1px rgba(0,0,0,0.06)',
  } as TextStyle
}
