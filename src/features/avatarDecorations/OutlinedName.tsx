import {useContext, useState} from 'react'
import {Text, View} from 'react-native'

import {NameTextContext} from './nameTextContext'

const offsets = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
]

/** Draws a hard edge with offset glyph copies using the installed text renderer. */
/* shortcut: each word is an inline box; split overlong words if character wrapping is needed. */
export function OutlinedName({
  text,
  children,
}: {
  text: string
  children: React.ReactNode
}) {
  const inherited = useContext(NameTextContext)
  const [metrics, setMetrics] = useState<{
    width: number
    height: number
    descender: number
  }>()
  const fontSize = inherited.fontSize ?? 16
  const height = metrics?.height ?? inherited.lineHeight ?? fontSize * 1.2
  const width = metrics?.width ?? text.length * fontSize
  const style = {
    fontFamily: inherited.fontFamily,
    fontSize,
    fontWeight: inherited.fontWeight,
    fontStyle: inherited.fontStyle,
    letterSpacing: inherited.letterSpacing,
    lineHeight: inherited.lineHeight,
    includeFontPadding: false,
    textShadowRadius: 0,
  }

  return (
    <View
      style={{
        width,
        height,
        overflow: 'visible',
        transform: [{translateY: metrics?.descender ?? 0}],
      }}>
      <Text
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        allowFontScaling={false}
        numberOfLines={1}
        style={[style, {position: 'absolute', width: 10000, opacity: 0}]}
        onTextLayout={({nativeEvent: {lines}}) => {
          const line = lines[0]
          if (!line) return
          const next = {
            width: Math.ceil(line.width),
            height: Math.ceil(line.height),
            descender: line.descender,
          }
          if (
            next.width !== metrics?.width ||
            next.height !== metrics?.height ||
            next.descender !== metrics?.descender
          ) {
            setMetrics(next)
          }
        }}>
        {text}
      </Text>
      {offsets.map(([x, y]) => (
        <Text
          key={`${x},${y}`}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          allowFontScaling={false}
          numberOfLines={1}
          style={[
            style,
            {position: 'absolute', left: x, top: y, width, color: '#050408'},
          ]}>
          {text}
        </Text>
      ))}
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={[style, {width}]}>
        {children}
      </Text>
    </View>
  )
}
