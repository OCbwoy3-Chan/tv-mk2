# Browser userstyles

The Witchsky web app exposes relatively stable `wsky-` CSS classes for browser
userstyle and userscript use. These names are an additive compatibility API.
Generated React Native Web classes such as `css-*` and `r-*`, exact inline styles,
DOM position, and `data-testid` values are implementation details and probably
shouldn't be targeted.

## Selector reference

Every selector below is part of the stable userstyle API.

### App layout and navigation

| Selector | Element |
| --- | --- |
| `.wsky-main` | Main application content |
| `.wsky-center` | Shared centered-column container |
| `.wsky-center-borders` | Desktop vertical border rails around the center column |
| `.wsky-header` | Shared screen header |
| `.wsky-screen` | Root of any screen |
| `.wsky-nav` | Any primary navigation container |
| `.wsky-nav--desktop` | Desktop left navigation |
| `.wsky-nav--mobile` | Mobile web bottom navigation |
| `.wsky-nav--compact` | Desktop navigation in compact rail mode |
| `.wsky-nav__item` | Primary navigation item |
| `.wsky-nav__compose` | Desktop compose action wrapper |
| `.wsky-sidebar` | Any secondary sidebar |
| `.wsky-sidebar--right` | Desktop right sidebar |
| `.wsky-tabs` | Tab list |
| `.wsky-fab` | Shared floating action button root |
| `.wsky-fab--compose` | Floating compose button |
| `.wsky-fab--load-latest` | Floating load/scroll-to-latest button |

### Screens and major regions

All named screen roots also have `.wsky-screen`.

| Selector | Element |
| --- | --- |
| `.wsky-screen--home` | Home screen |
| `.wsky-screen--profile` | Profile screen |
| `.wsky-screen--post-thread` | Post thread screen |
| `.wsky-screen--search` | Search screen |
| `.wsky-screen--notifications` | Notifications screen |
| `.wsky-screen--settings` | Settings screen |
| `.wsky-screen--bookmarks` | Saved Posts screen |
| `.wsky-screen--saved-feeds` | Saved Feeds editor screen |
| `.wsky-screen--feeds` | Feeds discovery screen |
| `.wsky-screen--lists` | Lists screen |
| `.wsky-screen--messages` | Chat list screen |
| `.wsky-profile` | Profile content |
| `.wsky-profile__header` | Profile header |
| `.wsky-search` | Search content |
| `.wsky-notifications` | Notifications content |
| `.wsky-settings` | Settings content |
| `.wsky-bookmarks` | Saved Posts list |
| `.wsky-saved-feeds` | Saved Feeds editor content |
| `.wsky-saved-feeds__item` | Saved feed row |
| `.wsky-saved-feeds__item--pinned` | Pinned saved-feed row |
| `.wsky-saved-feeds__item--unpinned` | Unpinned saved-feed row |
| `.wsky-feeds` | Feeds discovery content |
| `.wsky-lists` | Lists content |
| `.wsky-messages` | Chat list content |
| `.wsky-home__topbar` | Desktop/tablet home logo and feeds-shortcut row |
| `.wsky-home__tabs-region` | Desktop/tablet sticky home tabs region |
| `.wsky-also-liked` | Also Liked section in a post thread |
| `.wsky-also-liked__header` | Also Liked expand/collapse header |

### Feeds, cards, and empty states

| Selector | Element |
| --- | --- |
| `.wsky-feed-page` | One feed page inside a pager |
| `.wsky-feed` | Feed list |
| `.wsky-feed-item` | Feed item |
| `.wsky-feed-card` | Feed or list source card |
| `.wsky-empty-state` | Shared empty-state container |

### Posts

The post hooks are shared by home and custom feeds, search results, hashtag and
topic results, Saved Posts, Also Liked cards, and non-focused posts in thread
views.

| Selector | Element |
| --- | --- |
| `.wsky-post` | Post item in a feed, result list, saved list, or thread |
| `.wsky-post__surface` | Visible post surface; use for card background, padding, border, and radius |
| `.wsky-post__hover` | Post hover/pressed overlay |
| `.wsky-post__meta` | Post author and timestamp area |
| `.wsky-post__content` | Post content area |
| `.wsky-post__text` | Post text container |
| `.wsky-post__embed` | Entire post embed, including media, link, quote, poll, or record cards |
| `.wsky-post__media` | Image, gallery, or video surface inside an embed |
| `.wsky-post__gallery-scroll` | Horizontal scrolling container inside an expanded gallery |
| `.wsky-post__actions` | Reply, repost, like, and share controls |

### Composer, dialogs, and menus

| Selector | Element |
| --- | --- |
| `.wsky-composer` | Post composer |
| `.wsky-composer__topbar` | Composer top bar |
| `.wsky-dialog` | Shared dialog content layer |
| `.wsky-dialog__backdrop` | Shared dialog backdrop |
| `.wsky-menu` | Shared dropdown menu surface |
| `.wsky-menu__item` | Shared dropdown menu item |

## State attributes

Classes describe what an element is. `data-wsky-*` attributes expose stable
state and subtype values.

| Attribute | Element | Values |
| --- | --- | --- |
| `data-wsky-nav-item` | `.wsky-nav__item` | `home`, `search`, `notifications`, `chat`, `feeds`, `lists`, `saved`, `profile`, or `settings` |
| `data-wsky-active` | `.wsky-nav__item` | `true` or `false` |
| `data-wsky-embed` | `.wsky-post` | `true` or `false` |
| `data-wsky-reply` | `.wsky-post` | `true` or `false` |
| `data-wsky-repost` | `.wsky-post` | `true` or `false` |
| `data-feed-context` | Feed posts when supplied by the feed | Opaque feed context |

For example:

```css
/* Hide embeds only on reposts. */
.wsky-post[data-wsky-repost='true'] .wsky-post__embed {
  display: none !important;
}

/* Emphasize the active desktop navigation item. */
.wsky-nav--desktop
  .wsky-nav__item[data-wsky-active='true'] {
  background: color-mix(in srgb, AccentColor 15%, transparent) !important;
}
```

## Notes

- React Native Web often emits inline styles, so userstyles will sometimes need
`!important`.
- Existing `data-testid` values remain available for tests, but are not part of
  this compatibility API.
- Prefer semantic hooks over element names or DOM relationships. React Native
  Web may add or remove wrapper elements between releases.
- Removing or changing a published selector or attribute is a breaking change
  for userstyle authors. Adding selectors is backward compatible.

When adding a hook in Witchsky, use `userStyle()` from `#/lib/userstyles`, keep
the name semantic rather than visual, and update this guide.
