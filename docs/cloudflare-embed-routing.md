# Cloudflare embed routing

The Pages Functions bundle is intentionally limited by `web/_routes.json` to
URLs below `/__embed/profile/`. Normal `/profile/...` navigation is served by
Pages as a static SPA request and does not count as a Workers request.

The public URL still needs Open Graph metadata when a social service fetches a
shared link. Configure one zone-level **URL Rewrite Transform Rule** before
deploying these routes.

## Transform Rule

In **Cloudflare Dashboard > witchsky.app > Rules > Overview**, create a **URL
Rewrite Rule** named `Route link preview bots to embed functions`.

Use this custom filter expression:

```text
http.host eq "witchsky.app"
and http.request.method in {"GET" "HEAD"}
and starts_with(http.request.uri.path, "/profile/")
and (
  lower(http.user_agent) contains "bluesky cardyb"
  or lower(http.user_agent) contains "discordbot"
  or lower(http.user_agent) contains "facebookexternalhit"
  or lower(http.user_agent) contains "linkedinbot"
  or lower(http.user_agent) contains "mastodon"
  or lower(http.user_agent) contains "skypeuripreview"
  or lower(http.user_agent) contains "slackbot"
  or lower(http.user_agent) contains "telegrambot"
  or lower(http.user_agent) contains "twitterbot"
  or lower(http.user_agent) contains "whatsapp"
)
```

Set **Path > Rewrite to > Dynamic** to:

```text
concat("/__embed", http.request.uri.path)
```

Preserve the query string. The rewrite is internal, so visitors and link
preview services continue to see the original `/profile/...` URL.

This uses no regular expressions and is available within the Transform Rules
allowance on Cloudflare's Free plan.

To prevent anyone from invoking the internal route directly, add a WAF custom
rule with action **Block** and this expression:

```text
starts_with(raw.http.request.uri.path, "/__embed/")
```

`raw.http.request.uri.path` remains the visitor's original path. It is
`/profile/...` for a request changed by the Transform Rule, but `/__embed/...`
for someone attempting to call the Function route directly.

## Rollout and verification

Create the Transform Rule first, then deploy the Pages project. After deploy:

```sh
# Browser navigation: static SPA response; should not appear in Functions metrics.
curl -I -A 'Mozilla/5.0' https://witchsky.app/profile/<handle>

# Link preview: rewritten to the cached Pages Function response.
curl -I -A 'Twitterbot/1.0' https://witchsky.app/profile/<handle>
```

Verify the crawler response contains the Open Graph tags with a GET request.
Repeat it in the same region and check `X-Witchsky-Embed-Cache`: the first
response should be `MISS` and a warmed response should be `HIT`.

In **Workers & Pages > witchsky > Functions Metrics**, only crawler requests
should remain. Cache hits still invoke a Pages Function, but they avoid the
Bluesky API call and HTML rendering. Profile previews are cached for one hour;
immutable post previews are cached for one day. The route split is what removes
ordinary browser requests from the daily Workers request quota.

If Functions ever exhaust the free daily quota, set the Pages project to
**Fail open** under **Settings > Runtime** so static application pages continue
to work.

## Video posts

A post with a video cannot use Open Graph alone. Discord switches to its player
layout whenever `og:video` or `twitter:card` is `player`, and that layout renders
the title but never the description, so the post text disappears. The preview is
therefore built as a [component embed](https://docs.discord.com/developers/link-previews/component-embeds):
a `<script id="discord:component-embed" type="application/json">` in `<head>`
whose container holds the author, the post text, and the video in a media
gallery. The Open Graph tags stay as a large card, Discord's documented fallback
when a component embed cannot be shown.

The post text is trimmed until the payload fits Discord's 3,000-byte limit. If
even the empty payload (`author avatar`, video, button) does not fit, the
component embed is omitted and the card carries the text instead.

Discord fetches the media itself, so the video URL must be playable: the PDS
serves blobs with `Content-Disposition: attachment` and without range support.
`functions/video/[did]/[cid].ts` re-serves the blob with a video content type,
`Accept-Ranges`, and range slicing for files up to 50 MB. `/video/*` is in the
`web/_routes.json` include list, so these fetches are Pages Function requests
(Cloudflare caches them for a day, keyed by the immutable blob URL).
