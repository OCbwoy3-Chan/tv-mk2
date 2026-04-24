import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type ApiKeyStateContext = persisted.Schema['openRouterApiKey']
type SetApiKeyContext = (v: persisted.Schema['openRouterApiKey']) => void
type ModelStateContext = persisted.Schema['openRouterModel']
type SetModelContext = (v: persisted.Schema['openRouterModel']) => void
type PromptStateContext = persisted.Schema['openRouterPrompt']
type SetPromptContext = (v: persisted.Schema['openRouterPrompt']) => void

const apiKeyStateContext = createContext<ApiKeyStateContext>(
  persisted.defaults.openRouterApiKey,
)
const setApiKeyContext = createContext<SetApiKeyContext>(
  (_: persisted.Schema['openRouterApiKey']) => {},
)
const modelStateContext = createContext<ModelStateContext>(
  persisted.defaults.openRouterModel,
)
const setModelContext = createContext<SetModelContext>(
  (_: persisted.Schema['openRouterModel']) => {},
)
const promptStateContext = createContext<PromptStateContext>(
  persisted.defaults.openRouterPrompt,
)
const setPromptContext = createContext<SetPromptContext>(
  (_: persisted.Schema['openRouterPrompt']) => {},
)

export function Provider({children}: PropsWithChildren<{}>) {
  const [apiKeyState, setApiKeyState] = useState(
    persisted.get('openRouterApiKey'),
  )
  const [modelState, setModelState] = useState(persisted.get('openRouterModel'))
  const [promptState, setPromptState] = useState(
    persisted.get('openRouterPrompt'),
  )

  const setApiKeyWrapped = useCallback(
    (openRouterApiKey: persisted.Schema['openRouterApiKey']) => {
      setApiKeyState(openRouterApiKey)
      persisted.write('openRouterApiKey', openRouterApiKey)
    },
    [setApiKeyState],
  )

  const setModelWrapped = useCallback(
    (openRouterModel: persisted.Schema['openRouterModel']) => {
      setModelState(openRouterModel)
      persisted.write('openRouterModel', openRouterModel)
    },
    [setModelState],
  )

  const setPromptWrapped = useCallback(
    (openRouterPrompt: persisted.Schema['openRouterPrompt']) => {
      setPromptState(openRouterPrompt)
      persisted.write('openRouterPrompt', openRouterPrompt)
    },
    [setPromptState],
  )

  useEffect(() => {
    return persisted.onUpdate('openRouterApiKey', nextApiKey => {
      setApiKeyState(nextApiKey)
    })
  }, [setApiKeyWrapped])

  useEffect(() => {
    return persisted.onUpdate('openRouterModel', nextModel => {
      setModelState(nextModel)
    })
  }, [setModelWrapped])

  useEffect(() => {
    return persisted.onUpdate('openRouterPrompt', nextPrompt => {
      setPromptState(nextPrompt)
    })
  }, [setPromptWrapped])

  return (
    <apiKeyStateContext.Provider value={apiKeyState}>
      <setApiKeyContext.Provider value={setApiKeyWrapped}>
        <modelStateContext.Provider value={modelState}>
          <setModelContext.Provider value={setModelWrapped}>
            <promptStateContext.Provider value={promptState}>
              <setPromptContext.Provider value={setPromptWrapped}>
                {children}
              </setPromptContext.Provider>
            </promptStateContext.Provider>
          </setModelContext.Provider>
        </modelStateContext.Provider>
      </setApiKeyContext.Provider>
    </apiKeyStateContext.Provider>
  )
}

export function useOpenRouterApiKey() {
  return useContext(apiKeyStateContext)
}

export function useSetOpenRouterApiKey() {
  return useContext(setApiKeyContext)
}

export function useOpenRouterModel() {
  return useContext(modelStateContext)
}

export function useSetOpenRouterModel() {
  return useContext(setModelContext)
}

export function useOpenRouterPrompt() {
  return useContext(promptStateContext)
}

export function useSetOpenRouterPrompt() {
  return useContext(setPromptContext)
}

export function useOpenRouterConfigured() {
  const apiKey = useOpenRouterApiKey()
  return !!apiKey && apiKey.length > 0
}
