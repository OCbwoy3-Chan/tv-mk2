import { createContext, useContext, useEffect, useState } from 'react'
import z from 'zod'

import * as persisted from '#/state/persisted'

export const deltasPreferencesZodSchema = z
  .object({
    showBlockedMessages: z.boolean().optional(),
    showHiddenList: z.boolean().optional(),
    showMdniBadge: z.boolean().optional(),
    evenMoreCustomizablePostTids: z.boolean().optional(),
    atprotoRkeyV2GenerationDefault: z
      .enum(['tid', 'prefix', 'suffix'])
      .optional(),
    atprotoRkeyV2PrefixDefault: z.string().optional(),
    atprotoRkeyV2SuffixDefault: z.string().optional(),

    spoofFediversePost: z.boolean().optional(),
    gta6Font: z.boolean().optional(),
    gta6FontBlobCid: z.string().optional()

  })
  .optional()

type DeltasPreferences = {
  showBlockedMessages: boolean
  showHiddenList: boolean
  showMdniBadge: boolean
  evenMoreCustomizablePostTids: boolean
  atprotoRkeyV2GenerationDefault: 'tid' | 'prefix' | 'suffix'
  atprotoRkeyV2PrefixDefault: string
  atprotoRkeyV2SuffixDefault: string

  spoofFediversePost: boolean
  gta6Font: boolean
  gta6FontBlobCid: string
}

const defaults: DeltasPreferences = {
  showBlockedMessages: true,
  showHiddenList: true,
  showMdniBadge: true,
  evenMoreCustomizablePostTids: false,
  atprotoRkeyV2GenerationDefault: 'tid',
  atprotoRkeyV2PrefixDefault: '',
  atprotoRkeyV2SuffixDefault: '',

  spoofFediversePost: false,
  gta6Font: false,
  gta6FontBlobCid: ''
}

function resolvePreferences(
  value: z.infer<typeof deltasPreferencesZodSchema>,
): DeltasPreferences {
  return {
    atprotoRkeyV2GenerationDefault:
      value?.atprotoRkeyV2GenerationDefault ??
      defaults.atprotoRkeyV2GenerationDefault,
    atprotoRkeyV2PrefixDefault:
      value?.atprotoRkeyV2PrefixDefault ?? defaults.atprotoRkeyV2PrefixDefault,
    atprotoRkeyV2SuffixDefault:
      value?.atprotoRkeyV2SuffixDefault ?? defaults.atprotoRkeyV2SuffixDefault,
    showBlockedMessages:
      value?.showBlockedMessages ?? defaults.showBlockedMessages,
    showHiddenList: value?.showHiddenList ?? defaults.showHiddenList,
    showMdniBadge: value?.showMdniBadge ?? defaults.showMdniBadge,
    evenMoreCustomizablePostTids:
      value?.evenMoreCustomizablePostTids ??
      defaults.evenMoreCustomizablePostTids,
    spoofFediversePost: value?.spoofFediversePost ?? defaults.spoofFediversePost,
    gta6Font: value?.gta6Font ?? defaults.gta6Font,
    gta6FontBlobCid: value?.gta6FontBlobCid ?? defaults.gta6FontBlobCid
  }
}

const stateContext = createContext(defaults)
const setContext = createContext<(patch: Partial<DeltasPreferences>) => void>(
  () => { },
)

export function DeltasPreferencesProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [preferences, setPreferences] = useState(() =>
    resolvePreferences(persisted.get('deltasPreferences')),
  )

  function update(patch: Partial<DeltasPreferences>) {
    const next = {
      ...resolvePreferences(persisted.get('deltasPreferences')),
      ...patch,
    }
    setPreferences(next)
    void persisted.write('deltasPreferences', next)
  }

  useEffect(() => {
    return persisted.onUpdate('deltasPreferences', value => {
      setPreferences(resolvePreferences(value))
    })
  }, [])

  return (
    <stateContext.Provider value={preferences}>
      <setContext.Provider value={update}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

export function useDeltasPreferences() {
  return useContext(stateContext)
}

export function useSetDeltasPreference() {
  const update = useContext(setContext)
  return function setPreference<K extends keyof DeltasPreferences>(
    key: K,
    value: DeltasPreferences[K],
  ) {
    update({ [key]: value })
  }
}

export function useAtprotoRkeyV2Settings() {
  const preferences = useDeltasPreferences()
  return {
    generation: preferences.atprotoRkeyV2GenerationDefault,
    prefix: preferences.atprotoRkeyV2PrefixDefault,
    suffix: preferences.atprotoRkeyV2SuffixDefault,
  }
}

export function useSetAtprotoRkeyV2Settings() {
  const update = useContext(setContext)
  return function setSettings(
    value: ReturnType<typeof useAtprotoRkeyV2Settings>,
  ) {
    update({
      atprotoRkeyV2GenerationDefault: value.generation,
      atprotoRkeyV2PrefixDefault: value.prefix,
      atprotoRkeyV2SuffixDefault: value.suffix,
    })
  }
}
