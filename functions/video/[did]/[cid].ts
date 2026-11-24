/*
 * /video/<did>/<cid> - playable URL for a video blob.
 *
 * The PDS serves `com.atproto.sync.getBlob` as an attachment with a sandboxing
 * CSP and without range support, which is not what Discord's media fetch or a
 * video player wants. This proxies the blob with the headers a media URL needs.
 */

import {getVideoBlobUrl} from '../../_shared/video-blob.ts'

const CACHE_TTL = 60 * 60 * 24
const MAX_SLICE_BYTES = 50 * 1000 * 1000

/**
 * Parse a single `bytes=` range. `null` means the range is well formed but
 * unsatisfiable, `undefined` means the header is not a range we understand.
 */
export function parseRange(
  header: string,
  size: number,
): [number, number] | null | undefined {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim())
  if (!match || (!match[1] && !match[2])) return

  if (!match[1]) {
    const suffix = Number(match[2])
    return suffix > 0 ? [Math.max(0, size - suffix), size - 1] : null
  }

  const start = Number(match[1])
  const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1
  return start <= end && start < size ? [start, end] : null
}

export const onRequestGet: PagesFunction = context =>
  serve(
    String(context.params.did),
    String(context.params.cid),
    context.request,
    'GET',
  )

export const onRequestHead: PagesFunction = context =>
  serve(
    String(context.params.did),
    String(context.params.cid),
    context.request,
    'HEAD',
  )

async function serve(
  did: string,
  cid: string,
  request: Request,
  method: 'GET' | 'HEAD',
) {
  if (
    !/^did:[a-z]+:[a-zA-Z0-9._:%-]+$/.test(did) ||
    !/^[a-zA-Z0-9]+$/.test(cid)
  ) {
    return new Response('Not found', {status: 404})
  }

  const range = request.headers.get('Range')
  const requestHeaders = new Headers()
  if (range) requestHeaders.set('Range', range)

  const upstream = await fetch(await getVideoBlobUrl(did, cid), {
    method,
    headers: requestHeaders,
    /* Content addressed, so it can be cached for as long as the CID lives. */
    cf: {cacheEverything: true, cacheTtl: CACHE_TTL},
  } as RequestInit)

  const contentType = upstream.headers.get('Content-Type') ?? ''
  if (!upstream.ok || !contentType.startsWith('video/')) {
    return new Response('Video not found', {status: 404})
  }

  /*
   * An explicit allowlist: the PDS response carries its own rate limit and
   * server headers that have no business on a public media URL.
   */
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': `public, max-age=${CACHE_TTL}`,
    'Content-Type': contentType,
  })

  const size = Number(upstream.headers.get('Content-Length'))
  const sliceable =
    range &&
    method === 'GET' &&
    upstream.status === 200 &&
    size > 0 &&
    size <= MAX_SLICE_BYTES

  // The PDS ignores Range, so a range request is cut here. The size cap keeps
  // this from buffering a whole long video.
  if (sliceable) {
    const span = parseRange(range, size)
    if (!span) {
      headers.set('Content-Range', `bytes */${size}`)
      return new Response(null, {status: 416, headers})
    }

    const body = (await upstream.arrayBuffer()).slice(span[0], span[1] + 1)
    headers.set('Content-Range', `bytes ${span[0]}-${span[1]}/${size}`)
    headers.set('Content-Length', String(body.byteLength))
    return new Response(body, {status: 206, headers})
  }

  headers.set('Accept-Ranges', 'bytes')
  return new Response(upstream.body, {status: upstream.status, headers})
}
