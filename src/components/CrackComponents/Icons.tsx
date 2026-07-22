import { Image, ImageProps } from 'expo-image'
import { Svg, Path, type PathProps, type SvgProps } from 'react-native-svg'

export function TobyIcon({
  fill,
  ...rest
}: { fill?: PathProps['fill'] } & SvgProps) {
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 24)

  return (
    <Image
      source={require('#/../assets/badges/toby.png')}
      accessibilityLabel="Toby"
      accessibilityHint=""
      accessibilityIgnoresInvertColors
      style={{ width: size, height: size }}
    />
  )
}

export function TennaIcon({
  fill,
  source,
  ...rest
}: { fill?: PathProps['fill'] } & SvgProps & ImageProps) {
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 24);

  return (
    <Image
      source={source}
      accessibilityLabel="Tenna"
      accessibilityHint=""
      accessibilityIgnoresInvertColors
      style={{ width: size, height: size }}
    />
  )
}
