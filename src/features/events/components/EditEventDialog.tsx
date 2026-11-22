import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {
  type EventCover,
  type EventDraft,
  isEventDraftPublishable,
} from '#/lib/api/event'
import {isNetworkError} from '#/lib/network-error'
import {logger} from '#/logger'
import {EventEditor} from '#/view/com/composer/event/EventEditor'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {applyEventEdit, eventDraftFromRecord} from '#/features/events/edit'
import {useUpdateEventMutation} from '#/features/events/queries'
import {coverUrl, type ParsedEvent} from '#/features/events/record'
import {type EventView} from '#/features/events/types'
import {Poster} from './Poster'

/** Edits an event the signed-in user created, with the composer's fields. */
export function EditEventDialog({
  control,
  event,
  parsed,
}: {
  control: Dialog.DialogControlProps
  event: EventView
  parsed: ParsedEvent
}) {
  return (
    <Dialog.Outer control={control} nativeOptions={{fullHeight: true}}>
      <Dialog.Handle />
      <DialogInner event={event} parsed={parsed} />
    </Dialog.Outer>
  )
}

function DialogInner({event, parsed}: {event: EventView; parsed: ParsedEvent}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const control = Dialog.useDialogContext()
  const discardControl = Prompt.usePromptControl()
  const [initial] = useState(() => eventDraftFromRecord(parsed))
  const [draft, setDraft] = useState<EventDraft | undefined>(initial)
  /* Unchanged (undefined), removed (null), or a newly picked image. */
  const [coverChange, setCoverChange] = useState<EventCover | null>()
  const {mutate, isPending} = useUpdateEventMutation(event)
  const currentCover = coverUrl(event)

  const dirty =
    coverChange !== undefined ||
    JSON.stringify(draft) !== JSON.stringify(initial)
  const canSave =
    !!initial &&
    !!draft &&
    dirty &&
    !isPending &&
    isEventDraftPublishable(draft)

  const onCancel = () => {
    if (dirty) discardControl.open()
    else control.close()
  }

  const onSave = () => {
    if (!initial || !draft) return
    const record = applyEventEdit(
      event.record as Record<string, unknown>,
      initial,
      draft,
    )
    mutate(
      {record, cover: coverChange},
      {
        onSuccess: () => {
          control.close(() => Toast.show(l`Event updated`))
        },
        onError: error => {
          if (!isNetworkError(error)) {
            logger.error('Failed to update event', {safeMessage: error})
          }
          Toast.show(l`Couldn't save the event`, {type: 'error'})
        },
      },
    )
  }

  return (
    <>
      <Dialog.ScrollableInner
        label={l`Edit event`}
        // The header already separates the form from the top edge.
        contentContainerStyle={[a.pt_lg]}
        header={
          <Dialog.Header style={a.px_sm}>
            <Button
              label={l`Cancel`}
              onPress={onCancel}
              size="small"
              color="primary"
              variant="ghost">
              <ButtonText style={[a.text_md]}>
                <Trans>Cancel</Trans>
              </ButtonText>
            </Button>
            <Dialog.HeaderText style={[a.flex_1, a.px_sm]}>
              <Trans>Edit event</Trans>
            </Dialog.HeaderText>
            <Button
              testID="saveEventBtn"
              label={l`Save`}
              onPress={onSave}
              disabled={!canSave}
              size="small"
              color="primary"
              variant="ghost">
              <ButtonText style={[a.text_md]}>
                <Trans>Save</Trans>
              </ButtonText>
            </Button>
          </Dialog.Header>
        }>
        <View>
          {draft ? (
            <EventEditor
              bare
              event={coverChange ? {...draft, cover: coverChange} : draft}
              coverPreview={coverChange === null ? undefined : currentCover}
              coverPlaceholder={
                <Poster
                  event={{...event, thumb: undefined}}
                  parsed={parsed}
                  size={96}
                />
              }
              dispatch={action => {
                if (action.type !== 'embed_update_event') return
                const {cover, uploadedCover: _, ...patch} = action.patch
                if ('cover' in action.patch) setCoverChange(cover ?? null)
                setDraft(prev => prev && {...prev, ...patch})
              }}
            />
          ) : (
            <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
              <Trans>
                This event has no start time, so it can't be edited here.
              </Trans>
            </Text>
          )}
        </View>
      </Dialog.ScrollableInner>
      <Prompt.Basic
        control={discardControl}
        title={l`Discard changes?`}
        description={l`Your edits to this event will be lost.`}
        confirmButtonCta={l`Discard`}
        confirmButtonColor="negative"
        onConfirm={() => control.close()}
      />
    </>
  )
}
