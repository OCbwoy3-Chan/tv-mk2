import {useCallback} from 'react'
import {useLingui} from '@lingui/react/macro'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {logger} from '#/logger'
import {type Shadow} from '#/state/cache/types'
import {type SessionAccount} from '#/state/session'
import {type FollowActionType} from '#/components/dialogs/FollowConfirmationDialog'
import * as Toast from '#/components/Toast'
import {type Metrics} from '#/analytics/metrics'
import type * as bsky from '#/types/bsky'
import {useRunWithEphemeralAgent} from './useRunWithEphemeralAgent'

export function useEphemeralFollowAction({
  profile,
  logContext: _logContext,
  onFollow,
  onUnfollow,
}: {
  profile: Shadow<bsky.profile.AnyProfileView>
  logContext: Metrics['profile:follow']['logContext'] &
    Metrics['profile:unfollow']['logContext']
  onFollow?: () => void
  onUnfollow?: () => void
}) {
  const {t: l} = useLingui()
  const runWithEphemeralAgent = useRunWithEphemeralAgent()

  return useCallback(
    async (account: SessionAccount) => {
      try {
        const result = await runWithEphemeralAgent(account, async agent => {
          const res = await agent.getProfile({actor: profile.did})
          const followingUri = res.data.viewer?.following

          if (followingUri) {
            await agent.deleteFollow(followingUri)
            return {followed: false}
          }

          await agent.follow(profile.did)
          return {followed: true}
        })

        if (result.followed) {
          onFollow?.()
          Toast.show(
            l`Following ${sanitizeDisplayName(
              profile.displayName || profile.handle,
            )} as @${account.handle}`,
          )
        } else {
          onUnfollow?.()
          Toast.show(
            l`No longer following ${sanitizeDisplayName(
              profile.displayName || profile.handle,
            )} as @${account.handle}`,
          )
        }
      } catch (e) {
        logger.error('useEphemeralFollowAction: failed to toggle follow', {
          message: String(e),
          targetDid: profile.did,
          accountDid: account.did,
        })
        Toast.show(l`An issue occurred, please try again.`, {
          type: 'error',
        })
      }
    },
    [l, onFollow, onUnfollow, profile, runWithEphemeralAgent],
  )
}

export function useEphemeralFollowIntent({
  profile,
}: {
  profile: Shadow<bsky.profile.AnyProfileView>
}) {
  const {t: l} = useLingui()
  const runWithEphemeralAgent = useRunWithEphemeralAgent()

  return useCallback(
    async (account: SessionAccount): Promise<FollowActionType> => {
      try {
        const isFollowing = await runWithEphemeralAgent(
          account,
          async agent => {
            const res = await agent.getProfile({actor: profile.did})
            return Boolean(res.data.viewer?.following)
          },
        )

        return isFollowing ? 'unfollow' : 'follow'
      } catch (e) {
        logger.error('useEphemeralFollowIntent: failed to load follow state', {
          message: String(e),
          targetDid: profile.did,
          accountDid: account.did,
        })
        Toast.show(l`An issue occurred, please try again.`, {
          type: 'error',
        })
        return 'follow'
      }
    },
    [l, profile, runWithEphemeralAgent],
  )
}
