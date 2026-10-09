import {
  isNotoEmojiFontLoaded,
  loadNotoEmojiFont,
  setNotoEmojiFontEnabled,
} from './index'

jest.mock(
  '../../../assets/fonts/noto-color-emoji/WitchskyNotoColorEmoji.woff2',
  () => '/noto.woff2',
)

const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
const originalFontFace = Object.getOwnPropertyDescriptor(globalThis, 'FontFace')
const registered = new Set<FontFace>()
const properties = new Map<string, string>()

beforeAll(() => {
  Object.defineProperty(globalThis, 'FontFace', {
    configurable: true,
    value: class {
      constructor(public family: string) {}

      load() {
        return Promise.resolve(this)
      }
    },
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      fonts: registered,
      documentElement: {
        style: {
          setProperty: (key: string, value: string) =>
            properties.set(key, value),
          removeProperty: (key: string) => properties.delete(key),
        },
      },
    },
  })
})

afterAll(() => {
  if (originalDocument) {
    Object.defineProperty(globalThis, 'document', originalDocument)
  } else {
    Reflect.deleteProperty(globalThis, 'document')
  }
  if (originalFontFace) {
    Object.defineProperty(globalThis, 'FontFace', originalFontFace)
  } else {
    Reflect.deleteProperty(globalThis, 'FontFace')
  }
})

it('waits for the font and restores text fields and pickers when disabled', async () => {
  setNotoEmojiFontEnabled(true)
  expect(isNotoEmojiFontLoaded()).toBe(false)
  expect(properties.size).toBe(0)
  expect(registered.size).toBe(0)

  const loading = loadNotoEmojiFont()
  expect(loadNotoEmojiFont()).toBe(loading)
  await loading
  expect(isNotoEmojiFontLoaded()).toBe(true)

  setNotoEmojiFontEnabled(true)
  expect(properties.get('--noto-emoji-font')).toBe('WitchskyNotoColorEmoji')
  expect([...registered].map(face => face.family)).toEqual([
    'WitchskyNotoColorEmoji',
    'EmojiMart',
  ])

  setNotoEmojiFontEnabled(false)
  expect(properties.size).toBe(0)
  expect([...registered].map(face => face.family)).toEqual([
    'WitchskyNotoColorEmoji',
  ])
})
