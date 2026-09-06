import {beforeEach, describe, expect, it, jest} from '@jest/globals'

import {getOAuthScope} from '../oauth-scopes'

const mockAuthorize = jest.fn<(...args: unknown[]) => Promise<URL>>()
const mockCallback = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockOpenAuthSession = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockRemove = jest.fn()
let mockUrlListener: ((event: {url: string}) => void) | undefined

jest.mock('../oauth-native-client', () => ({
  NATIVE_REDIRECT_URI: 'app.witchsky:/auth/callback',
  getNativeOAuthClient: () => ({
    authorize: (...args: unknown[]) => mockAuthorize(...args),
    callback: (...args: unknown[]) => mockCallback(...args),
  }),
}))
jest.mock('expo-linking', () => ({
  addEventListener: (_event: string, listener: typeof mockUrlListener) => {
    mockUrlListener = listener
    return {remove: mockRemove}
  },
}))
jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: (...args: unknown[]) => mockOpenAuthSession(...args),
}))

import {signInNative} from '../oauth-native-sign-in.android'

beforeEach(() => {
  mockAuthorize.mockReset()
  mockCallback.mockReset()
  mockOpenAuthSession.mockReset()
  mockRemove.mockReset()
  mockUrlListener = undefined
})

describe('Android native OAuth', () => {
  it('completes from the deep link and ignores the browser result race', async () => {
    const session = {did: 'did:plc:example'}
    let rejectBrowser!: (error: Error) => void
    mockAuthorize.mockResolvedValueOnce(new URL('https://pds.test/authorize'))
    mockCallback.mockResolvedValueOnce({session})
    mockOpenAuthSession.mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        rejectBrowser = reject
      }),
    )

    const result = signInNative('alice.test')
    await Promise.resolve()
    mockUrlListener?.({
      url: 'app.witchsky://auth/callback?code=code-value&state=state-value',
    })
    rejectBrowser(new TypeError('undefined is not a function'))

    await expect(result).resolves.toBe(session)
    expect(mockAuthorize).toHaveBeenCalledWith('alice.test', {
      display: 'touch',
      scope: getOAuthScope(),
      redirect_uri: 'app.witchsky:/auth/callback',
    })
    expect(mockCallback).toHaveBeenCalledWith(
      new URLSearchParams('code=code-value&state=state-value'),
      {redirect_uri: 'app.witchsky:/auth/callback'},
    )
    expect(mockRemove).toHaveBeenCalledTimes(1)
  })

  it('turns an explicit abort into a silent cancellation', async () => {
    const controller = new AbortController()
    mockAuthorize.mockResolvedValueOnce(new URL('https://pds.test/authorize'))
    mockOpenAuthSession.mockReturnValueOnce(new Promise(() => {}))

    const result = signInNative('alice.test', {signal: controller.signal})
    await Promise.resolve()
    controller.abort()

    await expect(result).rejects.toThrow('OAUTH_CANCELLED')
    expect(mockRemove).toHaveBeenCalledTimes(1)
  })
})
