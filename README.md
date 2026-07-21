# ????? ????? Social App 📺🎤 (alpha)

Hey, audience! This is the codebase for the ????? ????? app, a fork of [Witchsky](https://tangled.org/jollywhoppers.com/witchsky.app), which itself is based on [social.daniela.lol](https://github.com/kittibytess/deer-social) and prior [Bluesky](https://github.com/bluesky-social/social-app) forks.

**EVERYTHING IS WIP, SOME THINGS MAY NOT WORK OR MAY HAVE NOT BEEN IMPLEMENTED YET.**

Get the app itself:

- **Web: [tenna.party](https://tenna.party)**
- **iOS: [native builds are avaiable here](https://github.com/OCbwoy3-Chan/tv-mk2/actions) (unsigned, for sideloading)**

<!-- - **Android: Maybe APK soon? ([F-Droid repo](https://app.jolly.you/fdroid/repo) in the future?)** -->
<!-- <a href="https://apps.obtainium.imranr.dev/redirect?r=obtainium://add/https://tangled.org/jollywhoppers.com/witchsky.app/">
<img src="https://github.com/ImranR98/Obtainium/blob/main/assets/graphics/badge_obtainium.png?raw=true"
alt="Get it on Obtainium" height="54" /></a> -->

## Improvements on Witchsky

- Tenna's Settings Page: Settings -> Deltas (above Runes)
- New fun self-labels: Lightner, Darkner, Tenna and well uhhh...
- VIP Exclusive labels such as... (they're hard-coded, im prob gonna make it use a labeler instead)
- Enhanced Custom TID option in composer, backported from TV World before it shut down. It's better than ([witchsky's own implementation](https://bsky.app/profile/did:plc:q7suwaz53ztc4mbiqyygbn43/post/3mpsyhopcmeow)).
- Native iOS via GitHub Actions (Unsigned. Requires Sideloading)
- Removed the labeler limit (200 max if u hit the limit ur you're deadass insane /gen /j)
- Brought back AI preferences [after their removal in v128](https://bsky.app/profile/did:plc:q7suwaz53ztc4mbiqyygbn43/post/3mqtl52mokc2p) in Settings -> Deltas
<!-- - Bypass !hide warnings on things labeled by Bluesky Moderation and other labelers -->

### TODO: Kris

- [ ] Custom cancellations (like on cred.blue/canceller) & import from repo button
- [ ] AltStore PAL Builds (My broke ass, I need a MacBook and an Apple Dev License) so it can be downloaded in EU & Japan
- [ ] Notifications (needs our own notif service + dev license, wtf)
- [ ] Rely on Expo EAS instead for signed builds (Needs rich dad or a bunch of MONEY)

## Development Resources

This is a [React Native](https://reactnative.dev/) application, written in the TypeScript programming language. It builds on the `atproto` TypeScript packages (like [`@atproto/api`](https://www.npmjs.com/package/@atproto/api)), which are also open source, but in [a different git repository](https://github.com/bluesky-social/atproto).

There is vestigial Go language source code (in `./bskyweb/`), for a web service that returns the React Native Web application in the social app deployments.
For Witchsky, the intended deployment is with a webserver that can serve static files, and reroute to `index.html` as needed. [Witchsky](https://witchsky.app) is currently hosted on [Cloudflare Pages](https://pages.cloudflare.com/). Maybe we will follow the same path.

The [Build Instructions](./docs/build.md) are a good place to get started with the app itself. If you use nix (and especially direnv) then `flake.nix` will get you a working environment for the web version of the app.

The Authenticated Transfer Protocol ("AT Protocol" or "atproto") is a decentralized social media protocol. You don't *need* to understand AT Protocol to work with this application, but it can help.
You may wish to reference [resources linked in social-app](https://github.com/bluesky-social/social-app#development-resources). However, please don't harass the Bluesky team with issues or questions pertaining to Witchsky.

v is a fork of Witchsky, which itself is a fork of the official Bluesky client, social-app. They both encompass a set of schemas and APIs built in the overall AT Protocol framework. The namespace for these "Lexicons" is `app.bsky.*`.

## Contributions

> tenna.party is a community fork, and we'd love to merge your PR!

As a rule of thumb, the best features for ????? ????? are those that have any positive impact on the user experience regardless of the maintenance overhead. Since tenna.party is a soft-ish fork, any features (patches) we add on top of Witchsky need to be maintained. For example, a change to the way posts are composed may be very invasive, touching lots of code across the codebase. If upstream refactors this component, we will need to rewrite this feature to be compatible or drop it from the client.

For this reason, only features that require changing only a small or medium amount of code from upstream should be considered.

Without an overriding motivation, opinionated features *maybe* should exist behind a toggle that is not enabled by default. This allows our client to cater to as many users as possible.

### Guidelines

- Check for existing issues before filing a new one please.
- Open an issue and give some time for discussion before submitting a PR.
  - This isn't strictly necessary, but the lead developers would love to give their thoughts and scope out your willingness to maintain the feature before you write it.
- Stay away from PRs like...
  - Changing "User" to "Tennaling."
  - Refactoring the codebase, e.g., to replace React Query with Redux Toolkit, etc.
- Include a new toggle and preference for your feature.

If we don't merge your PR for whatever reason, you are welcome to fork and/or self-host:

## Forking guidelines

Just like Witchsky and social-app, you have our blessing 🪄✨ to fork this application! However, it's very important to make it clear to users when you're giving them a fork.

Please be sure to:

- Change all branding in the repository and UI to clearly differentiate from ????? ?????.
- Change any support links (feedback, email, terms of service, issue tracker, etc) to your own systems.

## Self hosting & personal builds

Self hosting is great! It is our intention that ????? ????? is easy to self host and build on your own. If you host your own instance of ????? ?????, or make your own builds, please make some level of effort to clarify that it is not an "official" build or instance. This can be in the form of a different domain or branding, but can also be as simple as not advertising your hosted instance or builds as "official" releases.

## Security disclosures

If you discover any __security issues__ with tenna.party (NOT WITCHSKY), please privately disclose them to [kris.darkworld.download](https://bsky.app/profile/kris.darkworld.download).
If the issue pertains to infastructure, code, or systems outside the scope of tenna.party and Witchsky, please refer to the [disclosure guidelines on social-app](https://github.com/bluesky-social/social-app#security-disclosures) if it is hosted by Bluesky PBC. Otherwise, reference the security policy of that system as applicable <3

## License (MIT)

See [./LICENSE](./LICENSE) for the full license.

Bluesky Social PBC has committed to a software patent non-aggression pledge. For details see [their original announcement](https://bsky.social/about/blog/10-01-2025-patent-pledge).

## P.S.

We ❤️ you and all of the ways you support us. Thank you for making Witchsky & tenna.party so great! ^.^ :3
