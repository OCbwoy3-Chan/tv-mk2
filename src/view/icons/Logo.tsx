import {forwardRef} from 'react'
import {type TextProps} from 'react-native'
import {Image} from 'expo-image'
import {type SvgProps} from 'react-native-svg'

import {useLogoVariant} from '#/view/icons/useLogoVariant'

/**
 * Renders the Tenna Party logo while preserving the SVG logo component API.
 */
type Props = {
  allowVariants?: boolean
  fill?: string
  style?: TextProps['style']
} & Omit<SvgProps, 'style'>

export const Logo = forwardRef(function LogoImpl(props: Props, _ref) {
  const {allowVariants = true, style, width = 32} = props
  const size = Number.parseFloat(String(width))

  useLogoVariant(allowVariants)

  return (
    <Image
      source={require('../../../assets/logo.png')}
      accessibilityLabel="Tenna Party"
      accessibilityHint=""
      accessibilityIgnoresInvertColors
      contentFit="contain"
      style={[{width: size, height: size * (441 / 500)}, style]}
    />
  )
})
