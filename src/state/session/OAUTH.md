# OAuth permissions

`oauth-config.ts` is the shared source for client metadata and scope strings.
`pnpm oauth:generate` refreshes the checked-in metadata used by the Go server;
web builds generate it automatically for both hosting outputs. Deploy the web
metadata before distributing native clients that request new scopes.

Initial sign-in requests `app.bsky.authFullApp`,
`chat.bsky.authFullChatClient`, and `app.witchsky.theme.authFull`, plus media
uploads and moderation reports. New chat RPCs missing from the published set
are requested individually with the selected chat audience. The first two sets inherit the selected service
DID and fragment. Custom audiences are encoded into the metadata URL and served
by the Pages Functions or Go handler. Keep both handlers enabled when hosting.

Email verification and handle dialogs request extra access explicitly, retaining
previously approved optional permissions. Web authorization uses a popup to preserve the
open action; native authorization uses the platform auth-session helpers.
App-password management, email updates, email 2FA, and deactivation require
password authentication because the PDS rejects OAuth credentials for those
endpoints, regardless of scope. Password reset uses unauthenticated requests to
the hosting service; it must not forward DPoP credentials through an entryway.

The theme permission set is published under `witchsky.app` as
`app.witchsky.theme.authFull`. Its four record collections must stay in sync with
`lexicons/app/witchsky/theme/authFull.json`. Update the published schema when
adding theme record types; never place account or blob permissions in the set.

Preferences stay on the PDS. Bluesky's PDS checks getPreferences and
putPreferences against its default Bluesky audience; proxying those calls to
Blacksky returns 501. Custom AppView sign-ins therefore add only these two
Bluesky-audience RPC grants alongside the selected AppView permission set.

The app permission set includes video methods with inheritAud. That grants them
for the selected AppView, not the DID-only video-service audience used by
getServiceAuth. The separate getUploadLimits grant covers that service request.

The published chat set currently omits getUnreadCounts, updateJoinRequestsRead,
and notification getPreferences/putPreferences. Their narrow supplemental RPC
grants produce the PDS's additional generic “Chat” consent entry. They can be
removed once the published set includes these methods.

AppView switching on web uses a same-tab redirect. The proposed server,
original server, account DID, and OAuth state are kept in session storage.
The callback uses the proposed metadata, verifies the state and account, then
applies routing before constructing the authenticated agent. Cancellation leaves
the original selection intact; session-construction failure rolls it back.
The callback clears the logged-out overlay and returns to the original route
without a second page load during app startup.

OAuth account updates from other tabs must not be interpreted as
password-session logout events.

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

Account reauthentication and optional-permission prompts share the in-place
login chooser. The Settings AppView changer keeps the current account's login
method: same-tab OAuth on web, native auth browser on mobile, or the existing
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
