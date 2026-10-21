import {isLinkPreviewRequest} from './link-preview'

describe('isLinkPreviewRequest', () => {
  it.each([
    'Bluesky Cardyb/1.0',
    'Mozilla/5.0 (compatible; Discordbot/2.0)',
    'facebookexternalhit/1.1',
    'Facebot',
    'LinkedInBot/1.0',
    'Mastodon/4.0',
    'SkypeUriPreview',
    'Slackbot-LinkExpanding 1.0',
    'TelegramBot (like TwitterBot)',
    'Twitterbot/1.0',
    'WhatsApp/2.0',
  ])('recognizes %s for both GET and HEAD', userAgent => {
    for (const method of ['GET', 'HEAD']) {
      expect(
        isLinkPreviewRequest(
          new Request('https://tenna.party/profile/bsky.app', {
            method,
            headers: {'User-Agent': userAgent},
          }),
        ),
      ).toBe(true)
    }
  })

  it.each(['Mozilla/5.0', 'Googlebot', 'GPTBot', ''])(
    'passes through browsers and general crawlers (%s)',
    userAgent => {
      expect(
        isLinkPreviewRequest(
          new Request('https://tenna.party/profile/bsky.app', {
            headers: {'User-Agent': userAgent},
          }),
        ),
      ).toBe(false)
    },
  )

  it('does not render metadata for non-read requests', () => {
    expect(
      isLinkPreviewRequest(
        new Request('https://tenna.party/profile/bsky.app', {
          method: 'POST',
          headers: {'User-Agent': 'Discordbot'},
        }),
      ),
    ).toBe(false)
  })
})
