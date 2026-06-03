import {defaults, tryParse, tryStringify} from '../schema'
import {normalizeData} from '../util'

describe('persisted schema helpers', () => {
  const partialState = {
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
  }

  it('applies schema defaults when reading partial data', () => {
    const parsed = tryParse(JSON.stringify(partialState))

    expect(parsed?.material3Accent).toBe('#ee6300')
    expect(parsed?.material3Style).toBe('TONAL_SPOT')
  })

  it('preserves hydrated defaults on later writes', () => {
    const hydrated = tryParse(JSON.stringify(partialState))
    const raw = tryStringify(hydrated!)

    expect(raw).toBeDefined()

    const reparsed = JSON.parse(raw!)
    expect(reparsed.material3Accent).toBe('#ee6300')
    expect(reparsed.material3Style).toBe('TONAL_SPOT')
  })

  it('fills optional settings from defaults object when absent from storage', () => {
    const parsed = tryParse(JSON.stringify(partialState))

    expect(parsed).toBeDefined()
    expect(normalizeData(parsed!).thumbnailFormat).toBe(
      defaults.thumbnailFormat,
    )
    expect(normalizeData(parsed!).downloadFormat).toBe(defaults.downloadFormat)
  })
})
