import {type PathProps, type SvgProps} from 'react-native-svg'
import {Image} from 'expo-image'

export function Logotype({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  //@ts-expect-error
  const size = parseInt(rest.width || 32)

  return (
    <Image
      source={require('../../../assets/wordmark.png')}
      accessibilityLabel="tenna.party"
      accessibilityHint=""
      accessibilityIgnoresInvertColors
      style={[{height: size * 0.5, aspectRatio: 992 / 204}]}
    />
  )
}