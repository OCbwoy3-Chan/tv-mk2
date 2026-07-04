import {type AppBskyActorDefs} from '@atproto/api'
import {type QueryClient} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {canAttemptSessionResume} from '#/state/session/util'
import {type SessionAccount, type SessionApiContext} from '#/state/session'

const queryKeyRoot = 'alternateAccountsReplyEligibility'

export type ReplyableAccountListItem = {
  account: SessionAccount
  profile?: AppBskyActorDefs.ProfileViewDetailed
}

export async function fetchReplyableSwitcherAccounts({
  queryClient,
  postUri,
  switcherAccounts,
  createEphemeralAgent,
}: {
  queryClient: QueryClient
  postUri: string
  switcherAccounts: ReplyableAccountListItem[]
  createEphemeralAgent: SessionApiContext['createEphemeralAgent']
}): Promise<ReplyableAccountListItem[]> {
  const alternateAccounts = switcherAccounts.map(item => item.account)
  const accountDids = alternateAccounts.map(account => account.did)

  const replyableDids = await queryClient.fetchQuery({
    queryKey: createQueryKey(queryKeyRoot, {postUri, accountDids}),
    staleTime: STALE.MINUTES.FIVE,
    queryFn: async () => {
      const results = new Set<string>()

      for (const account of alternateAccounts) {
        if (!canAttemptSessionResume(account)) {
          continue
        }

        try {
          const agent = await createEphemeralAgent(account)
          const res = await agent.getPosts({uris: [postUri]})
          const target = res.data.posts[0]
          if (!target?.viewer?.replyDisabled) {
            results.add(account.did)
          }
        } catch {
          // Skip accounts we can't verify.
        }
      }

      return results
    },
  })

  return switcherAccounts.filter(item => replyableDids.has(item.account.did))
}
