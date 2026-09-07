import {type OAuthSession} from '@atproto/oauth-client-browser'

import {getWebOAuthClient} from '../oauth-web-client'

// Exercise the browser adapter even under the native Jest project.
const {createOAuthTransport}: typeof import('../oauth-client-adapter') =
  require('../oauth-client-adapter.ts')

jest.mock('../oauth-web-client', () => ({getWebOAuthClient: jest.fn()}))

it('uses the current DPoP session after another tab authorizes the account', async () => {
  const staleFetch = jest.fn()
  const firstFetch = jest.fn().mockResolvedValue(new Response(null, {status: 200}))
  const replacementFetch = jest.fn().mockResolvedValue(new Response(null, {status: 200}))
  const restore = jest.fn().mockResolvedValue({fetchHandler: firstFetch})
  jest.mocked(getWebOAuthClient).mockReturnValue({restore} as never)
  const transport = createOAuthTransport({did: 'did:plc:account', fetchHandler: staleFetch} as unknown as OAuthSession)
  await transport.fetchHandler('/xrpc/app.bsky.feed.getTimeline')
  restore.mockResolvedValue({fetchHandler: replacementFetch})
  await transport.fetchHandler('/xrpc/app.bsky.feed.getTimeline')
  expect(staleFetch).not.toHaveBeenCalled()
  expect(firstFetch).toHaveBeenCalledTimes(1)
  expect(replacementFetch).toHaveBeenCalledTimes(1)
  expect(restore).toHaveBeenLastCalledWith('did:plc:account', false)
})
