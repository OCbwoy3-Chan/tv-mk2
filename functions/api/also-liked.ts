const ALSO_LIKED_URL = 'https://foryou.club/also-liked'

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'access-control-allow-origin': '*',
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
      ...init?.headers,
    },
  })
}

export async function onRequestGet(context: {request: Request}) {
  const url = new URL(context.request.url)
  const post = url.searchParams.get('post')

  if (!post) {
    return json({error: 'Missing post parameter'}, {status: 400})
  }

  const upstreamUrl = new URL(ALSO_LIKED_URL)
  upstreamUrl.searchParams.set('format', 'json')
  upstreamUrl.searchParams.set('post', post)

  const limit = url.searchParams.get('limit')
  if (limit) {
    upstreamUrl.searchParams.set('limit', limit)
  }

  const cursor = url.searchParams.get('cursor')
  if (cursor) {
    upstreamUrl.searchParams.set('cursor', cursor)
  }

  const response = await fetch(upstreamUrl.toString())
  const body = await response.text()

  return new Response(body, {
    status: response.status,
    headers: {
      'access-control-allow-origin': '*',
      'cache-control': 'no-store',
      'content-type':
        response.headers.get('content-type') ||
        'application/json; charset=utf-8',
    },
  })
}
