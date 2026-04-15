import {BrowserOAuthClient} from '@atproto/oauth-client-browser'

const OAUTH_BASE_URL: string =
  process.env.EXPO_PUBLIC_OAUTH_BASE_URL || 'https://witchsky.app'

const OAUTH_CLIENT_NAME: string =
  process.env.EXPO_PUBLIC_OAUTH_CLIENT_NAME || 'Witchsky'

const OAUTH_SCOPE = [
  'atproto',
  'repo:*',
  'blob:*/*',
  'identity:handle',
  'account:email?action=manage',
  'account:status?action=manage',
  'rpc:app.bsky.actor.getPreferences?aud=*',
  'rpc:app.bsky.actor.getProfile?aud=*',
  'rpc:app.bsky.actor.getProfiles?aud=*',
  'rpc:app.bsky.actor.getSuggestions?aud=*',
  'rpc:app.bsky.actor.putPreferences?aud=*',
  'rpc:app.bsky.actor.searchActors?aud=*',
  'rpc:app.bsky.actor.searchActorsTypeahead?aud=*',
  'rpc:app.bsky.ageassurance.begin?aud=*',
  'rpc:app.bsky.bookmark.createBookmark?aud=*',
  'rpc:app.bsky.bookmark.deleteBookmark?aud=*',
  'rpc:app.bsky.bookmark.getBookmarks?aud=*',
  'rpc:app.bsky.contact.dismissMatch?aud=*',
  'rpc:app.bsky.contact.getMatches?aud=*',
  'rpc:app.bsky.contact.getSyncStatus?aud=*',
  'rpc:app.bsky.contact.importContacts?aud=*',
  'rpc:app.bsky.contact.removeData?aud=*',
  'rpc:app.bsky.contact.startPhoneVerification?aud=*',
  'rpc:app.bsky.contact.verifyPhone?aud=*',
  'rpc:app.bsky.draft.createDraft?aud=*',
  'rpc:app.bsky.draft.deleteDraft?aud=*',
  'rpc:app.bsky.draft.getDrafts?aud=*',
  'rpc:app.bsky.draft.updateDraft?aud=*',
  'rpc:app.bsky.feed.describeFeedGenerator?aud=*',
  'rpc:app.bsky.feed.getActorFeeds?aud=*',
  'rpc:app.bsky.feed.getActorLikes?aud=*',
  'rpc:app.bsky.feed.getAuthorFeed?aud=*',
  'rpc:app.bsky.feed.getFeed?aud=*',
  'rpc:app.bsky.feed.getFeedGenerator?aud=*',
  'rpc:app.bsky.feed.getFeedGenerators?aud=*',
  'rpc:app.bsky.feed.getFeedSkeleton?aud=*',
  'rpc:app.bsky.feed.getLikes?aud=*',
  'rpc:app.bsky.feed.getListFeed?aud=*',
  'rpc:app.bsky.feed.getPostThread?aud=*',
  'rpc:app.bsky.feed.getPosts?aud=*',
  'rpc:app.bsky.feed.getQuotes?aud=*',
  'rpc:app.bsky.feed.getRepostedBy?aud=*',
  'rpc:app.bsky.feed.getSuggestedFeeds?aud=*',
  'rpc:app.bsky.feed.getTimeline?aud=*',
  'rpc:app.bsky.feed.searchPosts?aud=*',
  'rpc:app.bsky.feed.sendInteractions?aud=*',
  'rpc:app.bsky.graph.getActorStarterPacks?aud=*',
  'rpc:app.bsky.graph.getBlocks?aud=*',
  'rpc:app.bsky.graph.getFollowers?aud=*',
  'rpc:app.bsky.graph.getFollows?aud=*',
  'rpc:app.bsky.graph.getKnownFollowers?aud=*',
  'rpc:app.bsky.graph.getList?aud=*',
  'rpc:app.bsky.graph.getListBlocks?aud=*',
  'rpc:app.bsky.graph.getListMutes?aud=*',
  'rpc:app.bsky.graph.getLists?aud=*',
  'rpc:app.bsky.graph.getListsWithMembership?aud=*',
  'rpc:app.bsky.graph.getMutes?aud=*',
  'rpc:app.bsky.graph.getRelationships?aud=*',
  'rpc:app.bsky.graph.getStarterPack?aud=*',
  'rpc:app.bsky.graph.getStarterPacks?aud=*',
  'rpc:app.bsky.graph.getStarterPacksWithMembership?aud=*',
  'rpc:app.bsky.graph.getSuggestedFollowsByActor?aud=*',
  'rpc:app.bsky.graph.muteActor?aud=*',
  'rpc:app.bsky.graph.muteActorList?aud=*',
  'rpc:app.bsky.graph.muteThread?aud=*',
  'rpc:app.bsky.graph.searchStarterPacks?aud=*',
  'rpc:app.bsky.graph.unmuteActor?aud=*',
  'rpc:app.bsky.graph.unmuteActorList?aud=*',
  'rpc:app.bsky.graph.unmuteThread?aud=*',
  'rpc:app.bsky.labeler.getServices?aud=*',
  'rpc:app.bsky.notification.getPreferences?aud=*',
  'rpc:app.bsky.notification.getUnreadCount?aud=*',
  'rpc:app.bsky.notification.listActivitySubscriptions?aud=*',
  'rpc:app.bsky.notification.listNotifications?aud=*',
  'rpc:app.bsky.notification.putActivitySubscription?aud=*',
  'rpc:app.bsky.notification.putPreferences?aud=*',
  'rpc:app.bsky.notification.putPreferencesV2?aud=*',
  'rpc:app.bsky.notification.registerPush?aud=*',
  'rpc:app.bsky.notification.unregisterPush?aud=*',
  'rpc:app.bsky.notification.updateSeen?aud=*',
  'rpc:app.bsky.unspecced.getAgeAssuranceState?aud=*',
  'rpc:app.bsky.unspecced.getConfig?aud=*',
  'rpc:app.bsky.unspecced.getOnboardingSuggestedStarterPacks?aud=*',
  'rpc:app.bsky.unspecced.getPopularFeedGenerators?aud=*',
  'rpc:app.bsky.unspecced.getPostThreadOtherV2?aud=*',
  'rpc:app.bsky.unspecced.getPostThreadV2?aud=*',
  'rpc:app.bsky.unspecced.getSuggestedFeeds?aud=*',
  'rpc:app.bsky.unspecced.getSuggestedFeedsSkeleton?aud=*',
  'rpc:app.bsky.unspecced.getSuggestedOnboardingUsers?aud=*',
  'rpc:app.bsky.unspecced.getSuggestedStarterPacks?aud=*',
  'rpc:app.bsky.unspecced.getSuggestedStarterPacksSkeleton?aud=*',
  'rpc:app.bsky.unspecced.getSuggestedUsers?aud=*',
  'rpc:app.bsky.unspecced.getSuggestedUsersForDiscover?aud=*',
  'rpc:app.bsky.unspecced.getSuggestedUsersForExplore?aud=*',
  'rpc:app.bsky.unspecced.getSuggestedUsersForSeeMore?aud=*',
  'rpc:app.bsky.unspecced.getSuggestedUsersSkeleton?aud=*',
  'rpc:app.bsky.unspecced.getSuggestionsSkeleton?aud=*',
  'rpc:app.bsky.unspecced.getTaggedSuggestions?aud=*',
  'rpc:app.bsky.unspecced.getTrendingTopics?aud=*',
  'rpc:app.bsky.unspecced.getTrends?aud=*',
  'rpc:app.bsky.unspecced.getTrendsSkeleton?aud=*',
  'rpc:app.bsky.unspecced.initAgeAssurance?aud=*',
  'rpc:app.bsky.unspecced.searchActorsSkeleton?aud=*',
  'rpc:app.bsky.unspecced.searchPostsSkeleton?aud=*',
  'rpc:app.bsky.unspecced.searchStarterPacksSkeleton?aud=*',
  'rpc:app.bsky.video.getJobStatus?aud=*',
  'rpc:app.bsky.video.getUploadLimits?aud=*',
  'rpc:app.bsky.video.uploadVideo?aud=*',
  'rpc:chat.bsky.actor.deleteAccount?aud=*',
  'rpc:chat.bsky.actor.exportAccountData?aud=*',
  'rpc:chat.bsky.convo.exportAccountData?aud=*',
  'rpc:chat.bsky.convo.acceptConvo?aud=*',
  'rpc:chat.bsky.convo.addReaction?aud=*',
  'rpc:chat.bsky.convo.deleteMessageForSelf?aud=*',
  'rpc:chat.bsky.convo.getConvo?aud=*',
  'rpc:chat.bsky.convo.getConvoAvailability?aud=*',
  'rpc:chat.bsky.convo.getConvoForMembers?aud=*',
  'rpc:chat.bsky.convo.getLog?aud=*',
  'rpc:chat.bsky.convo.getMessages?aud=*',
  'rpc:chat.bsky.convo.leaveConvo?aud=*',
  'rpc:chat.bsky.convo.listConvos?aud=*',
  'rpc:chat.bsky.convo.muteConvo?aud=*',
  'rpc:chat.bsky.convo.removeReaction?aud=*',
  'rpc:chat.bsky.convo.sendMessage?aud=*',
  'rpc:chat.bsky.convo.sendMessageBatch?aud=*',
  'rpc:chat.bsky.convo.unmuteConvo?aud=*',
  'rpc:chat.bsky.convo.updateAllRead?aud=*',
  'rpc:chat.bsky.convo.updateRead?aud=*',
  'rpc:com.atproto.moderation.createReport?aud=*',
  'rpc:com.atproto.repo.uploadBlob?aud=*',
].join(' ')

function isLoopback() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host === '::1'
  )
}

const BSKY_OAUTH_CLIENT = createWebOAuthClient()

function createWebOAuthClient() {
  if (isLoopback()) {
    // Loopback client: encode scope and redirect_uri in the client_id URL.
    // The authorization server uses hardcoded metadata for http://localhost
    // client_ids. Without explicit scope, only "atproto" is granted, which
    // lacks the granular permissions this client needs for repo, appview, and
    // chat APIs.
    const port = window.location.port ? `:${window.location.port}` : ''
    const redirectUri = `http://127.0.0.1${port}/`
    const clientId =
      `http://localhost` +
      `?redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(OAUTH_SCOPE)}`

    return new BrowserOAuthClient({
      clientMetadata: {
        client_id: clientId,
        redirect_uris: [redirectUri],
        scope: OAUTH_SCOPE,
        token_endpoint_auth_method: 'none',
        response_types: ['code'],
        grant_types: ['authorization_code', 'refresh_token'],
        application_type: 'web',
        dpop_bound_access_tokens: true,
      },
      handleResolver: 'https://bsky.social',
    })
  }

  return new BrowserOAuthClient({
    clientMetadata: {
      client_id: `${OAUTH_BASE_URL}/oauth-client-metadata.json`,
      client_name: OAUTH_CLIENT_NAME,
      client_uri: OAUTH_BASE_URL,
      redirect_uris: [`${OAUTH_BASE_URL}/auth/web/callback`],
      scope: OAUTH_SCOPE,
      token_endpoint_auth_method: 'none',
      response_types: ['code'],
      grant_types: ['authorization_code', 'refresh_token'],
      application_type: 'web',
      dpop_bound_access_tokens: true,
    },
    handleResolver: 'https://bsky.social',
  })
}

export function getWebOAuthClient() {
  return BSKY_OAUTH_CLIENT
}
