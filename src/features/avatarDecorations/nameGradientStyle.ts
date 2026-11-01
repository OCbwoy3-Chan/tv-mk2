/** Adapted from eurosky-social/eurosky-social-app (MIT). */
import {type TextStyle} from 'react-native'

import {type NameGradient} from './nameGradients'

/**
 * Native fallback style for display names. GradientName supplies the colored
 * characters and draws the hard outline on Android.
 *
 * `outline` adds a dark edge around the letters. Native can't stroke text, so
 * it approximates with a tight dark shadow.
 */
export function nameGradientTextStyle(
  gradient: Pick<NameGradient, 'colors' | 'segmented'> & {solid?: string},
  opts?: {outline?: boolean},
): TextStyle {
  if (opts?.outline) {
    return {
      color: gradient.solid ?? gradient.colors[0],
      textShadowColor: '#050408',
      textShadowOffset: {width: 0, height: 0},
      textShadowRadius: 2,
    }
  }
  return {color: gradient.solid ?? gradient.colors[0]}
}
