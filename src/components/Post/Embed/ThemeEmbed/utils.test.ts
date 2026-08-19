import {type AppBskyEmbedExternal} from '@atproto/api'

import {getThemeEmbedRoute, isThemeEmbed} from './utils'

function view(
  value: Partial<AppBskyEmbedExternal.ViewExternal>,
): AppBskyEmbedExternal.ViewExternal {
  return {
    $type: 'app.bsky.embed.external#viewExternal',
    uri: 'https://example.com',
    title: 'Theme',
    description: '',
    ...value,
  }
}

describe('theme embeds', () => {
  it('recognizes an associated theme record', () => {
    const embed = view({
      associatedRefs: [
        {
          uri: 'at://did:plc:alice/app.witchsky.theme.colors/3mexample',
          cid: 'bafytheme',
        },
      ],
    })

    expect(isThemeEmbed(embed)).toBe(true)
    expect(getThemeEmbedRoute(embed)).toEqual({
      name: 'did:plc:alice',
      rkey: '3mexample',
    })
  })

  it('recognizes a Witchsky theme page URL without associated refs', () => {
    expect(
      getThemeEmbedRoute(
        view({uri: 'https://witchsky.app/profile/alice.test/theme/3mexample'}),
      ),
    ).toEqual({name: 'alice.test', rkey: '3mexample'})
  })
})
