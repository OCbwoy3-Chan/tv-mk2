import {useEffect, useState} from 'react'
import {InteractionManager} from 'react-native'

/**
 * Delays enabling a query until after animations/interactions settle.
 * Keeps fork-specific network work off the cold render/scroll path without
 * restructuring upstream UI components.
 */
export function useDeferredEnable(enabled: boolean): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setReady(false)
      return
    }

    let cancelled = false
    const handle = InteractionManager.runAfterInteractions(() => {
      if (!cancelled) {
        setReady(true)
      }
    })

    return () => {
      cancelled = true
      handle.cancel()
    }
  }, [enabled])

  return enabled && ready
}
