import {parsePrivatePostLink} from './private-post-link'

it('recognizes both legacy and serialized private-post wrapper URLs', () => {
  const uri = 'at://did:web:example.com/space/party.tenna.private.space/self/did:web:example.com/party.tenna.private.post/abc'
  const query = new URLSearchParams({uri, cid: 'bafytest'}).toString()
  for (const separator of ['?', '/?']) {
    expect(parsePrivatePostLink(`https://private-post.tenna.party${separator}${query}`)).toEqual({uri, cid: 'bafytest'})
  }
})

it.each([
  'not a URL',
  'https://private-post.tenna.party.example.com/?uri=secret',
  'https://private-post.tenna.party@evil.example/?uri=secret',
  'http://private-post.tenna.party/?uri=secret',
  'https://private-post.tenna.party/other?uri=secret',
])('does not render an unrelated link as a private post: %s', uri => {
  expect(parsePrivatePostLink(uri)).toBeUndefined()
})
