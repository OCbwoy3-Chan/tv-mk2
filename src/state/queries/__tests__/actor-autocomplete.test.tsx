import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {
  useActorAutocompleteFn,
  useActorAutocompleteQuery,
} from '#/state/queries/actor-autocomplete'
import {useAppviewClient} from '#/state/session'
import {device} from '#/storage'

jest.mock('#/state/queries/preferences', () => ({
  DEFAULT_LOGGED_OUT_PREFERENCES: {moderationPrefs: {}},
}))
jest.mock('@bsky/sdk/moderation', () => ({
  moderateProfile: () => ({ui: () => ({filter: false})}),
}))
jest.mock('#/state/session', () => ({useAppviewClient: jest.fn()}))
jest.mock('#/state/preferences/moderation-opts', () => ({
  useModerationOpts: () => undefined,
}))

const profile = {did: 'did:plc:alice', handle: 'alice.test'}

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {retry: false}},
  })
  const call = jest.fn().mockResolvedValue({actors: [profile]})
  jest.mocked(useAppviewClient).mockReturnValue({call} as never)
  function Wrapper({children}: {children: React.ReactNode}) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
  const hook = renderHook(
    () => ({
      query: useActorAutocompleteQuery('alice', true),
      autocomplete: useActorAutocompleteFn(),
    }),
    {wrapper: Wrapper},
  )
  return {call, queryClient, ...hook}
}

test('query and imperative autocomplete share the same cached result shape', async () => {
  const {call, result, queryClient} = setup()
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true))
  expect(result.current.query.data).toEqual([profile])
  await expect(result.current.autocomplete({query: 'alice'})).resolves.toEqual([
    profile,
  ])
  expect(call).toHaveBeenCalledTimes(1)
  queryClient.clear()
})

test('autocomplete refetches on server changes without showing old suggestions', async () => {
  const previous = device.get(['customAppViewUrl'])
  const {call, result, rerender, queryClient} = setup()
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true))
  const nextCall = jest.fn().mockImplementation(() => new Promise(() => {}))
  jest.mocked(useAppviewClient).mockReturnValue({call: nextCall} as never)
  try {
    act(() => {
      device.set(['customAppViewUrl'], 'https://api.blacksky.community')
    })
    rerender({})
    expect(result.current.query.data).toBeUndefined()
    expect(nextCall).toHaveBeenCalledTimes(1)
    expect(call).toHaveBeenCalledTimes(1)
  } finally {
    act(() => {
      device.set(['customAppViewUrl'], previous)
    })
    queryClient.clear()
  }
})
