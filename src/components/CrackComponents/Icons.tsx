import {Image} from 'expo-image'
import {type PathProps, type SvgProps} from 'react-native-svg'

export function LightnerIcon({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 24)

  return (
    <Image
      source={require('#/../assets/lightner.png')}
      accessibilityLabel="Lightner"
      accessibilityHint=""
      accessibilityIgnoresInvertColors
      style={{width: size, height: size}}
    />
  )
}

export function DarknerIcon({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 24)

  return (
    <Image
      source={require('#/../assets/darkner.png')}
      accessibilityLabel="Darkner"
      accessibilityHint=""
      accessibilityIgnoresInvertColors
      style={{width: size, height: size}}
    />
  )
}
