export const THEME_COLLECTION = 'app.witchsky.theme.colors'
export const SAVED_THEME_COLLECTION = 'app.witchsky.theme.saved'
export const THEME_GROUP_COLLECTION = 'app.witchsky.theme.collection'
export const THEME_GROUP_ITEM_COLLECTION = 'app.witchsky.theme.collectionitem'
export const THEME_DEFS = 'app.witchsky.theme.defs'
export const MATERIAL_YOU_SPECIAL = `${THEME_DEFS}#materialYou` as const
export const HUE_SPECIAL = `${THEME_DEFS}#hue` as const

/** Stable TID-keyed record; its collection items can change independently. */
export const FEATURED_THEME_COLLECTION_URI = `at://witchsky.app/${THEME_GROUP_COLLECTION}/3mu4wp2pxkc2q`
export const BLUESKY_FORKS_THEME_COLLECTION_URI = `at://witchsky.app/${THEME_GROUP_COLLECTION}/3munq7ft6g522`

export type ThemeMode = 'light' | 'dark'
export type ThemeSelectionMode = ThemeMode | 'system'

/**
 * Remote collections shown on each theme gallery. Add an AT URI to either
 * list to feature that collection only on the corresponding mode's screen.
 * The same collection may appear in both lists; records are filtered by mode.
 */
export const FEATURED_THEME_COLLECTION_URIS: Record<
  ThemeMode,
  readonly string[]
> = {
  light: [FEATURED_THEME_COLLECTION_URI, BLUESKY_FORKS_THEME_COLLECTION_URI],
  dark: [FEATURED_THEME_COLLECTION_URI, BLUESKY_FORKS_THEME_COLLECTION_URI],
}

/** Semantic roles intentionally describe UI usage instead of palette math. */
export type SemanticColors = {
  canvas: string
  surface: string
  surfaceRaised: string
  text: string
  textMuted: string
  border: string
  accent: string
  accentSoft: string
  onAccent: string
  positive: string
  warning: string
  critical: string
  favorite: string
}

export type ThemeColorSet = {
  name: string
  colors: SemanticColors
}

export type ThemeVariant = {
  name: string
  colors?: Partial<SemanticColors>
}

export type MaterialYouSpecial = {
  $type: typeof MATERIAL_YOU_SPECIAL
  accent: string
}

export type HueSpecial = {
  $type: typeof HUE_SPECIAL
}

export type ThemeSpecial =
  | MaterialYouSpecial
  | HueSpecial
  | ({$type: string} & Record<string, unknown>)

export type ThemeRecord = {
  $type?: typeof THEME_COLLECTION
  name: string
  description?: string
  mode: ThemeMode
  recommendedPair?: string
  base: ThemeColorSet
  variants?: ThemeVariant[]
  special?: ThemeSpecial
  createdAt: string
  updatedAt?: string
}

export type ThemeView = {
  uri: string
  cid: string
  author: string
  record: ThemeRecord
  source: 'saved' | 'own' | 'featured' | 'builtin'
  savedRecordUri?: string
}

export type ThemeCollectionView = {
  uri: string
  name: string
  description?: string
  themes: ThemeView[]
}

export type SavedThemeRecord = {
  $type?: typeof SAVED_THEME_COLLECTION
  subject: {uri: string; cid: string}
  snapshot: ThemeRecord
  createdAt: string
}

export type ThemeCollectionRecord = {
  $type?: typeof THEME_GROUP_COLLECTION
  name: string
  description?: string
  createdAt: string
}

export type ThemeCollectionItemRecord = {
  $type?: typeof THEME_GROUP_ITEM_COLLECTION
  subject: {uri: string; cid: string}
  collection: string
  createdAt: string
}

export type ActiveTheme = {
  light: ActiveThemeSelection
  dark: ActiveThemeSelection
}

export type ActiveThemeSelection = {
  uri: string
  cid: string
  author: string
  record: ThemeRecord
  colorSet: string
  hue?: number
}

export function getColorSet(record: ThemeRecord, preferredName?: string) {
  const sets = getColorSets(record)
  return sets.find(set => set.name === preferredName) ?? sets[0]
}

export function getColorSets(record: ThemeRecord): ThemeColorSet[] {
  return [
    record.base,
    ...(record.variants ?? []).map(variant => ({
      name: variant.name,
      colors: {...record.base.colors, ...variant.colors},
    })),
  ]
}

export function themeColorsChanged(before: ThemeRecord, after: ThemeRecord) {
  const a = getColorSets(before)
  const b = getColorSets(after)
  if (a.length !== b.length) return true
  return a.some((set, index) => {
    const next = b[index]
    return (
      !next ||
      Object.keys(set.colors).some(
        key =>
          set.colors[key as keyof SemanticColors] !==
          next.colors[key as keyof SemanticColors],
      )
    )
  })
}

export function isSupportedTheme(record: ThemeRecord) {
  return !record.special || isMaterialYouTheme(record) || isHueTheme(record)
}

export function isMaterialYouTheme(
  record: ThemeRecord,
): record is ThemeRecord & {special: MaterialYouSpecial} {
  return (
    record.special?.$type === MATERIAL_YOU_SPECIAL &&
    typeof record.special.accent === 'string'
  )
}

export function isHueTheme(
  record: ThemeRecord,
): record is ThemeRecord & {special: HueSpecial} {
  return record.special?.$type === HUE_SPECIAL
}

export function activeThemeSelection(active: ActiveTheme, mode: ThemeMode) {
  return active[mode]
}

export function themeRkey(uri: string) {
  return uri.split('/').pop() ?? ''
}

export function themeAuthor(uri: string) {
  return uri.startsWith('at://') ? uri.slice(5).split('/')[0] : ''
}

export function themeWebPath(author: string, rkey: string) {
  return `/profile/${author}/theme/${rkey}`
}
