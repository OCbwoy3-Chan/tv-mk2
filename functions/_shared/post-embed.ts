import {
  renderPostComponentEmbed,
  serializeComponentEmbed,
} from './component-embed.ts'
import {renderCachedEmbed} from './embed-cache.ts'
import {
  html,
  HtmlSafeString,
  type ProfileView,
  renderHandleString,
} from './profile-embed.ts'

type Facet = {
  features?: Array<{$type?: string; uri?: string}>
  index?: {byteEnd?: number; byteStart?: number}
}

type ImageView = {thumb?: string; thumbnail?: string; fullsize?: string}

type VideoView = {
  alt?: string
  cid?: string
  thumbnail?: string
}

type Embed = {
  $type?: string
  external?: {thumb?: string; uri?: string}
  images?: ImageView[]
  items?: ImageView[]
  media?: Embed
  /**
   * `app.bsky.embed.record#view` puts the quoted post directly in `record`;
   * `recordWithMedia#view` nests a `record#view` there, so the quoted post ends
   * up at `record.record`.
   */
  record?: Embed | ViewRecord | {$type?: string; record?: Embed | ViewRecord}
  thumbnail?: string
}

type ViewRecord = {
  $type?: string
  author?: ProfileView
  embeds?: Embed[]
  uri?: string
  value?: {
    $type?: string
    embed?: Embed
    text?: string
  }
}

type Thread = {
  $type?: string
  parent?: Thread
  post: {
    author: ProfileView
    embed?: Embed
    indexedAt: string
    record?: {facets?: Facet[]; text?: string}
    uri?: string
  }
}

const TYPE = {
  external: 'app.bsky.embed.external#view',
  gallery: 'app.bsky.embed.gallery#view',
  images: 'app.bsky.embed.images#view',
  record: 'app.bsky.embed.record#view',
  recordWithMedia: 'app.bsky.embed.recordWithMedia#view',
  thread: 'app.bsky.feed.defs#threadViewPost',
  video: 'app.bsky.embed.video#view',
  viewRecord: 'app.bsky.embed.record#viewRecord',
}

function isType<T extends {$type?: string}>(
  value: T | undefined,
  type: string,
): value is T {
  return value?.$type === type
}

function getRecord(embed: Embed | undefined) {
  return embed && 'record' in embed ? embed.record : undefined
}

/**
 * The quoted post, or undefined when the record is blocked, detached or gone.
 */
function getQuotedViewRecord(embed: Embed | undefined): ViewRecord | undefined {
  if (!isType(embed, TYPE.record) && !isType(embed, TYPE.recordWithMedia)) {
    return
  }
  const record = getRecord(embed)
  const inner = record && 'record' in record ? record.record : record
  return inner && isType(inner, TYPE.viewRecord)
    ? (inner as ViewRecord)
    : undefined
}

function expandFacetedLinks(text: string, facets: Facet[]): string {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const bytes = encoder.encode(text)
  const sortedFacets = [...facets].sort(
    (a, b) => (a.index?.byteStart ?? 0) - (b.index?.byteStart ?? 0),
  )

  let result = ''
  let cursor = 0

  for (const facet of sortedFacets) {
    const start = facet.index?.byteStart
    const end = facet.index?.byteEnd
    if (
      typeof start !== 'number' ||
      typeof end !== 'number' ||
      start < cursor ||
      end < start ||
      end > bytes.length
    ) {
      continue
    }

    result += decoder.decode(bytes.slice(cursor, start))
    const segmentText = decoder.decode(bytes.slice(start, end))
    const link = facet.features?.find(
      feature =>
        feature.$type === 'app.bsky.richtext.facet#link' && feature.uri,
    )

    result +=
      link?.uri &&
      segmentText.endsWith('...') &&
      link.uri.includes(segmentText.slice(0, -3))
        ? link.uri
        : segmentText
    cursor = end
  }

  result += decoder.decode(bytes.slice(cursor))
  return result
}

export function expandPostTextRich(postView: Thread): string {
  if (!postView.post) {
    return ''
  }

  const post = postView.post
  const record = post.record
  const embed = post.embed
  const originalText = typeof record?.text === 'string' ? record.text : ''
  const facets = record?.facets

  let expandedText = originalText

  // Use RichText to process facets if they exist
  if (originalText && facets && facets.length > 0) {
    try {
      expandedText = expandFacetedLinks(originalText, facets)
    } catch (error) {
      console.error('Error processing RichText segments:', error)
      // Fallback to original text on error
      expandedText = originalText
    }
  }

  // Append external link URL if present and not already in text
  if (isType(embed, TYPE.external) && embed?.external?.uri) {
    const externalUri = embed.external.uri
    if (!expandedText.includes(externalUri)) {
      expandedText = expandedText
        ? `${expandedText}\n${externalUri}`
        : externalUri
    }
  }

  // Append placeholder for quote posts or other record embeds
  if (isType(embed, TYPE.record) || isType(embed, TYPE.recordWithMedia)) {
    const viewRecord = getQuotedViewRecord(embed)
    if (viewRecord?.author) {
      const quote = `↘️ quoting ${renderHandleString(
        viewRecord.author,
      )}:\n\n${viewRecord.value?.text ?? ''}`
      expandedText = expandedText ? `${expandedText}\n\n${quote}` : quote
    } else {
      const placeholder = '[quote/embed]'
      if (!expandedText.includes(placeholder)) {
        expandedText = expandedText
          ? `${expandedText}\n\n${placeholder}`
          : placeholder
      }
    }
  }

  // prepend reply header
  const parent = postView.parent
  if (isType(parent, TYPE.thread)) {
    const header = `↩️ reply to ${renderHandleString(parent.post.author)}:`
    expandedText = expandedText ? `${header}\n\n${expandedText}` : header
  }

  return expandedText
}

export type PreviewMedia =
  | {kind: 'external'; thumb: string}
  | {kind: 'images'; urls: string[]}
  | {kind: 'video'; alt?: string; cid: string; did: string; thumbnail?: string}

function getEmbedMedia(
  embed: Embed | undefined,
  authorDid: string,
): PreviewMedia | undefined {
  if (!embed) return

  const {images, items, external} = embed

  if (embed.$type === TYPE.recordWithMedia) {
    return getEmbedMedia(embed.media, authorDid)
  }

  if (embed.$type === TYPE.images || embed.$type === TYPE.gallery) {
    // images use `thumb`, gallery items use `thumbnail`
    const urls = (images ?? items ?? [])
      .map(image => image.thumb ?? image.thumbnail)
      .filter((url): url is string => !!url)
    return urls.length ? {kind: 'images', urls: urls.slice(0, 4)} : undefined
  }

  if (embed.$type === TYPE.video) {
    const video = embed as VideoView
    return video.cid
      ? {
          alt: video.alt,
          cid: video.cid,
          did: authorDid,
          kind: 'video',
          thumbnail: video.thumbnail,
        }
      : undefined
  }

  if (embed.$type === TYPE.external) {
    return external?.thumb
      ? {kind: 'external', thumb: external.thumb}
      : undefined
  }
}

/**
 * The post's own media, falling back to the quoted post's when it has none -
 * a text post quoting a video should still preview the video. One level only,
 * matching vxBsky.
 */
export function getPreviewMedia(thread: Thread): PreviewMedia | undefined {
  const post = thread.post
  const own = getEmbedMedia(post.embed, post.author.did)
  if (own) return own

  const quoted = getQuotedViewRecord(post.embed)
  if (!quoted) return
  return getEmbedMedia(
    quoted.embeds?.[0],
    quoted.author?.did ?? post.author.did,
  )
}

/**
 * Open Graph / Twitter card tags for the post's media.
 *
 * A video stays a thumbnail card. `og:video` and `twitter:card=player` select
 * Discord's player layout, which renders the title and never the description,
 * and nothing can add the description back - the video itself goes in the
 * component embed instead (see `component-embed.ts`). Every other unfurler
 * gets the card with the post text.
 */
export function renderEmbedMeta(media: PreviewMedia | undefined) {
  if (!media) {
    return html`<meta name="twitter:card" content="summary" />`
  }

  if (media.kind === 'video') {
    return media.thumbnail
      ? html`
          <meta property="og:image" content="${media.thumbnail}" />
          <meta name="twitter:image" content="${media.thumbnail}" />
          <meta name="twitter:card" content="summary_large_image" />
        `
      : html`<meta name="twitter:card" content="summary" />`
  }

  if (media.kind === 'external') {
    return html`
      <meta property="og:image" content="${media.thumb}" />
      <meta name="twitter:card" content="summary_large_image" />
    `
  }

  return html`
    ${media.urls.map(url => html`<meta property="og:image" content="${url}" />`)}
    <meta name="twitter:card" content="summary_large_image" />
  `
}

/**
 * The Discord component embed for a video post, as a `<script>` element the
 * caller appends to `<head>`. Unlike the Open Graph tags this keeps the post
 * text above the video, and Discord re-hosts the media itself.
 */
function renderVideoComponentEmbed({
  appName,
  media,
  postText,
  thread,
  url,
}: {
  appName: string
  media: Extract<PreviewMedia, {kind: 'video'}>
  postText: string
  thread: Thread
  url: string
}) {
  const author = thread.post.author

  const embed = renderPostComponentEmbed({
    appName,
    authorName: author.displayName ?? author.handle,
    authorAvatar: author.avatar,
    authorHandle: author.handle,
    postText,
    postUrl: url,
    videoAlt: media.alt,
    /* Our proxy serves the blob playable; see `functions/video`. */
    videoUrl: `${new URL(url).origin}/video/${media.did}/${media.cid}`,
  })
  if (!embed) return ''

  /*
   * Script content is not HTML-escaped, and the payload has no raw `<` left,
   * so it is appended as markup rather than through the escaping template.
   */
  return new HtmlSafeString([
    `<script id="discord:component-embed" type="application/json">${serializeComponentEmbed(embed)}</script>`,
  ])
}

/**
 * The metadata appended to `<head>` for a post. `postText` is the expanded
 * text used for descriptions.
 */
export function renderHeadMeta({
  appName,
  postText: postTextString,
  thread,
  url,
}: {
  appName: string
  postText: string
  thread: Thread
  url: string
}) {
  const author = thread.post.author
  const media = getPreviewMedia(thread)

  const postText =
    postTextString.length > 0
      ? html`
          <meta name="description" content="${postTextString}" />
          <meta property="og:description" content="${postTextString}" />
        `
      : ''

  /*
   * Discord ignores Open Graph for a video it can play, so the text rides in a
   * component embed. When the payload cannot be made to fit, the component
   * embed is empty and the card below still carries the text.
   */
  const componentEmbed =
    media?.kind === 'video'
      ? renderVideoComponentEmbed({
          appName,
          media,
          postText: postTextString,
          thread,
          url,
        })
      : ''

  const embedElems = renderEmbedMeta(media)

  const uri = thread.post.uri
  const atUri = uri
    ? html`
        <link rel="alternate" href="${uri}" />
        <meta name="at:canonical" content="${uri}" />
      `
    : ''

  return html`
    <meta property="og:site_name" content="${appName}" />
    <meta property="og:type" content="article" />
    <meta property="profile:username" content="${author.handle}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${renderHandleString(author)}" />
    ${postText} ${embedElems} ${componentEmbed}
    <meta name="twitter:label1" content="Account DID" />
    <meta name="twitter:value1" content="${author.did}" />
    <meta name="article:published_time" content="${thread.post.indexedAt}" />
    ${atUri}
  `
}

class HeadHandler {
  thread: Thread
  url: string
  postTextString: string
  constructor(thread: Thread, url: string, postTextString: string) {
    this.thread = thread
    this.url = url
    this.postTextString = postTextString
  }
  async element(element) {
    element.append(
      renderHeadMeta({
        appName: 'Witchsky',
        postText: this.postTextString,
        thread: this.thread,
        url: this.url,
      }),
      {html: true},
    )
  }
}

class TitleHandler {
  thread: Thread
  constructor(thread: Thread) {
    this.thread = thread
  }
  async element(element) {
    element.setInnerContent(renderHandleString(this.thread.post.author))
  }
}

class NoscriptHandler {
  thread: Thread
  postTextString: string
  constructor(thread: Thread, postTextString: string) {
    this.thread = thread
    this.postTextString = postTextString
  }
  async element(element) {
    element.append(
      html`
        <div id="bsky_post_summary">
          <h3>Post</h3>
          <p id="bsky_display_name">
            ${this.thread.post.author.displayName ?? ''}
          </p>
          <p id="bsky_handle">${this.thread.post.author.handle}</p>
          <p id="bsky_did">${this.thread.post.author.did}</p>
          <p id="bsky_post_text">${this.postTextString}</p>
          <p id="bsky_post_indexedat">${this.thread.post.indexedAt}</p>
        </div>
      `,
      {html: true},
    )
  }
}

export async function handlePostEmbed(context) {
  const {request, env} = context
  const {handleOrDID, rkey}: {handleOrDID: string; rkey: string} =
    context.params

  return renderCachedEmbed({
    request,
    executionContext: context,
    async render(publicUrl) {
      const origin = new URL(publicUrl).origin
      const base = env.ASSETS.fetch(new URL('/', origin))

      try {
        const apiUrl = new URL(
          'https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread',
        )
        apiUrl.searchParams.set(
          'uri',
          `at://${handleOrDID}/app.bsky.feed.post/${rkey}`,
        )
        apiUrl.searchParams.set('depth', '1')
        apiUrl.searchParams.set('parentHeight', '1')

        const apiResponse = await fetch(apiUrl, {
          headers: {Accept: 'application/json'},
        })
        if (!apiResponse.ok) {
          throw new Error(`getPostThread returned ${apiResponse.status}`)
        }

        const data = (await apiResponse.json()) as {thread?: Thread}
        if (!isType(data.thread, TYPE.thread)) {
          throw new Error('Expected a ThreadViewPost')
        }

        const thread = data.thread
        const postTextString = expandPostTextRich(thread)
        return new HTMLRewriter()
          .on(`head`, new HeadHandler(thread, publicUrl, postTextString))
          .on(`title`, new TitleHandler(thread))
          .on(`noscript`, new NoscriptHandler(thread, postTextString))
          .transform(await base)
      } catch (error) {
        console.error(error)
        const baseResponse = await base
        const response = new Response(baseResponse.body, baseResponse)
        response.headers.set('Cache-Control', 'no-store')
        return response
      }
    },
  })
}
