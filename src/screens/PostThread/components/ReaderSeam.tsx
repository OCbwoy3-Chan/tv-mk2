import {useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import Animated, {FadeIn} from 'react-native-reanimated'
import {type AppBskyFeedDefs, type AppBskyFeedThreadgate} from '@atproto/api'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {CountWheel} from '#/lib/custom-animations/CountWheel'
import {AnimatedLikeIcon} from '#/lib/custom-animations/LikeIcon'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {
  POST_TOMBSTONE,
  type Shadow,
  usePostShadow,
} from '#/state/cache/post-shadow'
import {useFeedFeedback} from '#/state/feed-feedback'
import {
  usePostLikeMutationQueue,
  usePostRepostMutationQueue,
} from '#/state/queries/post'
import {
  threadgateRecordToAllowUISetting,
  threadgateViewToAllowUISetting,
} from '#/state/queries/threadgate/util'
import {useRequireAuth, useSession, useSessionApi} from '#/state/session'
import {type OnPostSuccessData} from '#/state/shell/composer'
import {ReaderSeamReplies} from '#/screens/PostThread/components/ReaderSeamControls'
import {ThreadComposePromptPill} from '#/screens/PostThread/components/ThreadComposePrompt'
import {
  OUTER_SPACE,
  READER_BRACKET_WIDTH,
  READER_SEAM_HEIGHT,
} from '#/screens/PostThread/const'
import {type ThreadPostItem} from '#/screens/PostThread/reader'
import {atoms as a, useTheme} from '#/alf'
import {EphemeralAccountSwitcher} from '#/components/EphemeralAccountSwitcher'
import {useRunWithEphemeralAgent} from '#/components/hooks/useRunWithEphemeralAgent'
import {Reply as ReplyIcon} from '#/components/icons/Reply'
import {fetchReplyableSwitcherAccounts} from '#/components/PostControls/alternateAccountsReplyEligibility'
import {
  PostControlButton,
  PostControlButtonIcon,
  PostControlButtonText,
} from '#/components/PostControls/PostControlButton'
import {RepostButton} from '#/components/PostControls/RepostButton'
import {useFormatPostStatCount} from '#/components/PostControls/util'
import * as Toast from '#/components/Toast'

/**
 * The toggle rendered after a reader post, inside its bracket. Collapsed it
 * shows a compact, right-aligned action bar (reply, repost, like) on a
 * hairline; tapping reply reveals the post's replies and a compose prompt.
 * Expects its parent to provide the post's horizontal padding; replies break
 * out to full width.
 */
export function ReaderSeam({
  post,
  expanded,
  hiddenReplyCount,
  continuationUri,
  href,
  sort,
  isThreadEnd = false,
  onToggle,
  onPostSuccess,
  threadgateRecord,
}: {
  post: ThreadPostItem
  expanded: boolean
  hiddenReplyCount: number
  continuationUri: string
  href: string
  sort: string
  /**
   * Last post in the OP chain with no "Read more replies" below. Collapsed
   * seams get a modest trailing spacer (smaller than the expanded-reply gap).
   */
  isThreadEnd?: boolean
  onToggle: () => void
  onPostSuccess?: (data: OnPostSuccessData) => void
  threadgateRecord?: AppBskyFeedThreadgate.Record
}) {
  const postShadow = usePostShadow(post.value.post)

  if (postShadow === POST_TOMBSTONE) {
    return null
  }

  return (
    <ReaderSeamInner
      post={post}
      postShadow={postShadow}
      expanded={expanded}
      hiddenReplyCount={hiddenReplyCount}
      continuationUri={continuationUri}
      href={href}
      sort={sort}
      isThreadEnd={isThreadEnd}
      onToggle={onToggle}
      onPostSuccess={onPostSuccess}
      threadgateRecord={threadgateRecord}
    />
  )
}

function ReaderSeamInner({
  post,
  postShadow,
  expanded,
  hiddenReplyCount,
  continuationUri,
  href,
  sort,
  isThreadEnd,
  onToggle,
  onPostSuccess,
  threadgateRecord,
}: {
  post: ThreadPostItem
  postShadow: Shadow<AppBskyFeedDefs.PostView>
  expanded: boolean
  hiddenReplyCount: number
  continuationUri: string
  href: string
  sort: string
  isThreadEnd: boolean
  onToggle: () => void
  onPostSuccess?: (data: OnPostSuccessData) => void
  threadgateRecord?: AppBskyFeedThreadgate.Record
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {accounts, currentAccount, hasSession} = useSession()
  const {createEphemeralAgent} = useSessionApi()
  const queryClient = useQueryClient()
  const runWithEphemeralAgent = useRunWithEphemeralAgent()
  const [hovered, setHovered] = useState(false)
  const lineVisible = hovered || expanded
  const requireAuth = useRequireAuth()
  const {openComposer} = useOpenComposer()
  const formatPostStatCount = useFormatPostStatCount()
  const feedFeedback = useFeedFeedback(undefined, hasSession)
  const logContext = 'PostThreadItem'

  const shadow = postShadow
  const record = post.value.post.record
  const moderation = post.moderation
  const isReplyGatedPost = useMemo(() => {
    const settings = threadgateRecord
      ? threadgateRecordToAllowUISetting(threadgateRecord)
      : threadgateViewToAllowUISetting(shadow.threadgate)
    return !(settings.length === 1 && settings[0].type === 'everybody')
  }, [shadow.threadgate, threadgateRecord])
  const hasAlternateAccounts = accounts.length > 1
  const switcherAccounts = useMemo(
    () =>
      accounts
        .filter(account => account.did !== currentAccount?.did)
        .map(account => ({account})),
    [accounts, currentAccount?.did],
  )

  const [queueLike, queueUnlike] = usePostLikeMutationQueue(
    shadow,
    undefined,
    feedFeedback.feedDescriptor,
    logContext,
  )
  const [queueRepost, queueUnrepost] = usePostRepostMutationQueue(
    shadow,
    undefined,
    feedFeedback.feedDescriptor,
    logContext,
  )

  const isBlocked = Boolean(
    shadow.author.viewer?.blocking ||
    shadow.author.viewer?.blockedBy ||
    shadow.author.viewer?.blockingByList,
  )

  const [hasLikeBeenToggled, setHasLikeBeenToggled] = useState(false)

  const onPressToggleLike = async () => {
    if (isBlocked) {
      Toast.show(l`Cannot interact with a blocked user`, {type: 'warning'})
      return
    }
    try {
      setHasLikeBeenToggled(true)
      if (!shadow.viewer?.like) {
        await queueLike()
      } else {
        await queueUnlike()
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') throw err
    }
  }

  const onRepost = async () => {
    if (isBlocked) {
      Toast.show(l`Cannot interact with a blocked user`, {type: 'warning'})
      return
    }
    try {
      if (!shadow.viewer?.repost) {
        await queueRepost()
      } else {
        await queueUnrepost()
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') throw err
    }
  }

  const onQuote = () => {
    if (isBlocked) {
      Toast.show(l`Cannot interact with a blocked user`, {type: 'warning'})
      return
    }
    openComposer({quote: shadow, logContext: 'QuotePost'})
  }

  const onPressReply = (activeAccountDid?: string) => {
    openComposer({
      activeAccountDid,
      replyTo: {
        uri: shadow.uri,
        cid: shadow.cid,
        text: record.text,
        author: shadow.author,
        embed: shadow.embed,
        moderation,
        langs: record.langs,
      },
      onPostSuccess,
      logContext: 'PostReply',
    })
  }

  const resolveReplyableAccounts = useCallback(async () => {
    const replyableAccounts = await fetchReplyableSwitcherAccounts({
      queryClient,
      postUri: shadow.uri,
      switcherAccounts,
      createEphemeralAgent,
    })
    if (replyableAccounts.length === 0) {
      Toast.show(l`No other accounts can reply to this post`, {
        type: 'warning',
      })
    }
    return replyableAccounts
  }, [createEphemeralAgent, l, queryClient, shadow.uri, switcherAccounts])

  const onSelectLikeAccount = async (account: (typeof accounts)[number]) => {
    try {
      const wasLiked = await runWithEphemeralAgent(account, async agent => {
        const res = await agent.getPosts({uris: [shadow.uri]})
        const target = res.data.posts[0]
        const likeUri = target?.viewer?.like

        if (likeUri) {
          await agent.deleteLike(likeUri)
          return true
        }

        await agent.like(shadow.uri, shadow.cid)
        return false
      })

      Toast.show(
        wasLiked
          ? l`Removed like as @${account.handle}`
          : l`Liked as @${account.handle}`,
      )
    } catch {
      Toast.show(l`An issue occurred, please try again.`, {type: 'error'})
    }
  }

  const onSelectRepostAccount = async (account: (typeof accounts)[number]) => {
    try {
      const wasReposted = await runWithEphemeralAgent(account, async agent => {
        const res = await agent.getPosts({uris: [shadow.uri]})
        const target = res.data.posts[0]
        const repostUri = target?.viewer?.repost

        if (repostUri) {
          await agent.deleteRepost(repostUri)
          return true
        }

        await agent.repost(shadow.uri, shadow.cid)
        return false
      })

      Toast.show(
        wasReposted
          ? l`Removed repost as @${account.handle}`
          : l`Reposted as @${account.handle}`,
      )
    } catch {
      Toast.show(l`An issue occurred, please try again.`, {type: 'error'})
    }
  }

  const renderReplyButton = (onLongPress?: () => void) => (
    <PostControlButton
      active={expanded}
      onPress={() => onToggle()}
      onLongPress={onLongPress}
      label={l({
        message: `Replies (${plural(hiddenReplyCount, {
          one: '# reply',
          other: '# replies',
        })})`,
        comment: 'Reader seam reply toggle, noun form with reply count',
      })}>
      <PostControlButtonIcon icon={ReplyIcon} />
      {hiddenReplyCount > 0 && (
        <PostControlButtonText>
          {formatPostStatCount(hiddenReplyCount)}
        </PostControlButtonText>
      )}
    </PostControlButton>
  )

  const renderRepostButton = (onLongPress?: () => void) => (
    <RepostButton
      isReposted={!!shadow.viewer?.repost}
      repostCount={(shadow.repostCount ?? 0) + (shadow.quoteCount ?? 0)}
      onRepost={() => void onRepost()}
      onQuote={onQuote}
      onLongPress={onLongPress}
      embeddingDisabled={Boolean(shadow.viewer?.embeddingDisabled)}
    />
  )

  const renderLikeButton = (onLongPress?: () => void) => (
    <PostControlButton
      active={Boolean(shadow.viewer?.like)}
      activeColor={t.palette.pink}
      onPress={() => requireAuth(() => onPressToggleLike())}
      onLongPress={onLongPress}
      label={
        shadow.viewer?.like
          ? l({
              message: `Unlike (${plural(shadow.likeCount || 0, {
                one: '# like',
                other: '# likes',
              })})`,
              comment: 'Like button, liked state',
            })
          : l({
              message: `Like (${plural(shadow.likeCount || 0, {
                one: '# like',
                other: '# likes',
              })})`,
              comment: 'Like button, unliked state',
            })
      }>
      <AnimatedLikeIcon
        isLiked={Boolean(shadow.viewer?.like)}
        hasBeenToggled={hasLikeBeenToggled}
      />
      <CountWheel
        count={shadow.likeCount ?? 0}
        isToggled={Boolean(shadow.viewer?.like)}
        hasBeenToggled={hasLikeBeenToggled}
        renderCount={({count}) => (
          <PostControlButtonText>
            {formatPostStatCount(count)}
          </PostControlButtonText>
        )}
      />
    </PostControlButton>
  )

  return (
    <>
      {/* Fixed height + align_center keep the hairline at the icons' vertical
          center, where the bracket's bottom cap is placed to meet it */}
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.gap_sm,
          {height: READER_SEAM_HEIGHT},
        ]}>
        {/* flex_1 keeps the line left of the buttons. alignSelf + marginTop
            place it at exactly READER_SEAM_HEIGHT/2 - 1 from the row top,
            matching the bracket borderBottom at bottom: READER_SEAM_HEIGHT/2 */}
        <View
          style={[
            a.flex_1,
            a.transition_opacity,
            {
              alignSelf: 'flex-start',
              marginTop: READER_SEAM_HEIGHT / 2 - 1,
              height: READER_BRACKET_WIDTH,
              opacity: lineVisible ? 1 : 0,
              backgroundColor: t.atoms.border_contrast_low.borderColor,
            },
          ]}
        />
        <View
          // @ts-ignore — web-only
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={[a.flex_row, a.align_center, a.ml_auto]}>
          {hasAlternateAccounts && currentAccount ? (
            <EphemeralAccountSwitcher
              selectedDid={currentAccount.did}
              title={l`Reply as`}
              triggerBehavior="longPress"
              resolveAccounts={
                isReplyGatedPost ? resolveReplyableAccounts : undefined
              }
              onSelectAccount={account => {
                onPressReply(account.did)
              }}
              renderTrigger={({triggerProps}) =>
                renderReplyButton(triggerProps.onLongPress)
              }
            />
          ) : (
            renderReplyButton()
          )}
          {hasAlternateAccounts && currentAccount ? (
            <EphemeralAccountSwitcher
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
          {hasAlternateAccounts && currentAccount ? (
            <EphemeralAccountSwitcher
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
      </View>

      {expanded && (
        <Animated.View entering={FadeIn.duration(150)}>
          <ThreadComposePromptPill onPress={() => onPressReply()} />
          <View style={[a.border_t, a.mt_xs, t.atoms.border_contrast_low]} />
        </Animated.View>
      )}

      {expanded && hiddenReplyCount > 0 && (
        <Animated.View
          entering={FadeIn.duration(150)}
          // Break out of the post's padding so replies sit at full width
          style={[{marginHorizontal: -OUTER_SPACE}]}>
          <ReaderSeamReplies
            uri={shadow.uri}
            continuationUri={continuationUri}
            hiddenReplyCount={hiddenReplyCount}
            href={href}
            sort={sort}
            onPostSuccess={onPostSuccess}
            threadgateRecord={threadgateRecord}
          />
        </Animated.View>
      )}
      {/*
       * Expanded: same gap as between consecutive reader segments.
       * Collapsed thread end: smaller spacer before Also liked / page end.
       */}
      {expanded ? (
        <View style={[a.pb_lg]} />
      ) : (
        isThreadEnd && <View style={[a.pb_sm]} />
      )}
    </>
  )
}
