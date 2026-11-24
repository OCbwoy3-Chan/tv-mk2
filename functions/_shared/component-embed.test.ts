import {
  MAX_EMBED_BYTES,
  componentEmbedBytes,
  countComponents,
  escapeMarkdown,
  renderPostComponentEmbed,
  serializeComponentEmbed,
} from './component-embed'

const options = {
  appName: 'Witchsky',
  authorName: 'Alice',
  authorHandle: 'alice.test',
  postText: 'look at this clip',
  postUrl: 'https://witchsky.app/profile/alice.test/post/3abc',
  videoUrl: 'https://witchsky.app/video/did:plc:alice/bafy',
}

describe('escapeMarkdown', () => {
  it('escapes the characters Discord would format', () => {
    expect(escapeMarkdown('**hi** _there_ `x` | >[a](b)')).toBe(
      '\\*\\*hi\\*\\* \\_there\\_ \\`x\\` \\| \\>\\[a\\](b)',
    )
  })
})

describe('serializeComponentEmbed', () => {
  it('escapes < so user text cannot close the script element', () => {
    const embed = renderPostComponentEmbed({
      ...options,
      postText: '</script><img src=x>',
    })

    expect(JSON.parse(serializeComponentEmbed(embed!)).component).toBeTruthy()
    expect(serializeComponentEmbed(embed!)).not.toContain('</script')
    expect(serializeComponentEmbed(embed!)).toContain('\\u003c')
  })
})

describe('renderPostComponentEmbed', () => {
  it('puts the post text and the video in one container', () => {
    const embed = renderPostComponentEmbed(options)!
    const json = JSON.stringify(embed)

    expect(embed.component.type).toBe(17)
    expect(json).toContain('look at this clip')
    expect(json).toContain('https://witchsky.app/video/did:plc:alice/bafy')
  })

  it('trims the text until the payload fits the limit', () => {
    const embed = renderPostComponentEmbed({
      ...options,
      postText: 'x'.repeat(5000),
    })!

    expect(componentEmbedBytes(embed)).toBeLessThanOrEqual(MAX_EMBED_BYTES)
    expect(countComponents(embed.component)).toBeLessThanOrEqual(40)
    // The video survives the trim.
    expect(JSON.stringify(embed)).toContain('/video/did:plc:alice/bafy')
  })

  it('gives up rather than emit a payload over the limit', () => {
    const embed = renderPostComponentEmbed({
      ...options,
      authorAvatar: `https://cdn.test/${'a'.repeat(4000)}`,
    })

    expect(embed).toBeUndefined()
  })
})
