import {type ReactNode} from 'react'
import {View} from 'react-native'
import {type AppBskyActorDefs, type ModerationDecision} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useConfirmFollowUnfollow} from '#/state/preferences/confirm-follow-unfollow'
import {useShowAvatarFollowButton} from '#/state/preferences/show-avatar-follow-button'
import {useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, select, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {FollowConfirmationDialog} from '#/components/dialogs/FollowConfirmationDialog'
import {useFollowMethods} from '#/components/hooks/useFollowMethods'
import {PlusSmall_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import * as Prompt from '#/components/Prompt'

export function AviFollowButton({
  author,
  moderation,
  children,
}: {
  author: AppBskyActorDefs.ProfileViewBasic
  moderation: ModerationDecision
  children: ReactNode
}) {
  const {_} = useLingui()
  const t = useTheme()
  const profile = useProfileShadow(author)
  const showAvatarFollowButton = useShowAvatarFollowButton()
  const confirmFollowUnfollow = useConfirmFollowUnfollow()
  const {follow} = useFollowMethods({
    profile,
    logContext: 'AvatarButton',
  })
  const {currentAccount, hasSession} = useSession()
  const promptControl = Prompt.usePromptControl()

  const name = sanitizeDisplayName(
    profile.displayName || profile.handle,
    moderation.ui('displayName'),
  )
  const isFollowing =
    Boolean(profile.viewer?.following) || profile.did === currentAccount?.did

  function onConfirm() {
    follow()
    Toast.show(_(msg`Following ${name}`))
  }

  function onPress() {
    if (confirmFollowUnfollow) {
      promptControl.open()
    } else {
      follow()
      Toast.show(_(msg`Following ${name}`))
    }
  }

  if (!hasSession || !showAvatarFollowButton) {
    return children
  }

  return (
    <View style={a.relative}>
      {children}

      {!isFollowing && (
        <Button
          label={_(msg`Follow ${name}`)}
          onPress={onPress}
          style={[
            a.rounded_full,
            a.absolute,
            {
              bottom: -7,
              right: -7,
            },
          ]}>
          <View
            style={[
              {
                paddingTop: 2,
                paddingLeft: 2,
                paddingBottom: 6,
                paddingRight: 6,
              },
              a.align_center,
              a.justify_center,
              a.rounded_full,
            ]}>
            <View
              style={[
                a.rounded_full,
                a.align_center,
                select(t.name, {
                  light: t.atoms.bg_contrast_100,
                  dim: t.atoms.bg_contrast_100,
                  dark: t.atoms.bg_contrast_200,
                }),
                {
                  borderWidth: 1,
                  borderColor: t.atoms.bg.backgroundColor,
                },
              ]}>
              <Plus
                size="sm"
                fill={
                  select(t.name, {
                    light: t.atoms.bg_contrast_600,
                    dim: t.atoms.bg_contrast_500,
                    dark: t.atoms.bg_contrast_600,
                  }).backgroundColor
                }
              />
            </View>
          </View>
        </Button>
      )}
      {confirmFollowUnfollow && (
        <FollowConfirmationDialog
          control={promptControl}
          displayName={name}
          handle={profile.handle}
          actionType="follow"
          onConfirm={onConfirm}
        />
      )}
    </View>
  )
}
