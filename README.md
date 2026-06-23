# TV Time Social App 📺🎤 (alpha)

Hey, witches! This is the codebase for the TV Time app, a fork of [Witchsky](https://tangled.org/jollywhoppers.com/witchsky.app), which itself is based on [social.daniela.lol](https://github.com/kittibytess/deer-social) and prior [Bluesky](https://github.com/bluesky-social/social-app) forks.

Get the app itself:

- **Web: ~~[witchsky.app](https://witchsky.app)~~ soon enough**
- **iOS: Unsigned IPA Builds [Soon™](https://cat-bounce.com/)? (Maybe an AltStore if I were to be super mega rich and own a Mac)**
<!-- - **Android: Maybe APK soon? ([F-Droid repo](https://app.jolly.you/fdroid/repo) in the future?)** -->

<!-- <a href="https://apps.obtainium.imranr.dev/redirect?r=obtainium://add/https://tangled.org/jollywhoppers.com/witchsky.app/">
<img src="https://github.com/ImranR98/Obtainium/blob/main/assets/graphics/badge_obtainium.png?raw=true"
alt="Get it on Obtainium" height="54" /></a> -->

## Improvements on Witchsky

- Lightner/Darkner labels (can't edit right now)

### Runes

These are all available as options in the Runes sub-page of the app's settings. These are Witchsky settings!

- Menus
  - Use handles in profile links instead of DIDs
  - Show "Open original post" and "Open post in PDSls" buttons
  - On non-bsky.social handles, show a link to that URL
  - Only show URL on handles with working links
- Badges
  - Trusted verifiers
    - Use own selection of trusted verifiers
    - Trust verifiers from current AppView
  - PDS badges
    - Show a PDS badge next to the display name on profiles
    - Hide PDS badge for Bluesky-hosted accounts
    - Change favicon service
- Impressions
  - Set visibility (Hidden, Lite, Visible, or Exact) of
    - Post like, repost, quote, save, and reply counts
    - Profile follower, following, and post counts
    - "Followed by" avatars on profiles
    - Extra "Follows you" label
- Usability
  - Feeds
    - Do not fall back to discover feed
    - Hide "Feeds ✨" tab when only one feed is selected
    - Disable composer prompt
    - Disable top-of-feed button
    - Show plus icon on unfollowed feed avatars
    - Hide posts that cannot be replied to from feeds
  - Redirect through go.bsky.app
  - Disable similar accounts recommendations
  - Hide follow button on posts and scrolled profile header
  - Confirm before following or unfollowing
  - Disable verify email reminder
- Display
  - Also liked
    - Show "Also liked" recommendations under post replies
    - Collapse "Also liked" by default
  - Density
    - Account switcher
      - Use compact account switcher
      - Automatically use compact account switcher with more than 6 accounts
    - Anything else
      - Compact posts
  - Show client used to post
  - Change custom post phrase
  - Images
    - Thumbnail format
    - Full-size format
    - Download format
    - Load especially small images as PNGs
- Infrastructure
  - Post translation provider
    - Google Translate
    - Kagi Translate
    - Naver Papago
    - LibreTranslate
    - Change LibreTranslate instance
  - Change image CDN
  - Change PLC directory
  - Change Constellation instance
  - Set custom AppView DID
- Settings sync
  - Sync settings between devices
  - Include OpenRouter API key in synced settings
  - Push settings to cloud
  - Load settings from cloud
- Extra
  - Fetch records directly from PDS to fix broken quotes
  - Auto-like what you repost
  - Disable via repost notifications
  - Show debug context for posts in Discover feed
  - Don't include the 'via' field in own posts
  - Developer mode
  - Feature gates

### TODO: Kris

- [ ] Buy `tenna.party` for 5€/year on Cloudflare Domains & host it
- [ ] Native Unsigned iOS builds via GitHub Actions
- [ ] Custom verifications/cancellations & import from repo button
- [ ] Our own settings section
- [ ] Profile badge editor replaces pet label settings
- [ ] Post rkey changer (e.g. -meow, vanity tid, etc.)
- [ ] Fix live reload being broken

## Development Resources

This is a [React Native](https://reactnative.dev/) application, written in the TypeScript programming language. It builds on the `atproto` TypeScript packages (like [`@atproto/api`](https://www.npmjs.com/package/@atproto/api)), which are also open source, but in [a different git repository](https://github.com/bluesky-social/atproto).

There is vestigial Go language source code (in `./bskyweb/`), for a web service that returns the React Native Web application in the social app deployments.
For Witchsky, the intended deployment is with a webserver that can serve static files, and reroute to `index.html` as needed. [Witchsky](https://witchsky.app) is currently hosted on [Cloudflare Pages](https://pages.cloudflare.com/). Maybe we will follow the same path.

The [Build Instructions](./docs/build.md) are a good place to get started with the app itself. If you use nix (and especially direnv) then `flake.nix` will get you a working environment for the web version of the app.

The Authenticated Transfer Protocol ("AT Protocol" or "atproto") is a decentralized social media protocol. You don't *need* to understand AT Protocol to work with this application, but it can help.
You may wish to reference [resources linked in social-app](https://github.com/bluesky-social/social-app#development-resources). However, please don't harass the Bluesky team with issues or questions pertaining to Witchsky.

TV Time is a fork of Witchsky, which itself is a fork of the official Bluesky client, social-app. They both encompass a set of schemas and APIs built in the overall AT Protocol framework. The namespace for these "Lexicons" is `app.bsky.*`.

## Contributions

> TV Time is a community fork, and we'd love to merge your PR!

As a rule of thumb, the best features for TV Time are those that have any positive impact on the user experience regardless of the maintenance overhead. Since TV Time is a soft-ish fork, any features (patches) we add on top of Witchsky need to be maintained. For example, a change to the way posts are composed may be very invasive, touching lots of code across the codebase. If upstream refactors this component, we will need to rewrite this feature to be compatible or drop it from the client.

For this reason, only features that require changing only a small amount of code from upstream should be considered.

Without an overriding motivation, opinionated features should exist behind a toggle that is not enabled by default. This allows TV Time to cater to as many users as possible.

### Guidelines

- Check for existing issues before filing a new one please.
- Open an issue and give some time for discussion before submitting a PR.
  - This isn't strictly necessary, but the lead developers would love to give their thoughts and scope out your willingness to maintain the feature before you write it.
- Stay away from PRs like...
  - Changing "Quote" to "Bitch."
  - Refactoring the codebase, e.g., to replace React Query with Redux Toolkit, etc.
- Include a new toggle and preference for your feature.

If we don't merge your PR for whatever reason, you are welcome to fork and/or self-host:

## Forking guidelines

Just like Witchsky and social-app, you have our blessing 🪄✨ to fork this application! However, it's very important to make it clear to users when you're giving them a fork.

Please be sure to:

- Change all branding in the repository and UI to clearly differentiate from TV Time.
- Change any support links (feedback, email, terms of service, issue tracker, etc) to your own systems.

## Self hosting & personal builds

Self hosting is great! It is our intention that TV Time is easy to self host and build on your own. If you host your own instance of TV Time, or make your own builds, please make some level of effort to clarify that it is not an "official" build or instance. This can be in the form of a different domain or branding, but can also be as simple as not advertising your hosted instance or builds as "official" releases.

## Security disclosures

If you discover any security issues with TV Time (NOT WITCHSKY), please privately disclose them to [kris.darkworld.download](https://bsky.app/profile/kris.darkworld.download).
If the issue pertains to infastructure, code, or systems outside the scope of TV Time, please refer to the [disclosure guidelines on social-app](https://github.com/bluesky-social/social-app#security-disclosures) if it is hosted by Bluesky PBC. Otherwise, reference the security policy of that system as applicable <3

## License (MIT)

See [./LICENSE](./LICENSE) for the full license.

Bluesky Social PBC has committed to a software patent non-aggression pledge. For details see [their original announcement](https://bsky.social/about/blog/10-01-2025-patent-pledge).

## P.S.

We ❤️ you and all of the ways you support us. Thank you for making Witchsky so great! ^.^
