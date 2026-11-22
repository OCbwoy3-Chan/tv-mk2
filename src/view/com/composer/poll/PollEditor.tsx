import {Pressable, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {
  DEFAULT_POLL_DURATION,
  getOptionIssues,
  getPollEndIssue,
  POLL_DURATIONS,
  POLL_MIN_OPTIONS,
  POLL_OPTION_MAX_BYTES,
  POLL_OPTION_MAX_GRAPHEMES,
  type PollDraft,
  type PollDuration,
  pollEndsAt,
  pollHasContent,
} from '#/lib/api/poll'
import {EmbedEditorRemoveBtn} from '#/view/com/composer/EmbedEditorRemoveBtn'
import {type PostAction} from '#/view/com/composer/state/composer'
import {atoms as a, useTheme} from '#/alf'
import {DateTimeField, utils as dt} from '#/components/forms/DateTimeField'
import * as TextField from '#/components/forms/TextField'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon} from '#/components/icons/Chevron'
import {Clock_Stroke2_Corner0_Rounded as ClockIcon} from '#/components/icons/Clock'
import {Poll_Stroke2_Corner0_Rounded as PollIcon} from '#/components/icons/Poll'
import * as Menu from '#/components/Menu'
import {POLL_CHOICE_TEXT} from '#/components/Poll/PollBar'
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
  const custom = Boolean(poll.endsAt)
  const endIssue = getPollEndIssue(poll, new Date())

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
              a.text_sm,
              a.font_semi_bold,
              {color: t.palette.primary_500},
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
                // The real limit is graphemes and bytes, checked below; this
                // only stops runaway pastes, since UTF-16 length <= UTF-8 bytes.
                maxLength={POLL_OPTION_MAX_BYTES}
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
            {isInvalid && (
              <Text
                testID={`pollOptionHint-${index}`}
                style={[
                  a.text_xs,
                  a.text_right,
                  {color: t.palette.negative_500},
                ]}>
                {issue === 'invalid' ? (
                  <Trans>
                    This choice contains characters that cannot be saved
                  </Trans>
                ) : (
                  <Trans>
                    Choices can be up to {POLL_OPTION_MAX_GRAPHEMES} characters
                  </Trans>
                )}
              </Text>
            )}
          </View>
        )
      })}

      <Menu.Root>
        <Menu.Trigger
          label={
            custom
              ? l`Poll closes at a set time, change`
              : l`Poll closes after ${durationLabel(duration)}, change`
          }>
          {({props, state}) => (
            <Pressable
              testID="pollDurationBtn"
              {...props}
              style={[
                a.flex_row,
                a.align_center,
                a.self_start,
                a.gap_xs,
                a.py_xs,
                a.px_sm,
                a.rounded_sm,
                // Its left edge lines up with the choice fields above.
                state.hovered || state.pressed
                  ? t.atoms.bg_contrast_50
                  : t.atoms.bg_contrast_25,
              ]}>
              <ClockIcon size="sm" style={t.atoms.text_contrast_medium} />
              <Text style={[POLL_CHOICE_TEXT, t.atoms.text_contrast_medium]}>
                {custom ? (
                  <Trans comment="The poll closes at a date and time the author picked">
                    Closes at a{' '}
                    <Text
                      style={[
                        POLL_CHOICE_TEXT,
                        a.font_semi_bold,
                        {color: t.palette.primary_500},
                      ]}>
                      set time
                    </Text>
                  </Trans>
                ) : (
                  <Trans comment="Before the poll's duration, e.g. “Closes after 1 day”">
                    Closes after{' '}
                    <Text
                      style={[
                        POLL_CHOICE_TEXT,
                        a.font_semi_bold,
                        {color: t.palette.primary_500},
                      ]}>
                      {durationLabel(duration)}
                    </Text>
                  </Trans>
                )}
              </Text>
              <ChevronDownIcon size="xs" fill={t.palette.primary_500} />
            </Pressable>
          )}
        </Menu.Trigger>
        <Menu.Outer showCancel>
          <Menu.Group>
            {POLL_DURATIONS.map(value => (
              <Menu.Item
                key={value}
                testID={`pollDuration-${value}`}
                label={l`Poll closes after ${durationLabel(value)}`}
                onPress={() =>
                  dispatch({type: 'embed_set_poll_duration', duration: value})
                }>
                <SelectedMark selected={!custom && value === duration} />
                <Menu.ItemText
                  style={
                    !custom && value === duration
                      ? {color: t.palette.primary_500}
                      : undefined
                  }>
                  {durationLabel(value)}
                </Menu.ItemText>
              </Menu.Item>
            ))}
            <Menu.Item
              testID="pollDuration-custom"
              label={l`Pick when the poll closes`}
              onPress={() =>
                dispatch({
                  type: 'embed_set_poll_end',
                  endsAt: custom ? poll.endsAt : defaultCustomEnd(duration),
                })
              }>
              <SelectedMark selected={custom} />
              <Menu.ItemText
                style={custom ? {color: t.palette.primary_500} : undefined}>
                <Trans comment="Menu item to pick a poll's closing date and time">
                  Custom…
                </Trans>
              </Menu.ItemText>
            </Menu.Item>
          </Menu.Group>
        </Menu.Outer>
      </Menu.Root>
      {custom && (
        <View style={[a.gap_xs]}>
          <DateTimeField
            testID="pollEndField"
            label={l`Poll closing time`}
            value={poll.endsAt ?? ''}
            minimumDate={new Date()}
            onChangeDateTime={value =>
              dispatch({type: 'embed_set_poll_end', endsAt: value})
            }
            isInvalid={endIssue !== null}
          />
          {endIssue && (
            <Text
              testID="pollEndHint"
              style={[a.text_xs, {color: t.palette.negative_500}]}>
              <Trans>Pick a time at least 5 minutes from now</Trans>
            </Text>
          )}
        </View>
      )}

      <Text style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]}>
        <Trans>Votes are public and handled by TOKIMEKI Poll</Trans>
      </Text>
    </View>
  )
}

/**
 * Where "Custom…" starts: the preset's closing time, rounded up to the next
 * quarter hour so the picker opens on a tidy value.
 */
function defaultCustomEnd(duration: PollDuration): string {
  const end = new Date(pollEndsAt({duration}, new Date()))
  const quarter = 15 * 60e3
  return dt.toDateTimeLocal(
    new Date(Math.ceil(end.getTime() / quarter) * quarter),
  )
}

/**
 * The selected item's check, in a fixed column so every label lines up, the
 * way `Select.ItemIndicator` marks a choice.
 */
function SelectedMark({selected}: {selected: boolean}) {
  const t = useTheme()
  return (
    <View style={[a.align_center, {width: 24}]}>
      {selected && <CheckIcon size="md" fill={t.palette.primary_500} />}
    </View>
  )
}
