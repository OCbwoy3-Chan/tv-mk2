import { Image } from 'expo-image'

import {type Props, useCommonSVGProps} from './common'

export function Full(
  props: Omit<Props, 'fill' | 'size' | 'height'> & {
    markFill?: Props['fill']
    textFill?: Props['fill']
  },
) {
  const {size} = useCommonSVGProps(props)
  
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

export const Mark = Full;