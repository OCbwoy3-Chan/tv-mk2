import {type QueryClient} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {type SessionAccount} from '#/state/session'
import {isEphemeralAuthError} from '#/state/session/ephemeral-auth'
import {type SessionApiContext} from '#/state/session/types'
import {canAttemptSessionResume} from '#/state/session/util'
import {type app} from '#/lexicons'

const queryKeyRoot = 'alternateAccountsReplyEligibility'

export type ReplyableAccountListItem = {
  account: SessionAccount
  profile?: app.bsky.actor.defs.ProfileViewDetailed
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
          results.add(account.did)
          continue
        }

        try {
          const agent = await createEphemeralAgent(account)
          const res = await agent.getPosts({uris: [postUri]})
          const target = res.data.posts[0]
          if (!target?.viewer?.replyDisabled) {
            results.add(account.did)
          }
        } catch (error) {
          // Keep expired accounts selectable so the composer can offer login.
          if (isEphemeralAuthError(error)) results.add(account.did)
        }
      }

      return results
    },
  })

  return switcherAccounts.filter(item => replyableDids.has(item.account.did))
}
