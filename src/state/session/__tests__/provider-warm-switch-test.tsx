import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {act, render, waitFor} from '@testing-library/react-native'

import {type SessionAccount} from '../types'

/*
 * The provider pulls the whole app shell in through `#/state/util` and the
 * account factories. These mocks cut the tree back to the session lifecycle
 * itself, mirroring provider-abort-test.tsx.
 */
jest.mock('#/state/persisted', () => {
  const {
    defaults,
  }: typeof import('#/state/persisted/schema') = require('#/state/persisted/schema')
  return {
    defaults,
    get: (key: keyof typeof defaults) => defaults[key],
    write: () => Promise.resolve(),
    readLatest: (key: keyof typeof defaults) => defaults[key],
    onUpdate: () => () => {},
  }
})
jest.mock('#/state/util', () => ({useCloseAllActiveElements: () => () => {}}))
jest.mock('#/components/dialogs/Context', () => ({
  useGlobalDialogsControlContext: () => ({signinDialogControl: {open() {}}}),
}))
jest.mock('#/analytics', () => ({
  AnalyticsContext: ({children}: {children: React.ReactNode}) => children,
  useAnalyticsBase: () => ({metric() {}, logger: {debug() {}, error() {}}}),
  utils: {accountToSessionMetadata: () => ({}), useMeta: () => undefined},
}))
jest.mock('#/state/shell/onboarding', () => ({
  useOnboardingDispatch: () => () => {},
}))
jest.mock('#/ageAssurance/data', () => ({
  clearAgeAssuranceServerDataForAll: () => {},
  clearAgeAssuranceServerDataForDid: () => {},
}))
jest.mock('#/lib/persisted-query-storage', () => ({
  clearPersistedQueryStorage: () => Promise.resolve(),
}))
jest.mock('#/lib/notifications/notifications', () => ({
  unregisterPushToken: () => Promise.resolve(),
}))
jest.mock('jwt-decode', () => ({
  jwtDecode: () => ({scope: 'com.atproto.access'}),
}))
jest.mock('#/state/events', () => ({
  emitSessionDropped: () => {},
  emitNetworkConfirmed: () => {},
  emitNetworkLost: () => {},
}))

const mockOAuthLogin = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockOAuthResume = jest.fn<(...args: unknown[]) => Promise<unknown>>()
// Warm sessions are web-only; these tests drive the web path.
jest.mock('../warm-sessions-enabled', () => ({WARM_SESSIONS_ENABLED: true}))
jest.mock('../oauth-session-bundle', () => ({
  createOAuthSessionBundleAndLogin: (...args: unknown[]) =>
    mockOAuthLogin(...args),
  createOAuthSessionBundleAndResume: (...args: unknown[]) =>
    mockOAuthResume(...args),
}))
jest.mock('../oauth-appview-switch', () => ({
  ensureAppViewAccess: () => Promise.resolve(true),
}))
jest.mock('../oauth-client-adapter', () => ({
  restoreOAuthSession: () =>
    Promise.resolve({getTokenInfo: () => Promise.resolve({scope: ''})}),
}))
jest.mock('../oauth-config', () => ({
  ...jest.requireActual<object>('../oauth-config'),
  hasOAuthAppViewScope: () => true,
}))
jest.mock('../agent', () => ({
  Agent: class {},
  agentToSessionAccount: () => undefined,
  createAgentAndResume: () => new Promise(() => {}),
  createPublicAgent: () => ({}),
}))
jest.mock('../oauth-agent', () => ({
  oauthResumeSession: () => new Promise(() => {}),
}))
jest.mock('../create-account', () => ({
  createSessionBundleAndCreateAccount: () => new Promise(() => {}),
}))

import {readAppViewProxy} from '#/state/preferences/custom-appview-did'
import {
  Provider,
  useAppviewClient,
  useSession,
  useSessionApi,
} from '#/state/session'
import {type SessionApiContext} from '#/state/session/types'
import {buildAppviewClient, buildChatClient} from '../clients'
import {
  clearWarmSessions,
  retainWarmSession,
  takeWarmSession,
  warmSessions,
} from '../warm-sessions'
import {makeAccount} from './mock-fetch'

type GetSession = () => Promise<unknown>

/**
 * An OAuth-shaped bundle; only the fields the provider reads are set.
 * `getSession` answers the post-switch verification.
 */
function makeOAuthBundle(
  account: SessionAccount,
  getSession: GetSession = () => Promise.resolve({handle: account.handle}),
) {
  const transport = {
    did: account.did,
    fetchHandler: () => new Promise(() => {}),
  }
  return {
    session: null,
    oauthAgent: {oauthSession: {}},
    appview: readAppViewProxy(),
    appviewClient: buildAppviewClient(transport as never),
    pdsClient: {did: account.did, call: () => getSession()},
    chatClient: buildChatClient(transport as never),
    service: new URL(account.service),
  }
}

function renderProvider() {
  let api!: SessionApiContext
  let appview!: unknown
  let accounts!: SessionAccount[]
  function Probe() {
    api = useSessionApi()
    appview = useAppviewClient()
    accounts = useSession().accounts
    return null
  }
  render(
    <Provider>
      <Probe />
    </Provider>,
  )
  return {api: () => api, appview: () => appview, accounts: () => accounts}
}

async function signInAliceThenBob(bobGetSession?: GetSession) {
  const alice = makeAccount({did: 'did:plc:alice', isOauthSession: true})
  const bob = makeAccount({did: 'did:plc:bob', isOauthSession: true})
  const aliceBundle = makeOAuthBundle(alice)
  const bobBundle = makeOAuthBundle(bob, bobGetSession)
  const {api, appview, accounts} = renderProvider()
  for (const [account, bundle] of [
    [alice, aliceBundle],
    [bob, bobBundle],
  ] as const) {
    mockOAuthLogin.mockResolvedValueOnce({account, bundle})
    await act(async () => {
      await api().login(
        {service: '', identifier: '', password: '', oauthSession: {} as never},
        'LoginForm',
      )
    })
  }
  return {api, appview, accounts, alice, bob, aliceBundle, bobBundle}
}

beforeEach(() => {
  clearWarmSessions()
  mockOAuthLogin.mockReset()
  mockOAuthResume.mockReset()
})

describe('switching between OAuth accounts', () => {
  it('switches back to the previous account without restoring it', async () => {
    const {api, appview, alice, aliceBundle, bobBundle} =
      await signInAliceThenBob()
    expect(appview() === bobBundle.appviewClient).toBe(true)

    await act(async () => {
      await api().resumeSession(alice, true)
    })

    expect(mockOAuthResume).not.toHaveBeenCalled()
    expect(appview() === aliceBundle.appviewClient).toBe(true)
  })

  it('restores normally when no warm session exists', async () => {
    const {api, appview, alice} = await signInAliceThenBob()
    clearWarmSessions()
    const restored = makeOAuthBundle(alice)

    mockOAuthResume.mockResolvedValueOnce({account: alice, bundle: restored})
    await act(async () => {
      await api().resumeSession(alice, true)
    })

    expect(mockOAuthResume).toHaveBeenCalledTimes(1)
    expect(appview() === restored.appviewClient).toBe(true)
  })

  it('does not resurrect a warm session taken before a logout', async () => {
    const {api, appview, alice} = await signInAliceThenBob()
    clearWarmSessions()
    let resolveWarm!: (value: unknown) => void
    mockOAuthResume.mockReturnValueOnce(new Promise(r => (resolveWarm = r)))
    // Start warming alice, then begin switching to her while it is in flight.
    warmSessions([alice])
    let switching!: Promise<void>
    act(() => {
      switching = api().resumeSession(alice, true)
    })
    act(() => {
      api().logoutEveryAccount('Settings')
    })
    await act(async () => {
      resolveWarm({account: alice, bundle: makeOAuthBundle(alice)})
      await expect(switching).rejects.toThrow('cancelled')
    })

    expect((appview() as {did?: string}).did).toBeUndefined()
    expect(await takeWarmSession(alice.did)).toBeUndefined()
  })

  it('keeps the switch when verification cannot reach the server', async () => {
    const {api, appview, alice, aliceBundle} = await signInAliceThenBob()
    // Re-park alice with a bundle whose verification fails offline.
    clearWarmSessions()
    const offline = makeOAuthBundle(alice, () =>
      Promise.reject(new TypeError('Failed to fetch')),
    )
    retainWarmSession(alice, offline as never)

    await act(async () => {
      await api().resumeSession(alice, true)
    })

    expect(mockOAuthResume).not.toHaveBeenCalled()
    expect(appview() === offline.appviewClient).toBe(true)
    expect(appview() === aliceBundle.appviewClient).toBe(false)
  })

  it('restores from scratch when the warm session is refused', async () => {
    const {api, appview, alice} = await signInAliceThenBob()
    clearWarmSessions()
    const revoked = makeOAuthBundle(alice, () =>
      Promise.reject(new Error('InvalidToken')),
    )
    retainWarmSession(alice, revoked as never)
    const restored = makeOAuthBundle(alice)
    mockOAuthResume.mockResolvedValueOnce({account: alice, bundle: restored})

    await act(async () => {
      await api().resumeSession(alice, true)
    })

    expect(mockOAuthResume).toHaveBeenCalledTimes(1)
    expect(appview() === restored.appviewClient).toBe(true)
  })

  it('goes back to the previous account when the retry fails too', async () => {
    const {api, appview, alice, bobBundle} = await signInAliceThenBob()
    clearWarmSessions()
    retainWarmSession(
      alice,
      makeOAuthBundle(alice, () =>
        Promise.reject(new Error('InvalidToken')),
      ) as never,
    )
    // bob's live bundle was parked by switchToBundle when alice activated.
    mockOAuthResume.mockRejectedValueOnce(new Error('revoked'))

    await act(async () => {
      await expect(api().resumeSession(alice, true)).rejects.toThrow('revoked')
    })

    expect(appview() === bobBundle.appviewClient).toBe(true)
    expect(await takeWarmSession(alice.did)).toBeUndefined()
  })

  it("keeps the switch time rather than the parked account's", async () => {
    const {api, accounts, alice} = await signInAliceThenBob()
    clearWarmSessions()
    const stale = {...alice, lastActiveAt: '2000-01-01T00:00:00.000Z'}
    retainWarmSession(stale, makeOAuthBundle(alice) as never)

    await act(async () => {
      await api().resumeSession(alice, true)
    })

    const stored = accounts().find(a => a.did === alice.did)
    expect(stored?.lastActiveAt).not.toBe(stale.lastActiveAt)
  })

  it('does not roll back after a logout during the rollback restore', async () => {
    const {api, appview, alice} = await signInAliceThenBob()
    clearWarmSessions()
    retainWarmSession(
      alice,
      makeOAuthBundle(alice, () =>
        Promise.reject(new Error('InvalidToken')),
      ) as never,
    )
    let resolveRollback!: (value: unknown) => void
    mockOAuthResume
      // The cold retry for alice fails...
      .mockRejectedValueOnce(new Error('revoked'))
      // ...and restoring bob for the rollback is slow.
      .mockReturnValueOnce(new Promise(r => (resolveRollback = r)))

    let switching!: Promise<void>
    act(() => {
      switching = api().resumeSession(alice, true)
    })
    await waitFor(() => expect(mockOAuthResume).toHaveBeenCalledTimes(2))
    act(() => {
      api().logoutEveryAccount('Settings')
    })
    await act(async () => {
      resolveRollback({
        account: makeAccount({did: 'did:plc:bob', isOauthSession: true}),
        bundle: makeOAuthBundle(alice),
      })
      await expect(switching).rejects.toThrow('revoked')
    })

    expect((appview() as {did?: string}).did).toBeUndefined()
  })
})
