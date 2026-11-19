import {useId} from 'react'
import Svg, {ClipPath, Defs, Image as SvgImage, Path} from 'react-native-svg'

import {hexagonPath} from '#/deltas/feat/avatarDecorations/avatarShapes'

/**
 * Hexagon avatar rendered as an SVG clip so it works identically on web and
 * native without a masked-view native module. The stroke is drawn on the same
 * path, inset by half the stroke width so it stays inside the avatar bounds.
 *
 * The clip id must be unique per mounted instance. Browsers resolve
 * `url(#id)` to the first matching element in document order, so a shared id
 * can point at a clipPath inside a hidden subtree (an inactive screen, a
 * virtualized-off row). That reference resolves to nothing, and the image then
 * paints unclipped - a plain rectangle under the hexagon stroke.
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
  // useId returns the same value on every render and differs per instance.
  // Strip the punctuation React puts in it so the fragment stays URL-safe.
  const clipId = `avatar-hexagon-${useId().replace(/[^\w-]/g, '')}`
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
