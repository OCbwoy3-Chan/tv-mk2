import {beforeEach, describe, expect, it, jest} from '@jest/globals'

let mockEnabled = true
jest.mock('../warm-sessions-enabled', () => ({
  get WARM_SESSIONS_ENABLED() {
    return mockEnabled
  },
}))
let mockAppView = 'did:web:api.bsky.app#bsky_appview'
jest.mock('#/state/preferences/custom-appview-did', () => ({
  readAppViewProxy: () => mockAppView,
}))
jest.mock('#/logger', () => ({logger: {warn() {}}}))
jest.mock('../oauth-client-adapter', () => ({restoreOAuthSession: jest.fn()}))
const mockResume = jest.fn<(account: unknown) => Promise<unknown>>()
jest.mock('../oauth-session-bundle', () => ({
  createOAuthSessionBundleAndResume: (account: unknown) => mockResume(account),
}))

import {type SessionAccount} from '../types'
import {
  clearWarmSessions,
  pruneWarmSessions,
  retainWarmSession,
  takeWarmSession,
  warmSessions,
} from '../warm-sessions'

function account(did: string, isOauthSession = true): SessionAccount {
  return {
    did: did as SessionAccount['did'],
    handle: did,
    service: 'https://bsky.social',
    isOauthSession,
  }
}

const bundle = {appview: mockAppView} as never

beforeEach(() => {
  mockEnabled = true
  clearWarmSessions()
  mockResume.mockReset()
  mockAppView = 'did:web:api.bsky.app#bsky_appview'
})

describe('warm sessions', () => {
  it('resumes each OAuth account once and skips password accounts', async () => {
    const alice = account('did:plc:alice')
    mockResume.mockResolvedValue({account: alice, bundle})
    warmSessions([alice, account('did:plc:bob', false)])
    warmSessions([alice])

    expect(mockResume).toHaveBeenCalledTimes(1)
    expect(await takeWarmSession(alice.did)).toEqual({account: alice, bundle})
  })

  it('hands a session out only once', async () => {
    const alice = account('did:plc:alice')
    retainWarmSession(alice, bundle)

    expect(await takeWarmSession(alice.did)).toBeDefined()
    expect(await takeWarmSession(alice.did)).toBeUndefined()
  })

  it('waits for a session that is still resuming', async () => {
    const alice = account('did:plc:alice')
    let resolve!: (value: unknown) => void
    mockResume.mockReturnValue(new Promise(r => (resolve = r)))
    warmSessions([alice])

    const taken = takeWarmSession(alice.did)
    resolve({account: alice, bundle})
    expect(await taken).toEqual({account: alice, bundle})
  })

  it('forgets a session whose resume failed', async () => {
    const alice = account('did:plc:alice')
    mockResume.mockRejectedValueOnce(new Error('revoked'))
    warmSessions([alice])
    await Promise.resolve()

    expect(await takeWarmSession(alice.did)).toBeUndefined()
    mockResume.mockResolvedValue({account: alice, bundle})
    warmSessions([alice])
    expect(mockResume).toHaveBeenCalledTimes(2)
  })

  it('discards a session built for another AppView', async () => {
    const alice = account('did:plc:alice')
    retainWarmSession(alice, {
      appview: 'did:web:other.example#bsky_appview',
    } as never)

    expect(await takeWarmSession(alice.did)).toBeUndefined()
  })

  it('checks the AppView after a still-resuming session lands', async () => {
    const alice = account('did:plc:alice')
    let resolve!: (value: unknown) => void
    mockResume.mockReturnValue(new Promise(r => (resolve = r)))
    warmSessions([alice])

    const taken = takeWarmSession(alice.did)
    mockAppView = 'did:web:other.example#bsky_appview'
    resolve({account: alice, bundle})
    expect(await taken).toBeUndefined()
  })

  it('never returns a session taken during a clear', async () => {
    const alice = account('did:plc:alice')
    let resolve!: (value: unknown) => void
    mockResume.mockReturnValue(new Promise(r => (resolve = r)))
    warmSessions([alice])

    const taken = takeWarmSession(alice.did)
    clearWarmSessions()
    resolve({account: alice, bundle})
    await taken
    expect(await takeWarmSession(alice.did)).toBeUndefined()
  })

  it('prunes accounts that are no longer saved', async () => {
    retainWarmSession(account('did:plc:alice'), bundle)
    retainWarmSession(account('did:plc:bob'), bundle)
    pruneWarmSessions(did => did === 'did:plc:bob')

    expect(await takeWarmSession('did:plc:alice')).toBeUndefined()
    expect(await takeWarmSession('did:plc:bob')).toBeDefined()
  })

  it('keeps nothing on native, where a kept session signs with a stale key', async () => {
    mockEnabled = false
    const alice = account('did:plc:alice')
    mockResume.mockResolvedValue({account: alice, bundle})
    warmSessions([alice])
    retainWarmSession(alice, bundle)

    expect(mockResume).not.toHaveBeenCalled()
    expect(await takeWarmSession(alice.did)).toBeUndefined()
  })
})
