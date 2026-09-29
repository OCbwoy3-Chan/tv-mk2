import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['replyIconIndicators']
type SetContext = (v: StateContext) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.replyIconIndicators,
)
const setContext = createContext<SetContext>((_: StateContext) => {})

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('replyIconIndicators'))

  const setStateWrapped = useCallback(
    (value: StateContext) => {
      setState(value)
      void persisted.write('replyIconIndicators', value)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate('replyIconIndicators', next => {
      setState(next)
    })
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

/**
 * Whether the reply icon in the post controls shows its indicators: a dot for
 * each reply, up to three, and a dashed outline on posts whose threadgate
 * restricts replies. Enabled by default.
 */
export function useReplyIconIndicators() {
  return useContext(stateContext)
}

export function useSetReplyIconIndicators() {
  return useContext(setContext)
}
