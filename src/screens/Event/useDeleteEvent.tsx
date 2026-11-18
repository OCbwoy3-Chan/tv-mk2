import {useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {isNetworkError} from '#/lib/network-error'
import {type NavigationProp} from '#/lib/routes/types'
import {logger} from '#/logger'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {eventQueryKey, useDeleteEventMutation} from '#/features/events/queries'
import {type EventView} from '#/features/events/types'

/**
 * Deleting an event the signed-in user created: `open` asks first, and
 * `prompt` has to be rendered for that. On success the page is left.
 */
export function useDeleteEvent({
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
  const promptControl = Prompt.usePromptControl()
  const {mutate} = useDeleteEventMutation()

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

  const prompt = (
    <Prompt.Basic
      control={promptControl}
      title={l`Delete this event?`}
      description={l`This can't be undone. Posts that link to it will stay up.`}
      confirmButtonCta={l`Delete`}
      confirmButtonColor="negative"
      onConfirm={onConfirm}
    />
  )

  return {open: promptControl.open, prompt}
}
