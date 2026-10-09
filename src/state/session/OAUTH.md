# OAuth session compatibility

`oauth-config.ts` is the shared source for client metadata and scope strings.
`pnpm oauth:generate` refreshes the checked-in metadata used by the Go server;
web builds generate it automatically for both hosting outputs.

Witchsky uses the production grant:
`atproto transition:generic transition:email transition:chat.bsky`.
Web and native keep the original metadata URLs without audience query parameters.
Custom AppViews change request routing, not the OAuth client identity or grant.
Loopback development also retains prod's root redirect and client-ID encoding.
Do not rename or clear the SDK session store when deploying main over prod.
The browser SDK continues to own IndexedDB tokens and DPoP keys; the account
list continues to identify these sessions by DID and `isOauthSession`.

Existing transition grants satisfy AppView and handle/email permission checks.
Granular grants remain readable; missing permissions can be recovered using the
same in-place authorization UI, which now requests the production scope.
App-password management, email updates, email 2FA, and deactivation still use
password authentication where the PDS requires it.

Keep the newer login behavior: web popups, native auth browsers (including the
Android deep-link completion fix), shared callback completion, per-account
restore serialization, cross-tab DPoP refresh, and ephemeral-error Login actions.
Ephemeral login updates the saved account and retries the pending action without
replacing the active account, navigation, scroll position, or draft.
Never impose a fetch deadline on a one-use refresh-token exchange.

The notes below describe historical testing of the granular-scope implementation,
not live verification of the restored production grant.

## Live verification (2026-09-06)

Tested with a dedicated account on the local web build, with the user completing
OAuth popups. Fresh authorization succeeded on Bluesky, Blacksky, and
`api.eurosky.network`. All six switch directions between these services
succeeded, including Bluesky via the custom `api.bsky.app` option.

After authorization, preferences, profiles, timelines, notifications, chat
unread counts, chat notification preferences, and video service authorization
returned 200. Denying a new authorization returned to the existing Eurosky
session without hanging on the loading screen. Reauthentication was disabled
for the active AppView.

Blacksky's proxied getPreferences returned 501; PDS getPreferences returned 200
with the default-audience grant.

A fresh Blacksky authorization without supplemental chat/video scopes returned
403 ScopeMissingError for chat getUnreadCounts, chat notification getPreferences,
and getServiceAuth for app.bsky.video.getUploadLimits at did:web:video.bsky.app.
The same requests returned 200 with those scopes. The consent UI shows an extra
“Chat” group for the supplemental RPCs, separate from the chat permission set.

Sources: [permission semantics](https://atproto.com/specs/permission),
[PDS preferences](https://github.com/bluesky-social/atproto/blob/main/packages/pds/src/api/app/bsky/actor/getPreferences.ts),
[PDS service auth](https://github.com/bluesky-social/atproto/blob/main/packages/pds/src/api/com/atproto/server/getServiceAuth.ts).

Helium follow-up: refreshed the test account's old authorization, then verified
same-tab Bluesky-to-Blacksky cancellation, successful Bluesky-to-Blacksky and
Blacksky-to-Bluesky switches, and Blacksky session restoration after reload.
Both saved accounts remained listed. The switcher uses a current storage
snapshot and resets its draft selection when opened.

Saved OAuth accounts are checked against the active AppView before switching.
A mismatched grant opens the in-place OAuth/legacy login chooser while retaining
the previous account. Only pressing OAuth Login opens an authorization popup
on web or the auth browser on native. Cancelling keeps the existing page. PDS token scopes expand
permission sets into RPC scopes; audience checks recognize those expanded grants.
Callback recovery resumes without initiating another authorization.

Helium also verified the test account's Blacksky-to-Eurosky authorization and
Eurosky restoration after reload. Multi-account testing reproduced a saved
Bluesky grant being routed to Blacksky; the audience check now requests access
before replacing the active account. Denying that request restored xan.lol on
Blacksky, and granting it loaded the test account on Blacksky.

The Eurosky-to-Blacksky return also succeeded. Once both accounts had matching
Blacksky grants, switching between xan.lol and the test account restored each
session without additional consent.

Ephemeral actions keep the shared AppView. Authentication errors offer a Login
button that opens Witchsky's OAuth/legacy form in a modal over the current
screen. Only the OAuth Login button opens a web popup or native auth browser.
The saved account is updated without changing the active bundle, AppView,
navigation, scroll position, or draft. Matching authentication closes the form
and retries the pending action; cancellation or a wrong account cannot retry.
Helium verified the in-screen OAuth/legacy choices and successful legacy login
returning to the same xan.lol profile with xan.lol still active. No test action
posted or changed social records. Unit tests cover both authentication modes,
wrong-account/cancel handling, and the notification's deferred action retry.

Cross-tab follow-up: browser requests restore the current OAuth session before
sending, so a reauthorization's new tokens are signed with its new DPoP key.
Follower tabs restore OAuth bundles without broadcasting a temporary signed-out
state. Device storage subscriptions also observe changes from other tabs, keeping
AppView routing and its displayed selection in sync. Helium verified both
Bluesky/Blacksky directions with two tabs and cancellation back to the prior
account and server.

Account reauthentication uses the in-place login chooser. Optional-permission
prompts start OAuth directly from the authorization button. Password changes
request email access to obtain the reset address; email reset codes are still
required. Missing email status is unknown and does not block posts or DMs. The Settings AppView changer keeps the current account's login
method: popup OAuth on web, native auth browser on mobile, or the existing
legacy restart flow. Native OAuth receives the target audience explicitly and
does not commit device routing before consent. The native login modal supplies
its own safe-area, keyboard, and nested-dialog providers; this layout still
requires an on-device check.

The reported Blacksky notification failure was reproduced without credentials:
one of 19 post URIs returned HTTP 500 individually, while the other 18 succeeded.
Blacksky's own client suppresses failed post batches. Witchsky now splits failed
5xx batches, retaining healthy posts and notifications whose subject cannot be
loaded. Authentication, rate-limit, and network failures still propagate. The
affected account's notifications were verified loading in Helium. OAuth lex
clients use the session transport directly to avoid duplicated moderation headers.

Zen Canary follow-up: a document held the main account's Web Lock while the
account chooser waited from another document. A retained Settings subframe was
also present; its involvement is inferred from the recovery, not proven. The stored
Blacksky grant still matched routing and was unexpired. A normal reload did
not release the lock; unloading only the Witchsky process restored the account
on Blacksky without reauthorization. AppView access checks now stop waiting
after ten seconds and the account chooser shows a retry message, without
stealing the lock or interrupting a token refresh in another document.

Local browser-client binding and fetch-timeout experiments were removed after
comparison with working Canary sign-in. The binding rejected older loopback
records during reauthorization, while the deadline could interrupt one-use token
rotation. The browser client now matches origin/main. The observed local
invalid_scope resolution failure remains unverified; mocked tests do not establish
live OAuth compatibility.
