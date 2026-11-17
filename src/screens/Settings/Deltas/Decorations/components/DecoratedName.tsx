import {Text, type TextProps} from '#/components/Typography'
import {
  useNameGradient,
  useNameStyle,
} from '#/deltas/feat/avatarDecorations/useDecorations'

/**
 * A display name painted with its owner's decoration, for places that render a
 * name inline without threading the gradient through by hand. Falls back to
 * plain text when the profile has no decoration.
 */
export function DecoratedName({
  did,
  children,
  style,
  ...rest
}: Omit<TextProps, 'gradient'> & {
  did: string | undefined
  children: string
}) {
  const gradient = useNameGradient(did)
  const nameStyle = useNameStyle(did)
  return (
    <Text emoji gradient={gradient} style={[style, nameStyle]} {...rest}>
      {children}
    </Text>
  )
}
