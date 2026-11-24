/*
 * Discord component embeds.
 * https://docs.discord.com/developers/link-previews/component-embeds
 *
 * The Open Graph video layout never renders a description, so a post shared to
 * Discord loses its text as soon as `og:video` is present. A component embed
 * replaces the Open Graph preview with a layout we build, which is the only way
 * to show a post's text next to its video.
 */

/** Whole payload limit, in bytes of the serialized JSON. */
export const MAX_EMBED_BYTES = 3000
/** Components allowed in an embed, including the top-level container. */
export const MAX_EMBED_COMPONENTS = 40
/** Gallery items allowed in an embed, across every gallery. */
export const MAX_GALLERY_ITEMS = 10

const ACCENT_COLOR = 0x0085ff

type UnfurledMedia = {url: string}

type Component =
  | {type: 1; components: Component[]}
  | {type: 2; style: 5; label: string; url: string}
  | {type: 9; components: Component[]; accessory: Component}
  | {type: 10; content: string}
  | {type: 11; media: UnfurledMedia}
  | {type: 12; items: {description?: string; media: UnfurledMedia}[]}
  | {type: 14; spacing: 1 | 2}
  | {type: 17; accent_color: number; components: Component[]}

export type ComponentEmbed = {component: Component}

/**
 * Discord markdown escapes. Unescaped user text would otherwise turn into
 * spoilers, quotes, links or formatting inside the embed.
 */
export function escapeMarkdown(text: string) {
  return text.replace(/([\\*_~`|>[\]]|<)/g, '\\$1')
}

/**
 * JSON is embedded in a `<script>` element, where the HTML parser stops at
 * `</script`; escaping `<` keeps user text from closing the tag early.
 */
export function serializeComponentEmbed(embed: ComponentEmbed) {
  return JSON.stringify(embed).replace(/</g, '\\u003c')
}

export function componentEmbedBytes(embed: ComponentEmbed) {
  return new TextEncoder().encode(serializeComponentEmbed(embed)).length
}

export function countComponents(component: Component): number {
  let count = 1
  if ('components' in component) {
    for (const child of component.components) count += countComponents(child)
  }
  if ('accessory' in component) count += countComponents(component.accessory)
  return count
}

export type PostComponentEmbedOptions = {
  appName: string
  /** Display name, already falling back to the handle when it is empty. */
  authorName: string
  authorAvatar?: string
  authorHandle: string
  postText: string
  postUrl: string
  videoUrl: string
  videoAlt?: string
}

function build(
  options: PostComponentEmbedOptions,
  postText: string,
): ComponentEmbed {
  const markdown = [
    `**[${escapeMarkdown(options.authorName)}](${options.postUrl})** (@${escapeMarkdown(options.authorHandle)})`,
    postText ? `\n${escapeMarkdown(postText)}` : '',
  ].join('')

  const header: Component = {type: 10, content: markdown}

  return {
    component: {
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        options.authorAvatar
          ? {
              type: 9,
              components: [header],
              accessory: {type: 11, media: {url: options.authorAvatar}},
            }
          : header,
        {
          type: 12,
          items: [
            {
              media: {url: options.videoUrl},
              ...(options.videoAlt ? {description: options.videoAlt} : {}),
            },
          ],
        },
        {type: 14, spacing: 2},
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: `Open on ${options.appName}`,
              url: options.postUrl,
            },
          ],
        },
      ],
    },
  }
}

/**
 * The embed for a video post, or undefined when the text cannot be shortened
 * enough to fit - the caller keeps the Open Graph card in that case.
 */
export function renderPostComponentEmbed(
  options: PostComponentEmbedOptions,
): ComponentEmbed | undefined {
  const full = build(options, options.postText)
  if (fits(full)) return full

  // Trim the post text until the payload fits; the header and video are fixed.
  const chars = Array.from(options.postText)
  let low = 0
  let high = chars.length
  let best: ComponentEmbed | undefined

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const candidate = build(
      options,
      mid === chars.length
        ? options.postText
        : `${chars.slice(0, mid).join('').trimEnd()}…`,
    )

    if (fits(candidate)) {
      best = candidate
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return best
}

function fits(embed: ComponentEmbed) {
  return (
    componentEmbedBytes(embed) <= MAX_EMBED_BYTES &&
    countComponents(embed.component) <= MAX_EMBED_COMPONENTS &&
    galleryItems(embed.component) <= MAX_GALLERY_ITEMS
  )
}

function galleryItems(component: Component): number {
  let count = component.type === 12 ? component.items.length : 0
  if ('components' in component) {
    for (const child of component.components) count += galleryItems(child)
  }
  if ('accessory' in component) count += galleryItems(component.accessory)
  return count
}
