# Userstyle selectors

Witchsky exposes stable `wsky-` CSS classes on the web app for browser
userstyles. These names are an additive compatibility API: generated
React Native Web classes such as `css-*` and `r-*` are implementation details
and should not be targeted.

## Stable classes

| Selector | Element |
| --- | --- |
| `.wsky-main` | Main application content |
| `.wsky-screen` | Any screen root |
| `.wsky-screen--home` | Home screen |
| `.wsky-screen--profile` | Profile screen |
| `.wsky-screen--post-thread` | Post thread screen |
| `.wsky-nav` | Any primary navigation container |
| `.wsky-nav--desktop` | Desktop left navigation |
| `.wsky-nav--mobile` | Mobile web bottom navigation |
| `.wsky-nav__item` | Primary navigation item |
| `.wsky-sidebar` | Any secondary sidebar |
| `.wsky-sidebar--right` | Desktop right sidebar |
| `.wsky-tabs` | Tab list |
| `.wsky-feed-page` | Feed page container |
| `.wsky-feed` | Feed list |
| `.wsky-feed-item` | Feed item |
| `.wsky-post` | Post feed item |
| `.wsky-post__meta` | Post author and timestamp area |
| `.wsky-post__content` | Post content area |
| `.wsky-post__text` | Post text container |
| `.wsky-post__embed` | Post embed container |
| `.wsky-post__actions` | Reply, repost, like, and share controls |
| `.wsky-profile` | Profile content |
| `.wsky-profile__header` | Profile header |
| `.wsky-composer` | Post composer |
| `.wsky-composer__topbar` | Composer top bar |

Some elements also expose state as `data-wsky-*` attributes. For example:

```css
/* Hide embeds in reposts. */
.wsky-post[data-wsky-repost='true'] .wsky-post__embed {
  display: none !important;
}

/* Make post text a little larger. */
.wsky-post__text {
  font-size: 17px !important;
}
```

Navigation items expose `data-wsky-nav-item` (`home`, `search`, `chat`,
`notifications`, or `profile`) and `data-wsky-active`. Posts expose
`data-wsky-embed`, `data-wsky-reply`, `data-wsky-repost`, and the existing
`data-feed-context`.

React Native Web may apply inline styles, so userstyles will sometimes need
`!important`. Existing `data-testid` values remain available, but they are test
hooks rather than part of this compatibility API.

When adding a new selector, use `userStyle()` from `#/lib/userstyles`, keep the
name semantic rather than visual, and update this list. Removing or changing a
published selector should be treated as a breaking change for userstyle
authors.
