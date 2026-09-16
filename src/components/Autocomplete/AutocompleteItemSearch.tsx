import {View} from 'react-native'
import {SiftItem} from '@bsky.app/sift'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon} from '#/components/icons/MagnifyingGlass'
import {Text} from '#/components/Typography'
import {type AutocompleteItemProps} from './types'

export function AutocompleteItemSearch({
  active,
  isFirst,
  isLast,
  props,
  item,
}: AutocompleteItemProps) {
  const t = useTheme()

  const {t: l} = useLingui()

  if (item.type !== 'search' && item.type !== 'open-link') return null
  const Icon = item.type === 'open-link' ? ChainLinkIcon : MagnifyingGlassIcon
  const label = item.type === 'open-link' ? l`Open link` : item.value

  return (
    <SiftItem
      {...props}
      accessibilityLabel={label}
      accessibilityHint=""
      testID={item.type === 'open-link' ? 'autocompleteOpenLink' : undefined}
      style={s => [
        a.py_sm,
        a.px_md,
        a.flex_row,
        a.align_center,
        a.gap_sm,
        active || s.hovered || s.pressed ? [t.atoms.bg_contrast_25] : [],
        isFirst && {
          paddingTop: a.py_sm.paddingTop * 1.2,
        },
        isLast && {
          paddingBottom: a.py_sm.paddingTop * 1.2,
        },
      ]}>
      <View
        style={[
          a.align_center,
          {
            width: 40,
          },
        ]}>
        <Icon fill={t.atoms.text_contrast_low.color} size="xl" />
      </View>
      <Text style={[a.text_md, a.leading_snug]}>{label}</Text>
    </SiftItem>
  )
}
