import {useMemo} from 'react'
import {interpretLabelValueDefinitions} from '@atproto/api'

import {getActiveAppLabelers} from '#/lib/moderation'
import {useIgnoredAppLabelers} from '#/state/preferences/ignored-app-labelers'
import {isNonConfigurableModerationAuthority} from '#/state/session/additional-moderation-authorities'
import {useLabelersDetailedInfoQuery} from '../labeler'
import {usePreferencesQuery} from './index'

export function useMyLabelersQuery({
  excludeNonConfigurableLabelers = false,
}: {
  excludeNonConfigurableLabelers?: boolean
} = {}) {
  const prefs = usePreferencesQuery()
  const ignoredAppLabelers = useIgnoredAppLabelers()
  let dids = Array.from(
    new Set(
      getActiveAppLabelers().concat(
        prefs.data?.moderationPrefs.labelers.map(l => l.did) || [],
      ),
    ),
  ).filter(did => !ignoredAppLabelers.includes(did))
  if (excludeNonConfigurableLabelers) {
    dids = dids.filter(did => !isNonConfigurableModerationAuthority(did))
  }
  const labelers = useLabelersDetailedInfoQuery({dids})
  const isLoading = prefs.isLoading || labelers.isLoading
  const error = prefs.error || labelers.error
  return useMemo(() => {
    return {
      isLoading,
      error,
      data: labelers.data,
      refetch: labelers.refetch,
    }
  }, [labelers, isLoading, error, ignoredAppLabelers])
}

export function useLabelDefinitionsQuery() {
  const labelers = useMyLabelersQuery()
  return useMemo(() => {
    return {
      labelDefs: Object.fromEntries(
        (labelers.data || []).map(labeler => [
          labeler.creator.did,
          interpretLabelValueDefinitions(labeler),
        ]),
      ),
      labelers: labelers.data || [],
    }
  }, [labelers])
}
