import {defaults, tryParse, tryStringify} from '../schema'

describe('persisted schema helpers', () => {
  it('applies schema defaults when reading partial data', () => {
    const parsed = tryParse(
      JSON.stringify({
        colorMode: 'system',
        darkTheme: 'dim',
        colorScheme: 'material3',
        hue: 0,
        session: {accounts: []},
        reminders: {},
        languagePrefs: defaults.languagePrefs,
        requireAltTextEnabled: true,
        invites: {copiedInvites: []},
        onboarding: {step: 'Home'},
        mutedThreads: [],
        translationServicePreference: 'google',
        postReplacement: {
          enabled: false,
          postName: 'skeet',
          postsName: 'skeets',
        },
      }),
    )

    expect(parsed?.material3Accent).toBe('#ee6300')
    expect(parsed?.material3Style).toBe('TONAL_SPOT')
  })

  it('writes schema defaults back into storage payloads', () => {
    const raw = tryStringify({
      ...defaults,
      material3Accent: undefined as never,
      material3Style: undefined as never,
    })

    expect(raw).toBeDefined()

    const reparsed = JSON.parse(raw!)
    expect(reparsed.material3Accent).toBe('#ee6300')
    expect(reparsed.material3Style).toBe('TONAL_SPOT')
  })
})
