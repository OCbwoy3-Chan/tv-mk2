const createAppConfig = require('../app.config')

it.each(['tenna.party', 'mu.social', 'blacksky.community', 'northsky.app'])(
  'registers %s on iOS and Android',
  host => {
    const {expo} = createAppConfig({})

    expect(expo.ios.associatedDomains).toContain(`applinks:${host}`)
    expect(expo.android.intentFilters).toContainEqual(
      expect.objectContaining({
        action: 'VIEW',
        autoVerify: true,
        category: ['BROWSABLE', 'DEFAULT'],
        data: expect.arrayContaining([{scheme: 'https', host}]),
      }),
    )
  },
)

it('preserves tenna.party native identities and custom icons', () => {
  const {expo} = createAppConfig({})
  expect(expo.name).toBe('tenna.party')
  expect(expo.slug).toBe('tennaparty')
  expect(expo.scheme).toEqual([
    'bluesky',
    'tenna',
    'party.tenna',
    'app.tennaparty',
  ])
  expect(expo.ios.bundleIdentifier).toBe(
    process.env.WITCHSKY_BUNDLE_ID || 'party.tenna',
  )
  expect(expo.android.package).toBe(
    process.env.WITCHSKY_BUNDLE_ID || 'app.tennaparty',
  )
  const icons = expo.plugins.find(
    plugin =>
      Array.isArray(plugin) && plugin[0] === '@bsky.app/expo-dynamic-app-icon',
  )
  expect(icons[1]).toEqual(
    expect.objectContaining({
      twitter_liquid_glass: expect.anything(),
      liquid_glass_r: expect.anything(),
      liquid_glass_o: expect.anything(),
      testflight: expect.anything(),
    }),
  )
})
