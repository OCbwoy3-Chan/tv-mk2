const mockClient = jest.fn()
jest.mock('@atproto/oauth-client-browser', () => ({
  BrowserOAuthClient: mockClient,
}))
jest.mock('../identity-resolver', () => ({
  createIdentityResolver: () => ({}),
}))
jest.mock('../oauth-scopes', () => ({
  getOAuthAudiences: () => ({
    appview: 'did:web:api.bsky.app#bsky_appview',
    chat: 'did:web:api.bsky.chat#bsky_chat',
  }),
}))

const prodScope =
  'atproto transition:generic transition:email transition:chat.bsky'
const originalBaseUrl = process.env.EXPO_PUBLIC_OAUTH_BASE_URL
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')

beforeEach(() => {
  jest.resetModules()
  mockClient.mockClear()
  process.env.EXPO_PUBLIC_OAUTH_BASE_URL = 'https://witchsky.app'
})

afterEach(() => {
  if (originalBaseUrl === undefined)
    delete process.env.EXPO_PUBLIC_OAUTH_BASE_URL
  else process.env.EXPO_PUBLIC_OAUTH_BASE_URL = originalBaseUrl
  if (originalWindow)
    Object.defineProperty(globalThis, 'window', originalWindow)
  else Reflect.deleteProperty(globalThis, 'window')
})

function loadClient(hostname: string, port = '') {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {location: {hostname, port}},
  })
  return require('../oauth-web-client.ts') as typeof import('../oauth-web-client')
}

it('keeps the prod client identity and SDK storage when AppView routing changes', () => {
  const {getWebOAuthClient} = loadClient('witchsky.app')
  const client = getWebOAuthClient()
  expect(
    getWebOAuthClient({
      appview: 'did:web:api.blacksky.community#bsky_appview',
      chat: 'did:web:api.bsky.chat#bsky_chat',
    }),
  ).toBe(client)
  expect(mockClient).toHaveBeenCalledTimes(1)
  expect(mockClient).toHaveBeenCalledWith({
    clientMetadata: expect.objectContaining({
      client_id: 'https://witchsky.app/oauth-client-metadata.json',
      scope: prodScope,
    }),
    identityResolver: {},
  })
})

it('retains the exact prod loopback client ID, including scope encoding', () => {
  const {getWebOAuthClient} = loadClient('localhost', '8081')
  getWebOAuthClient()
  const redirect = 'http://127.0.0.1:8081/'
  expect(mockClient).toHaveBeenCalledWith(
    expect.objectContaining({
      clientMetadata: expect.objectContaining({
        client_id: `http://localhost?redirect_uri=${encodeURIComponent(redirect)}&scope=${encodeURIComponent(prodScope)}`,
        redirect_uris: [redirect],
      }),
    }),
  )
})
