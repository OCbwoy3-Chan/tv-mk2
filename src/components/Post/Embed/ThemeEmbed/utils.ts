import {type AppBskyEmbedExternal, AtUri} from '@atproto/api'

import {THEME_COLLECTION} from '#/features/themes/types'
import {parseThemeUrl} from '#/features/themes/urls'

export function getThemeEmbedRoute(view: AppBskyEmbedExternal.ViewExternal) {
  const ref = view.associatedRefs?.find(item => {
    try {
      const collection = new AtUri(item.uri).collection
      return collection === THEME_COLLECTION
    } catch {
      return false
    }
  })
  if (ref) {
    const uri = new AtUri(ref.uri)
    return {name: uri.hostname, rkey: uri.rkey}
  }
  return parseThemeUrl(view.uri)
}

export function isThemeEmbed(view: AppBskyEmbedExternal.ViewExternal) {
  return Boolean(getThemeEmbedRoute(view))
}
