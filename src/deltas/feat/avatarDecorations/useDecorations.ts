import {type TextStyle} from 'react-native'
import {type Client} from '@atproto/lex'
import {type DidString} from '@atproto/syntax'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {useDeferredEnable} from '#/lib/hooks/useDeferredEnable'
import {isRecordNotFoundError} from '#/lib/xrpc-error'
import {useSlingshotInstance} from '#/state/preferences/slingshot-instance'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {usePdsClient, useSession} from '#/state/session'
import {useDeltasPreferences} from '#/deltas/preferences'
import {useGta6FontQuery} from '#/deltas/lib/useGta6Font'
import {com} from '#/lexicons'
import {type DecorationFrame, getFrame} from './catalog'
import {getNameGradient, type NameGradient} from './nameGradients'
import {nameGradientTextStyle} from './nameGradientStyle'
import {
  buildDecorationRecord,
  type DecorationSettings,
  getDecorationSettings,
  parseDecorationSettings,
  SETTINGS_COLLECTION,
  SETTINGS_RKEY,
} from './records'

const activeDecorationsQueryRoot = 'activeDecorations'

/** Shared, deferred decoration lookup for every account. */
function useActiveDecorations(did: string | undefined) {
  const slingshot = useSlingshotInstance()
  const enabled = useDeferredEnable(!!did)
  const {data} = useQuery({
    queryKey: createQueryKey(activeDecorationsQueryRoot, {did, slingshot}),
    enabled,
    staleTime: STALE.MINUTES.THIRTY,
    queryFn: () => getDecorationSettings(did!, slingshot),
  })
  return data
}

/** Active avatar frame for a DID, or undefined. */
export function useAvatarDecoration(
  did: string | undefined,
): DecorationFrame | undefined {
  return getFrame(useActiveDecorations(did)?.avatar)
}

/** Active avatar shape for a DID, or undefined when the viewer default applies. */
export function useAvatarShape(did: string | undefined) {
  return useActiveDecorations(did)?.avatarShape
}

/** Active display-name gradient for a DID, or undefined. */
export function useNameGradient(
  did: string | undefined,
): NameGradient | undefined {
  return getNameGradient(useActiveDecorations(did)?.name)
}

/**
 * Display-name font, gradient, and optional outline, or undefined.
 */
export function useNameStyle(did: string | undefined): TextStyle | undefined {
  const active = useActiveDecorations(did)
  const {gta6Font} = useDeltasPreferences()
  const {data: fontFamily} = useGta6FontQuery()
  const gradient = getNameGradient(active?.name)
  const fontEnabled = gta6Font && !!fontFamily
  if (!gradient && !fontEnabled) return undefined
  return {
    ...(gradient &&
      nameGradientTextStyle(gradient, {outline: active?.nameOutline})),
    ...(fontEnabled && {
      fontFamily,
      fontWeight: 'normal',
      fontStyle: 'normal',
    }),
  }
}

const myDecorationSettingsQueryRoot = 'myDecorationSettings'

/** Read straight from the PDS so saving never merges an indexer's stale copy. */
async function readOwnSettings(client: Client, did: DidString) {
  try {
    return await client.call(com.atproto.repo.getRecord, {
      repo: did,
      collection: SETTINGS_COLLECTION,
      rkey: SETTINGS_RKEY,
    })
  } catch (error) {
    if (isRecordNotFoundError(error)) return undefined
    throw error
  }
}

/**
 * The current account's own settings, ungated by list membership so the
 * settings screen can read and preview choices either way. Empty until loaded.
 */
export function useMyDecorationSettingsQuery() {
  const client = usePdsClient()
  const {currentAccount} = useSession()
  const did = currentAccount?.did
  return useQuery({
    queryKey: createQueryKey(myDecorationSettingsQueryRoot, {did}),
    enabled: !!did,
    staleTime: STALE.MINUTES.ONE,
    queryFn: async () => {
      const result = await readOwnSettings(client, did!)
      return parseDecorationSettings(result?.value)
    },
  })
}

export function useMyDecorationSettings(): DecorationSettings {
  return useMyDecorationSettingsQuery().data ?? {}
}

/**
 * Writes the current account's settings record, merging `patch` over whatever
 * is already stored (putRecord replaces the whole record, so this is a
 * read-modify-write). Pass a slot as undefined to clear it.
 */
export function useSetDecorations() {
  const client = usePdsClient()
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()
  const slingshot = useSlingshotInstance()
  const did = currentAccount?.did

  return useMutation({
    scope: {id: `decorations:${did}`},
    async mutationFn(patch: Partial<DecorationSettings>) {
      if (!did) throw new Error('User not logged in')
      const repo = did
      const current = await readOwnSettings(client, repo)
      const record = buildDecorationRecord(
        parseDecorationSettings(current?.value),
        patch,
      )
      await client.call(com.atproto.repo.putRecord, {
        repo,
        collection: SETTINGS_COLLECTION,
        rkey: SETTINGS_RKEY,
        swapRecord: current?.cid ?? null,
        record,
        // Not an app.bsky collection, so the PDS has no schema for it.
        validate: false,
      })
      return {
        did: repo,
        next: parseDecorationSettings(record),
        slingshot,
      }
    },
    onSuccess({did: savedDid, next, slingshot: savedSlingshot}) {
      queryClient.setQueryData(
        createQueryKey(myDecorationSettingsQueryRoot, {did: savedDid}),
        next,
      )
      // Keep our own preview current without waiting for Slingshot to see it.
      queryClient.setQueryData(
        createQueryKey(activeDecorationsQueryRoot, {
          did: savedDid,
          slingshot: savedSlingshot,
        }),
        next,
      )
    },
  })
}
