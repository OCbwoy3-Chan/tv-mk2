import {getPublicUrl} from './embed-cache'

describe('getPublicUrl', () => {
  it('removes the internal crawler prefix and tracking parameters', () => {
    expect(
      getPublicUrl(
        'https://witchsky.app/__embed/profile/alice.test/post/abc?utm_source=x#fragment',
      ),
    ).toBe('https://witchsky.app/profile/alice.test/post/abc')
  })

  it('leaves a public path public', () => {
    expect(getPublicUrl('https://witchsky.app/profile/alice.test')).toBe(
      'https://witchsky.app/profile/alice.test',
    )
  })
})
