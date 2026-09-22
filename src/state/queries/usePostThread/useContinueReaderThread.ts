import {type AtUriString} from '@atproto/syntax'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {
  LINEAR_VIEW_BF,
  READER_VIEW_BELOW,
} from '#/state/queries/usePostThread/const'
import {usePostThreadContext} from '#/state/queries/usePostThread/context'
import {extendSelfThreadChain} from '#/state/queries/usePostThread/selfThreadChain'
import {type UsePostThreadQueryResult} from '#/state/queries/usePostThread/types'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'

/** Append another bounded batch without changing the reader's anchor. */
export function useContinueReaderThread() {
  const context = usePostThreadContext()
  const qc = useQueryClient()
  const client = useAppviewClient()

  return useMutation({
    async mutationFn() {
      if (!context) throw new Error('Missing thread context')
      const queryKey = context.postThreadQueryKey
      await qc.cancelQueries({queryKey, exact: true})
      const current = qc.getQueryData<UsePostThreadQueryResult>(queryKey)
      if (!current) throw new Error('Missing thread data')
      const thread = await extendSelfThreadChain({
        thread: current.thread,
        async fetchBelow(anchorUri) {
          const data = await client.call(app.bsky.unspecced.getPostThreadV2, {
            anchor: anchorUri as AtUriString,
            above: false,
            below: READER_VIEW_BELOW,
            branchingFactor: LINEAR_VIEW_BF,
            sort: queryKey[1].sort,
          })
          return data.thread || []
        },
      })
      if (
        qc.getQueryData<UsePostThreadQueryResult>(queryKey)?.thread !==
        current.thread
      ) {
        throw new Error('Thread changed while loading its continuation')
      }
      qc.setQueryData<UsePostThreadQueryResult>(queryKey, latest =>
        latest ? {...latest, thread} : latest,
      )
      return thread.length > current.thread.length
    },
  })
}
