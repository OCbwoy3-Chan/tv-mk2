import {CHAT_PROXY_SERVICE} from '#/lib/constants'
import {readAppViewProxy} from '#/state/preferences/custom-appview-did'
import {buildOAuthScope, type OAuthPermission} from './oauth-config'

export function getOAuthAudiences() {
  return {
    appview: readAppViewProxy(),
    chat: CHAT_PROXY_SERVICE,
  }
}

export function getOAuthScope(permissions: OAuthPermission[] = []) {
  const {appview, chat} = getOAuthAudiences()
  return buildOAuthScope(appview, chat, permissions)
}
