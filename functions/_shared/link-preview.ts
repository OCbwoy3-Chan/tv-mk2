/** Keep ordinary browser navigation on the static app without fetching API data. */
export function isLinkPreviewRequest(request: Request): boolean {
  return (
    (request.method === 'GET' || request.method === 'HEAD') &&
    /bluesky cardyb|discordbot|facebookexternalhit|facebot|linkedinbot|mastodon|skypeuripreview|slackbot|telegrambot|twitterbot|whatsapp/i.test(
      request.headers.get('User-Agent') ?? '',
    )
  )
}
