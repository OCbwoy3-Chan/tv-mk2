import {useCallback, useEffect, useState} from 'react'
import {AtUri} from '@atproto/api'
import {TID} from '@atproto/common-web'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {useConstellationInstance} from '#/state/preferences/constellation-instance'
import {useSlingshotInstance} from '#/state/preferences/slingshot-instance'
import {useAgent, useSession} from '#/state/session'
import {pdsAgent} from '#/state/session/agent'
import {useSetThemePrefs, useThemePrefs} from '#/state/shell'
import {useMaterialYouPalette} from '#/alf/util/materialYou'
import {IS_WEB} from '#/env'
import {DEFAULT_ACTIVE_THEME, FEATURED_THEMES} from './catalog'
import {materialYouStyleForSet, resolveMaterialYouRecord} from './materialYou'
import {
  type ActiveTheme,
  FEATURED_THEME_COLLECTION_URIS,
  getColorSets,
  isHueTheme,
  isMaterialYouTheme,
  isSupportedTheme,
  SAVED_THEME_COLLECTION,
  type SavedThemeRecord,
  THEME_COLLECTION,
  THEME_GROUP_COLLECTION,
  THEME_GROUP_ITEM_COLLECTION,
  themeAuthor,
  type ThemeCollectionItemRecord,
  type ThemeCollectionRecord,
  type ThemeCollectionView,
  themeColorsChanged,
  type ThemeMode,
  type ThemeRecord,
  type ThemeView,
} from './types'

type RepoRecord = {uri: string; cid: string; value: unknown}
type ThemeAgent = ReturnType<typeof useAgent>

async function getPublicRecord(
  slingshot: string,
  params: {repo: string; collection: string; rkey: string},
) {
  const url = new URL('/xrpc/com.atproto.repo.getRecord', slingshot)
  url.searchParams.set('repo', params.repo)
  url.searchParams.set('collection', params.collection)
  url.searchParams.set('rkey', params.rkey)
  const response = await fetch(url, {headers: {accept: 'application/json'}})
  if (!response.ok) {
    throw new Error(`Slingshot getRecord failed: ${response.status}`)
  }
  const data = (await response.json()) as RepoRecord
  return {data}
}

async function listCollectionItemLinks(
  constellation: string,
  collectionUri: string,
) {
  const links: Array<{did: string; collection: string; rkey: string}> = []
  let cursor: string | null = null
  do {
    const url = new URL('/links', constellation)
    url.searchParams.set('target', collectionUri)
    url.searchParams.set('collection', THEME_GROUP_ITEM_COLLECTION)
    url.searchParams.set('path', '.collection')
    if (cursor) url.searchParams.set('cursor', cursor)
    const response = await fetch(url, {headers: {accept: 'application/json'}})
    if (!response.ok) {
      throw new Error(`Constellation links failed: ${response.status}`)
    }
    const data = (await response.json()) as {
      linking_records?: Array<{did: string; collection: string; rkey: string}>
      cursor?: string | null
    }
    links.push(...(data.linking_records ?? []))
    cursor = data.cursor ?? null
  } while (cursor)
  return links
}

function isThemeRecord(value: unknown): value is ThemeRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<ThemeRecord>
  return (
    typeof record.name === 'string' &&
    (record.mode === 'light' || record.mode === 'dark') &&
    Boolean(record.base?.name) &&
    Boolean(record.base?.colors)
  )
}

function isSavedThemeRecord(value: unknown): value is SavedThemeRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<SavedThemeRecord>
  return Boolean(record.subject?.uri && isThemeRecord(record.snapshot))
}

function isThemeCollectionRecord(
  value: unknown,
): value is ThemeCollectionRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<ThemeCollectionRecord>
  return typeof record.name === 'string' && typeof record.createdAt === 'string'
}

function isThemeCollectionItemRecord(
  value: unknown,
): value is ThemeCollectionItemRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<ThemeCollectionItemRecord>
  return Boolean(
    record.subject?.uri &&
    record.subject.cid &&
    record.collection &&
    record.createdAt,
  )
}

async function getTheme(
  slingshot: string,
  repo: string,
  rkey: string,
  collections = [THEME_COLLECTION],
): Promise<ThemeView> {
  let lastError: unknown
  for (const collection of collections) {
    try {
      const response = await getPublicRecord(slingshot, {
        repo,
        collection,
        rkey,
      })
      if (
        !isThemeRecord(response.data.value) ||
        !isSupportedTheme(response.data.value)
      ) {
        throw new Error('Invalid or unsupported theme')
      }
      return {
        uri: response.data.uri,
        cid: response.data.cid,
        author: repo,
        record: response.data.value,
        source: 'own',
      }
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Theme not found')
}

async function getFeaturedThemesFromCollection(
  slingshot: string,
  constellation: string,
  collectionUri: string,
  modes: ReadonlySet<ThemeMode>,
): Promise<ThemeCollectionView> {
  const collection = new AtUri(collectionUri)
  const collectionResponse = await getPublicRecord(slingshot, {
    repo: collection.hostname,
    collection: THEME_GROUP_COLLECTION,
    rkey: collection.rkey,
  })
  if (!isThemeCollectionRecord(collectionResponse.data.value)) {
    throw new Error('Invalid theme collection')
  }
  const canonicalCollectionUri = collectionResponse.data.uri
  const itemLinks = await listCollectionItemLinks(
    constellation,
    canonicalCollectionUri,
  )
  const itemRecords = await Promise.all(
    itemLinks.map(link =>
      getPublicRecord(slingshot, {
        repo: link.did,
        collection: link.collection,
        rkey: link.rkey,
      }).then(response => response.data),
    ),
  )
  const items = itemRecords
    .filter(item => isThemeCollectionItemRecord(item.value))
    .map(item => item.value as ThemeCollectionItemRecord)
    .filter(
      item =>
        item.collection === collectionUri ||
        item.collection === canonicalCollectionUri,
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  const themes = await Promise.all(
    items.map(async item => {
      try {
        const subject = new AtUri(item.subject.uri)
        if (subject.collection !== THEME_COLLECTION) {
          return
        }
        const theme = await getTheme(
          slingshot,
          subject.hostname,
          subject.rkey,
          [subject.collection],
        )
        if (!modes.has(theme.record.mode)) {
          return
        }
        return {...theme, source: 'featured' as const}
      } catch {
        return
      }
    }),
  )
  const seen = new Set<string>()
  const uniqueThemes: ThemeView[] = []
  for (const theme of themes) {
    if (!theme || seen.has(theme.uri)) continue
    seen.add(theme.uri)
    uniqueThemes.push(theme)
  }
  return {
    uri: collectionUri,
    name: collectionResponse.data.value.name,
    description: collectionResponse.data.value.description,
    themes: uniqueThemes,
  }
}

async function getFeaturedThemeCollections(
  slingshot: string,
  constellation: string,
): Promise<ThemeCollectionView[]> {
  const collections = new Map<string, Set<ThemeMode>>()
  for (const mode of ['light', 'dark'] as const) {
    for (const uri of FEATURED_THEME_COLLECTION_URIS[mode]) {
      const modes = collections.get(uri) ?? new Set<ThemeMode>()
      modes.add(mode)
      collections.set(uri, modes)
    }
  }

  const results = await Promise.all(
    [...collections].map(([uri, modes]) =>
      getFeaturedThemesFromCollection(
        slingshot,
        constellation,
        uri,
        modes,
      ).catch(() => undefined),
    ),
  )
  return results.filter((collection): collection is ThemeCollectionView =>
    Boolean(collection),
  )
}

async function listRecords(
  agent: ThemeAgent,
  repo: string,
  collection: string,
) {
  try {
    const response = await agent.com.atproto.repo.listRecords({
      repo,
      collection,
      limit: 100,
      reverse: true,
    })
    return response.data.records as RepoRecord[]
  } catch {
    return []
  }
}

export function useThemeRecord(repo?: string, rkey?: string) {
  const slingshot = useSlingshotInstance()
  return useQuery({
    queryKey: ['witchsky-theme', slingshot, repo, rkey],
    enabled: Boolean(repo && rkey),
    queryFn: () => getTheme(slingshot, repo!, rkey!),
  })
}

export function useThemeLibrary() {
  const agent = useAgent()
  const {currentAccount} = useSession()
  const slingshot = useSlingshotInstance()
  const constellation = useConstellationInstance()

  return useQuery({
    // Keep the transport version in the key so an older fallback-only result
    // is not retained across an app update.
    queryKey: [
      'witchsky-theme-library',
      'slingshot-v1',
      slingshot,
      constellation,
      currentAccount?.did,
    ],
    queryFn: async () => {
      const repo = currentAccount?.did
      const [remoteCollections, themes, saved] = await Promise.all([
        getFeaturedThemeCollections(slingshot, constellation),
        repo ? listRecords(agent, repo, THEME_COLLECTION) : [],
        repo ? listRecords(agent, repo, SAVED_THEME_COLLECTION) : [],
      ])
      const own: ThemeView[] = themes
        .filter(item => isThemeRecord(item.value))
        .filter(item => isSupportedTheme(item.value as ThemeRecord))
        .map(item => ({
          uri: item.uri,
          cid: item.cid,
          author: repo!,
          record: item.value as ThemeRecord,
          source: 'own',
        }))
      const savedThemes: ThemeView[] = saved
        .filter(item => isSavedThemeRecord(item.value))
        .filter(item =>
          isSupportedTheme((item.value as SavedThemeRecord).snapshot),
        )
        .map(item => {
          const value = item.value as SavedThemeRecord
          return {
            uri: value.subject.uri,
            cid: value.subject.cid,
            author: themeAuthor(value.subject.uri),
            record: value.snapshot,
            source: 'saved',
            savedRecordUri: item.uri,
          }
        })
      const seen = new Set<string>()
      const uniqueSavedThemes = savedThemes.filter(theme => {
        if (seen.has(theme.uri)) return false
        seen.add(theme.uri)
        return true
      })
      const featuredCollections = remoteCollections.length
        ? remoteCollections
        : [
            {
              uri: FEATURED_THEME_COLLECTION_URIS.light[0],
              name: 'Featured themes',
              themes: FEATURED_THEMES,
            },
          ]
      return {
        own,
        saved: uniqueSavedThemes,
        featuredCollections,
        featured: featuredCollections.flatMap(collection => collection.themes),
      }
    },
  })
}

export function usePublishTheme() {
  const agent = useAgent()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      record,
      rkey,
    }: {
      record: ThemeRecord
      rkey?: string
    }) => {
      const result = await pdsAgent(agent).com.atproto.repo.putRecord({
        repo: agent.assertDid,
        collection: THEME_COLLECTION,
        rkey: rkey ?? TID.nextStr(),
        record,
        validate: false,
      })
      return result.data
    },
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: ['witchsky-theme-library']}),
  })
}

export function useSaveTheme() {
  const agent = useAgent()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (theme: ThemeView) => {
      const saved = await listRecords(
        agent,
        agent.assertDid,
        SAVED_THEME_COLLECTION,
      )
      const existing = saved.find(item => {
        const value = item.value as Partial<SavedThemeRecord>
        return value.subject?.uri === theme.uri
      })
      const existingUri = existing ? new AtUri(existing.uri) : undefined
      const record: SavedThemeRecord = {
        $type: SAVED_THEME_COLLECTION,
        subject: {uri: theme.uri, cid: theme.cid},
        snapshot: theme.record,
        createdAt: new Date().toISOString(),
      }
      return pdsAgent(agent).com.atproto.repo.putRecord({
        repo: agent.assertDid,
        collection: SAVED_THEME_COLLECTION,
        rkey: existingUri?.rkey ?? TID.nextStr(),
        record,
        validate: false,
      })
    },
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: ['witchsky-theme-library']}),
  })
}

export function useApplyTheme() {
  const agent = useAgent()
  const {currentAccount} = useSession()
  const materialPalette = useMaterialYouPalette()
  const {activeTheme, material3Accent} = useThemePrefs()
  const {setActiveTheme, setHue, setMaterial3Accent, setMaterial3Style} =
    useSetThemePrefs()
  const saveTheme = useSaveTheme()
  const slingshot = useSlingshotInstance()

  return useCallback(
    (
      theme: ThemeView,
      colorSet = getColorSets(theme.record)[0]?.name,
      hue = 0,
    ) => {
      if (!colorSet) return
      if (isMaterialYouTheme(theme.record)) {
        const style = materialYouStyleForSet(colorSet)
        setMaterial3Accent(theme.record.special.accent)
        if (style) setMaterial3Style(style)
      }
      if (!isHueTheme(theme.record)) setHue(0)
      const previous = activeTheme ?? DEFAULT_ACTIVE_THEME
      setActiveTheme({
        ...previous,
        [theme.record.mode]: {
          ...theme,
          colorSet,
          hue: isHueTheme(theme.record) ? hue : undefined,
        },
      })
      if (currentAccount) {
        saveTheme.mutate(theme)
        const pairUri = theme.record.recommendedPair
        const pairAccent = isMaterialYouTheme(theme.record)
          ? theme.record.special.accent
          : material3Accent
        const savePair = (pair: ThemeView) =>
          saveTheme.mutate({
            ...pair,
            record: resolveMaterialYouRecord(
              pair.record,
              materialPalette,
              pairAccent,
              IS_WEB,
            ),
          })
        if (pairUri) {
          void (async () => {
            try {
              const builtin = FEATURED_THEMES.find(item => item.uri === pairUri)
              if (builtin) {
                savePair(builtin)
                return
              }
              const parsed = new AtUri(pairUri)
              if (parsed.collection !== THEME_COLLECTION) {
                return
              }
              const pair = await getTheme(
                slingshot,
                parsed.hostname,
                parsed.rkey,
                [parsed.collection],
              )
              savePair(pair)
            } catch {}
          })()
        }
      }
    },
    [
      activeTheme,
      agent,
      currentAccount,
      material3Accent,
      materialPalette,
      saveTheme,
      setActiveTheme,
      setHue,
      setMaterial3Accent,
      setMaterial3Style,
      slingshot,
    ],
  )
}

export function useUnsaveTheme() {
  const agent = useAgent()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (savedRecordUri: string) =>
      pdsAgent(agent).com.atproto.repo.deleteRecord({
        repo: agent.assertDid,
        collection: new AtUri(savedRecordUri).collection,
        rkey: new AtUri(savedRecordUri).rkey,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: ['witchsky-theme-library']}),
  })
}

/** Polls only the active upstream record and reports a CID mismatch. */
export function useThemeUpdate(active?: ActiveTheme['light']) {
  const slingshot = useSlingshotInstance()
  const [update, setUpdate] = useState<ThemeView>()
  useEffect(() => {
    if (!active?.uri.startsWith('at://') || active.cid.startsWith('builtin-')) {
      setUpdate(undefined)
      return
    }
    setUpdate(undefined)
    let cancelled = false
    const parsed = new AtUri(active.uri)
    const check = async () => {
      try {
        const response = await getPublicRecord(slingshot, {
          repo: parsed.hostname,
          collection: parsed.collection,
          rkey: parsed.rkey,
        })
        if (
          !cancelled &&
          response.data.cid &&
          response.data.cid !== active.cid &&
          isThemeRecord(response.data.value) &&
          themeColorsChanged(active.record, response.data.value)
        ) {
          setUpdate({
            uri: response.data.uri,
            cid: response.data.cid,
            author: parsed.hostname,
            record: response.data.value,
            source: 'saved',
          })
        } else if (!cancelled) {
          setUpdate(undefined)
        }
      } catch {
        /* The saved snapshot remains usable while its upstream is unavailable. */
      }
    }
    void check()
    const interval = setInterval(() => void check(), 5 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [active, slingshot])
  return update
}

export function useActiveThemeUpdate(active?: ActiveTheme):
  | {
      mode: ThemeMode
      theme: ThemeView
    }
  | undefined {
  const light = useThemeUpdate(active?.light)
  const dark = useThemeUpdate(active?.dark)
  return light
    ? {mode: 'light', theme: light}
    : dark
      ? {mode: 'dark', theme: dark}
      : undefined
}
