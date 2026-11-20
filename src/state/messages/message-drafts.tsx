import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useReducer,
} from 'react'

import {type BluemojiRef} from '#/features/bluemoji/util'
import {useCurrentConvoId} from './current-convo-id'

const MessageDraftsContext = createContext<{
  state: State
  dispatch: React.Dispatch<Actions>
} | null>(null)
MessageDraftsContext.displayName = 'MessageDraftsContext'

function useMessageDraftsContext() {
  const ctx = useContext(MessageDraftsContext)
  if (!ctx) {
    throw new Error(
      'useMessageDrafts must be used within a MessageDraftsContext',
    )
  }
  return ctx
}

export function useMessageDraft() {
  const {currentConvoId} = useCurrentConvoId()
  const {state, dispatch} = useMessageDraftsContext()
  return useMemo(
    () => ({
      getDraft: () => (currentConvoId && state[currentConvoId]?.text) || '',
      getBluemoji: () =>
        (currentConvoId && state[currentConvoId]?.bluemoji) || {},
      clearDraft: () => {
        if (currentConvoId) {
          dispatch({type: 'clear', convoId: currentConvoId})
        }
      },
    }),
    [state, dispatch, currentConvoId],
  )
}

export function useSaveMessageDraft(
  message: string,
  bluemoji: Record<string, BluemojiRef>,
) {
  const {currentConvoId} = useCurrentConvoId()
  const {dispatch} = useMessageDraftsContext()
  const getMessage = useEffectEvent(() => ({text: message, bluemoji}))

  useEffect(() => {
    return () => {
      if (currentConvoId) {
        dispatch({
          type: 'set',
          convoId: currentConvoId,
          draft: getMessage(),
        })
      }
    }
  }, [currentConvoId, dispatch])
}

type MessageDraft = {text: string; bluemoji: Record<string, BluemojiRef>}
type State = {[convoId: string]: MessageDraft | undefined}
type Actions =
  | {type: 'set'; convoId: string; draft: MessageDraft}
  | {type: 'clear'; convoId: string}

function reducer(state: State, action: Actions): State {
  switch (action.type) {
    case 'set':
      return {...state, [action.convoId]: action.draft}
    case 'clear':
      return {...state, [action.convoId]: undefined}
    default:
      return state
  }
}

export function MessageDraftsProvider({children}: {children: React.ReactNode}) {
  const [state, dispatch] = useReducer(reducer, {})

  const ctx = useMemo(() => {
    return {state, dispatch}
  }, [state])

  return (
    <MessageDraftsContext.Provider value={ctx}>
      {children}
    </MessageDraftsContext.Provider>
  )
}
