import {getWebOAuthDisplay} from '../oauth-web-display'

const setItem = jest.fn()

beforeEach(() => {
  setItem.mockClear()
})

it.each(['standalone', 'fullscreen'])('uses a redirect in %s mode', mode => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      matchMedia: (query: string) => ({
        matches: query === `(display-mode: ${mode})`,
      }),
      location: {href: 'https://witchsky.app/settings'},
      sessionStorage: {setItem},
    },
  })
  expect(getWebOAuthDisplay()).toBe('page')
  expect(setItem).toHaveBeenCalledWith(
    'oauth_return_url',
    'https://witchsky.app/settings',
  )
})

it('keeps popups in a regular browser tab', () => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {matchMedia: () => ({matches: false})},
  })
  expect(getWebOAuthDisplay()).toBe('popup')
  expect(setItem).not.toHaveBeenCalled()
})
