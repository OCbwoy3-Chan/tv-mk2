import {useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {HITSLOP_10} from '#/lib/constants'
import {isNetworkError} from '#/lib/network-error'
import {type NavigationProp} from '#/lib/routes/types'
import {logger} from '#/logger'
import {useEnableSquareButtons} from '#/state/preferences/enable-square-buttons'
import {Button, ButtonIcon} from '#/components/Button'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {eventQueryKey, useDeleteEventMutation} from '#/features/events/queries'
import {type EventView} from '#/features/events/types'

/**
 * The top bar's delete button for an event the signed-in user created. Asks
 * before deleting.
 */
export function DeleteEventButton({
  event,
  onDeleted,
}: {
  event: EventView
  /** Called before leaving the page, so it can stop rendering the event. */
  onDeleted: () => void
}) {
  const {t: l} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const queryClient = useQueryClient()
  const prompt = Prompt.usePromptControl()
  const squareButtons = useEnableSquareButtons()
  const {mutate, isPending} = useDeleteEventMutation()

  const onConfirm = () =>
    mutate(event.uri, {
      onSuccess: () => {
        onDeleted()
        queryClient.setQueryData(eventQueryKey(event.uri), null)
        Toast.show(l`Event deleted`)
        if (navigation.canGoBack()) {
          navigation.goBack()
        } else {
          navigation.navigate('Home')
        }
      },
      onError: error => {
        if (!isNetworkError(error)) {
          logger.error('Failed to delete event', {safeMessage: error})
        }
        Toast.show(l`Couldn't delete the event`, {type: 'error'})
      },
    })

  return (
    <>
      <Button
        testID="deleteEventBtn"
        label={l`Delete event`}
        size="small"
        variant="ghost"
        color="negative"
        shape={squareButtons ? 'square' : 'round'}
        hitSlop={HITSLOP_10}
        disabled={isPending}
        onPress={prompt.open}>
        <ButtonIcon icon={TrashIcon} size="md" />
      </Button>
      <Prompt.Basic
        control={prompt}
        title={l`Delete this event?`}
        description={l`This can't be undone. Posts that link to it will stay up.`}
        confirmButtonCta={l`Delete`}
        confirmButtonColor="negative"
        onConfirm={onConfirm}
      />
    </>
  )
}
