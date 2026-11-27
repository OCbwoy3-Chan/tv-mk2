# tenna.party app 📺🎤 (alpha)

Hey, audience! This is the codebase for the [tenna.party](https://tenna.party) app, a fork of [Witchsky](https://tangled.org/did:plc:3thjdgidhlxp7qzhffroeece), which itself is based on [social.daniela.lol](https://github.com/kittibytess/deer-social) and prior [Bluesky](https://github.com/bluesky-social/social-app) forks.

Get the app itself:

- **Web: [tenna.party](https://tenna.party)**
- **iOS/Android: IPA & Obtainium (im lazy so the links are on the [fluxer](https://fluxer.gg/4x3SR8Ui))**

<!-- <a href="https://apps.obtainium.imranr.dev/redirect?r=obtainium://add/https://tangled.org/did:plc:3thjdgidhlxp7qzhffroeece">
<img src="https://github.com/ImranR98/Obtainium/blob/main/assets/graphics/badge_obtainium.png?raw=true"
alt="Get it on Obtainium" height="54" /></a> -->

## Enhancements on top of Witchsky

Fixes and changes:
- More descriptive PDS dialogs
- 200 max labelers
- Custom emoji & mention masking e.g. `[Kris](@kris.kralsei.stream)`, `[Ralsei](:ralsei:)`
- Custom emojis in DMs
- [Parfait](https://parfait.social) and [pckt](https://pckt.blog) rich text support (from [purrsky](https://github.com/uwx/purrsky))

Profile stuff:
- Profile Bages (character + kin)
- *Enhanced* Eurosky+ Profile Decorations (for free)

Moderation options:
- Show blocked messages in group chats
- Show hidden lists (like ones hidden by Bluesky Moderation)
- MDNI badges shown on 18+ accounts if they don't have it in their name

App quirk options:
- More customizable & vanity post TIDs/rkeys (e.g. `deltarunetmrw`)
- Notifications V2 AppView compat workaround
- AppView notification prefs migrator 

[Deltas+](http://tenna.party/settings/deltas/plus) gated options:
- Spoof Fediverse (Bridgy Fed) posts and their text
- Change display name font globally

### TODO: Kris

Deltas:
- [ ] Mod self-labels

- [ ] Tennalings/Krislings feeds
  - [ ] Krislings: Algorithm
  - [ ] Feed settings
  - [x] Opt-outs & show MDNI post options
  - [x] Hide MDNI posts by default

- [ ] Labeler integrations (labeler.tenna.party):
  - [ ] Opt-in option to client-side negate false or unfaithfully added labels

- [ ] Labeler integrations (labeler.unlabeled.fyi):
  - [ ] Apply the 🔞 badge on MDNI users (if they don't have 🔞 in their display name)
  - [ ] Tennalings/Krislings: Use MDNI labels instead of matching text on profile

## Development Resources

This is a [React Native](https://reactnative.dev/) application, written in the TypeScript programming language. It builds on the `atproto` TypeScript packages (like [`@atproto/api`](https://www.npmjs.com/package/@atproto/api)), which are also open source, but in [a different git repository](https://github.com/bluesky-social/atproto).

There is vestigial Go language source code (in `./bskyweb/`), for a web service that returns the React Native Web application in the social app deployment. However, it is not used in current Witchsky deployments.
For Witchsky, the intended deployment is with a webserver that can serve static files, and reroute to `index.html` as needed. [Witchsky](https://witchsky.app) is currently hosted on [Cloudflare Pages](https://pages.cloudflare.com/).

The [Build Instructions](./docs/build.md) are a good place to get started with the app itself. If you use nix (and especially direnv) then `flake.nix` will get you a working environment for the web version of the app.

The Authenticated Transfer Protocol ("AT Protocol" or "atproto") is a decentralized social media protocol. You don't *need* to understand AT Protocol to work with this application, but it can help.
You may wish to reference [resources linked in social-app](https://github.com/bluesky-social/social-app#development-resources). However, please don't harass the Bluesky team with issues or questions pertaining to Witchsky.

Witchsky is a fork of the official Bluesky client, social-app. It encompasses a set of schemas and APIs built in the overall AT Protocol framework. The namespace for these "Lexicons" is `app.bsky.*`.

## Contributions

> Witchsky is a community fork, and we'd love to merge your PR!

As a rule of thumb, the best features for Witchsky are those that have a disproportionately positive impact on the user experience compared to the maintenance overhead. Unlike some open source projects, since Witchsky is a soft fork, any features (patches) we add on top of upstream social-app need to be maintained. For example, a change to the way posts are composed may be very invasive, touching lots of code across the codebase. If upstream refactors this component, we will need to rewrite this feature to be compatible or drop it from the client.

For this reason, only features that require changing only a small amount of code from upstream should be considered.

Without an overriding motivation, opinionated features should exist behind a toggle that is not enabled by default. This allows Witchsky to cater to as many users as possible.

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

Just like social-app, you have our blessing 🪄✨ to fork this application! However, it's very important to make it clear to users when you're giving them a fork.

Please be sure to:

- Change all branding in the repository and UI to clearly differentiate from Bluesky.
- Change any support links (feedback, email, terms of service, etc) to your own systems.
- Replace any analytics or error-collection systems with your own so we don't get super confused.
- Replace the landing-screen illustration in `assets/illustrations/`. It is commissioned artwork licensed to Bluesky alone, and our MIT license does not cover it.
- Source your own UI icons. The glyph set in `assets/icons/` is licensed to us by a third party for our own use, and that license does not extend to you.
- Replace the Bluesky logo, app icons, and other brand assets. Our trademarks are not licensed with the code.

Please read [./ASSETS.md](./ASSETS.md) before you ship. Not every file in this repository is
covered by our MIT license — some of the artwork, icons, fonts, and brand assets are licensed to
us by third parties or are trademarks, and `ASSETS.md` says which ones and what to do about them.
That file is new. Its absence is why some forks have shipped assets they did not have rights to,
and that was our omission rather than theirs.

## Self hosting & personal builds

Self hosting is great! It is our intention that Witchsky is easy to self host and build on your own. If you host your own instance of Witchsky, or make your own builds, please make some level of effort to clarify that it is not an "official" build or instance. This can be in the form of a different domain or branding, but can also be as simple as not advertising your hosted instance or builds as "official" releases.

## Security disclosures

If you discover any security issues present in tenna.party that is not present in Witchsky, please privately disclose them to @kris.kralsei.stream.
If the issue pertains to infastructure, code, or systems outside the scope of Witchsky or tenna.party, please refer to the [disclosure guidelines on social-app](https://github.com/bluesky-social/social-app#security-disclosures) if it is hosted by Bluesky PBC. Otherwise, reference the security policy of that system as applicable <3

## License (MIT)

See [./LICENSE](./LICENSE) for the full license, which covers the source code in this repository.

It does not cover every file. Certain images, icons, fonts, and brand assets are licensed to us
by third parties, or are trademarks, and are carved out — see [./ASSETS.md](./ASSETS.md). Required
third-party attribution notices are collected in [./NOTICE.md](./NOTICE.md).

Bluesky Social PBC has committed to a software patent non-aggression pledge. For details see [the original announcement](https://bsky.social/about/blog/10-01-2025-patent-pledge).

## P.S.

We ❤️ you and all of the ways you support us. Thank you for making Witchsky and tenna.party so great! ^.^
