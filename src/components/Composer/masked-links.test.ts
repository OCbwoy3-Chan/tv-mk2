import {facets, Tapper} from '@bsky.app/tapper'

import {maskedLinkFacet, normalizeComposerLink} from './masked-links'

const postUrl =
  'https://witchsky.app/profile/did:plc:7ztoas5m6664r5bwab56byec/post/3muqcpj5o3c23'

function createTapper() {
  return new Tapper({facets: {...facets, maskedLink: maskedLinkFacet}})
}

describe('composer masked link facets', () => {
  it('highlights the complete expression and commits only its destination', () => {
    const tapper = createTapper()
    const committed = jest.fn()
    tapper.on('facetCommitted', facet =>
      committed(normalizeComposerLink(facet)),
    )
    const text = `[meow](${postUrl})`
    tapper.handleTextChange(text)
    expect(tapper.nodes).toEqual([
      expect.objectContaining({
        type: 'facet',
        raw: text,
        value: postUrl,
        start: 0,
        end: text.length,
      }),
    ])
    expect(committed).toHaveBeenCalledTimes(1)
    expect(committed).toHaveBeenCalledWith(
      expect.objectContaining({type: 'url', value: postUrl}),
    )
  })

  it('gives masked links priority over facets inside their labels', () => {
    const tapper = createTapper()
    tapper.handleTextChange(
      '🌟 [@person.test #tag](example.com) https://other.test',
    )
    expect(
      tapper.nodes.filter(node => node.type === 'facet').map(node => node.raw),
    ).toEqual(['[@person.test #tag](example.com)', 'https://other.test'])
  })

  it('recognizes a link completed one character at a time', () => {
    const tapper = createTapper()
    const text = `[meow](${postUrl})`
    for (let i = 1; i <= text.length; i++)
      tapper.handleTextChange(text.slice(0, i))
    expect(tapper.nodes[0]).toMatchObject({
      type: 'facet',
      facetType: 'maskedLink',
      raw: text,
      value: postUrl,
    })
  })

  it('normalizes bare domains for embed callbacks', () => {
    expect(
      normalizeComposerLink({
        type: 'maskedLink',
        value: 'example.com',
        raw: '[label](example.com)',
        range: {start: 0, end: 20},
      }).value,
    ).toBe('https://example.com')
  })
})
