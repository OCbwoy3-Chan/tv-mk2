import {resolveThemeReference} from './themeReference'
import {THEME_COLLECTION} from './types'

const did = 'did:plc:themeauthor'
const uri = `at://${did}/${THEME_COLLECTION}/testtheme`

it('converts a shared theme link and resolves its handle', async () => {
  const resolve = jest.fn().mockResolvedValue(did)
  await expect(
    resolveThemeReference(
      ' https://witchsky.app/profile/example.com/theme/testtheme?shared=1 ',
      resolve,
    ),
  ).resolves.toBe(uri)
  expect(resolve).toHaveBeenCalledWith('example.com')
})

it('keeps DID-based AT URIs without resolving a handle', async () => {
  const resolve = jest.fn()
  await expect(resolveThemeReference(uri, resolve)).resolves.toBe(uri)
  expect(resolve).not.toHaveBeenCalled()
})

it('resolves handles in AT URIs as well as links', async () => {
  await expect(
    resolveThemeReference(
      `at://example.com/${THEME_COLLECTION}/testtheme`,
      jest.fn().mockResolvedValue(did),
    ),
  ).resolves.toBe(uri)
})

it('allows clearing the optional pair', async () => {
  await expect(resolveThemeReference('  ', jest.fn())).resolves.toBeUndefined()
})

it.each([
  'https://witchsky.app/profile/example.com/post/testtheme',
  `at://${did}/app.bsky.feed.post/testtheme`,
  `at://${did}/${THEME_COLLECTION}`,
  'not a theme',
])('rejects invalid theme references: %s', async input => {
  await expect(resolveThemeReference(input, jest.fn())).rejects.toThrow()
})

it('propagates handle resolution failures instead of saving a broken pair', async () => {
  await expect(
    resolveThemeReference(
      'https://witchsky.app/profile/example.com/theme/testtheme',
      jest.fn().mockRejectedValue(new Error('Handle not found')),
    ),
  ).rejects.toThrow('Handle not found')
})
