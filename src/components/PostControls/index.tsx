import {memo, useCallback, useMemo, useState} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {
  type AppBskyFeedDefs,
  type AppBskyFeedPost,
  type AppBskyFeedThreadgate,
  type RichText as RichTextAPI,
} from '@atproto/api'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {CountWheel} from '#/lib/custom-animations/CountWheel'
import {AnimatedLikeIcon} from '#/lib/custom-animations/LikeIcon'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {
  shouldShowCountsMetricLabelOnly,
  shouldShowCountsMetricRow,
} from '#/lib/metrics-display'
import {type Shadow} from '#/state/cache/types'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {
  useLikesMetricsDisplay,
  useQuotesMetricsDisplay,
  useReplyMetricsDisplay,
  useRepostsMetricsDisplay,
} from '#/state/preferences/metrics-display-preference'
import {
  useGetPost,
  usePostLikeMutationQueue,
  usePostRepostMutationQueue,
} from '#/state/queries/post'
import {
  threadgateRecordToAllowUISetting,
  threadgateViewToAllowUISetting,
} from '#/state/queries/threadgate/util'
import {useRequireAuth, useSession, useSessionApi} from '#/state/session'
import {
  ProgressGuideAction,
  useProgressGuideControls,
} from '#/state/shell/progress-guide'
import * as userActionHistory from '#/state/userActionHistory'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {
  EphemeralAccountSwitcherFromScope,
  EphemeralAccountSwitcherScope,
} from '#/components/EphemeralAccountSwitcher'
import {Reply as Bubble} from '#/components/icons/Reply'
import {useFormatPostStatCount} from '#/components/PostControls/util'
import * as Skele from '#/components/Skeleton'
import * as Toast from '#/components/Toast'
import {useAnalytics} from '#/analytics'
import {useAutoLikeOnRepost} from '../../state/preferences/auto-like-on-repost.tsx'
import {useRunWithEphemeralAgent} from '../hooks/useRunWithEphemeralAgent'
import {fetchReplyableSwitcherAccounts} from './alternateAccountsReplyEligibility'
import {BookmarkButton} from './BookmarkButton'
import {MetricCountLabel} from './MetricCountLabel'
import {
  PostControlButton,
  PostControlButtonIcon,
  PostControlButtonText,
} from './PostControlButton'
import {PostMenuButton} from './PostMenu'
import {RepostButton} from './RepostButton'
import {ShareMenuButton} from './ShareMenu'

function PostControlsInner({
  big,
  post,
  record,
  richText,
  feedContext,
  reqId,
  style,
  onPressReply,
  onPostReply,
  logContext,
  threadgateRecord,
  onShowLess,
  viaRepost,
  variant,
  forceGoogleTranslate = false,
}: {
  big?: boolean
  post: Shadow<AppBskyFeedDefs.PostView>
  record: AppBskyFeedPost.Record
  richText: RichTextAPI
  feedContext?: string | undefined
  reqId?: string | undefined
  style?: StyleProp<ViewStyle>
  onPressReply: () => void
  onPostReply?: (postUri: string | undefined) => void
  logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
  threadgateRecord?: AppBskyFeedThreadgate.Record
  onShowLess?: (interaction: AppBskyFeedDefs.Interaction) => void
  viaRepost?: {uri: string; cid: string}
  variant?: 'compact' | 'normal' | 'large'
  forceGoogleTranslate?: boolean
}): React.ReactNode {
  const ax = useAnalytics()
  const t = useTheme()
  const {t: l} = useLingui()
  const {openComposer} = useOpenComposer()
  const {feedDescriptor} = useFeedFeedbackContext()
  const {accounts, currentAccount} = useSession()
  const {createEphemeralAgent} = useSessionApi()
  const queryClient = useQueryClient()
  const getPost = useGetPost()
  const runWithEphemeralAgent = useRunWithEphemeralAgent()
  const [queueLike, queueUnlike] = usePostLikeMutationQueue(
    post,
    viaRepost,
    feedDescriptor,
    logContext,
  )
  const [queueRepost, queueUnrepost] = usePostRepostMutationQueue(
    post,
    viaRepost,
    feedDescriptor,
    logContext,
  )
  const requireAuth = useRequireAuth()
  const {sendInteraction} = useFeedFeedbackContext()
  const {captureAction} = useProgressGuideControls()
  const isBlocked = Boolean(
    post.author.viewer?.blocking ||
    post.author.viewer?.blockedBy ||
    post.author.viewer?.blockingByList,
  )
  const replyDisabled = post.viewer?.replyDisabled
  const isReplyGatedPost = useMemo(() => {
    const settings = threadgateRecord
      ? threadgateRecordToAllowUISetting(threadgateRecord)
      : threadgateViewToAllowUISetting(post.threadgate)
    return !(settings.length === 1 && settings[0].type === 'everybody')
  }, [threadgateRecord, post.threadgate])
  const {gtPhone} = useBreakpoints()
  const likesMetricsDisplay = useLikesMetricsDisplay()
  const repostsMetricsDisplay = useRepostsMetricsDisplay()
  const replyMetricsDisplay = useReplyMetricsDisplay()
  const quotesMetricsDisplay = useQuotesMetricsDisplay()
  const formatPostStatCount = useFormatPostStatCount(likesMetricsDisplay)

  const [hasLikeIconBeenToggled, setHasLikeIconBeenToggled] = useState(false)

  const autoLikeOnRepost = useAutoLikeOnRepost()

  const shouldAutoLikeOnRepost = async () => {
    if (post.viewer?.like) return false

    if (userActionHistory.getActionHistory().likes.includes(post.uri)) {
      return false
    }

    try {
      const latestPost = await getPost({uri: post.uri})
      return !latestPost.viewer?.like
    } catch {
      return false
    }
  }

  const onPressToggleLike = async () => {
    if (isBlocked) {
      Toast.show(l`Cannot interact with a blocked user`, {
        type: 'warning',
      })
      return
    }

    try {
      setHasLikeIconBeenToggled(true)
      if (!post.viewer?.like) {
        sendInteraction({
          item: post.uri,
          event: 'app.bsky.feed.defs#interactionLike',
          feedContext,
          reqId,
        })
        captureAction(ProgressGuideAction.Like)
        await queueLike()
      } else {
        await queueUnlike()
      }
    } catch (err) {
      const e = err as Error
      if (e?.name !== 'AbortError') {
        throw e
      }
    }
  }

  const onRepost = async () => {
    if (isBlocked) {
      Toast.show(l`Cannot interact with a blocked user`, {
        type: 'warning',
      })
      return
    }

    try {
      if (!post.viewer?.repost) {
        sendInteraction({
          item: post.uri,
          event: 'app.bsky.feed.defs#interactionRepost',
          feedContext,
          reqId,
        })
        await queueRepost()
        setHasLikeIconBeenToggled(true)
        if (autoLikeOnRepost && (await shouldAutoLikeOnRepost())) {
          sendInteraction({
            item: post.uri,
            event: 'app.bsky.feed.defs#interactionLike',
            feedContext,
            reqId,
          })
          captureAction(ProgressGuideAction.Like)
          await queueLike()
        }
      } else {
        await queueUnrepost()
      }
    } catch (err) {
      const e = err as Error
      if (e?.name !== 'AbortError') {
        throw e
      }
    }
  }

  const onQuote = () => {
    if (isBlocked) {
      Toast.show(l`Cannot interact with a blocked user`, {
        type: 'warning',
      })
      return
    }

    sendInteraction({
      item: post.uri,
      event: 'app.bsky.feed.defs#interactionQuote',
      feedContext,
      reqId,
    })
    ax.metric('post:clickQuotePost', {
      uri: post.uri,
      authorDid: post.author.did,
      logContext,
      feedDescriptor,
    })
    openComposer({
      quote: post,
      onPost: onPostReply,
      logContext: 'QuotePost',
    })
  }

  const onShare = () => {
    sendInteraction({
      item: post.uri,
      event: 'app.bsky.feed.defs#interactionShare',
      feedContext,
      reqId,
    })
  }

  const onReplyAsAccount = (accountDid: string) => {
    setTimeout(() => {
      ax.metric('post:clickReply', {
        uri: post.uri,
        authorDid: post.author.did,
        logContext,
        feedDescriptor,
      })
      openComposer({
        activeAccountDid: accountDid,
        replyTo: {
          uri: post.uri,
          cid: post.cid,
          text: record.text || '',
          author: post.author,
          embed: post.embed,
          langs: record.langs,
        },
        onPost: onPostReply,
        logContext: 'PostReply',
      })
    }, 0)
  }

  const secondaryControlSpacingStyles = useSecondaryControlSpacingStyles({
    variant,
    big,
    gtPhone,
  })
  const hasAlternateAccounts = accounts.length > 1 && Boolean(currentAccount)
  const switcherAccounts = useMemo(
    () =>
      accounts
        .filter(account => account.did !== currentAccount?.did)
        .map(account => ({account})),
    [accounts, currentAccount?.did],
  )

  const resolveReplyableAccounts = useCallback(async () => {
    const replyableAccounts = await fetchReplyableSwitcherAccounts({
      queryClient,
      postUri: post.uri,
      switcherAccounts,
      createEphemeralAgent,
    })
    if (replyableAccounts.length === 0) {
      Toast.show(l`No other accounts can reply to this post`, {
        type: 'warning',
      })
    }
    return replyableAccounts
  }, [
    createEphemeralAgent,
    l,
    post.uri,
    queryClient,
    switcherAccounts,
  ])

  const onSelectLikeAccount = async (account: (typeof accounts)[number]) => {
    try {
      const wasLiked = await runWithEphemeralAgent(account, async agent => {
        const res = await agent.getPosts({uris: [post.uri]})
        const target = res.data.posts[0]
        const likeUri = target?.viewer?.like

        if (likeUri) {
          await agent.deleteLike(likeUri)
          return true
        }

        await agent.like(post.uri, post.cid)
        return false
      })

      Toast.show(
        wasLiked
          ? l`Removed like as @${account.handle}`
          : l`Liked as @${account.handle}`,
      )
    } catch (e) {
      Toast.show(l`An issue occurred, please try again.`, {
        type: 'error',
      })
    }
  }

  const onSelectRepostAccount = async (account: (typeof accounts)[number]) => {
    try {
      const wasReposted = await runWithEphemeralAgent(account, async agent => {
        const res = await agent.getPosts({uris: [post.uri]})
        const target = res.data.posts[0]
        const repostUri = target?.viewer?.repost

        if (repostUri) {
          await agent.deleteRepost(repostUri)
          return true
        }

        await agent.repost(post.uri, post.cid)
        return false
      })

      Toast.show(
        wasReposted
          ? l`Removed repost as @${account.handle}`
          : l`Reposted as @${account.handle}`,
      )
    } catch (e) {
      Toast.show(l`An issue occurred, please try again.`, {
        type: 'error',
      })
    }
  }

  const onSelectBookmarkAccount = async (
    account: (typeof accounts)[number],
  ) => {
    try {
      const wasBookmarked = await runWithEphemeralAgent(
        account,
        async agent => {
          const res = await agent.getPosts({uris: [post.uri]})
          const target = res.data.posts[0]

          if (target?.viewer?.bookmarked) {
            await agent.app.bsky.bookmark.deleteBookmark({uri: post.uri})
            return true
          }

          await agent.app.bsky.bookmark.createBookmark({
            uri: post.uri,
            cid: post.cid,
          })
          return false
        },
      )

      Toast.show(
        wasBookmarked
          ? l`Removed save as @${account.handle}`
          : l`Saved as @${account.handle}`,
      )
    } catch (e) {
      Toast.show(l`An issue occurred, please try again.`, {
        type: 'error',
      })
    }
  }

  const renderReplyButton = (onLongPress?: () => void) => (
    <PostControlButton
      testID="replyBtn"
      onPress={
        !replyDisabled
          ? () =>
              requireAuth(() => {
                ax.metric('post:clickReply', {
                  uri: post.uri,
                  authorDid: post.author.did,
                  logContext,
                  feedDescriptor,
                })
                onPressReply()
              })
          : undefined
      }
      onLongPress={onLongPress}
      label={l({
        message: `Reply (${plural(post.replyCount || 0, {
          one: '# reply',
          other: '# replies',
        })})`,
        comment:
          'Accessibility label for the reply button, verb form followed by number of replies and noun form',
      })}
      big={big}>
      <PostControlButtonIcon icon={Bubble} />
      <MetricCountLabel
        display={replyMetricsDisplay}
        count={post.replyCount ?? 0}
        labelOnly={plural(post.replyCount ?? 0, {
          one: 'reply',
          other: 'replies',
        })}
      />
    </PostControlButton>
  )

  const renderRepostButton = (onLongPress?: () => void) => (
    <RepostButton
      isReposted={!!post.viewer?.repost}
      repostCount={
        (shouldShowCountsMetricRow(repostsMetricsDisplay)
          ? (post.repostCount ?? 0)
          : 0) +
        (shouldShowCountsMetricRow(quotesMetricsDisplay)
          ? (post.quoteCount ?? 0)
          : 0)
      }
      metricsDisplay={
        (post.repostCount ?? 0) > 0
          ? repostsMetricsDisplay
          : quotesMetricsDisplay
      }
      onRepost={() => void onRepost()}
      onQuote={onQuote}
      onLongPress={onLongPress}
      big={big}
      embeddingDisabled={Boolean(post.viewer?.embeddingDisabled)}
    />
  )

  const renderLikeButton = (onLongPress?: () => void) => (
    <PostControlButton
      testID="likeBtn"
      big={big}
      active={Boolean(post.viewer?.like)}
      activeColor={t.palette.pink}
      onPress={() => requireAuth(() => onPressToggleLike())}
      onLongPress={onLongPress}
      label={
        post.viewer?.like
          ? l({
              message: `Unlike (${plural(post.likeCount || 0, {
                one: '# like',
                other: '# likes',
              })})`,
              comment:
                'Accessibility label for the like button when the post has been liked, verb followed by number of likes and noun',
            })
          : l({
              message: `Like (${plural(post.likeCount || 0, {
                one: '# like',
                other: '# likes',
              })})`,
              comment:
                'Accessibility label for the like button when the post has not been liked, verb form followed by number of likes and noun form',
            })
      }>
      <AnimatedLikeIcon
        isLiked={Boolean(post.viewer?.like)}
        big={big}
        hasBeenToggled={hasLikeIconBeenToggled}
      />
      {shouldShowCountsMetricRow(likesMetricsDisplay) ? (
        shouldShowCountsMetricLabelOnly(
          likesMetricsDisplay,
          post.likeCount ?? 0,
        ) ? (
          <MetricCountLabel
            display={likesMetricsDisplay}
            count={post.likeCount ?? 0}
            testID="likeCount"
            labelOnly={plural(post.likeCount ?? 0, {
              one: 'like',
              other: 'likes',
            })}
          />
        ) : (
          <CountWheel
            count={post.likeCount ?? 0}
            isToggled={Boolean(post.viewer?.like)}
            hasBeenToggled={hasLikeIconBeenToggled}
            renderCount={({count}) => (
              <PostControlButtonText testID="likeCount">
                {formatPostStatCount(count)}
              </PostControlButtonText>
            )}
          />
        )
      ) : null}
    </PostControlButton>
  )

  return (
    <>
      <View
        style={[
          a.flex_row,
          a.justify_between,
          a.align_center,
          !big && a.pt_2xs,
          a.gap_md,
          style,
        ]}>
        <View style={[a.flex_row, a.flex_1, {maxWidth: 320}]}>
          <View
            style={[
              a.flex_1,
              a.align_start,
              {marginLeft: big ? -2 : -6},
              replyDisabled ? {opacity: 0.6} : undefined,
            ]}>
            {hasAlternateAccounts && currentAccount ? (
              <EphemeralAccountSwitcherFromScope
                selectedDid={currentAccount.did}
                title={l`Reply as`}
                triggerBehavior="longPress"
                resolveAccounts={
                  isReplyGatedPost ? resolveReplyableAccounts : undefined
                }
                onSelectAccount={account => {
                  onReplyAsAccount(account.did)
                }}
                renderTrigger={({triggerProps}) =>
                  renderReplyButton(triggerProps.onLongPress)
                }
              />
            ) : (
              renderReplyButton()
            )}
          </View>
          <View style={[a.flex_1, a.align_start]}>
            {hasAlternateAccounts && currentAccount ? (
              <EphemeralAccountSwitcherFromScope
                selectedDid={currentAccount.did}
                title={l`Repost as`}
                triggerBehavior="longPress"
                onSelectAccount={account => {
                  void onSelectRepostAccount(account)
                }}
                renderTrigger={({triggerProps}) =>
                  renderRepostButton(triggerProps.onLongPress)
                }
              />
            ) : (
              renderRepostButton()
            )}
          </View>
          <View style={[a.flex_1, a.align_start]}>
            {hasAlternateAccounts && currentAccount ? (
              <EphemeralAccountSwitcherFromScope
                selectedDid={currentAccount.did}
                title={l`Like as`}
                triggerBehavior="longPress"
                onSelectAccount={account => {
                  void onSelectLikeAccount(account)
                }}
                renderTrigger={({triggerProps}) =>
                  renderLikeButton(triggerProps.onLongPress)
                }
              />
            ) : (
              renderLikeButton()
            )}
          </View>
          {/* Spacer! */}
          <View />
        </View>
        <View
          style={[a.flex_row, a.justify_end, secondaryControlSpacingStyles]}>
          {hasAlternateAccounts && currentAccount ? (
            <EphemeralAccountSwitcherFromScope
              selectedDid={currentAccount.did}
              title={l`Save as`}
              triggerBehavior="longPress"
              onSelectAccount={account => {
                void onSelectBookmarkAccount(account)
              }}
              renderTrigger={({triggerProps}) => (
                <BookmarkButton
                  post={post}
                  big={big}
                  logContext={logContext}
                  onLongPress={triggerProps.onLongPress}
                  hitSlop={{
                    right: secondaryControlSpacingStyles.gap / 2,
                  }}
                />
              )}
            />
          ) : (
            <BookmarkButton
              post={post}
              big={big}
              logContext={logContext}
              hitSlop={{
                right: secondaryControlSpacingStyles.gap / 2,
              }}
            />
          )}
          <ShareMenuButton
            testID="postShareBtn"
            post={post}
            big={big}
            record={record}
            richText={richText}
            timestamp={post.indexedAt}
            threadgateRecord={threadgateRecord}
            onShare={onShare}
            hitSlop={{
              left: secondaryControlSpacingStyles.gap / 2,
              right: secondaryControlSpacingStyles.gap / 2,
            }}
            logContext={logContext}
          />
          <PostMenuButton
            testID="postDropdownBtn"
            post={post}
            postFeedContext={feedContext}
            postReqId={reqId}
            big={big}
            record={record}
            richText={richText}
            timestamp={post.indexedAt}
            threadgateRecord={threadgateRecord}
            onShowLess={onShowLess}
            hitSlop={{
              left: secondaryControlSpacingStyles.gap / 2,
            }}
            logContext={logContext}
            forceGoogleTranslate={forceGoogleTranslate}
          />
        </View>
      </View>
    </>
  )
}

type PostControlsProps = Parameters<typeof PostControlsInner>[0]

const PostControls = memo(function PostControls(props: PostControlsProps) {
  const {accounts, currentAccount} = useSession()

  if (accounts.length < 2 || !currentAccount) {
    return <PostControlsInner {...props} />
  }

  return (
    <EphemeralAccountSwitcherScope
      selectedDid={currentAccount.did}
      currentProfileFromBatch>
      <PostControlsInner {...props} />
    </EphemeralAccountSwitcherScope>
  )
})
export {PostControls}

export function PostControlsSkeleton({
  big,
  style,
  variant,
}: {
  big?: boolean
  style?: StyleProp<ViewStyle>
  variant?: 'compact' | 'normal' | 'large'
}) {
  const {gtPhone} = useBreakpoints()

  const rowHeight = big ? 32 : 28
  const padding = 4
  const size = rowHeight - padding * 2

  const secondaryControlSpacingStyles = useSecondaryControlSpacingStyles({
    variant,
    big,
    gtPhone,
  })

  const itemStyles = {
    padding,
  }

  return (
    <Skele.Row
      style={[a.flex_row, a.justify_between, a.align_center, a.gap_md, style]}>
      <View style={[a.flex_row, a.flex_1, {maxWidth: 320}]}>
        <View
          style={[itemStyles, a.flex_1, a.align_start, {marginLeft: -padding}]}>
          <Skele.Pill blend size={size} />
        </View>

        <View style={[itemStyles, a.flex_1, a.align_start]}>
          <Skele.Pill blend size={size} />
        </View>

        <View style={[itemStyles, a.flex_1, a.align_start]}>
          <Skele.Pill blend size={size} />
        </View>
      </View>
      <View style={[a.flex_row, a.justify_end, secondaryControlSpacingStyles]}>
        <View style={itemStyles}>
          <Skele.Circle blend size={size} />
        </View>
        <View style={itemStyles}>
          <Skele.Circle blend size={size} />
        </View>
        <View style={itemStyles}>
          <Skele.Circle blend size={size} />
        </View>
      </View>
    </Skele.Row>
  )
}

function useSecondaryControlSpacingStyles({
  variant,
  big,
  gtPhone,
}: {
  variant?: 'compact' | 'normal' | 'large'
  big?: boolean
  gtPhone: boolean
}) {
  return useMemo(() => {
    let gap = 0 // default, we want `gap` to be defined on the resulting object
    if (variant !== 'compact') gap = a.gap_xs.gap
    if (big || gtPhone) gap = a.gap_sm.gap
    return {gap}
  }, [variant, big, gtPhone])
}
