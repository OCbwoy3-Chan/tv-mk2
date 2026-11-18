import {AtUri} from '@atproto/api'
import {type Client, type TypedLexMap} from '@atproto/lex'
import {
  type InfiniteData,
  type QueryClient,
  type QueryKey,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {BLACKSKY_APPVIEW} from '#/lib/constants'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewClient, usePdsClient, useSession} from '#/state/session'
import {applyRsvp} from './rsvp-state'
import {
  EVENT_COLLECTION,
  type EventView,
  RSVP_COLLECTION,
  type RsvpStatus,
  type RsvpView,
} from './types'

const EVENT_KEY_ROOT = 'event'
const RSVPS_KEY_ROOT = 'event-rsvps'
const MY_EVENTS_KEY_ROOT = 'my-events'

export const eventQueryKey = (uri: string) =>
  createQueryKey(EVENT_KEY_ROOT, {uri})
const rsvpsQueryKey = (uri: string, status: string) =>
  createQueryKey(RSVPS_KEY_ROOT, {uri, status})
const myEventsQueryKey = (did: string, when: 'upcoming' | 'past') =>
  createQueryKey(MY_EVENTS_KEY_ROOT, {did, when})

type EventsResponse = {events: EventView[]}
type RsvpPage = {
  rsvps: RsvpView[]
  cursor?: string
  mutedOrBlockedCount?: number
}
type MyEventsPage = {events: EventView[]; cursor?: string}

type XrpcParams = Record<string, string | number | string[] | undefined>

/*
 * The generated lexicons have no calendar namespace, so these are raw XRPC
 * reads. `agent.fetchHandler` is the only surface that takes an arbitrary path
 * and header; the required `atproto-proxy` points the PDS at Blacksky.
 */
async function calendarXrpc<T>(
  client: Client,
  method: string,
  params: XrpcParams,
): Promise<T> {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) search.append(key, String(item))
    }
  }
  const res = await client.agent.fetchHandler(`/xrpc/${method}?${search}`, {
    headers: {'atproto-proxy': BLACKSKY_APPVIEW, accept: 'application/json'},
  })
  if (!res.ok) throw new Error(`${method} failed: ${res.status}`)
  return (await res.json()) as T
}

export function useEventQuery(uri: string | undefined, initial?: EventView) {
  const client = useAppviewClient()
  return useQuery({
    queryKey: eventQueryKey(uri ?? ''),
    enabled: !!uri,
    staleTime: STALE.SECONDS.THIRTY,
    initialData: initial,
    queryFn: async (): Promise<EventView | null> => {
      const {events} = await calendarXrpc<EventsResponse>(
        client,
        'community.blacksky.calendar.getEvents',
        {uris: [uri!]},
      )
      return events[0] ?? null
    },
  })
}

/** The first few RSVPs in one status, for an avatar row beside its count. */
export function useRsvpsQuery(
  uri: string | undefined,
  status: RsvpStatus,
  enabled = true,
) {
  const client = useAppviewClient()
  return useQuery({
    queryKey: rsvpsQueryKey(uri ?? '', status),
    enabled: !!uri && enabled,
    staleTime: STALE.SECONDS.THIRTY,
    queryFn: () =>
      calendarXrpc<RsvpPage>(
        client,
        'community.blacksky.calendar.getEventRsvps',
        {event: uri!, status, limit: 6},
      ),
  })
}

export function useEventRsvpsQuery(
  uri: string | undefined,
  status: RsvpStatus | undefined,
  section: 'main' | 'mutedOrBlocked' = 'main',
  enabled = true,
) {
  const client = useAppviewClient()
  return useInfiniteQuery<
    RsvpPage,
    Error,
    InfiniteData<RsvpPage>,
    QueryKey,
    string | undefined
  >({
    queryKey: [
      ...rsvpsQueryKey(uri ?? '', status ?? 'all'),
      section,
    ] as QueryKey,
    enabled: !!uri && enabled,
    staleTime: STALE.SECONDS.THIRTY,
    initialPageParam: undefined,
    getNextPageParam: page => page.cursor,
    queryFn: ({pageParam}) =>
      calendarXrpc<RsvpPage>(
        client,
        'community.blacksky.calendar.getEventRsvps',
        {event: uri!, status, section, limit: 50, cursor: pageParam},
      ),
  })
}

export function useMyEventsQuery(when: 'upcoming' | 'past', enabled = true) {
  const client = useAppviewClient()
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()
  return useInfiniteQuery<
    MyEventsPage,
    Error,
    InfiniteData<MyEventsPage>,
    ReturnType<typeof myEventsQueryKey>,
    string | undefined
  >({
    queryKey: myEventsQueryKey(currentAccount?.did ?? '', when),
    enabled: !!currentAccount && enabled,
    staleTime: STALE.SECONDS.THIRTY,
    initialPageParam: undefined,
    getNextPageParam: page => page.cursor,
    queryFn: async ({pageParam}) => {
      const page = await calendarXrpc<MyEventsPage>(
        client,
        'community.blacksky.calendar.getMyEvents',
        {when, limit: 25, cursor: pageParam},
      )
      for (const event of page.events) {
        // A cached entry may hold an RSVP the AppView hasn't indexed yet.
        if (queryClient.getQueryData(eventQueryKey(event.uri)) === undefined) {
          queryClient.setQueryData(eventQueryKey(event.uri), event)
        }
      }
      return page
    },
  })
}

/* Keys are [root, args, options], so only the root matches as a prefix. */
function markListsStale(queryClient: QueryClient) {
  void queryClient.invalidateQueries({
    queryKey: [RSVPS_KEY_ROOT],
    refetchType: 'none',
  })
  void queryClient.invalidateQueries({
    queryKey: [MY_EVENTS_KEY_ROOT],
    refetchType: 'none',
  })
}

export type RsvpChange = {
  status: RsvpStatus
  current?: {uri: string; status: string}
}

/**
 * Pressing the current status again removes the RSVP. `current` must be the
 * RSVP as rendered before the press, because the optimistic update overwrites
 * the cached one. The PDS result is written through without refetching, since
 * the AppView lags the write.
 */
export function useRsvpMutation(event: EventView) {
  const pdsClient = usePdsClient()
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()
  const queryKey = eventQueryKey(event.uri)

  return useMutation<
    {uri: string; status: RsvpStatus} | undefined,
    Error,
    RsvpChange,
    {prev?: EventView | null}
  >({
    mutationFn: async ({status, current}) => {
      if (!currentAccount) throw new Error('Not signed in')
      const repo = currentAccount.did
      /* The collection isn't in our generated lexicons, so the record helpers
       * key on the `$type` we pass rather than a typed schema. */
      if (current && current.status === status) {
        await pdsClient.deleteRecord(
          RSVP_COLLECTION,
          new AtUri(current.uri).rkey,
          {
            repo,
            service: null,
          },
        )
        return undefined
      }
      const record = {
        $type: RSVP_COLLECTION as `${string}.${string}.${string}`,
        subject: {uri: event.uri, cid: event.cid},
        status,
        createdAt: new Date().toISOString(),
      } satisfies TypedLexMap
      const res = current
        ? await pdsClient.putRecord(record, new AtUri(current.uri).rkey, {
            repo,
            service: null,
          })
        : await pdsClient.createRecord(record, undefined, {
            repo,
            service: null,
          })
      return {uri: res.body.uri, status}
    },
    onMutate: async ({status, current}) => {
      await queryClient.cancelQueries({queryKey})
      const prev = queryClient.getQueryData<EventView | null>(queryKey)
      const next =
        current?.status === status
          ? undefined
          : {uri: current?.uri ?? 'pending', status}
      queryClient.setQueryData(queryKey, applyRsvp(prev ?? event, next))
      return {prev}
    },
    onError: (_error, _change, context) => {
      queryClient.setQueryData(queryKey, context?.prev ?? event)
    },
    onSuccess: result => {
      const base = queryClient.getQueryData<EventView | null>(queryKey) ?? event
      queryClient.setQueryData(queryKey, {
        ...base,
        viewer: {...base.viewer, rsvp: result},
      })
      markListsStale(queryClient)
    },
  })
}

/**
 * Deletes the viewer's own event record. Other people's RSVPs live in their
 * repos and are left alone; without the event they no longer show anywhere.
 * The event's cached view is left for the caller to drop, so the open event
 * page doesn't flash "not found" while it's being left.
 */
export function useDeleteEventMutation() {
  const pdsClient = usePdsClient()
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async uri => {
      const {host: repo, rkey} = new AtUri(uri)
      await pdsClient.deleteRecord(EVENT_COLLECTION, rkey, {
        repo,
        service: null,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({queryKey: [MY_EVENTS_KEY_ROOT]})
    },
  })
}

/**
 * Rewrites the viewer's own event record. The edited view is cached straight
 * away, since the AppView only sees the change once it reaches the firehose.
 */
export function useUpdateEventMutation(event: EventView) {
  const pdsClient = usePdsClient()
  const queryClient = useQueryClient()
  return useMutation<{cid: string}, Error, Record<string, unknown>>({
    mutationFn: async record => {
      const {host: repo, rkey} = new AtUri(event.uri)
      const res = await pdsClient.putRecord(record as never, rkey, {
        repo,
        service: null,
      })
      return {cid: res.body.cid}
    },
    onSuccess: ({cid}, record) => {
      queryClient.setQueryData<EventView | null>(
        eventQueryKey(event.uri),
        prev => (prev ? {...prev, cid, record} : prev),
      )
      void queryClient.invalidateQueries({queryKey: [MY_EVENTS_KEY_ROOT]})
    },
  })
}
