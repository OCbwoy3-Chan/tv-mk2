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
      source={require('#/../assets/badges/lightner.png')}
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
      source={require('#/../assets/badges/darkner.png')}
      accessibilityLabel="Darkner"
      accessibilityHint=""
      accessibilityIgnoresInvertColors
      style={{width: size, height: size}}
    />
  )
}

export function TennaIcon({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 24)

  return (
    <Image
      source={require('#/../assets/logo.png')}
      accessibilityLabel="Tenna"
      accessibilityHint=""
      accessibilityIgnoresInvertColors
      style={{width: size, height: size}}
    />
  )
}
