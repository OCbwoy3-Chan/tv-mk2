import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  COCORE_ALT_TEXT_AI_BASE_URL,
  DEFAULT_ALT_TEXT_AI_MODEL,
  OPENROUTER_ALT_TEXT_AI_BASE_URL,
} from '#/lib/constants'
import * as persisted from '#/state/persisted'

export type AltTextAiProvider = NonNullable<
  persisted.Schema['altTextAiProvider']
>
type EnabledAltTextAiProvider = Exclude<AltTextAiProvider, 'none'>

export type AltTextAiConfig = {
  provider: EnabledAltTextAiProvider
  apiKey?: string
  baseUrl: string
  model?: string
  prompt?: string
}

type Settings = {
  provider: AltTextAiProvider
  openRouterApiKey?: string
  openRouterModel?: string
  prompt?: string
  openAiCompatibleApiKey?: string
  openAiCompatibleBaseUrl?: string
  openAiCompatibleModel?: string
}

type SettingsApi = {
  setProvider: (value: AltTextAiProvider) => void
  setOpenRouterApiKey: (value?: string) => void
  setOpenRouterModel: (value?: string) => void
  setPrompt: (value?: string) => void
  setOpenAiCompatibleApiKey: (value?: string) => void
  setOpenAiCompatibleBaseUrl: (value?: string) => void
  setOpenAiCompatibleModel: (value?: string) => void
}

const settingsContext = createContext<Settings>({
  provider: 'none',
  openRouterModel: DEFAULT_ALT_TEXT_AI_MODEL,
})
const settingsApiContext = createContext<SettingsApi>({
  setProvider: () => {},
  setOpenRouterApiKey: () => {},
  setOpenRouterModel: () => {},
  setPrompt: () => {},
  setOpenAiCompatibleApiKey: () => {},
  setOpenAiCompatibleBaseUrl: () => {},
  setOpenAiCompatibleModel: () => {},
})

function usePersistedState<K extends keyof persisted.Schema>(key: K) {
  const [value, setValue] = useState(() => persisted.get(key))

  const setValueWrapped = useCallback(
    (next: persisted.Schema[K]) => {
      setValue(next)
      void persisted.write(key, next)
    },
    [key],
  )

  useEffect(() => persisted.onUpdate(key, setValue), [key])

  return [value, setValueWrapped] as const
}

export function Provider({children}: PropsWithChildren<{}>) {
  const [provider, setProvider] = usePersistedState('altTextAiProvider')
  const [openRouterApiKey, setOpenRouterApiKey] =
    usePersistedState('openRouterApiKey')
  const [openRouterModel, setOpenRouterModel] =
    usePersistedState('openRouterModel')
  const [prompt, setPrompt] = usePersistedState('openRouterPrompt')
  const [openAiCompatibleApiKey, setOpenAiCompatibleApiKey] = usePersistedState(
    'openAiCompatibleApiKey',
  )
  const [openAiCompatibleBaseUrl, setOpenAiCompatibleBaseUrl] =
    usePersistedState('openAiCompatibleBaseUrl')
  const [openAiCompatibleModel, setOpenAiCompatibleModel] = usePersistedState(
    'openAiCompatibleModel',
  )

  const settings = useMemo<Settings>(
    () => ({
      provider: provider ?? 'none',
      openRouterApiKey,
      openRouterModel,
      prompt,
      openAiCompatibleApiKey,
      openAiCompatibleBaseUrl,
      openAiCompatibleModel,
    }),
    [
      provider,
      openRouterApiKey,
      openRouterModel,
      prompt,
      openAiCompatibleApiKey,
      openAiCompatibleBaseUrl,
      openAiCompatibleModel,
    ],
  )
  const api = useMemo<SettingsApi>(
    () => ({
      setProvider,
      setOpenRouterApiKey,
      setOpenRouterModel,
      setPrompt,
      setOpenAiCompatibleApiKey,
      setOpenAiCompatibleBaseUrl,
      setOpenAiCompatibleModel,
    }),
    [
      setProvider,
      setOpenRouterApiKey,
      setOpenRouterModel,
      setPrompt,
      setOpenAiCompatibleApiKey,
      setOpenAiCompatibleBaseUrl,
      setOpenAiCompatibleModel,
    ],
  )

  return (
    <settingsContext.Provider value={settings}>
      <settingsApiContext.Provider value={api}>
        {children}
      </settingsApiContext.Provider>
    </settingsContext.Provider>
  )
}

export function useAltTextAiProvider() {
  return useContext(settingsContext).provider
}

export function useSetAltTextAiProvider() {
  return useContext(settingsApiContext).setProvider
}

export function useAltTextAiApiKey() {
  const settings = useContext(settingsContext)
  switch (settings.provider) {
    case 'openaiCompatible':
      return settings.openAiCompatibleApiKey
    case 'cocore':
    case 'none':
      return undefined
    default:
      return settings.openRouterApiKey
  }
}

export function useSetAltTextAiApiKey() {
  const {provider} = useContext(settingsContext)
  const api = useContext(settingsApiContext)
  return useMemo(() => {
    switch (provider) {
      case 'openaiCompatible':
        return api.setOpenAiCompatibleApiKey
      default:
        return api.setOpenRouterApiKey
    }
  }, [api, provider])
}

export function useAltTextAiModel() {
  const settings = useContext(settingsContext)
  switch (settings.provider) {
    case 'cocore':
    case 'none':
      return undefined
    case 'openaiCompatible':
      return settings.openAiCompatibleModel
    default:
      return settings.openRouterModel ?? DEFAULT_ALT_TEXT_AI_MODEL
  }
}

export function useSetAltTextAiModel() {
  const {provider} = useContext(settingsContext)
  const api = useContext(settingsApiContext)
  return useMemo(() => {
    switch (provider) {
      case 'openaiCompatible':
        return api.setOpenAiCompatibleModel
      default:
        return api.setOpenRouterModel
    }
  }, [api, provider])
}

export function useAltTextAiBaseUrl() {
  const settings = useContext(settingsContext)
  switch (settings.provider) {
    case 'cocore':
      return COCORE_ALT_TEXT_AI_BASE_URL
    case 'none':
      return undefined
    case 'openaiCompatible':
      return settings.openAiCompatibleBaseUrl
    default:
      return OPENROUTER_ALT_TEXT_AI_BASE_URL
  }
}

export function useSetOpenAiCompatibleBaseUrl() {
  return useContext(settingsApiContext).setOpenAiCompatibleBaseUrl
}

export function useAltTextAiPrompt() {
  return useContext(settingsContext).prompt
}

export function useSetAltTextAiPrompt() {
  return useContext(settingsApiContext).setPrompt
}

export function useAltTextAiConfig(): AltTextAiConfig | undefined {
  const provider = useAltTextAiProvider()
  const apiKey = useAltTextAiApiKey()
  const model = useAltTextAiModel()
  const baseUrl = useAltTextAiBaseUrl()
  const prompt = useAltTextAiPrompt()

  if (provider === 'none') return undefined
  if (!baseUrl) {
    return undefined
  }
  if (provider === 'openrouter' && (!apiKey || !model)) return undefined
  if (provider === 'openaiCompatible' && !model) return undefined
  return {provider, apiKey, model, baseUrl, prompt}
}

export function useAltTextAiConfigured() {
  return !!useAltTextAiConfig()
}

/** @deprecated Use the provider-neutral alt text AI hooks. */
export function useOpenRouterApiKey() {
  return useContext(settingsContext).openRouterApiKey
}

/** @deprecated Use the provider-neutral alt text AI hooks. */
export function useSetOpenRouterApiKey() {
  return useContext(settingsApiContext).setOpenRouterApiKey
}

/** @deprecated Use the provider-neutral alt text AI hooks. */
export function useOpenRouterModel() {
  return useContext(settingsContext).openRouterModel
}

/** @deprecated Use the provider-neutral alt text AI hooks. */
export function useSetOpenRouterModel() {
  return useContext(settingsApiContext).setOpenRouterModel
}

/** @deprecated Use the provider-neutral alt text AI hooks. */
export function useOpenRouterPrompt() {
  return useAltTextAiPrompt()
}

/** @deprecated Use the provider-neutral alt text AI hooks. */
export function useSetOpenRouterPrompt() {
  return useSetAltTextAiPrompt()
}

/** @deprecated Use useAltTextAiConfigured. */
export function useOpenRouterConfigured() {
  const apiKey = useOpenRouterApiKey()
  return !!apiKey
}
