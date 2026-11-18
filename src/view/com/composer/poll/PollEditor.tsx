import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {
  DEFAULT_POLL_DURATION,
  getOptionIssues,
  POLL_DURATIONS,
  POLL_MIN_OPTIONS,
  POLL_OPTION_MAX_CHARS,
  type PollDraft,
  type PollDuration,
  pollHasContent,
} from '#/lib/api/poll'
import {EmbedEditorRemoveBtn} from '#/view/com/composer/EmbedEditorRemoveBtn'
import {type PostAction} from '#/view/com/composer/state/composer'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {Poll_Stroke2_Corner0_Rounded as PollIcon} from '#/components/icons/Poll'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

/**
 * Choices grow on their own: once every choice has text, the reducer adds a
 * blank one (up to the maximum), and blank extra choices are ignored when
 * posting. So there are no add or remove buttons.
 */
export function PollEditor({
  poll,
  dispatch,
}: {
  poll: PollDraft
  dispatch: (action: PostAction) => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const durationLabel = (value: PollDuration) =>
    ({
      '1h': l`1 hour`,
      '6h': l`6 hours`,
      '12h': l`12 hours`,
      '1d': l`1 day`,
      '3d': l`3 days`,
      '7d': l`7 days`,
    })[value]
  const options = poll.options ?? ['', '']
  const duration = poll.duration ?? DEFAULT_POLL_DURATION
  const issues = getOptionIssues(options)

  return (
    <View
      testID="pollEditor"
      style={[
        a.mt_lg,
        a.p_md,
        a.gap_md,
        a.rounded_md,
        a.border,
        t.atoms.border_contrast_low,
        t.atoms.bg_contrast_25,
      ]}>
      <View style={[a.flex_row, a.align_center, a.justify_between]}>
        <View style={[a.flex_row, a.align_center, a.gap_xs]}>
          <PollIcon size="sm" fill={t.palette.primary_500} />
          <Text
            style={[
              a.text_xs,
              a.font_bold,
              {color: t.palette.primary_500, textTransform: 'uppercase'},
            ]}>
            <Trans comment="Heading of the poll editor card in the post composer">
              Poll
            </Trans>
          </Text>
        </View>
        <EmbedEditorRemoveBtn
          testID="removePollBtn"
          label={l`Remove poll`}
          confirm={pollHasContent(poll)}
          promptTitle={l`Remove poll?`}
          promptDescription={l`The choices you've written will be lost.`}
          onRemove={() => {
            ax.metric('composer:poll:remove', {})
            dispatch({type: 'embed_remove_poll'})
          }}
        />
      </View>

      {options.map((option, index) => {
        const issue = issues[index]
        const isInvalid = issue === 'invalid' || issue === 'too_long'
        const isOptional = index >= POLL_MIN_OPTIONS
        return (
          <View key={index} style={[a.gap_2xs]}>
            <TextField.Root isInvalid={isInvalid}>
              <TextField.Input
                testID={`pollOptionInput-${index}`}
                maxLength={POLL_OPTION_MAX_CHARS}
                label={l({
                  message: `Choice ${index + 1}`,
                  comment:
                    'Accessibility label for a poll choice text field in the composer. The number is the position of the choice.',
                })}
                placeholder={
                  isOptional
                    ? l({
                        message: 'Choice (optional)',
                        comment:
                          'Placeholder for an extra, optional poll choice text field in the composer',
                      })
                    : l({
                        message: 'Choice',
                        comment:
                          'Placeholder for a poll choice text field in the composer',
                      })
                }
                value={option}
                onChangeText={next => {
                  // Typing into the blank extra slot is what adds a choice.
                  if (isOptional && !option && next) {
                    ax.metric('composer:poll:optionAdd', {count: index + 1})
                  }
                  dispatch({
                    type: 'embed_update_poll_option',
                    index,
                    text: next,
                  })
                }}
              />
            </TextField.Root>
            {issue === 'invalid' && (
              <Text
                testID={`pollOptionHint-${index}`}
                style={[
                  a.text_xs,
                  a.text_right,
                  {color: t.palette.negative_500},
                ]}>
                <Trans>
                  This choice contains characters that cannot be saved
                </Trans>
              </Text>
            )}
          </View>
        )
      })}

      <View style={[a.gap_xs]}>
        <Text style={[a.text_xs, a.font_medium, t.atoms.text_contrast_medium]}>
          <Trans comment="Label above the poll duration choices in the composer">
            Poll closes after
          </Trans>
        </Text>
        <View style={[a.flex_row, a.flex_wrap, a.gap_xs]}>
          {POLL_DURATIONS.map(value => {
            const selected = value === duration
            return (
              <Button
                key={value}
                testID={`pollDuration-${value}`}
                label={l`Poll closes after ${durationLabel(value)}`}
                onPress={() =>
                  dispatch({type: 'embed_set_poll_duration', duration: value})
                }
                accessibilityState={{selected}}
                size="tiny"
                color={selected ? 'primary' : 'secondary'}>
                <ButtonText>{durationLabel(value)}</ButtonText>
              </Button>
            )
          })}
        </View>
      </View>

      <Text style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]}>
        <Trans>Votes are public and handled by TOKIMEKI Poll</Trans>
      </Text>
    </View>
  )
}
