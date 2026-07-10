import {type PathProps, type SvgProps} from 'react-native-svg'
import { Image } from 'expo-image'

export function Logomark({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  const size = parseInt(rest.width || 32)

  return (
    <Image
      source={require('../../../assets/logo.png')}
      accessibilityLabel="Tenna"
      accessibilityHint=""
      accessibilityIgnoresInvertColors
      style={[{height: size, aspectRatio: 500 / 441}]}
    />
  )
}
