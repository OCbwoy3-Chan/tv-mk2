import {useEffect, useMemo} from 'react'

import {logger} from '#/logger'
import {useProfilesQuery} from '#/state/queries/profile'
import {type app} from '#/lexicons'
import {account as accountStorage} from '#/storage'
import {type Account} from '#/storage/schema'

type Profile = app.bsky.actor.defs.ProfileViewDetailed
type CachedProfile = NonNullable<Account['profile']>

function readCachedProfile(did: string): CachedProfile | undefined {
  try {
    return accountStorage.get([did, 'profile'])
  } catch {
    // A corrupt entry fails JSON.parse inside Storage.get; treat as no cache.
    return undefined
  }
}

/** Only what a switcher row shows; viewer state is relative to who fetched it. */
function toSnapshot(profile: Profile): CachedProfile['profile'] {
  return {
    did: profile.did,
    handle: profile.handle,
    displayName: profile.displayName,
    avatar: profile.avatar,
    associated: profile.associated,
    labels: profile.labels,
    verification: profile.verification,
  }
}

/**
 * Profiles for saved accounts, shown from the on-device copy until the fresh
 * fetch lands. Each query client starts empty for the other accounts, so
 * without this every switcher would flash placeholder avatars after a switch.
 */
export function useAccountProfilesQuery({dids}: {dids: string[]}) {
  const didsKey = dids.join(' ')
  /*
   * Memoized for identity, not cost: see `placeholderProfiles`. Rebuilt only
   * when the set of accounts changes.
   */
  const placeholder = useMemo(() => {
    const profiles = didsKey
      .split(' ')
      .map(did => readCachedProfile(did)?.profile)
      .filter((p): p is Profile => !!p)
    return profiles.length ? {profiles} : undefined
  }, [didsKey])
  const query = useProfilesQuery({
    handles: dids,
    placeholderProfiles: placeholder,
  })

  const {data, dataUpdatedAt, isPlaceholderData} = query
  useEffect(() => {
    if (!data || isPlaceholderData) return
    const saved = new Set(didsKey.split(' '))
    for (const profile of data.profiles) {
      if (!saved.has(profile.did)) continue
      const cached = readCachedProfile(profile.did)
      // Another account's client may hold an older fetch of the same profile.
      if (cached && cached.fetchedAt >= dataUpdatedAt) continue
      const snapshot = toSnapshot(profile)
      if (
        cached &&
        JSON.stringify(cached.profile) === JSON.stringify(snapshot)
      ) {
        continue
      }
      try {
        accountStorage.set([profile.did, 'profile'], {
          profile: snapshot,
          fetchedAt: dataUpdatedAt,
        })
      } catch (e) {
        // A full quota only costs the head start next time.
        logger.warn('Failed to cache account profile', {safeMessage: e})
      }
    }
  }, [data, dataUpdatedAt, isPlaceholderData, didsKey])

  return query
}
