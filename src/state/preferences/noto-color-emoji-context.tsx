import {createContext, useContext, useEffect, useState} from 'react'

import {
  isNotoEmojiFontLoaded,
  loadNotoEmojiFont,
  setNotoEmojiFontEnabled,
} from '#/lib/notoEmojiFont'
import {logger} from '#/logger'
import * as persisted from '#/state/persisted'

const stateContext = createContext(false)
const setContext = createContext<(enabled: boolean) => void>(() => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [enabled, setEnabled] = useState(
    persisted.get('useNotoColorEmoji') ?? false,
  )
  const [loaded, setLoaded] = useState(isNotoEmojiFontLoaded)

  function setEnabledAndPersist(value: boolean) {
    setEnabled(value)
    void persisted.write('useNotoColorEmoji', value)
  }

  useEffect(() => {
    return persisted.onUpdate('useNotoColorEmoji', value => {
      setEnabled(value ?? false)
    })
  }, [])

  useEffect(() => {
    if (!enabled || loaded) return
    let cancelled = false
    loadNotoEmojiFont()
      .then(() => {
        if (!cancelled) setLoaded(true)
      })
      .catch(error => {
        logger.error('Failed to load Noto Color Emoji', {safeMessage: error})
      })
    return () => {
      cancelled = true
    }
  }, [enabled, loaded])

  useEffect(() => {
    setNotoEmojiFontEnabled(enabled && loaded)
    return () => setNotoEmojiFontEnabled(false)
  }, [enabled, loaded])

  return (
    <stateContext.Provider value={enabled}>
      <setContext.Provider value={setEnabledAndPersist}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useNotoColorEmoji() {
  return useContext(stateContext)
}

export function useSetNotoColorEmoji() {
  return useContext(setContext)
}
