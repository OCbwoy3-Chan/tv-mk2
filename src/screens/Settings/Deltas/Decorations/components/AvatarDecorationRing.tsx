import {View, type ViewStyle} from 'react-native'

import {atoms as a} from '#/alf'
import {type DecorationFrame} from '#/deltas/feat/avatarDecorations/catalog'

/**
 * Code-drawn ring frame overlaid on an avatar. It is an absolute inset ring
 * within the avatar bounds, like the live-status border, so nothing renders
 * outside the container on any platform.
 */
export function AvatarDecorationRing({
  frame,
  size,
  borderRadius,
}: {
  frame: DecorationFrame
  size: number
  borderRadius?: ViewStyle['borderRadius']
}) {
  // Scale the stroke with the avatar, snapped to half pixels for crisp edges.
  const width = Math.max(1.5, Math.round(size * 0.07 * 2) / 2)
  return (
    <View
      testID="avatarDecorationRing"
      accessible={false}
      pointerEvents="none"
      style={[
        a.absolute,
        a.inset_0,
        a.rounded_full,
        {borderWidth: width, borderColor: frame.color, borderRadius},
      ]}
    />
  )
}
