import {type StyleProp, View, type ViewStyle} from 'react-native'

import {sanitizePronouns} from '#/lib/strings/pronouns'
import {useEnableSquareButtons} from '#/state/preferences/enable-square-buttons'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function PronounPill({
  pronouns,
  style,
}: {
  pronouns?: string
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const square = useEnableSquareButtons()
  const label = sanitizePronouns(pronouns ?? '')
  if (!label) return null
  return (
    <View
      style={[
        t.atoms.bg_contrast_50,
        square ? a.rounded_xs : a.rounded_full,
        a.px_xs,
        a.py_2xs,
        a.flex_shrink,
        {maxWidth: '100%'},
        style,
      ]}>
      <Text
        emoji
        numberOfLines={1}
        style={[t.atoms.text_contrast_medium, a.text_xs, a.font_medium]}>
        {label}
      </Text>
    </View>
  )
}
