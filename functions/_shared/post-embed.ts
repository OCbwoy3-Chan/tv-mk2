import {renderCachedEmbed} from './embed-cache.ts'
import {html, type ProfileView, renderHandleString} from './profile-embed.ts'

type Facet = {
  features?: Array<{$type?: string; uri?: string}>
  index?: {byteEnd?: number; byteStart?: number}
}

type Embed = {
  $type?: string
  external?: {uri?: string}
  images?: Array<{thumb?: string}>
  record?: Embed | ViewRecord
  thumbnail?: string
}

type ViewRecord = {
  $type?: string
  author: ProfileView
  value?: {text?: string}
}

type Thread = {
  $type?: string
  parent?: Thread
  post: {
    author: ProfileView
    embed?: Embed
    indexedAt: string
    record?: {facets?: Facet[]; text?: string}
  }
}

const TYPE = {
  external: 'app.bsky.embed.external#view',
  images: 'app.bsky.embed.images#view',
  record: 'app.bsky.embed.record#view',
  recordWithMedia: 'app.bsky.embed.recordWithMedia#view',
  thread: 'app.bsky.feed.defs#threadViewPost',
  viewRecord: 'app.bsky.embed.record#viewRecord',
}

function isType<T extends {$type?: string}>(
  value: T | undefined,
  type: string,
): value is T {
  return value?.$type === type
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
    const recordEmbed = embed?.record
    const embeddedRecord =
      recordEmbed && 'record' in recordEmbed
        ? (recordEmbed.record ?? recordEmbed)
        : recordEmbed
    if (isType(embeddedRecord, TYPE.viewRecord)) {
      const viewRecord = embeddedRecord as ViewRecord
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
    const author = this.thread.post.author

    const postText =
      this.postTextString.length > 0
        ? html`
            <meta name="description" content="${this.postTextString}" />
            <meta property="og:description" content="${this.postTextString}" />
          `
        : ''

    const embed = this.thread.post.embed

    const embedElems = !embed
      ? ''
      : isType(embed, TYPE.images) && embed.images?.length
        ? html`${embed.images
              .filter(image => image.thumb)
              .map(
                image =>
                  html`<meta
                    property="og:image"
                    content="${image.thumb as string}" />`,
              )}
            <meta name="twitter:card" content="summary_large_image" /> `
        : // TODO: in the future, embed videos
          'thumbnail' in embed && embed.thumbnail
          ? html`
              <meta property="og:image" content="${embed.thumbnail}" />
              <meta name="twitter:card" content="summary_large_image" />
            `
          : html`<meta name="twitter:card" content="summary" />`

    element.append(
      html`
        <meta property="og:site_name" content="Witchsky" />
        <meta property="og:type" content="article" />
        <meta property="profile:username" content="${author.handle}" />
        <meta property="og:url" content="${this.url}" />
        <meta property="og:title" content="${renderHandleString(author)}" />
        ${postText} ${embedElems}
        <meta name="twitter:label1" content="Account DID" />
        <meta name="twitter:value1" content="${author.did}" />
        <meta
          name="article:published_time"
          content="${this.thread.post.indexedAt}" />
      `,
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
