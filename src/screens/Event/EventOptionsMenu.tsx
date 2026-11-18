import {Trans, useLingui} from '@lingui/react/macro'

import {useEnableSquareButtons} from '#/state/preferences/enable-square-buttons'
import {Button, ButtonIcon} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {DotGrid3x1_Stroke2_Corner0_Rounded as DotGridIcon} from '#/components/icons/DotGrid'
import {PencilLine_Stroke2_Corner0_Rounded as PencilLineIcon} from '#/components/icons/Pencil'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import * as Menu from '#/components/Menu'
import {type ParsedEvent} from '#/features/events/record'
import {type EventView} from '#/features/events/types'
import {EditEventDialog} from './EditEventDialog'
import {useDeleteEvent} from './useDeleteEvent'

/** The "…" menu on an event the signed-in user created: edit or delete it. */
export function EventOptionsMenu({
  event,
  parsed,
  onDeleted,
}: {
  event: EventView
  parsed: ParsedEvent
  onDeleted: () => void
}) {
  const {t: l} = useLingui()
  const squareButtons = useEnableSquareButtons()
  const editControl = useDialogControl()
  const deleteEvent = useDeleteEvent({event, onDeleted})

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
    </>
  )
}
