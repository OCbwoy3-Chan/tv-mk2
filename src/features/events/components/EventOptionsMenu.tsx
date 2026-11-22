import {Trans, useLingui} from '@lingui/react/macro'

import {isNetworkError} from '#/lib/network-error'
import {logger} from '#/logger'
import {useEnableSquareButtons} from '#/state/preferences/enable-square-buttons'
import {Button, ButtonIcon} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateIcon} from '#/components/icons/ArrowRotate'
import {CircleBanSign_Stroke2_Corner0_Rounded as CircleBanIcon} from '#/components/icons/CircleBanSign'
import {DotGrid3x1_Stroke2_Corner0_Rounded as DotGridIcon} from '#/components/icons/DotGrid'
import {PencilLine_Stroke2_Corner0_Rounded as PencilLineIcon} from '#/components/icons/Pencil'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import * as Menu from '#/components/Menu'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {useUpdateEventMutation} from '#/features/events/queries'
import {type ParsedEvent} from '#/features/events/record'
import {EVENT_COLLECTION, type EventView} from '#/features/events/types'
import {EditEventDialog} from './EditEventDialog'
import {useDeleteEvent} from './useDeleteEvent'

/** The "…" menu on an event the signed-in user created: edit or delete it. */
export function EventOptionsMenu({
  event,
  parsed,
  onDeleted,
  leaveOnDelete = true,
}: {
  event: EventView
  parsed: ParsedEvent
  onDeleted?: () => void
  /** Leave the page after deleting; off for the menu on an event's card. */
  leaveOnDelete?: boolean
}) {
  const {t: l} = useLingui()
  const squareButtons = useEnableSquareButtons()
  const editControl = useDialogControl()
  const cancelControl = Prompt.usePromptControl()
  const deleteEvent = useDeleteEvent({event, onDeleted, leaveOnDelete})
  const {mutate: updateEvent} = useUpdateEventMutation(event)

  /*
   * Only the status changes, so the event, its post and everyone's RSVPs stay;
   * calendar apps show a cancelled event as such and stop offering RSVPs.
   */
  const setStatus = (status: 'cancelled' | 'scheduled') =>
    updateEvent(
      {
        record: {
          ...(event.record as Record<string, unknown>),
          status: `${EVENT_COLLECTION}#${status}`,
        },
      },
      {
        onSuccess: () =>
          Toast.show(
            status === 'cancelled' ? l`Event cancelled` : l`Event restored`,
          ),
        onError: error => {
          if (!isNetworkError(error)) {
            logger.error('Failed to change event status', {safeMessage: error})
          }
          Toast.show(l`Couldn't update the event`, {type: 'error'})
        },
      },
    )

  return (
    <>
      <Menu.Root>
        <Menu.Trigger label={l`Event options`}>
          {({props}) => (
            <Button
              testID="eventOptionsBtn"
              {...props}
              label={props.accessibilityLabel}
              size="small"
              color="secondary"
              shape={squareButtons ? 'square' : 'round'}>
              <ButtonIcon icon={DotGridIcon} />
            </Button>
          )}
        </Menu.Trigger>
        <Menu.Outer showCancel>
          <Menu.Group>
            <Menu.Item
              testID="editEventItem"
              label={l`Edit event`}
              onPress={editControl.open}>
              <Menu.ItemText>
                <Trans>Edit event</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon position="right" icon={PencilLineIcon} />
            </Menu.Item>
            {parsed.cancelled ? (
              <Menu.Item
                testID="restoreEventItem"
                label={l`Restore event`}
                onPress={() => setStatus('scheduled')}>
                <Menu.ItemText>
                  <Trans>Restore event</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon position="right" icon={ArrowRotateIcon} />
              </Menu.Item>
            ) : (
              <Menu.Item
                testID="cancelEventItem"
                label={l`Cancel event`}
                onPress={cancelControl.open}>
                <Menu.ItemText>
                  <Trans>Cancel event</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon position="right" icon={CircleBanIcon} />
              </Menu.Item>
            )}
            <Menu.Item
              testID="deleteEventItem"
              label={l`Delete event`}
              destructive
              onPress={deleteEvent.open}>
              <Menu.ItemText>
                <Trans>Delete event</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon position="right" icon={TrashIcon} />
            </Menu.Item>
          </Menu.Group>
        </Menu.Outer>
      </Menu.Root>
      <EditEventDialog control={editControl} event={event} parsed={parsed} />
      {deleteEvent.prompt}
      <Prompt.Basic
        control={cancelControl}
        title={l`Cancel this event?`}
        description={l`Guests will see that it's cancelled. Their responses stay, and you can restore it later.`}
        confirmButtonCta={l`Cancel event`}
        cancelButtonCta={l`Keep event`}
        confirmButtonColor="negative"
        onConfirm={() => setStatus('cancelled')}
      />
    </>
  )
}
