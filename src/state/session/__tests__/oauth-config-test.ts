import {
  buildOAuthScope,
  createOAuthMetadata,
  DEFAULT_APPVIEW_AUDIENCE,
  hasOAuthAppViewScope,
  hasOAuthPermission,
} from '../oauth-config'

const prodScope =
  'atproto transition:generic transition:email transition:chat.bsky'

it.each([false, true])(
  'preserves prod client identity and scopes (native=%s)',
  native => {
    const metadata = createOAuthMetadata({
      baseUrl: 'https://tenna.party',
      native,
    })
    expect(metadata.client_id).toBe(
      `https://tenna.party/oauth-client-metadata${native ? '-native' : ''}.json`,
    )
    expect(metadata.scope).toBe(prodScope)
    expect(metadata.redirect_uris).toEqual(
      native
        ? ['party.tenna:/auth/callback', 'app.tennaparty:/auth/callback']
        : ['https://tenna.party/auth/web/callback'],
    )
  },
)

it('uses the same client and grant across AppViews and permission requests', () => {
  const baseUrl = 'https://dev.tenna.party'
  const appview = 'did:web:api.blacksky.community#bsky_appview'
  const chat = 'did:web:chat.example.com#bsky_chat'
  expect(createOAuthMetadata({baseUrl, appview, chat})).toEqual(
    createOAuthMetadata({baseUrl}),
  )
  expect(buildOAuthScope(appview, chat, ['handle', 'email'])).toBe(prodScope)
})

it('accepts saved prod grants without requiring reauthorization', () => {
  expect(hasOAuthPermission(prodScope, 'handle')).toBe(true)
  expect(hasOAuthPermission(prodScope, 'email')).toBe(true)
  expect(hasOAuthAppViewScope(prodScope, DEFAULT_APPVIEW_AUDIENCE)).toBe(true)
  expect(
    hasOAuthAppViewScope(prodScope, 'did:web:custom.example#bsky_appview'),
  ).toBe(true)
  expect(hasOAuthPermission('atproto', 'handle')).toBe(false)
  expect(hasOAuthPermission('atproto transition:generic', 'email')).toBe(false)
})

it('still recognizes existing granular grants', () => {
  expect(
    hasOAuthPermission('atproto account?attr=email&action=manage', 'email'),
  ).toBe(true)
  expect(hasOAuthPermission('atproto account:email', 'email')).toBe(false)
  expect(hasOAuthPermission('atproto identity?attr=handle', 'handle')).toBe(
    true,
  )
  const scope = `rpc:app.bsky.notification.listNotifications?aud=${encodeURIComponent(DEFAULT_APPVIEW_AUDIENCE)}`
  expect(hasOAuthAppViewScope(scope, DEFAULT_APPVIEW_AUDIENCE)).toBe(true)
  expect(
    hasOAuthAppViewScope(scope, 'did:web:custom.example#bsky_appview'),
  ).toBe(false)
})

it('rejects malformed service audiences', () => {
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
