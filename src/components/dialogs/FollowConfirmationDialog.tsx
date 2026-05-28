import {type GestureResponderEvent} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {useConfirmFollowUnfollow} from '#/state/preferences/confirm-follow-unfollow'
import * as Prompt from '#/components/Prompt'

export type FollowActionType = 'follow' | 'unfollow'

type FollowConfirmationDialogProps = {
  control: Prompt.PromptControlProps
  displayName: string
  handle: string
  actionType: FollowActionType
  onConfirm: (e: GestureResponderEvent) => void
}

export function FollowConfirmationDialog({
  control,
  displayName,
  handle,
  actionType,
  onConfirm,
}: FollowConfirmationDialogProps) {
  const {t: l} = useLingui()
  const confirmFollowUnfollow = useConfirmFollowUnfollow()

  if (!confirmFollowUnfollow) {
    return null
  }

  const isFollowing = actionType === 'follow'
  const title = isFollowing
    ? l({
        message: `Follow ${displayName}?`,
        comment: 'Title for follow confirmation dialog',
      })
    : l({
        message: `Unfollow ${displayName}?`,
        comment: 'Title for unfollow confirmation dialog',
      })

  const description = isFollowing
    ? l({
        message: `You are about to follow @${handle}.`,
        comment: 'Description for follow confirmation dialog',
      })
    : l({
        message: `You are about to unfollow @${handle}.`,
        comment: 'Description for unfollow confirmation dialog',
      })

  const confirmLabel = isFollowing
    ? l({
        message: 'Follow',
        comment: 'Confirm button label for follow action',
      })
    : l({
        message: 'Unfollow',
        comment: 'Confirm button label for unfollow action',
      })

  return (
    <Prompt.Basic
      control={control}
      title={title}
      description={description}
      confirmButtonCta={confirmLabel}
      confirmButtonColor={isFollowing ? 'primary' : 'negative'}
      onConfirm={onConfirm}
    />
  )
}
