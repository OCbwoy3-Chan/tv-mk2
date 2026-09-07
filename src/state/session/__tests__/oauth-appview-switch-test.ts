import {device} from '#/storage'
import {
  completeWebOAuth,
  ensureAppViewAccess,
  startAppViewSwitch,
} from '../oauth-appview-switch'
import {restoreOAuthSession} from '../oauth-client-adapter'
import {buildOAuthScope} from '../oauth-config'
import {getWebOAuthClient} from '../oauth-web-client'

jest.mock('../oauth-client-adapter', () => ({restoreOAuthSession: jest.fn()}))
jest.mock('#/storage', () => ({device: {get: jest.fn(), set: jest.fn()}}))
jest.mock('../oauth-scopes', () => ({
  getOAuthAudiences: () => ({
    appview: 'did:web:api.bsky.app#bsky_appview',
    chat: 'did:web:api.bsky.chat#bsky_chat',
  }),
}))
jest.mock('../oauth-web-client', () => ({getWebOAuthClient: jest.fn()}))
jest.mock('../oauth-web-return-url', () => ({saveOAuthReturnUrl: jest.fn()}))

const selection = {
  did: 'did:web:api.eurosky.network',
  url: 'https://api.eurosky.network',
}
const init = jest.fn()
const signIn = jest.fn()
const login = jest.fn()
const values = new Map<string, string>()

beforeEach(() => {
  jest.clearAllMocks()
  values.clear()
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      sessionStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    },
  })
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {randomUUID: () => 'switch-state'},
  })
  jest.mocked(getWebOAuthClient).mockReturnValue({init, signIn} as never)
  signIn.mockImplementation(() => new Promise(() => {}))
  login.mockResolvedValue(undefined)
})

it('redirects without changing the active selection', () => {
  void startAppViewSwitch('did:plc:account', selection)
  expect(signIn).toHaveBeenCalledWith('did:plc:account', {
    scope: expect.stringContaining(encodeURIComponent(selection.did)),
    state: 'switch-state',
  })
  expect(device.set).not.toHaveBeenCalled()
})

it('keeps the original selection on PDS cancellation', async () => {
  void startAppViewSwitch('did:plc:account', selection)
  init.mockRejectedValueOnce(new Error('access_denied'))
  await expect(completeWebOAuth(login)).rejects.toThrow('access_denied')
  expect(device.set).not.toHaveBeenCalled()
  expect(login).not.toHaveBeenCalled()
  expect(values.size).toBe(0)
})

it('uses the requested client and applies routing before login', async () => {
  void startAppViewSwitch('did:plc:account', selection)
  init.mockResolvedValueOnce({
    session: {did: 'did:plc:account'},
    state: 'switch-state',
  })
  login.mockImplementationOnce(() => {
    expect(device.set).toHaveBeenCalledWith(
      ['customAppViewDid'],
      selection.did,
    )
    return Promise.resolve()
  })
  await expect(completeWebOAuth(login)).resolves.toBe(true)
  expect(getWebOAuthClient).toHaveBeenLastCalledWith({
    appview: selection.did + '#bsky_appview',
    chat: 'did:web:api.bsky.chat#bsky_chat',
  })
  expect(values.size).toBe(0)
})

it.each([
  {did: 'did:plc:other', state: 'switch-state'},
  {did: 'did:plc:account', state: 'different-switch'},
])('rejects a mismatched callback %j', async ({did, state}) => {
  void startAppViewSwitch('did:plc:account', selection)
  init.mockResolvedValueOnce({session: {did}, state})
  await expect(completeWebOAuth(login)).rejects.toThrow('Unexpected OAuth')
  expect(device.set).not.toHaveBeenCalled()
  expect(login).not.toHaveBeenCalled()
})

it('rolls back routing if session construction fails', async () => {
  void startAppViewSwitch('did:plc:account', selection)
  init.mockResolvedValueOnce({
    session: {did: 'did:plc:account'},
    state: 'switch-state',
  })
  login.mockRejectedValueOnce(new Error('session failed'))
  await expect(completeWebOAuth(login)).rejects.toThrow('session failed')
  expect(device.set).toHaveBeenLastCalledWith(['customAppViewUrl'], undefined)
  expect(device.set).toHaveBeenNthCalledWith(
    3,
    ['customAppViewDid'],
    undefined,
  )
})

it('reports a missing grant without starting OAuth or changing routing', async () => {
  jest.mocked(restoreOAuthSession).mockResolvedValue({
    getTokenInfo: () =>
      Promise.resolve({
        scope: buildOAuthScope(selection.did + '#bsky_appview'),
      }),
  } as never)
  signIn.mockResolvedValue(undefined)
  expect(await ensureAppViewAccess('did:plc:account')).toBe(false)
  expect(signIn).not.toHaveBeenCalled()
  expect(device.set).not.toHaveBeenCalled()
})

it('resumes a saved account whose grant matches the active server', async () => {
  jest.mocked(restoreOAuthSession).mockResolvedValue({
    getTokenInfo: () => Promise.resolve({scope: buildOAuthScope()}),
  } as never)
  expect(await ensureAppViewAccess('did:plc:account')).toBe(true)
  expect(signIn).not.toHaveBeenCalled()
})
