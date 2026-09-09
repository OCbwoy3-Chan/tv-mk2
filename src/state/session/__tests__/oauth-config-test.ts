import {
  buildOAuthScope,
  createOAuthMetadata,
  DEFAULT_APPVIEW_AUDIENCE,
  hasOAuthAppViewScope,
  hasOAuthPermission,
  OPTIONAL_OAUTH_SCOPES,
} from '../oauth-config'

describe('OAuth permission configuration', () => {
  it('identifies Tenna Party and grants its push and private-reader calls', () => {
    const metadata = createOAuthMetadata({baseUrl: 'https://tenna.party'})
    expect(metadata.client_name).toBe('tenna.party')
    expect(metadata.client_id).toBe('https://tenna.party/oauth-client-metadata.json')
    expect(metadata.scope.split(' ')).toContain('rpc:party.tenna.private.getPost?aud=*')
    expect(metadata.scope.split(' ')).toContain(
      'rpc:party.tenna.private.privateVesselPermissions?aud=*',
    )
    expect(metadata.scope.split(' ')).toContain(`rpc:app.bsky.notification.registerPush?aud=${encodeURIComponent('did:web:push.tenna.party#bsky_notif')}`)
  })
  it('requests app permission sets without account-management access', () => {
    const scopes = buildOAuthScope().split(' ')
    expect(scopes).toContain(
      `include:app.bsky.authFullApp?aud=${encodeURIComponent(DEFAULT_APPVIEW_AUDIENCE)}`,
    )
    expect(scopes).toContain('include:app.witchsky.theme.authFull')
    expect(scopes.some(scope => scope.startsWith('transition:'))).toBe(false)
    for (const scope of Object.values(OPTIONAL_OAUTH_SCOPES))
      expect(scopes).not.toContain(scope)
    expect(scopes).not.toContain('repo:*')
  })

  it('maps permission sets to the selected services and advertises optional access', () => {
    const appview = 'did:web:blacksky.app#bsky_appview'
    const chat = 'did:web:chat.example.com#bsky_chat'
    const metadata = createOAuthMetadata({
      baseUrl: 'https://dev.tenna.party',
      appview,
      chat,
    })
    const url = new URL(metadata.client_id)
    expect(url.searchParams.get('appview')).toBe(appview)
    expect(url.searchParams.get('chat')).toBe(chat)
    expect(metadata.redirect_uris).toEqual([
      'https://dev.tenna.party/auth/web/callback',
    ])
    expect(metadata.scope).toContain(
      `include:app.bsky.authFullApp?aud=${encodeURIComponent(appview)}`,
    )
    expect(metadata.scope).toContain(
      `include:chat.bsky.authFullChatClient?aud=${encodeURIComponent(chat)}`,
    )
    for (const method of [
      'chat.bsky.convo.getUnreadCounts',
      'chat.bsky.group.updateJoinRequestsRead',
      'chat.bsky.notification.getPreferences',
      'chat.bsky.notification.putPreferences',
    ]) {
      expect(metadata.scope.split(' ')).toContain(
        `rpc:${method}?aud=${encodeURIComponent(chat)}`,
      )
    }
    for (const method of [
      'app.bsky.actor.getPreferences',
      'app.bsky.actor.putPreferences',
    ]) {
      expect(metadata.scope.split(' ')).toContain(
        `rpc:${method}?aud=${encodeURIComponent(DEFAULT_APPVIEW_AUDIENCE)}`,
      )
      expect(buildOAuthScope().split(' ')).not.toContain(
        `rpc:${method}?aud=${encodeURIComponent(DEFAULT_APPVIEW_AUDIENCE)}`,
      )
    }
    expect(metadata.scope).toContain(OPTIONAL_OAUTH_SCOPES.email)
    expect(buildOAuthScope(appview, chat, ['handle'])).toContain(
      OPTIONAL_OAUTH_SCOPES.handle,
    )
    expect(buildOAuthScope(appview, chat, ['handle'])).not.toContain(
      OPTIONAL_OAUTH_SCOPES.email,
    )
  })

  it('keeps the native callback fixed and rejects malformed audiences', () => {
    expect(
      createOAuthMetadata({baseUrl: 'https://tenna.party', native: true})
        .redirect_uris,
    ).toEqual(['party.tenna:/auth/callback', 'app.tennaparty:/auth/callback'])
    for (const appview of [
      '*',
      'did:web:example.com',
      'did:web:example.com#bsky_appview identity:*',
    ]) {
      expect(() =>
        createOAuthMetadata({baseUrl: 'https://tenna.party', appview}),
      ).toThrow()
    }
  })
})

it('recognizes normalized grants without confusing read access with management', () => {
  expect(
    hasOAuthPermission('atproto account?attr=email&action=manage', 'email'),
  ).toBe(true)
  expect(hasOAuthPermission('atproto account:email', 'email')).toBe(false)
  expect(hasOAuthPermission('atproto identity?attr=handle', 'handle')).toBe(
    true,
  )
  expect(hasOAuthPermission('atproto identity:*', 'handle')).toBe(true)
  expect(
    hasOAuthPermission('atproto transition:generic transition:email', 'handle'),
  ).toBe(false)
})

it('rejects a saved account grant for another appview', () => {
  const blacksky = 'did:web:api.blacksky.community#bsky_appview'
  expect(hasOAuthAppViewScope(buildOAuthScope(), blacksky)).toBe(false)
  expect(hasOAuthAppViewScope(buildOAuthScope(blacksky), blacksky)).toBe(true)
  expect(hasOAuthAppViewScope('transition:generic', blacksky)).toBe(true)
})

it('recognizes expanded PDS grants with positional or named methods', () => {
  const aud = encodeURIComponent(DEFAULT_APPVIEW_AUDIENCE)
  for (const method of [
    'rpc:app.bsky.notification.listNotifications',
    'rpc?lxm=app.bsky.notification.listNotifications',
  ]) {
    const scope = `${method}${method.includes('?') ? '&' : '?'}aud=${aud}`
    expect(hasOAuthAppViewScope(scope, DEFAULT_APPVIEW_AUDIENCE)).toBe(true)
    expect(
      hasOAuthAppViewScope(scope, 'did:web:api.eurosky.network#bsky_appview'),
    ).toBe(false)
  }
})
