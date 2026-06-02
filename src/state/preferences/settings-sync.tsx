import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import {type PropsWithChildren} from 'react'

import * as persisted from '#/state/persisted'
import {type Schema} from '#/state/persisted/schema'

// ---------------------------------------------------------------------------
// Synced keys allowlist
// ---------------------------------------------------------------------------
// Everything the storage manifest will include. Deliberately excludes:
//   session, invites, reminders, onboarding, pdsAddressHistory,
//   hasCheckedForStarterPack, mutedThreads (deprecated),
//   lastSelectedHomeFeed (deprecated UI state),
//   settingsSyncEnabled, settingsSyncDraftId  (the mechanism, not the content)

export const SYNCED_PREFS_KEYS = [
  'colorMode',
  'darkTheme',
  'colorScheme',
  'hue',
  'material3Accent',
  'material3Style',
  'languagePrefs',
  'requireAltTextEnabled',
  'largeAltBadgeEnabled',
  'externalEmbeds',
  'hiddenPosts',
  'useInAppBrowser',
  'disableHaptics',
  'disableAutoplay',
  'kawaii',
  'subtitlesEnabled',
  'goLinksEnabled',
  'constellationEnabled',
  'directFetchRecords',
  'ignoredAppLabelers',
  'noDiscoverFallback',
  'repostCarouselEnabled',
  'alsoLikedFeedEnabled',
  'constellationInstance',
  'showLinkInHandle',
  'showLinkInHandleOnlyOnWorkingLinks',
  'hideFeedsPromoTab',
  'disableViaRepostNotification',
  'disableComposerPrompt',
  'disableTopOfFeedButton',
  'showAvatarFollowButton',
  'disableLikesMetrics',
  'disableRepostsMetrics',
  'disableQuotesMetrics',
  'disableSavesMetrics',
  'disableReplyMetrics',
  'disableFollowersMetrics',
  'disableFollowingMetrics',
  'disableFollowedByMetrics',
  'disablePostsMetrics',
  'showFollowsYouBadge',
  'hideSimilarAccountsRecomm',
  'hideScaryFollowButtons',
  'showGermDmButton',
  'confirmFollowUnfollow',
  'discoverContextEnabled',
  'compactPosts',
  'enableSquareAvatars',
  'enableSquareButtons',
  'useCompactAccountSwitcher',
  'autoCompactAccountSwitcher',
  'disableVerifyEmailReminder',
  'showViaClient',
  'deerVerification',
  'highQualityImages',
  'imageCdnHost',
  'plcDirectory',
  'hideUnreplyablePosts',
  'pdsLabel',
  'faviconService',
  'postReplacement',
  'showExternalShareButtons',
  'translationServicePreference',
  'libreTranslateInstance',
  'openRouterApiKey',
  'openRouterModel',
  'openRouterPrompt',
  'useHandleInLinks',
  'trendingDisabled',
  'trendingVideoDisabled',
  'autoLikeOnRepost',
  'omitViaField',
  'syncOpenRouterApiKey',
] as const satisfies readonly (keyof Schema)[]

export type SyncedPrefsKey = (typeof SYNCED_PREFS_KEYS)[number]

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = createContext<StateContext>(
  Boolean(persisted.defaults.settingsSyncEnabled),
)
stateContext.displayName = 'CloudSyncStateContext'

const setContext = createContext<SetContext>((_: boolean) => {})
setContext.displayName = 'CloudSyncSetContext'

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function Provider({children}: PropsWithChildren<{}>) {
  const [state, setState] = useState(
    Boolean(persisted.get('settingsSyncEnabled')),
  )

  const setStateWrapped = useCallback((value: boolean) => {
    setState(value)
    persisted.write('settingsSyncEnabled', value)
  }, [])

  useEffect(() => {
    return persisted.onUpdate('settingsSyncEnabled', next => {
      setState(Boolean(next))
    })
  }, [])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export const useSettingsSyncEnabled = () => useContext(stateContext)
export const useSetSettingsSyncEnabled = () => useContext(setContext)
