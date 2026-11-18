import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {
  type EventDraft,
  eventHasContent,
  type EventMode,
  getEventNameIssue,
} from '#/lib/api/event'
import {EmbedEditorRemoveBtn} from '#/view/com/composer/EmbedEditorRemoveBtn'
import {type PostAction} from '#/view/com/composer/state/composer'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {DateTimeField} from '#/components/forms/DateTimeField'
import * as dt from '#/components/forms/DateTimeField/utils'
import * as SegmentedControl from '#/components/forms/SegmentedControl'
import * as TextField from '#/components/forms/TextField'
import {CalendarDays_Stroke2_Corner0_Rounded as CalendarIcon} from '#/components/icons/CalendarDays'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

/** Starts and Ends share a row when each still gets at least this much. */
const DATE_FIELD_MIN_WIDTH = 260

export function EventEditor({
  event,
  dispatch,
}: {
  event: EventDraft
  dispatch: (action: PostAction) => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  /*
   * A missing name only keeps the Post button disabled; it is not flagged, so
   * the card doesn't sit in red while it's being filled in.
   */
  const issue = getEventNameIssue(event)
  const nameIssue = issue === 'empty' ? null : issue
  const start = dt.fromEventParts(event.date, event.time)
  const end = event.endsDate
    ? dt.fromEventParts(event.endsDate, event.endsTime ?? '')
    : ''

  const dateFieldStyle = {flexGrow: 1, flexBasis: DATE_FIELD_MIN_WIDTH}
  // Ends has a Clear button in its label row; keep both fields level.
  const labelRowStyle = {minHeight: 28}

  const update = (patch: Partial<EventDraft>) =>
    dispatch({type: 'embed_update_event', patch})

  return (
    <View
      testID="eventEditor"
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
          <CalendarIcon size="sm" fill={t.palette.primary_500} />
          <Text
            style={[
              a.text_xs,
              a.font_bold,
              {color: t.palette.primary_500, textTransform: 'uppercase'},
            ]}>
            <Trans comment="Heading of the event editor card in the post composer">
              Event
            </Trans>
          </Text>
        </View>
        <EmbedEditorRemoveBtn
          testID="removeEventBtn"
          label={l`Remove event`}
          confirm={eventHasContent(event)}
          promptTitle={l`Remove event?`}
          promptDescription={l`The details you've entered will be lost.`}
          onRemove={() => {
            ax.metric('composer:event:remove', {})
            dispatch({type: 'embed_remove_event'})
          }}
        />
      </View>

      <View style={[a.gap_xs]}>
        <TextField.LabelText>
          <Trans>Event name</Trans>
        </TextField.LabelText>
        <TextField.Root isInvalid={nameIssue !== null}>
          <TextField.Input
            testID="eventNameInput"
            label={l`Event name`}
            placeholder={l`Community meetup`}
            value={event.name}
            onChangeText={name => update({name})}
          />
        </TextField.Root>
        {nameIssue && (
          <Text
            testID="eventNameHint"
            style={[a.text_xs, {color: t.palette.negative_500}]}>
            {nameIssue === 'invalid' ? (
              <Trans>This name contains characters that cannot be saved</Trans>
            ) : (
              <Trans>This name is too long</Trans>
            )}
          </Text>
        )}
      </View>

      <View style={[a.flex_row, a.flex_wrap, a.gap_md]}>
        <View style={[a.gap_xs, dateFieldStyle]}>
          <View style={[a.justify_center, labelRowStyle]}>
            <TextField.LabelText>
              <Trans>Starts</Trans>
            </TextField.LabelText>
          </View>
          <DateTimeField
            testID="eventStartField"
            label={l`Event start`}
            value={start}
            onChangeDateTime={value => {
              const parts = dt.toEventParts(value)
              update({
                date: parts.date,
                time: parts.time,
                // An end before the new start no longer makes sense.
                ...(event.endsDate && event.endsDate < parts.date
                  ? {endsDate: undefined, endsTime: undefined}
                  : {}),
              })
            }}
            isInvalid={!start}
          />
        </View>

        <View style={[a.gap_xs, dateFieldStyle]}>
          <View
            style={[
              a.flex_row,
              a.align_center,
              a.justify_between,
              labelRowStyle,
            ]}>
            <TextField.LabelText>
              <Trans>Ends</Trans>
            </TextField.LabelText>
            {event.endsDate ? (
              <Button
                testID="clearEventEndBtn"
                label={l`Remove end time`}
                size="tiny"
                variant="ghost"
                color="secondary"
                onPress={() =>
                  update({endsDate: undefined, endsTime: undefined})
                }>
                <ButtonText>
                  <Trans>Clear</Trans>
                </ButtonText>
              </Button>
            ) : null}
          </View>
          <DateTimeField
            testID="eventEndField"
            label={l`Event end`}
            value={end}
            placeholder={l`Optional`}
            minimumDate={start ? dt.fromDateTimeLocal(start) : undefined}
            onChangeDateTime={value => {
              const parts = dt.toEventParts(value)
              update({endsDate: parts.date, endsTime: parts.time})
            }}
          />
        </View>
      </View>

      <View style={[a.gap_xs]}>
        <TextField.LabelText>
          <Trans>Where</Trans>
        </TextField.LabelText>
        <SegmentedControl.Root
          type="radio"
          size="small"
          label={l`Event type`}
          value={event.mode}
          onChange={(mode: EventMode) => update({mode})}>
          <SegmentedControl.Item label={l`In person`} value="inperson">
            <SegmentedControl.ItemText>
              <Trans>In person</Trans>
            </SegmentedControl.ItemText>
          </SegmentedControl.Item>
          <SegmentedControl.Item label={l`Online`} value="virtual">
            <SegmentedControl.ItemText>
              <Trans>Online</Trans>
            </SegmentedControl.ItemText>
          </SegmentedControl.Item>
          <SegmentedControl.Item label={l`Hybrid`} value="hybrid">
            <SegmentedControl.ItemText>
              <Trans>Hybrid</Trans>
            </SegmentedControl.ItemText>
          </SegmentedControl.Item>
        </SegmentedControl.Root>
      </View>

      <TextField.Root>
        <TextField.Input
          testID="eventPlaceInput"
          label={event.mode === 'inperson' ? l`Location` : l`Location or link`}
          placeholder={
            event.mode === 'inperson'
              ? l`Venue or address`
              : l`Add a link or address people can join from`
          }
          value={event.place ?? ''}
          onChangeText={place => update({place})}
        />
      </TextField.Root>

      <TextField.Root>
        <TextField.Input
          testID="eventDescriptionInput"
          label={l`Description`}
          placeholder={l({
            message: 'Describe your event',
            comment:
              'Placeholder for the event description field in the composer',
          })}
          value={event.description ?? ''}
          onChangeText={description => update({description})}
          multiline
        />
      </TextField.Root>
    </View>
  )
}
