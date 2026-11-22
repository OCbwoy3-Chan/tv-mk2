import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {CircleCheck_Stroke2_Corner0_Rounded as CircleCheckIcon} from '#/components/icons/CircleCheck'
import {Text} from '#/components/Typography'

/**
 * Poll choices sit a step above small text but stay under the post's own
 * text (`text_md`), so a poll doesn't outweigh what it's attached to.
 */
export const POLL_CHOICE_TEXT = {fontSize: 14}

/*
 * Vote buttons and result bars share a height, so voting doesn't shift the
 * post below.
 */
export const POLL_CHOICE_MIN_HEIGHT = 36

/**
 * One option of a poll as a filled bar, the viewer's pick in the accent
 * color. Borderless, so a poll reads as part of the post, not a card in it.
 */
export function PollBar({
  label,
  pct,
  mine,
  winner = false,
}: {
  label: string
  pct: number
  mine: boolean
  /** A top choice of a poll that has ended; ties mark each of them. */
  winner?: boolean
}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.relative,
        a.justify_center,
        a.rounded_sm,
        a.overflow_hidden,
        t.atoms.bg_contrast_25,
        {minHeight: POLL_CHOICE_MIN_HEIGHT},
      ]}>
      <View
        style={[
          {position: 'absolute', top: 0, bottom: 0, left: 0, width: `${pct}%`},
          {
            backgroundColor: mine
              ? t.palette.primary_200
              : t.palette.contrast_100,
          },
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
        <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_xs]}>
          <Text
            emoji
            style={[
              POLL_CHOICE_TEXT,
              a.flex_shrink,
              a.leading_snug,
              (mine || winner) && a.font_semi_bold,
            ]}
            numberOfLines={2}>
            {label}
          </Text>
          {winner && (
            <CircleCheckIcon
              testID="pollWinnerMark"
              size="sm"
              fill={t.palette.primary_500}
            />
          )}
        </View>
        <Text
          style={[
            POLL_CHOICE_TEXT,
            a.font_semi_bold,
            mine ? {color: t.palette.primary_600} : t.atoms.text_contrast_high,
          ]}>
          {pct}%
        </Text>
      </View>
    </View>
  )
}
