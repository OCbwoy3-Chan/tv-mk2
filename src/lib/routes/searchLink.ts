import {isValidAtIdentifier, isValidRecordKey} from '@atproto/syntax'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {THEME_COLLECTION} from '#/features/themes/types'

type SearchLinkScreen =
  | 'Profile'
  | 'PostThread'
  | 'CustomFeed'
  | 'ProfileList'
  | 'StarterPack'
  | 'StarterPackShort'
  | 'Theme'

type SearchLink = {
  [Screen in SearchLinkScreen]: {
    screen: Screen
    params: CommonNavigatorParams[Screen]
  }
}[SearchLinkScreen]

/** Parses content links without treating other clients as trusted app origins. */
export function parseSearchLink(input: string): SearchLink | undefined {
  const text = input.trim()
  if (/\s/.test(text)) return

  try {
    if (text.startsWith('at://')) return parseAtUri(text)

    const url = new URL(text)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return
    if (url.username || url.password) return

    const path = decodeURIComponent(url.pathname).replace(/\/$/, '')
    if (path.startsWith('/at://')) return parseAtUri(path.slice(1))
    // PDSls also exposes repositories and records under /at/<identifier>.
    if (url.hostname === 'pds.ls' && path.startsWith('/at/')) {
      return parseAtUri(`at://${path.slice(4)}`)
    }

    const parts = path.slice(1).split('/')
    if (
      url.hostname === 'go.bsky.app' &&
      parts.length === 1 &&
      /^[a-zA-Z0-9]+$/.test(parts[0])
    ) {
      return {screen: 'StarterPackShort', params: {code: parts[0]}}
    }

    const [prefix, name, kind, rkey] = parts
    if (!isValidAtIdentifier(name)) return
    if (prefix === 'profile') {
      if (parts.length === 2) return {screen: 'Profile', params: {name}}
      if (parts.length !== 4 || !isValidRecordKey(rkey)) return
      switch (kind) {
        case 'theme':
          return {screen: 'Theme', params: {name, rkey}}
        case 'post':
          return {screen: 'PostThread', params: {name, rkey}}
        case 'feed':
          return {screen: 'CustomFeed', params: {name, rkey}}
        case 'lists':
          return {screen: 'ProfileList', params: {name, rkey}}
      }
    }
    if (
      (prefix === 'start' || prefix === 'starter-pack') &&
      parts.length === 3 &&
      isValidRecordKey(kind)
    ) {
      return {screen: 'StarterPack', params: {name, rkey: kind}}
    }
  } catch {
    // Malformed links remain ordinary search queries.
  }
}

/** Maps supported records to the screens that fetch and display them. */
function parseAtUri(uri: string): SearchLink | undefined {
  const parts = uri.slice('at://'.length).replace(/\/$/, '').split('/')
  const [name, collection, rkey] = parts
  if (!isValidAtIdentifier(name)) return
  if (parts.length === 1) return {screen: 'Profile', params: {name}}
  if (parts.length !== 3 || !isValidRecordKey(rkey)) return

  switch (collection) {
    case THEME_COLLECTION:
      return {screen: 'Theme', params: {name, rkey}}
    case 'app.bsky.actor.profile':
    case 'app.bsky.labeler.service':
      if (rkey === 'self') return {screen: 'Profile', params: {name}}
      return
    case 'app.bsky.feed.post':
      return {screen: 'PostThread', params: {name, rkey}}
    case 'app.bsky.feed.generator':
      return {screen: 'CustomFeed', params: {name, rkey}}
    case 'app.bsky.graph.list':
      return {screen: 'ProfileList', params: {name, rkey}}
    case 'app.bsky.graph.starterpack':
      return {screen: 'StarterPack', params: {name, rkey}}
  }
}
