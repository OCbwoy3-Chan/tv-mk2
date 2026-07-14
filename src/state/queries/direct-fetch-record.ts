import {
  type AppBskyActorDefs,
  type AppBskyEmbedRecord,
  type AppBskyFeedDefs,
  AppBskyFeedPost,
  AtUri,
  type AtpAgent,
} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {retry} from '#/lib/async/retry'
import {useDeferredEnable} from '#/lib/hooks/useDeferredEnable'
import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'
import * as bsky from '#/types/bsky'
import {type EmbedType} from '#/types/bsky/post'

const RQKEY_ROOT = 'direct-fetch-record'
export const RQKEY = (uri: string) => [RQKEY_ROOT, uri]

export type DirectFetchUnavailableReason =
  | 'repo_not_found'
  | 'account_suspended'

export type DirectFetchEmbedRecordResult =
  | {
      record: EmbedType<'post'>
      unavailableReason?: undefined
    }
  | {
      record?: undefined
      unavailableReason: DirectFetchUnavailableReason
    }

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function isRepoNotFoundError(e: unknown) {
  const message = getErrorMessage(e)
  return (
    message.includes('Could not find repo:') ||
    message.includes('Could not locate repo:')
  )
}

function isAccountSuspendedError(e: unknown) {
  return getErrorMessage(e).includes('Account has been suspended')
}

export async function directFetchRecordAndProfile(
  agent: AtpAgent,
  uri: string,
): Promise<
  | {
      profile: AppBskyActorDefs.ProfileViewDetailed
      record: unknown
    }
  | {
      unavailableReason: DirectFetchUnavailableReason
    }
  | undefined
> {
  const urip = new AtUri(uri)

  if (!urip.host.startsWith('did:')) {
    const res = await agent.resolveHandle({
      handle: urip.host,
    })
    urip.host = res.data.did as `did:${string}:${string}`
  }

  try {
    const [profile, record] = await Promise.all([
      (async () => (await agent.getProfile({actor: urip.host})).data)(),
      (async () =>
        (
          await retry(
            2,
            e => {
              if (e.message.includes(`Could not locate record:`)) {
                return false
              }
              return true
            },
            () =>
              agent.api.com.atproto.repo.getRecord({
                repo: urip.host,
                collection: 'app.bsky.feed.post',
                rkey: urip.rkey,
              }),
          )
        ).data.value)(),
    ])

    return {profile, record}
  } catch (e) {
    console.error(e)
    if (isRepoNotFoundError(e)) {
      return {unavailableReason: 'repo_not_found'}
    }
    if (isAccountSuspendedError(e)) {
      return {unavailableReason: 'account_suspended'}
    }
    return undefined
  }
}

export async function directFetchEmbedRecord(
  agent: AtpAgent,
  uri: string,
): Promise<DirectFetchEmbedRecordResult | undefined> {
  const res = await directFetchRecordAndProfile(agent, uri)
  if (res === undefined) return undefined
  if ('unavailableReason' in res) return res
  const {profile, record} = res

  if (record && bsky.validate(record, AppBskyFeedPost.validateRecord)) {
    return {
      record: {
        type: 'post',
        view: {
          $type: 'app.bsky.embed.record#viewRecord',
          uri,
          author: profile as AppBskyActorDefs.ProfileViewBasic,
          cid: 'directfetch',
          value: record,
          indexedAt: new Date().toISOString(),
        } satisfies AppBskyEmbedRecord.ViewRecord,
      },
    }
  } else {
    return undefined
  }
}

export function useDirectFetchEmbedRecord({
  uri,
  enabled,
}: {
  uri: string
  enabled?: boolean
}) {
  const agent = useAgent()
  const deferredEnabled = useDeferredEnable(Boolean(enabled) && !!uri)
  return useQuery<DirectFetchEmbedRecordResult | undefined>({
    staleTime: STALE.HOURS.ONE,
    queryKey: RQKEY(uri || ''),
    async queryFn() {
      return directFetchEmbedRecord(agent, uri)
    },
    enabled: deferredEnabled,
  })
}

export async function directFetchPostRecord(
  agent: AtpAgent,
  uri: string,
): Promise<AppBskyFeedDefs.PostView | undefined> {
  const res = await directFetchRecordAndProfile(agent, uri)
  if (res === undefined || 'unavailableReason' in res) return undefined
  const {profile, record} = res

  if (record && bsky.validate(record, AppBskyFeedPost.validateRecord)) {
    return {
      $type: 'app.bsky.feed.defs#postView',
      uri,
      author: profile as AppBskyActorDefs.ProfileViewBasic,
      cid: 'directfetch',
      record,
      indexedAt: new Date().toISOString(),
    } satisfies AppBskyFeedDefs.PostView
  } else {
    return undefined
  }
}

// based on https://stackoverflow.com/a/46432113
export class LRU<K, V> {
  max: number
  private cache: Map<K, Promise<V>>
  constructor(max = 1_024) {
    this.max = max
    this.cache = new Map()
  }

  get(key: K) {
    let item = this.cache.get(key)
    if (item !== undefined) {
      // refresh key
      this.cache.delete(key)
      this.cache.set(key, item)
    }
    return item
  }

  set(key: K, val: Promise<V>) {
    // refresh key
    if (this.cache.has(key)) this.cache.delete(key)
    // evict oldest
    else if (this.cache.size >= this.max)
      this.cache.delete(this.nonemptyFirst())
    this.cache.set(key, val)
  }

  delete(key: K) {
    return this.cache.delete(key)
  }

  private nonemptyFirst() {
    return this.cache.keys().next().value!
  }

  async getOrInsertWith(key: K, fn: () => Promise<V>): Promise<V> {
    const val = this.get(key)
    if (val !== undefined) return val

    const promise = fn()
    this.set(key, promise)
    return promise
  }

  // try to insert, but remove from cache on error and bubble
  async getOrTryInsertWith(key: K, fn: () => Promise<V>): Promise<V> {
    const val = this.get(key)
    if (val !== undefined) return val

    const promise = fn()
    this.set(key, promise)
    try {
      return await promise
    } catch (e) {
      this.delete(key)
      throw e
    }
  }
}
