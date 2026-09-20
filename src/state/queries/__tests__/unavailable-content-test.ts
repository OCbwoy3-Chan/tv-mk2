import {renderHook} from '@testing-library/react-native'

import {useDidDocument} from '#/state/queries/resolve-identity'
import {
  classifyUnavailablePost,
  getUnavailableHandle,
  isUnavailableProfileError,
  useUnavailableProfileLabel,
} from '../unavailable-content'

jest.mock('#/state/queries/resolve-identity', () => ({
  useDidDocument: jest.fn(),
}))
jest.mock('#/state/queries/profile', () => ({}))

describe('unavailable content', () => {
  it('replaces missing chat handles and leaves available profiles unchanged', () => {
    const did = 'did:plc:alice'
    jest.mocked(useDidDocument).mockReturnValue({
      data: {id: did, alsoKnownAs: ['at://r-12.net']},
    } as ReturnType<typeof useDidDocument>)
    const {result, rerender} = renderHook(
      ({handle}: {handle: string}) => useUnavailableProfileLabel({did, handle}),
      {initialProps: {handle: 'missing.invalid'}},
    )
    expect(result.current).toContain('@r-12.net')
    rerender({handle: 'alice.example'})
    expect(result.current).toBeUndefined()
    expect(useDidDocument).toHaveBeenLastCalledWith({did: ''})
  })

  it('uses the DID when a missing chat account has no resolvable handle', () => {
    jest
      .mocked(useDidDocument)
      .mockReturnValue({data: undefined} as ReturnType<typeof useDidDocument>)
    const {result} = renderHook(() =>
      useUnavailableProfileLabel({
        did: 'did:plc:alice',
        handle: 'missing.invalid',
      }),
    )
    expect(result.current).toBe('did:plc:alice')
  })

  it('recovers a handle only from the matching DID document', () => {
    const did = 'did:plc:alice'
    const doc = {
      id: did,
      alsoKnownAs: ['https://example.com', 'at://alice.example'],
    }
    expect(getUnavailableHandle(doc, did)).toBe('alice.example')
    expect(getUnavailableHandle(doc, 'did:plc:bob')).toBeUndefined()
    expect(
      getUnavailableHandle(
        {id: did, alsoKnownAs: ['at://missing.invalid', 'at://bad/path']},
        did,
      ),
    ).toBeUndefined()
  })

  it('distinguishes absent records from unavailable repositories', () => {
    expect(classifyUnavailablePost('RecordNotFound')).toBe('deleted')
    for (const error of [
      'RepoNotFound',
      'RepoDeactivated',
      'RepoTakendown',
      'AccountNotFound',
      'AccountDeactivated',
      'AccountTakedown',
    ]) {
      expect(classifyUnavailablePost(error)).toBe('account')
    }
  })

  it('recognizes AppView missing profiles without treating all failures as account errors', () => {
    expect(
      isUnavailableProfileError({
        error: 'InvalidRequest',
        message: 'Profile not found',
      }),
    ).toBe(true)
    expect(isUnavailableProfileError({error: 'AccountSuspended'})).toBe(true)
    expect(
      isUnavailableProfileError({
        error: 'InvalidRequest',
        message: 'Unable to resolve handle',
      }),
    ).toBe(false)
    expect(isUnavailableProfileError(new Error('offline'))).toBe(false)
    expect(isUnavailableProfileError(null)).toBe(false)
  })

  it('does not infer deletion from network or generic errors', () => {
    for (const error of [
      undefined,
      'InvalidRequest',
      'InternalServerError',
      'NotFound',
      new Error('offline'),
    ]) {
      expect(classifyUnavailablePost(error)).toBe('unknown')
    }
  })
})
