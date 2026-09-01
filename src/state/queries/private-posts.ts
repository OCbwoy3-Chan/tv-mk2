import {useQuery} from '@tanstack/react-query'

import {
  getPrivatePost,
  getPrivatePostsModStatus,
  type PrivatePost,
  type PrivatePostsModStatus,
} from '#/lib/api/private-posts'
import {
  usePrivatePostsAppViewDID,
  usePrivatePostsAppViewURL,
} from '#/state/preferences/private-posts-appview'
import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'

const RQKEY_ROOT = 'private-posts'
export const RQKEY_MOD_STATUS = (appViewDID: string, appViewURL?: string) => [
  RQKEY_ROOT,
  'mod-status',
  appViewDID,
  appViewURL,
]
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
    queryKey: RQKEY_MOD_STATUS(appViewDID, appViewURL),
    queryFn: () =>
      getPrivatePostsModStatus({
        agent,
        appViewDID,
        appViewURL: appViewURL!,
      }),
  })
}

export function usePrivatePost(
  uri: string | undefined,
  cid: string | undefined,
) {
  const agent = useAgent()
  const [appViewDID] = usePrivatePostsAppViewDID()
  const appViewURL = usePrivatePostsAppViewURL()

  return useQuery<PrivatePost>({
    enabled: !!uri && !!cid && !!agent.session && !!appViewURL,
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
