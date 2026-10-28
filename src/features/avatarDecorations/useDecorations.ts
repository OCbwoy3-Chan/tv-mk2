import {type TextStyle} from 'react-native'
import {type DidString} from '@atproto/syntax'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {isRecordNotFoundError} from '#/lib/xrpc-error'
import {useConstellationInstance} from '#/state/preferences/constellation-instance'
import {useSlingshotInstance} from '#/state/preferences/slingshot-instance'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {usePdsClient, useSession} from '#/state/session'
import {com} from '#/lexicons'
import {getFrame} from './catalog'
import {getNameGradient} from './nameGradients'
import {nameGradientTextStyle} from './nameGradientStyle'
import {
  type DecorationSettings,
  getDecorationSettings,
  hasDecorationEntitlement,
  parseDecorationSettings,
  SETTINGS_COLLECTION,
  SETTINGS_RKEY,
} from './records'

const decorationEntitlementQueryRoot = 'decorationEntitlement'

export function useDecorationEntitlementQuery(did: string | undefined) {
  const instance = useConstellationInstance()
  return useQuery({
    queryKey: createQueryKey(decorationEntitlementQueryRoot, {did, instance}),
    enabled: !!did,
    staleTime: STALE.MINUTES.THIRTY,
    queryFn: () => hasDecorationEntitlement(did!, undefined, instance),
  })
}

const activeDecorationsQueryRoot = 'activeDecorations'

function useActiveDecorations(did: string | undefined) {
  const instance = useSlingshotInstance()
  const entitlement = useDecorationEntitlementQuery(did)
  const {data} = useQuery({
    queryKey: createQueryKey(activeDecorationsQueryRoot, {did, instance}),
    enabled: !!did && entitlement.data === true,
    staleTime: STALE.MINUTES.THIRTY,
    queryFn: () => getDecorationSettings(did!, instance),
  })
  return entitlement.data === true ? data : undefined
}

export function useAvatarDecoration(did: string | undefined) {
  return getFrame(useActiveDecorations(did)?.avatar)
}

export function useNameStyle(did: string | undefined): TextStyle | undefined {
  const active = useActiveDecorations(did)
  const gradient = getNameGradient(active?.name)
  return gradient
    ? nameGradientTextStyle(gradient, {outline: active?.nameOutline})
    : undefined
}

const myDecorationSettingsQueryRoot = 'myDecorationSettings'

/** Read directly from the PDS so saving never merges an indexer's stale record. */
async function readOwnSettings(
  client: ReturnType<typeof usePdsClient>,
  did: DidString,
) {
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
      return parseDecorationSettings(result?.value ?? {})
    },
  })
}

export function useMyDecorationSettings(): DecorationSettings {
  return useMyDecorationSettingsQuery().data ?? {}
}

export function useSetDecorations() {
  const client = usePdsClient()
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()
  const instance = useSlingshotInstance()
  const did = currentAccount?.did

  return useMutation({
    scope: {id: `decorations:${did}`},
    async mutationFn(patch: Partial<DecorationSettings>) {
      if (!did) throw new Error('User not logged in')
      const current = await readOwnSettings(client, did)
      const next = {...current?.value, ...patch}
      const record = {
        ...next,
        $type: SETTINGS_COLLECTION,
        updatedAt: new Date().toISOString(),
      }
      // Undefined means remove this slot; omit it from the serialized record.
      for (const key of Object.keys(record) as (keyof typeof record)[]) {
        if (record[key] === undefined) delete record[key]
      }
      await client.call(com.atproto.repo.putRecord, {
        repo: did,
        collection: SETTINGS_COLLECTION,
        rkey: SETTINGS_RKEY,
        swapRecord: current?.cid ?? null,
        record,
      })
      return {did, next, instance}
    },
    onSuccess({did: savedDid, next, instance: savedInstance}) {
      queryClient.setQueryData(
        createQueryKey(myDecorationSettingsQueryRoot, {did: savedDid}),
        next,
      )
      // Keep our own preview current without waiting for Slingshot to index it.
      queryClient.setQueryData(
        createQueryKey(activeDecorationsQueryRoot, {
          did: savedDid,
          instance: savedInstance,
        }),
        next,
      )
    },
  })
}
