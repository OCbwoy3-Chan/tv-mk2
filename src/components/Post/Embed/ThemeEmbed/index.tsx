import {View} from 'react-native'
import type {AppBskyEmbedExternal} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useThemeRecord} from '#/features/themes/api'
import {ThemePreview} from '#/features/themes/ThemePreview'
import {getColorSets} from '#/features/themes/types'
import {getThemeEmbedRoute} from './utils'

export function ThemeEmbed({
  view,
  onOpen,
}: {
  view: AppBskyEmbedExternal.ViewExternal
  onOpen?: () => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const route = getThemeEmbedRoute(view)
  const {data: theme} = useThemeRecord(route?.name, route?.rkey)
  if (!route) return null
  const colorSets = theme ? getColorSets(theme.record) : []
  const colorSet = colorSets[0]
  const title = theme?.record.name || view.title || _(msg`Theme`)
  const description = theme?.record.description || view.description
  return (
    <View
      style={[
        a.mt_sm,
        a.rounded_md,
        a.overflow_hidden,
        a.border,
        a.w_full,
        t.atoms.border_contrast_low,
      ]}>
      <Link
        label={_(msg`Preview theme ${title}`)}
        accessibilityHint=""
        to={{screen: 'Theme', params: route}}
        onPress={onOpen}
        style={[a.w_full]}>
        {() => (
          <View style={[a.w_full, a.overflow_hidden]}>
            {colorSet ? (
              <ThemePreview
                colorSet={colorSet}
                colorSets={colorSets}
                special={Boolean(theme?.record.special)}
                variantCount={colorSets.length}
                aspectRatio={3.82}
                hideLabel
                style={{minWidth: 0}}
              />
            ) : (
              <View
                style={[a.w_full, t.atoms.bg_contrast_25, {aspectRatio: 3.82}]}
              />
            )}
          </View>
        )}
      </Link>
      <View style={[a.p_md, a.gap_xs, t.atoms.bg]}>
        <Text numberOfLines={2} style={[a.text_lg, a.font_semi_bold]}>
          {title}
        </Text>
        {description ? (
          <Text
            numberOfLines={2}
            style={[a.text_sm, t.atoms.text_contrast_medium]}>
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  )
}
