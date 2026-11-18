import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

/**
 * Poll choices sit a step above small text but stay under the post's own
 * text (`text_md`), so a poll doesn't outweigh what it's attached to.
 */
export const POLL_CHOICE_TEXT = {fontSize: 14}

/** One option of a poll as a percentage bar, highlighted if the viewer picked it. */
export function PollBar({
  label,
  pct,
  mine,
}: {
  label: string
  pct: number
  mine: boolean
}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.relative,
        a.rounded_xs,
        a.border,
        a.overflow_hidden,
        mine ? t.atoms.bg_contrast_25 : null,
        t.atoms.border_contrast_low,
      ]}>
      <View
        style={[
          {position: 'absolute', top: 0, bottom: 0, left: 0, width: `${pct}%`},
          {backgroundColor: t.palette.primary_100},
        ]}
      />
      <View
        style={[
          a.flex_row,
          a.justify_between,
          a.align_center,
          a.gap_sm,
          a.px_md,
          a.py_sm,
        ]}>
        <Text
          emoji
          style={[
            POLL_CHOICE_TEXT,
            mine && a.font_bold,
            a.flex_1,
            a.leading_snug,
          ]}
          numberOfLines={2}>
          {label}
        </Text>
        <Text
          style={[
            POLL_CHOICE_TEXT,
            a.font_semi_bold,
            t.atoms.text_contrast_high,
          ]}>
          {pct}%
        </Text>
      </View>
    </View>
  )
}
