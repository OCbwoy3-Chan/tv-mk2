import {View, type ViewProps} from 'react-native'
import MaskedView from '@react-native-masked-view/masked-view'
import Svg, {Path} from 'react-native-svg'

import {IS_WEB} from '#/env'
import {hexagonPath} from './avatarShapes'

const NativeMaskedView = MaskedView as unknown as React.ComponentType<
  ViewProps & {maskElement: React.ReactElement}
>

export function AvatarShapeMask({
  size,
  rounded,
  children,
}: {
  size: number
  rounded: boolean
  children: React.ReactNode
}) {
  const path = hexagonPath(size, rounded)
  if (IS_WEB) {
    return (
      <View
        style={
          {width: size, height: size, clipPath: `path('${path}')`} as never
        }>
        {children}
      </View>
    )
  }
  return (
    <NativeMaskedView
      style={{width: size, height: size}}
      maskElement={
        <Svg width={size} height={size}>
          <Path d={path} fill="black" />
        </Svg>
      }>
      {children}
    </NativeMaskedView>
  )
}
