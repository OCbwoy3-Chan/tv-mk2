import {createOAuthMetadata} from '../../src/state/session/oauth-config'

/** Keep production metadata stable even when routing uses a custom AppView. */
export function oauthMetadataResponse(request: Request, native: boolean) {
  const url = new URL(request.url)
  try {
    const metadata = createOAuthMetadata({
      baseUrl: url.origin,
      native,
      appview: url.searchParams.get('appview') ?? undefined,
      chat: url.searchParams.get('chat') ?? undefined,
    })
    return Response.json(metadata, {
      headers: {
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return Response.json(
      {error: 'Invalid OAuth service audience'},
      {status: 400},
    )
  }
}
