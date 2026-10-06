import {useCallback} from 'react'
import {type DidString, type HandleString} from '@atproto/syntax'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {
  useCustomAppViewDid,
  useCustomAppViewUrl,
} from '#/state/preferences/custom-appview-did'
import {STALE} from '#/state/queries'
import {useAppviewClient, usePdsClient} from '#/state/session'
import {app, com} from '#/lexicons'

const handleQueryKeyRoot = 'handle'
const fetchHandleQueryKey = (handleOrDid: string) => [
  handleQueryKeyRoot,
  handleOrDid,
]
const didQueryKeyRoot = 'did'
const fetchDidQueryKey = (handleOrDid: string) => [didQueryKeyRoot, handleOrDid]

export function useFetchHandle() {
  const queryClient = useQueryClient()
  const client = useAppviewClient()
  const [appViewDid] = useCustomAppViewDid()
  const [appViewUrl] = useCustomAppViewUrl()

  return useCallback(
    async (handleOrDid: string) => {
      if (handleOrDid.startsWith('did:')) {
        const data = await queryClient.fetchQuery({
          staleTime: STALE.MINUTES.FIVE,
          queryKey: [
            ...fetchHandleQueryKey(handleOrDid),
            {appViewDid, appViewUrl},
          ],
          queryFn: () =>
            client.call(app.bsky.actor.getProfile, {
              actor: handleOrDid as DidString,
            }),
        })
        return data.handle
      }
      return handleOrDid
    },
    [queryClient, client, appViewDid, appViewUrl],
  )
}

export function useUpdateHandleMutation(opts?: {
  onSuccess?: (handle: string) => void
}) {
  const queryClient = useQueryClient()
  const client = usePdsClient()

  return useMutation({
    mutationFn: async ({handle}: {handle: string}) => {
      await client.call(com.atproto.identity.updateHandle, {
        // callers validate the handle before submitting
        handle: handle as HandleString,
      })
    },
    onSuccess(_data, variables) {
      opts?.onSuccess?.(variables.handle)
      void queryClient.invalidateQueries({
        queryKey: fetchHandleQueryKey(variables.handle),
      })
    },
  })
}

export function useFetchDid() {
  const queryClient = useQueryClient()
  const client = useAppviewClient()
  const [appViewDid] = useCustomAppViewDid()
  const [appViewUrl] = useCustomAppViewUrl()

  return useCallback(
    async (handleOrDid: string) => {
      return queryClient.fetchQuery({
        staleTime: STALE.INFINITY,
        queryKey: [...fetchDidQueryKey(handleOrDid), {appViewDid, appViewUrl}],
        queryFn: async () => {
          let identifier = handleOrDid
          if (!identifier.startsWith('did:')) {
            const data = await client.call(com.atproto.identity.resolveHandle, {
              handle: identifier as HandleString,
            })
            identifier = data.did
          }
          return identifier
        },
      })
    },
    [queryClient, client, appViewDid, appViewUrl],
  )
}
