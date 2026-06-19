import {useCallback} from 'react'
import {type AtpAgent} from '@atproto/api'

import {type SessionAccount, useSessionApi} from '#/state/session'

export function useRunWithEphemeralAgent() {
  const {createEphemeralAgent} = useSessionApi()

  return useCallback(
    async <T>(
      account: SessionAccount,
      fn: (agent: AtpAgent) => Promise<T>,
    ): Promise<T> => {
      const agent = await createEphemeralAgent(account)
      return await fn(agent)
    },
    [createEphemeralAgent],
  )
}
