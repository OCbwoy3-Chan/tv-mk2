import {AtUri} from '@atproto/syntax'
import {useLingui} from '@lingui/react/macro'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {useHaptics} from '#/lib/haptics'
import {logger} from '#/logger'
import {useConstellationInstance} from '#/state/preferences/constellation-instance'
import {usePdsClient} from '#/state/session'
import * as Toast from '#/components/Toast'
import {com} from '#/lexicons'
import {RQKEY_POLL} from './api'
import {
  forgetVote,
  noteVoteRecord,
  rememberUnvote,
  rememberVote,
} from './recent-votes'
import {TOKIMEKI_VOTE_COLLECTION, type TokimekiPoll} from './types'

const VOTE_REFETCH_DELAY_MS = 4000

/**
 * Casts a vote the way TOKIMEKI does: a `tech.tokimeki.poll.vote` record in the
 * voter's own repo. One vote per poll, so the card stops offering buttons once
 * `myVote` is set.
 */
export function useTokimekiVoteMutation(
  poll: TokimekiPoll | null | undefined,
  viewerDid: string,
) {
  const pdsClient = usePdsClient()
  const queryClient = useQueryClient()
  const instance = useConstellationInstance()
  const haptics = useHaptics()
  const {t: l} = useLingui()

  return useMutation({
    mutationFn: async (index: number) => {
      if (!poll) throw new Error('This poll is not loaded yet')
      if (!pdsClient.did) throw new Error('You need to sign in to vote')
      return await pdsClient.call(com.atproto.repo.createRecord, {
        repo: pdsClient.assertDid,
        collection: TOKIMEKI_VOTE_COLLECTION,
        record: {
          $type: TOKIMEKI_VOTE_COLLECTION,
          poll: {uri: poll.uri, cid: poll.cid},
          optionIndex: index,
          createdAt: new Date().toISOString(),
        },
        // Our PDS does not know this lexicon.
        validate: false,
      })
    },
    onMutate: async (index: number) => {
      const key = RQKEY_POLL(poll?.uri ?? '', viewerDid, instance)
      await queryClient.cancelQueries({queryKey: key})
      const prev = queryClient.getQueryData<TokimekiPoll | null>(key)
      if (prev) {
        // Survives refetches that land before the indexers see the vote.
        rememberVote(prev, viewerDid, index)
        const counts = [...prev.counts]
        counts[index] = (counts[index] ?? 0) + 1
        queryClient.setQueryData<TokimekiPoll>(key, {
          ...prev,
          counts,
          totalVotes: prev.totalVotes + 1,
          myVote: index,
        })
      }
      return {prev, key}
    },
    onError: (_e, _index, ctx) => {
      if (poll) forgetVote(poll.uri, viewerDid)
      if (ctx) queryClient.setQueryData(ctx.key, ctx.prev ?? null)
      logger.error('Failed to record TOKIMEKI poll vote', {safeMessage: _e})
      Toast.show(l`Could not record your vote`, {type: 'error'})
    },
    onSuccess: (data, _index, ctx) => {
      haptics.confirm()
      // Keep the new record's URI, so the vote can be taken back right away.
      if (poll) noteVoteRecord(poll.uri, viewerDid, data.uri)
      if (ctx) {
        queryClient.setQueryData<TokimekiPoll | null>(ctx.key, prev =>
          prev ? {...prev, myVoteUris: [data.uri]} : prev,
        )
      }
    },
    onSettled: (_data, error, _index, ctx) => {
      if (!ctx || error) return
      /*
       * The counts come from TOKIMEKI's AppView, which only learns of the vote
       * from the firehose. Refetching straight away can drop the vote that was
       * just added optimistically, so give it a moment first.
       */
      setTimeout(() => {
        void queryClient.invalidateQueries({queryKey: ctx.key})
      }, VOTE_REFETCH_DELAY_MS)
    },
  })
}

/**
 * Takes the viewer's vote back while the poll is open, the way TOKIMEKI's
 * page does: by deleting their vote records on it from their own repo.
 */
export function useTokimekiUnvoteMutation(
  poll: TokimekiPoll | null | undefined,
  viewerDid: string,
) {
  const pdsClient = usePdsClient()
  const queryClient = useQueryClient()
  const instance = useConstellationInstance()
  const haptics = useHaptics()
  const {t: l} = useLingui()

  return useMutation({
    mutationFn: async (uris: string[]) => {
      if (!pdsClient.did) throw new Error('You need to sign in to vote')
      for (const uri of uris) {
        const {host, collection, rkey} = new AtUri(uri)
        // Only ever delete the viewer's own vote records.
        if (host !== pdsClient.did || collection !== TOKIMEKI_VOTE_COLLECTION) {
          continue
        }
        await pdsClient.call(com.atproto.repo.deleteRecord, {
          repo: pdsClient.assertDid,
          collection: TOKIMEKI_VOTE_COLLECTION,
          rkey,
        })
      }
    },
    onMutate: async () => {
      const key = RQKEY_POLL(poll?.uri ?? '', viewerDid, instance)
      await queryClient.cancelQueries({queryKey: key})
      const prev = queryClient.getQueryData<TokimekiPoll | null>(key)
      if (prev && prev.myVote !== undefined) {
        const index = prev.myVote
        rememberUnvote(prev, viewerDid, index)
        queryClient.setQueryData<TokimekiPoll>(key, {
          ...prev,
          counts: prev.counts.map((c, i) =>
            i === index ? Math.max(0, c - 1) : c,
          ),
          totalVotes: Math.max(0, prev.totalVotes - 1),
          myVote: undefined,
          myVoteUris: undefined,
        })
      }
      return {prev, key}
    },
    onError: (_e, _uris, ctx) => {
      if (poll) forgetVote(poll.uri, viewerDid)
      if (ctx) queryClient.setQueryData(ctx.key, ctx.prev ?? null)
      logger.error('Failed to remove TOKIMEKI poll vote', {safeMessage: _e})
      Toast.show(l`Could not remove your vote`, {type: 'error'})
    },
    onSuccess: () => {
      haptics.tap()
    },
    onSettled: (_data, error, _uris, ctx) => {
      if (!ctx || error) return
      setTimeout(() => {
        void queryClient.invalidateQueries({queryKey: ctx.key})
      }, VOTE_REFETCH_DELAY_MS)
    },
  })
}
