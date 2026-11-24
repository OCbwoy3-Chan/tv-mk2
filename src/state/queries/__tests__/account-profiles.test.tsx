import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {renderHook, waitFor} from '@testing-library/react-native'

let mockRespond: () => Promise<unknown>
jest.mock('#/state/session', () => ({
  useAppviewClient: () => ({call: () => mockRespond()}),
}))

import {useAccountProfilesQuery} from '#/state/queries/account-profiles'
import {account as accountStorage} from '#/storage'

const DID = 'did:plc:alice'

function render() {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}})
  return renderHook(() => useAccountProfilesQuery({dids: [DID]}), {
    wrapper: ({children}) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })
}

beforeEach(() => {
  accountStorage.remove([DID, 'profile'])
})

describe('useAccountProfilesQuery', () => {
  it('shows the cached profile while the fetch is in flight', () => {
    accountStorage.set([DID, 'profile'], {
      profile: {did: DID, handle: 'cached.test'},
      fetchedAt: 1,
    })
    mockRespond = () => new Promise(() => {})
    const {result} = render()

    expect(result.current.isPlaceholderData).toBe(true)
    expect(result.current.data?.profiles[0].handle).toBe('cached.test')
  })

  it('keeps the same placeholder across renders', () => {
    accountStorage.set([DID, 'profile'], {
      profile: {did: DID, handle: 'cached.test'},
      fetchedAt: 1,
    })
    mockRespond = () => new Promise(() => {})
    const {result, rerender} = render()
    const first = result.current.data

    rerender({})
    rerender({})

    // A new object per render loops components that sync state from it.
    expect(result.current.data).toBe(first)
  })

  it('caches a public snapshot of the fetched profile', async () => {
    mockRespond = () =>
      Promise.resolve({
        profiles: [{did: DID, handle: 'fresh.test', viewer: {muted: true}}],
      })
    const {result} = render()

    await waitFor(() =>
      expect(result.current.data?.profiles[0].handle).toBe('fresh.test'),
    )
    await waitFor(() =>
      expect(accountStorage.get([DID, 'profile'])?.profile.handle).toBe(
        'fresh.test',
      ),
    )
    expect(accountStorage.get([DID, 'profile'])?.profile).not.toHaveProperty(
      'viewer',
    )
  })

  it('does not overwrite a newer cached profile with an older fetch', async () => {
    accountStorage.set([DID, 'profile'], {
      profile: {did: DID, handle: 'newer.test'},
      fetchedAt: Date.now() + 60_000,
    })
    mockRespond = () =>
      Promise.resolve({profiles: [{did: DID, handle: 'older.test'}]})
    const {result} = render()

    await waitFor(() =>
      expect(result.current.data?.profiles[0].handle).toBe('older.test'),
    )
    expect(accountStorage.get([DID, 'profile'])?.profile.handle).toBe(
      'newer.test',
    )
  })
})
