import {useId} from 'react'
import Svg, {ClipPath, Defs, Image as SvgImage, Path} from 'react-native-svg'

import {hexagonPath} from '#/deltas/feat/avatarDecorations/avatarShapes'

/**
 * Hexagon avatar rendered as an SVG clip so it works identically on web and
 * native without a masked-view native module. The stroke is drawn on the same
 * path, inset by half the stroke width so it stays inside the avatar bounds.
 */
export function HexagonAvatar({
  uri,
  size,
  rounded,
  stroke,
  strokeWidth,
  testID,
}: {
  uri: string
  size: number
  rounded: boolean
  /** Border, decoration frame, or live color. */
  stroke?: string
  strokeWidth?: number
  testID?: string
}) {
  const clipId = `avatar-hexagon-${useId().replace(/:/g, '')}`
  return (
    <Svg width={size} height={size} testID={testID}>
      <Defs>
        <ClipPath id={clipId}>
          <Path d={hexagonPath(size, rounded)} />
        </ClipPath>
      </Defs>
      <SvgImage
        href={{uri}}
        x={0}
        y={0}
        width={size}
        height={size}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clipId})`}
      />
      {stroke && strokeWidth ? (
        <Path
          testID="avatarHexagonBorder"
          d={hexagonPath(size, rounded, strokeWidth / 2)}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      ) : null}
    </Svg>
  )
}
