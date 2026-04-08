import React from 'react'

import * as persisted from '#/state/persisted'

type ApiKeyStateContext = persisted.Schema['openRouterApiKey']
type SetApiKeyContext = (v: persisted.Schema['openRouterApiKey']) => void
type ModelStateContext = persisted.Schema['openRouterModel']
type SetModelContext = (v: persisted.Schema['openRouterModel']) => void
type PromptStateContext = persisted.Schema['openRouterPrompt']
type SetPromptContext = (v: persisted.Schema['openRouterPrompt']) => void

const apiKeyStateContext = React.createContext<ApiKeyStateContext>(
  persisted.defaults.openRouterApiKey,
)
const setApiKeyContext = React.createContext<SetApiKeyContext>(
  (_: persisted.Schema['openRouterApiKey']) => {},
)
const modelStateContext = React.createContext<ModelStateContext>(
  persisted.defaults.openRouterModel,
)
const setModelContext = React.createContext<SetModelContext>(
  (_: persisted.Schema['openRouterModel']) => {},
)
const promptStateContext = React.createContext<PromptStateContext>(
  persisted.defaults.openRouterPrompt,
)
const setPromptContext = React.createContext<SetPromptContext>(
  (_: persisted.Schema['openRouterPrompt']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [apiKeyState, setApiKeyState] = React.useState(
    persisted.get('openRouterApiKey'),
  )
  const [modelState, setModelState] = React.useState(
    persisted.get('openRouterModel'),
  )
  const [promptState, setPromptState] = React.useState(
    persisted.get('openRouterPrompt'),
  )

  const setApiKeyWrapped = React.useCallback(
    (openRouterApiKey: persisted.Schema['openRouterApiKey']) => {
      setApiKeyState(openRouterApiKey)
      persisted.write('openRouterApiKey', openRouterApiKey)
    },
    [setApiKeyState],
  )

  const setModelWrapped = React.useCallback(
    (openRouterModel: persisted.Schema['openRouterModel']) => {
      setModelState(openRouterModel)
      persisted.write('openRouterModel', openRouterModel)
    },
    [setModelState],
  )

  const setPromptWrapped = React.useCallback(
    (openRouterPrompt: persisted.Schema['openRouterPrompt']) => {
      setPromptState(openRouterPrompt)
      persisted.write('openRouterPrompt', openRouterPrompt)
    },
    [setPromptState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('openRouterApiKey', nextApiKey => {
      setApiKeyState(nextApiKey)
    })
  }, [setApiKeyWrapped])

  React.useEffect(() => {
    return persisted.onUpdate('openRouterModel', nextModel => {
      setModelState(nextModel)
    })
  }, [setModelWrapped])

  React.useEffect(() => {
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
  return React.useContext(apiKeyStateContext)
}

export function useSetOpenRouterApiKey() {
  return React.useContext(setApiKeyContext)
}

export function useOpenRouterModel() {
  return React.useContext(modelStateContext)
}

export function useSetOpenRouterModel() {
  return React.useContext(setModelContext)
}

export function useOpenRouterPrompt() {
  return React.useContext(promptStateContext)
}

export function useSetOpenRouterPrompt() {
  return React.useContext(setPromptContext)
}

export function useOpenRouterConfigured() {
  const apiKey = useOpenRouterApiKey()
  return !!apiKey && apiKey.length > 0
}
