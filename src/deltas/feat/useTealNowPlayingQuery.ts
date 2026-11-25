import { useIsFocused } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { useSlingshotInstance } from '#/state/preferences/slingshot-instance'
import { STALE } from '#/state/queries'
import { createQueryKey } from '#/state/queries/util'
import {cleanMusicName} from '#/deltas/feat/cleanMusicName'
import { useDeltasPreferences } from '#/deltas/preferences'

const statusSchema = z.object({
  time: z.string().datetime({ offset: true }),
  expiry: z.string().datetime({ offset: true }).optional(),
  item: z.object({
    trackName: z.string().min(1),
    releaseName: z.string().optional(),
    artists: z.array(z.object({ artistName: z.string().min(1) })),
  }),
})

const useTealNowPlayingQueryRoot = 'tealNowPlaying'

export function useTealNowPlayingQuery(did: string) {
  const service = useSlingshotInstance()
  const focused = useIsFocused()
  const { showTealNowPlaying } = useDeltasPreferences()

  return useQuery({
    queryKey: createQueryKey(useTealNowPlayingQueryRoot, { did, service }),
    enabled: showTealNowPlaying && focused && !!did,
    staleTime: STALE.SECONDS.FIFTEEN,
    refetchInterval: focused ? STALE.SECONDS.FIFTEEN : false,
    retry: false,
    queryFn: async ({ signal }) => {
      const url = new URL('/xrpc/com.atproto.repo.getRecord', service)
      url.searchParams.set('repo', did)
      url.searchParams.set('collection', 'fm.teal.actor.status')
      url.searchParams.set('rkey', 'self')
      const response = await fetch(url.toString(), {
        signal,
        headers: { accept: 'application/json' },
      })
      const body = (await response.json()) as {
        error?: unknown
        value?: unknown
      }
      if (!response.ok) {
        if (body.error === 'RecordNotFound') return null
        throw new Error(`Teal status lookup failed: ${response.status}`)
      }
      const parsed = statusSchema.safeParse(body.value)
      if (!parsed.success) return null
      const record = parsed.data
      const time = Date.parse(record.time)
      const expiresAt = Math.min(
        record.expiry ? Date.parse(record.expiry) : time + 10 * 60_000,
        time + 3 * 60 * 60_000,
      )
      if (expiresAt <= Date.now()) return null
      return {
        time,
        expiresAt,
        trackName: cleanMusicName(record.item.trackName, 'track'),
        artists: record.item.artists.map(artist =>
          cleanMusicName(artist.artistName, 'artist'),
        ),
        releaseName: record.item.releaseName
          ? cleanMusicName(record.item.releaseName, 'album')
          : undefined,
      }
    },
  })
}
