import {
  choicesFromLinkCard,
  parseTokimekiPollUrl,
  tokimekiPollFromRefs,
} from './parse'

const DID = 'did:plc:rzjl3bznelq76ukmp6bbwfzw'
const RKEY = '3mzlhqlhwyjev'

describe('parseTokimekiPollUrl', () => {
  test('reads a poll link', () => {
    expect(
      parseTokimekiPollUrl(`https://poll.tokimeki.tech/p/${DID}/${RKEY}`),
    ).toEqual({did: DID, rkey: RKEY})
  })

  test('ignores the options layout hint and trailing slash', () => {
    expect(
      parseTokimekiPollUrl(
        `https://poll.tokimeki.tech/p/${DID}/${RKEY}?options=4`,
      ),
    ).toEqual({did: DID, rkey: RKEY})
    expect(
      parseTokimekiPollUrl(`https://poll.tokimeki.blue/p/${DID}/${RKEY}/`),
    ).toEqual({did: DID, rkey: RKEY})
  })

  test('rejects non-poll pages, other hosts and malformed ids', () => {
    expect(parseTokimekiPollUrl('https://poll.tokimeki.tech/polls')).toBe(
      undefined,
    )
    expect(parseTokimekiPollUrl(`https://example.com/p/${DID}/${RKEY}`)).toBe(
      undefined,
    )
    expect(parseTokimekiPollUrl(`https://poll.tokimeki.tech/p/${DID}`)).toBe(
      undefined,
    )
    expect(
      parseTokimekiPollUrl(`https://poll.tokimeki.tech/p/notadid/${RKEY}`),
    ).toBe(undefined)
    expect(parseTokimekiPollUrl('not a url')).toBe(undefined)
  })
})

describe('tokimekiPollFromRefs', () => {
  it('finds a poll record among the refs', () => {
    expect(
      tokimekiPollFromRefs([
        {uri: `at://${DID}/app.bsky.feed.post/${RKEY}`},
        {uri: `at://${DID}/tech.tokimeki.poll.poll/${RKEY}`},
      ]),
    ).toEqual({did: DID, rkey: RKEY})
  })

  it('ignores other collections and malformed refs', () => {
    expect(
      tokimekiPollFromRefs([
        {uri: `at://${DID}/tech.tokimeki.poll.vote/${RKEY}`},
        {uri: `at://notadid/tech.tokimeki.poll.poll/${RKEY}`},
        {uri: 'https://poll.tokimeki.tech/p/x/y'},
      ]),
    ).toBe(undefined)
    expect(tokimekiPollFromRefs(undefined)).toBe(undefined)
  })
})

describe('choicesFromLinkCard', () => {
  it('reads the choices the card lists', () => {
    expect(choicesFromLinkCard('YES / NO')).toEqual(['YES', 'NO'])
    expect(choicesFromLinkCard('a / b / c / d')).toHaveLength(4)
  })

  it('falls back to two blank rows', () => {
    expect(choicesFromLinkCard(undefined)).toEqual(['', ''])
    expect(choicesFromLinkCard('just a description')).toEqual(['', ''])
  })
})
