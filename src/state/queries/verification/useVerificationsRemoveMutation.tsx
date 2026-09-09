import {AtUri} from '@atproto/syntax'
import {useMutation} from '@tanstack/react-query'
import {useQueryClient} from '@tanstack/react-query'

import {until} from '#/lib/async/until'
import {useConstellationInstance} from '#/state/preferences/constellation-instance'
import {
  useDeerVerificationEnabled,
  useDeerVerificationTrusted,
} from '#/state/preferences/deer-verification'
import {useUpdateProfileVerificationCache} from '#/state/queries/verification/useUpdateProfileVerificationCache'
import {useAppviewClient, usePdsClient, useSession} from '#/state/session'
import {useAnalytics} from '#/analytics'
import {app} from '#/lexicons'
import type * as bsky from '#/types/bsky'
import {RQKEY as DEER_VERIFICATION_RQKEY} from '../deer-verification'

export function useVerificationsRemoveMutation() {
  const ax = useAnalytics()
  const appviewClient = useAppviewClient()
  const pdsClient = usePdsClient()
  const {currentAccount} = useSession()
  const updateProfileVerificationCache = useUpdateProfileVerificationCache()

  const qc = useQueryClient()

  const deerVerificationTrusted = useDeerVerificationTrusted()

  return useMutation({
    async mutationFn({
      profile,
      verifications,
    }: {
      profile: bsky.profile.AnyProfileView
      verifications: app.bsky.actor.defs.VerificationView[]
    }) {
      if (!currentAccount) {
        throw new Error('User not logged in')
      }

      const uris = new Set(verifications.map(v => v.uri))

      await Promise.all(
        [...uris].map(uri => {
          return pdsClient.delete(app.bsky.graph.verification, {
            rkey: new AtUri(uri).rkeySafe,
          })
        }),
      )

      await until(
        5,
        1e3,
        profile => {
          if (!profile) return false
          if (!profile.verification?.verifications.some(v => uris.has(v.uri))) {
            return true
          }
          return false
        },
        () => {
          return appviewClient.call(app.bsky.actor.getProfile, {
            actor: profile.did ?? '',
          })
        },
      )
    },
    async onSuccess(_, {profile}) {
      ax.metric('verification:revoke', {})
      await updateProfileVerificationCache({profile})
      await qc.invalidateQueries({
        queryKey: DEER_VERIFICATION_RQKEY(profile.did, deerVerificationTrusted),
      })
    },
  })
}
