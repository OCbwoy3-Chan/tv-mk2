import {createContext, useContext, useMemo, type PropsWithChildren} from 'react'
import {AtpAgent, type ModerationOpts} from '@atproto/api'

import {useHiddenPosts, useLabelDefinitions} from '#/state/preferences'
import {useIgnoredAppLabelers} from '#/state/preferences/ignored-app-labelers'
import {DEFAULT_LOGGED_OUT_LABEL_PREFERENCES} from '#/state/queries/preferences/const'
import {useSession} from '#/state/session'
import {usePreferencesQuery} from '../queries/preferences'

export const moderationOptsContext = createContext<ModerationOpts | undefined>(
  undefined,
)
moderationOptsContext.displayName = 'ModerationOptsContext'

// used in the moderation state devtool
export const moderationOptsOverrideContext = createContext<
  ModerationOpts | undefined
>(undefined)
moderationOptsOverrideContext.displayName = 'ModerationOptsOverrideContext'

export function useModerationOpts() {
  return useContext(moderationOptsContext)
}

export function Provider({children}: PropsWithChildren<{}>) {
  const override = useContext(moderationOptsOverrideContext)
  const {currentAccount} = useSession()
  const prefs = usePreferencesQuery()
  const {labelDefs} = useLabelDefinitions()
  const hiddenPosts = useHiddenPosts() // TODO move this into pds-stored prefs
  const ignoredAppLabelers = useIgnoredAppLabelers()

  const userDid = currentAccount?.did
  const moderationPrefs = prefs.data?.moderationPrefs
  const value = useMemo<ModerationOpts | undefined>(() => {
    if (override) {
      return override
    }
    if (!moderationPrefs) {
      return undefined
    }
    return {
      userDid,
      prefs: {
        ...moderationPrefs,
        labelers: moderationPrefs.labelers.length
          ? moderationPrefs.labelers.filter(
              l => !ignoredAppLabelers.includes(l.did),
            )
          : AtpAgent.appLabelers.map(did => ({
              did,
              labels: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES,
            })),
        hiddenPosts: hiddenPosts || [],
      },
      labelDefs,
    }
  }, [
    override,
    userDid,
    labelDefs,
    moderationPrefs,
    hiddenPosts,
    ignoredAppLabelers,
  ])

  return (
    <moderationOptsContext.Provider value={value}>
      {children}
    </moderationOptsContext.Provider>
  )
}
