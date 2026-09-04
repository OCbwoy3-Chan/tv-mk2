import {useQuery} from '@tanstack/react-query'

import {
  getPrivatePost,
  getPrivatePostsModStatus,
  type PrivatePost,
  type PrivatePostsModStatus,
} from '#/lib/api/private-posts'
import {isSpacesCompatiblePDS} from '#/lib/spaces'
import {
  usePrivatePostsAppViewDID,
  usePrivatePostsAppViewURL,
} from '#/state/preferences/private-posts-appview'
import {usePrivatePostsEnabled} from '#/state/preferences/private-posts-enabled'
import {STALE} from '#/state/queries'
import {useAgent, useSession, useSessionApi} from '#/state/session'

const RQKEY_ROOT = 'private-posts'
export const RQKEY_MOD_STATUS = (
  did: string,
  appViewDID: string,
  appViewURL?: string,
) => [RQKEY_ROOT, 'mod-status', did, appViewDID, appViewURL]
export const RQKEY_AVAILABILITY = (
  did: string,
  appViewDID: string,
  appViewURL?: string,
) => [RQKEY_ROOT, 'availability', did, appViewDID, appViewURL]
export const RQKEY_POST = (
  uri: string,
  cid: string,
  appViewDID: string,
  appViewURL?: string,
) => [RQKEY_ROOT, 'post', uri, cid, appViewDID, appViewURL]

export function usePrivatePostsModStatus() {
  const agent = useAgent()
  const [appViewDID] = usePrivatePostsAppViewDID()
  const appViewURL = usePrivatePostsAppViewURL()

  return useQuery<PrivatePostsModStatus>({
    enabled: !!agent.session && !!appViewURL,
    staleTime: STALE.MINUTES.FIVE,
    queryKey: RQKEY_MOD_STATUS(
      agent.session?.did ?? '',
      appViewDID,
      appViewURL,
    ),
    queryFn: () =>
      getPrivatePostsModStatus({
        agent,
        appViewDID,
        appViewURL: appViewURL!,
      }),
  })
}

export function usePrivatePostAvailability(
  accountDid: string | undefined,
  enabled: boolean,
) {
  const agent = useAgent()
  const {accounts} = useSession()
  const {createEphemeralAgent} = useSessionApi()
  const [appViewDID] = usePrivatePostsAppViewDID()
  const appViewURL = usePrivatePostsAppViewURL()
  const account = accounts.find(candidate => candidate.did === accountDid)

  return useQuery({
    enabled: enabled && !!account && !!appViewURL,
    staleTime: STALE.MINUTES.FIVE,
    queryKey: RQKEY_AVAILABILITY(accountDid ?? '', appViewDID, appViewURL),
    queryFn: async () => {
      const isCurrentAccount = agent.session?.did === accountDid
      const selectedAgent = isCurrentAccount
        ? agent
        : await createEphemeralAgent(account!)

      try {
        const [pdsSupported, modStatus] = await Promise.all([
          isSpacesCompatiblePDS(selectedAgent),
          getPrivatePostsModStatus({
            agent: selectedAgent,
            appViewDID,
            appViewURL: appViewURL!,
          }),
        ])
        return {pdsSupported, isBanned: modStatus.isBanned}
      } finally {
        if (!isCurrentAccount && 'dispose' in selectedAgent) {
          // OAuth agents own resources that should not outlive this check.
          const disposableAgent = selectedAgent as {dispose: () => void}
          disposableAgent.dispose()
        }
      }
    },
  })
}

export function usePrivatePost(
  uri: string | undefined,
  cid: string | undefined,
) {
  const agent = useAgent()
  const privatePostsEnabled = usePrivatePostsEnabled()
  const [appViewDID] = usePrivatePostsAppViewDID()
  const appViewURL = usePrivatePostsAppViewURL()

  return useQuery<PrivatePost>({
    enabled:
      privatePostsEnabled && !!uri && !!cid && !!agent.session && !!appViewURL,
    staleTime: STALE.MINUTES.FIVE,
    queryKey: RQKEY_POST(uri ?? '', cid ?? '', appViewDID, appViewURL),
    queryFn: () =>
      getPrivatePost({
        agent,
        appViewDID,
        appViewURL: appViewURL!,
        uri: uri!,
        cid: cid!,
      }),
  })
}
