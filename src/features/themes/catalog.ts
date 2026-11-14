import {type ActiveTheme, type ThemeRecord, type ThemeView} from './types'

const createdAt = '2026-08-18T00:00:00.000Z'
const themeCollection = 'app.witchsky.theme.colors'
const witchskyDid = 'did:plc:nstiflhvn4dywu5xlwq5wp4v'

export const WITCHSKY_THEME: ThemeRecord = {
  $type: themeCollection,
  name: 'Witchsky',
  description: 'Warm, magical colors designed for Witchsky.',
  mode: 'light',
  recommendedPair: `at://${witchskyDid}/${themeCollection}/3mug7d56zc42i`,
  createdAt,
  base: {
    name: 'Moonmilk',
    colors: {
      canvas: '#fefbfb',
      surface: '#f5f2f1',
      surfaceRaised: '#ffffff',
      text: '#281c1c',
      textMuted: '#755f57',
      border: '#d0cbc9',
      accent: '#ed5345',
      accentSoft: '#f8d8d4',
      onAccent: '#ffffff',
      positive: '#09b35e',
      warning: '#d89200',
      critical: '#e91646',
      favorite: '#dd5e8f',
    },
  },
}

export const WITCHSKY_DARK_THEME: ThemeRecord = {
  $type: themeCollection,
  name: 'Witchsky Dark',
  description: 'Warm, magical colors designed for Witchsky after dark.',
  mode: 'dark',
  recommendedPair: `at://${witchskyDid}/${themeCollection}/3mug7d56zc32i`,
  createdAt,
  base: {
    name: 'Coven',
    colors: {
      canvas: '#281c1c',
      surface: '#2f201f',
      surfaceRaised: '#3e2b21',
      text: '#fefbfb',
      textMuted: '#c0bbb9',
      border: '#624c43',
      accent: '#ed5345',
      accentSoft: '#431d19',
      onAccent: '#fefbfb',
      positive: '#0ac266',
      warning: '#ffc404',
      critical: '#eb2452',
      favorite: '#dd5e8f',
    },
  },
  variants: [
    {
      name: 'Midnight',
      colors: {
        canvas: '#150b08',
        surface: '#2a1a15',
        positive: '#09b35e',
        critical: '#e91646',
      },
    },
  ],
}

function fallback(record: ThemeRecord, rkey: string, cid: string): ThemeView {
  return {
    uri: `at://${witchskyDid}/${themeCollection}/${rkey}`,
    cid,
    author: 'witchsky.app',
    record,
    source: 'builtin',
  }
}

/** Used only when the remotely managed featured collection is unavailable. */
export const FEATURED_THEMES = [
  fallback(
    WITCHSKY_THEME,
    '3mug7d56zc32i',
    'bafyreiecuisoynzapf4u3qxezl3tpnsd6q7mgbsi7tttsfvnv5rb5k66wa',
  ),
  fallback(
    WITCHSKY_DARK_THEME,
    '3mug7d56zc42i',
    'bafyreifxzld23aw5pt3qkyp3af5mvzkleity3ldotxglk5g4uvvsleq7re',
  ),
]

export const DEFAULT_ACTIVE_THEME: ActiveTheme = {
  light: {
    uri: 'at://did:plc:7itw3e5v6xxe6aoo4s3upfbe/app.witchsky.theme.colors/3mx7yczhnmc2k',
    cid: 'bafyreidp2zh6qvgpwhs7rmy5w2j2dr7llwtibleptfvjx4s6suuzufahxm',
    author: 'hiijax.net',
    record: {
      $type: 'app.witchsky.theme.colors',
      base: {
        colors: {
          accent: '#aa5edd',
          accentSoft: '#622e85',
          border: '#cdc9d0',
          canvas: '#f7f5fa',
          critical: '#e91646',
          favorite: '#dd5e8f',
          onAccent: '#ffffff',
          positive: '#09b35e',
          surface: '#efeaf6',
          surfaceRaised: '#ffffff',
          text: '#291b32',
          textMuted: '#4f4158',
          warning: '#d89200',
        },
        name: 'Asperitas',
      },
      createdAt: '2026-10-06T17:41:14.211Z',
      description: 'protogen.nexus',
      mode: 'light',
      name: 'Protogen Asperitas',
      recommendedPair: 'at://did:plc:7itw3e5v6xxe6aoo4s3upfbe/app.witchsky.theme.colors/3mx7xljzi322l',
      updatedAt: '2026-10-06T17:52:33.803Z',
    },
    colorSet: 'Asperitas',
  },
  dark: {
    uri: 'at://did:plc:7itw3e5v6xxe6aoo4s3upfbe/app.witchsky.theme.colors/3mx7xljzi322l',
    cid: 'bafyreiclmw5rzvqqljt2sfvevqghim2it26nafaj45u5kuujjd33fo4pqy',
    author: 'hiijax.net',
    record: {
      $type: 'app.witchsky.theme.colors',
      base: {
        colors: {
          accent: '#aa5edd',
          accentSoft: '#622e85',
          border: '#40364e',
          canvas: '#201b27',
          critical: '#eb2452',
          favorite: '#dd5e8f',
          onAccent: '#fefbfb',
          positive: '#0ac266',
          surface: '#161419',
          surfaceRaised: '#2b2537',
          text: '#fefbfb',
          textMuted: '#c0bbb9',
          warning: '#ffc404',
        },
        name: 'Umbral',
      },
      createdAt: '2026-10-06T17:15:38.061Z',
      description: 'protogen.nexus',
      mode: 'dark',
      name: 'Protogen Umbral',
      recommendedPair: 'at://did:plc:7itw3e5v6xxe6aoo4s3upfbe/app.witchsky.theme.colors/3mx7yczhnmc2k',
      updatedAt: '2026-10-06T18:02:20.928Z',
      variants: [],
    },
    colorSet: 'Umbral',
  },
}
