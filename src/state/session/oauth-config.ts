/** Shared by clients, metadata generation, and the metadata HTTP handlers. */
export const DEFAULT_APPVIEW_AUDIENCE = 'did:web:api.bsky.app#bsky_appview'
export const DEFAULT_CHAT_AUDIENCE = 'did:web:api.bsky.chat#bsky_chat'
export const NATIVE_REDIRECT_URI = 'app.tennaparty:/auth/callback'

/** Keep the prod grant and client identity so stored sessions can refresh. */
export const OAUTH_SCOPE =
  'atproto transition:generic transition:email transition:chat.bsky'

export const OPTIONAL_OAUTH_SCOPES = {
  handle: 'identity:handle',
  email: 'account:email?action=manage',
} as const
export type OAuthPermission = keyof typeof OPTIONAL_OAUTH_SCOPES

/** Servers may normalize positional parameters or percent encoding. */
export function hasOAuthPermission(scope: string, permission: OAuthPermission) {
  const scopes = scope.split(' ')
  if (
    scopes.includes('transition:generic') &&
    (permission === 'handle' || scopes.includes('transition:email'))
  ) {
    return true
  }
  return scopes.some(value => {
    const [name, query] = value.split('?')
    const [resource, positional] = name.split(':')
    const params = new URLSearchParams(query)
    const attr =
      positional === undefined
        ? params.get('attr')
        : decodeURIComponent(positional)
    if (permission === 'handle')
      return resource === 'identity' && (attr === 'handle' || attr === '*')
    return (
      resource === 'account' &&
      attr === 'email' &&
      params.get('action') === 'manage'
    )
  })
}

/** PDS grants expand permission sets into their constituent RPC scopes. */
export function hasOAuthAppViewScope(scope: string, audience: string) {
  return scope.split(' ').some(value => {
    if (value === 'transition:generic') return true
    const [name, query] = value.split('?')
    const [resource, positional] = name.split(':')
    const params = new URLSearchParams(query)
    if (params.get('aud') !== audience && params.get('aud') !== '*') {
      return false
    }
    if (resource === 'include') {
      return positional === 'app.bsky.authFullApp'
    }
    const methods = positional
      ? [decodeURIComponent(positional)]
      : params.getAll('lxm')
    return (
      resource === 'rpc' &&
      (methods.includes('*') ||
        methods.includes('app.bsky.notification.listNotifications'))
    )
  })
}

/** Audiences and optional permissions no longer partition the production grant. */
export function buildOAuthScope(
  _appview = DEFAULT_APPVIEW_AUDIENCE,
  _chat = DEFAULT_CHAT_AUDIENCE,
  _permissions: OAuthPermission[] = [],
) {
  return OAUTH_SCOPE
}

export function createOAuthMetadata({
  baseUrl,
  clientName = 'tenna.party',
  native = false,
  appview = DEFAULT_APPVIEW_AUDIENCE,
  chat = DEFAULT_CHAT_AUDIENCE,
}: {
  baseUrl: string
  clientName?: string
  native?: boolean
  appview?: string
  chat?: string
}) {
  baseUrl = new URL(baseUrl).origin
  for (const audience of [appview, chat]) {
    if (
      !/^did:(plc:[a-z2-7]{24}|web:[A-Za-z0-9._:%-]+)#[A-Za-z0-9._-]+$/.test(
        audience,
      )
    ) {
      throw new Error('Invalid OAuth service audience')
    }
  }
  const clientId = new URL(
    native
      ? '/oauth-client-metadata-native.json'
      : '/oauth-client-metadata.json',
    baseUrl,
  )
  return {
    client_id: clientId.href,
    client_name: clientName,
    client_uri: baseUrl,
    redirect_uris: (native
      ? [NATIVE_REDIRECT_URI, ANDROID_REDIRECT_URI]
      : [`${baseUrl}/auth/web/callback`]) as [string, ...string[]],
    scope: buildOAuthScope(appview, chat, ['handle', 'email']),
    token_endpoint_auth_method: 'none' as const,
    response_types: ['code'] as ['code'],
    grant_types: ['authorization_code', 'refresh_token'] as [
      'authorization_code',
      'refresh_token',
    ],
    application_type: native ? ('native' as const) : ('web' as const),
    dpop_bound_access_tokens: true as const,
  }
}

/** The browser SDK signals successful popup handoff with this control-flow error. */
export function isOAuthPopupComplete(error: unknown) {
  return (
    error instanceof Error &&
    'code' in error &&
    error.code === 'LOGIN_CONTINUED_IN_PARENT_WINDOW'
  )
}
