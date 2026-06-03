import {memo, useMemo} from 'react'
import {Text as RNText, View} from 'react-native'
import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  type AppBskyFeedThreadgate,
  AtUri,
  RichText as RichTextAPI,
} from '@atproto/api'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {
  type CountsMetricsDisplay,
  formatCountsMetricNumber,
  shouldShowCountsMetricLabelOnly,
  shouldShowThreadExpandedMetric,
} from '#/lib/metrics-display'
import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {niceDate} from '#/lib/strings/time'
import {
  POST_TOMBSTONE,
  type Shadow,
  usePostShadow,
} from '#/state/cache/post-shadow'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {FeedFeedbackProvider, useFeedFeedback} from '#/state/feed-feedback'
import {useCompactPosts} from '#/state/preferences/compact-posts'
import {useEnableSquareAvatars} from '#/state/preferences/enable-square-avatars'
import {useEnableSquareButtons} from '#/state/preferences/enable-square-buttons'
import {useHideScaryFollowButtons} from '#/state/preferences/hide-scary-follow-buttons'
import {
  useLikesMetricsDisplay,
  useQuotesMetricsDisplay,
  useRepostsMetricsDisplay,
  useSavesMetricsDisplay,
} from '#/state/preferences/metrics-display-preference'
import {useShowViaClient} from '#/state/preferences/show-via-client'
import {type ThreadItem} from '#/state/queries/usePostThread/types'
import {useSession} from '#/state/session'
import {type OnPostSuccessData} from '#/state/shell/composer'
import {useMergedThreadgateHiddenReplies} from '#/state/threadgate-hidden-replies'
import {type PostSource} from '#/state/unstable-post-source'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {ThreadItemAnchorFollowButton} from '#/screens/PostThread/components/ThreadItemAnchorFollowButton'
import {
  LINEAR_AVI_WIDTH,
  OUTER_SPACE,
  REPLY_LINE_WIDTH,
} from '#/screens/PostThread/const'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {DebugFieldDisplay} from '#/components/DebugFieldDisplay'
import {CalendarClock_Stroke2_Corner0_Rounded as CalendarClockIcon} from '#/components/icons/CalendarClock'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import {GalleryBleed} from '#/components/images/Gallery'
import {Link} from '#/components/Link'
import {ContentHider} from '#/components/moderation/ContentHider'
import {LabelsOnMyPost} from '#/components/moderation/LabelsOnMe'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {type AppModerationCause} from '#/components/Pills'
import {Embed, PostEmbedViewContext} from '#/components/Post/Embed'
import {TranslatedPost} from '#/components/Post/Translated'
import {PostControls, PostControlsSkeleton} from '#/components/PostControls'
import {ProfileBadges} from '#/components/ProfileBadges'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import * as Prompt from '#/components/Prompt'
import {RichText} from '#/components/RichText'
import * as Skele from '#/components/Skeleton'
import {Text} from '#/components/Typography'
import {WhoCanReply} from '#/components/WhoCanReply'
import {useAnalytics} from '#/analytics'
import {useActorStatus} from '#/features/liveNow'
import * as bsky from '#/types/bsky'

export function ThreadItemAnchor({
  item,
  onPostSuccess,
  threadgateRecord,
  postSource,
}: {
  item: Extract<ThreadItem, {type: 'threadPost'}>
  onPostSuccess?: (data: OnPostSuccessData) => void
  threadgateRecord?: AppBskyFeedThreadgate.Record
  postSource?: PostSource
}) {
  const postShadow = usePostShadow(item.value.post)
  const threadRootUri = item.value.post.record.reply?.root?.uri || item.uri
  const isRoot = threadRootUri === item.uri

  if (postShadow === POST_TOMBSTONE) {
    return <ThreadItemAnchorDeleted isRoot={isRoot} />
  }

  return (
    <ThreadItemAnchorInner
      // Safeguard from clobbering per-post state below:
      key={postShadow.uri}
      item={item}
      isRoot={isRoot}
      postShadow={postShadow}
      onPostSuccess={onPostSuccess}
      threadgateRecord={threadgateRecord}
      postSource={postSource}
    />
  )
}

function ThreadItemAnchorDeleted({isRoot}: {isRoot: boolean}) {
  const t = useTheme()

  return (
    <>
      <ThreadItemAnchorParentReplyLine isRoot={isRoot} />

      <View
        style={[
          {
            paddingHorizontal: OUTER_SPACE,
            paddingBottom: OUTER_SPACE,
          },
          isRoot && [a.pt_lg],
        ]}>
        <View
          style={[
            a.flex_row,
            a.align_center,
            a.py_md,
            a.rounded_sm,
            t.atoms.bg_contrast_25,
          ]}>
          <View
            style={[
              a.flex_row,
              a.align_center,
              a.justify_center,
              {
                width: LINEAR_AVI_WIDTH,
              },
            ]}>
            <TrashIcon style={[t.atoms.text_contrast_medium]} />
          </View>
          <Text
            style={[a.text_md, a.font_semi_bold, t.atoms.text_contrast_medium]}>
            <Trans>Post has been deleted</Trans>
          </Text>
        </View>
      </View>
    </>
  )
}

function ThreadItemAnchorParentReplyLine({
  isRoot,
  compactPosts = false,
}: {
  isRoot: boolean
  compactPosts?: boolean
}) {
  const t = useTheme()
  const avatarSize = compactPosts ? 34 : 42
  const sidePadding = compactPosts ? OUTER_SPACE - 2 : OUTER_SPACE

  return !isRoot ? (
    <View
      style={[
        a.flex_row,
        compactPosts ? a.pb_2xs : a.pb_xs,
        {
          paddingLeft: sidePadding,
          height: compactPosts ? a.pt_md.paddingTop : a.pt_lg.paddingTop,
        },
      ]}>
      <View style={{width: avatarSize}}>
        <View
          style={[
            {
              width: REPLY_LINE_WIDTH,
              marginLeft: 'auto',
              marginRight: 'auto',
              flexGrow: 1,
              backgroundColor: t.atoms.border_contrast_low.borderColor,
            },
          ]}
        />
      </View>
    </View>
  ) : null
}

const ThreadItemAnchorInner = memo(function ThreadItemAnchorInner({
  item,
  isRoot,
  postShadow,
  onPostSuccess,
  threadgateRecord,
  postSource,
}: {
  item: Extract<ThreadItem, {type: 'threadPost'}>
  isRoot: boolean
  postShadow: Shadow<AppBskyFeedDefs.PostView>
  onPostSuccess?: (data: OnPostSuccessData) => void
  threadgateRecord?: AppBskyFeedThreadgate.Record
  postSource?: PostSource
}) {
  const t = useTheme()
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const {openComposer} = useOpenComposer()
  const {currentAccount, hasSession} = useSession()
  const feedFeedback = useFeedFeedback(postSource?.feedSourceInfo, hasSession)
  const compactPosts = useCompactPosts()
  const isCompactPosts = !!compactPosts
  const avatarSize = isCompactPosts ? 34 : 42
  const sidePadding = isCompactPosts ? OUTER_SPACE - 2 : OUTER_SPACE

  const post = postShadow
  const record = item.value.post.record
  const moderation = item.moderation
  const authorShadow = useProfileShadow(post.author)
  const {isActive: live} = useActorStatus(post.author)
  const richText = useMemo(
    () =>
      new RichTextAPI({
        text: record.text,
        facets: record.facets,
      }),
    [record],
  )

  const threadRootUri = record.reply?.root?.uri || post.uri
  const authorHref = makeProfileLink(post.author)
  const displayName = sanitizeDisplayName(
    post.author.displayName || sanitizeHandle(post.author.handle),
    moderation.ui('displayName'),
  )
  const isAllLowercaseDisplayName =
    displayName === displayName.toLowerCase() && /[a-z]/.test(displayName)
  const isThreadAuthor = getThreadAuthor(post, record) === currentAccount?.did

  const likesMetricsDisplay = useLikesMetricsDisplay()
  const repostsMetricsDisplay = useRepostsMetricsDisplay()
  const quotesMetricsDisplay = useQuotesMetricsDisplay()
  const savesMetricsDisplay = useSavesMetricsDisplay()

  const likesHref = useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey, 'liked-by')
  }, [post.uri, post.author])
  const repostsHref = useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey, 'reposted-by')
  }, [post.uri, post.author])
  const quotesHref = useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey, 'quotes')
  }, [post.uri, post.author])

  const threadgateHiddenReplies = useMergedThreadgateHiddenReplies({
    threadgateRecord,
  })
  const additionalPostAlerts: AppModerationCause[] = useMemo(() => {
    const isPostHiddenByThreadgate = threadgateHiddenReplies.has(post.uri)
    const isControlledByViewer =
      new AtUri(threadRootUri).host === currentAccount?.did
    return isControlledByViewer && isPostHiddenByThreadgate
      ? [
          {
            type: 'reply-hidden',
            source: {type: 'user', did: currentAccount?.did},
            priority: 6,
          },
        ]
      : []
  }, [post, currentAccount?.did, threadgateHiddenReplies, threadRootUri])
  const onlyFollowersCanReply = !!threadgateRecord?.allow?.find(
    rule => rule.$type === 'app.bsky.feed.threadgate#followerRule',
  )
  const hideScaryFollowButtons = useHideScaryFollowButtons()
  const showFollowButton =
    currentAccount?.did !== post.author.did &&
    !onlyFollowersCanReply &&
    !hideScaryFollowButtons

  const viaRepost = useMemo(() => {
    const reason = postSource?.post.reason

    if (AppBskyFeedDefs.isReasonRepost(reason) && reason.uri && reason.cid) {
      return {
        uri: reason.uri,
        cid: reason.cid,
      }
    }
  }, [postSource])

  const onPressReply = useNonReactiveCallback(() => {
    openComposer({
      replyTo: {
        uri: post.uri,
        cid: post.cid,
        text: record.text,
        author: post.author,
        embed: post.embed,
        moderation,
        langs: record.langs,
      },
      onPostSuccess: onPostSuccess,
      logContext: 'PostReply',
    })

    if (postSource) {
      feedFeedback.sendInteraction({
        item: post.uri,
        event: 'app.bsky.feed.defs#interactionReply',
        feedContext: postSource.post.feedContext,
        reqId: postSource.post.reqId,
      })
    }
  })

  const onOpenAuthor = () => {
    ax.metric('post:clickthroughAuthor', {
      uri: post.uri,
      authorDid: post.author.did,
      logContext: 'PostThreadItem',
      feedDescriptor: feedFeedback.feedDescriptor,
    })
    if (postSource) {
      feedFeedback.sendInteraction({
        item: post.uri,
        event: 'app.bsky.feed.defs#clickthroughAuthor',
        feedContext: postSource.post.feedContext,
        reqId: postSource.post.reqId,
      })
    }
  }

  const onOpenEmbed = () => {
    ax.metric('post:clickthroughEmbed', {
      uri: post.uri,
      authorDid: post.author.did,
      logContext: 'PostThreadItem',
      feedDescriptor: feedFeedback.feedDescriptor,
    })
    if (postSource) {
      feedFeedback.sendInteraction({
        item: post.uri,
        event: 'app.bsky.feed.defs#clickthroughEmbed',
        feedContext: postSource.post.feedContext,
        reqId: postSource.post.reqId,
      })
    }
  }

  return (
    <>
      <ThreadItemAnchorParentReplyLine
        isRoot={isRoot}
        compactPosts={isCompactPosts}
      />
      <GalleryBleed>
        <View
          testID={`postThreadItem-by-${post.author.handle}`}
          style={[
            {
              paddingHorizontal: sidePadding,
            },
            isRoot && [isCompactPosts ? a.pt_md : a.pt_lg],
          ]}>
          <View
            style={[
              a.flex_row,
              a.align_start,
              isCompactPosts ? a.gap_sm : a.gap_md,
              isCompactPosts ? a.pb_sm : a.pb_md,
            ]}>
            <View collapsable={false}>
              <PreviewableUserAvatar
                size={avatarSize}
                profile={post.author}
                moderation={moderation.ui('avatar')}
                type={post.author.associated?.labeler ? 'labeler' : 'user'}
                live={live}
                onBeforePress={onOpenAuthor}
              />
            </View>
            <Link
              to={authorHref}
              style={[
                a.flex_1,
                isCompactPosts && {
                  marginTop: isAllLowercaseDisplayName ? -4 : -3,
                },
              ]}
              label={displayName}
              onPress={onOpenAuthor}>
              <View style={[a.flex_1, a.align_start]}>
                <ProfileHoverCard did={post.author.did} style={[a.w_full]}>
                  <View style={[a.flex_row, a.align_center]}>
                    <Text
                      emoji
                      style={[
                        a.flex_shrink,
                        isCompactPosts ? a.text_md : a.text_lg,
                        a.font_semi_bold,
                        a.leading_snug,
                      ]}
                      numberOfLines={1}>
                      {displayName}
                    </Text>

                    <View
                      style={[
                        a.pl_xs,
                        a.flex_row,
                        a.gap_2xs,
                        a.align_center,
                        isCompactPosts && {marginTop: 1},
                      ]}>
                      <ProfileBadges
                        profile={authorShadow}
                        size="md"
                        interactive
                      />
                    </View>
                  </View>
                  <Text
                    style={[
                      isCompactPosts ? a.text_sm : a.text_md,
                      a.leading_snug,
                      t.atoms.text_contrast_medium,
                    ]}
                    numberOfLines={1}>
                    {sanitizeHandle(post.author.handle, '@')}
                  </Text>
                </ProfileHoverCard>
              </View>
            </Link>
            <View collapsable={false} style={[a.self_start]}>
              <ThreadItemAnchorFollowButton
                did={post.author.did}
                enabled={showFollowButton}
              />
            </View>
          </View>
          <View style={[isCompactPosts ? a.pb_2xs : a.pb_sm]}>
            <LabelsOnMyPost
              post={post}
              style={[isCompactPosts ? a.pb_2xs : a.pb_sm]}
            />
            <ContentHider
              modui={moderation.ui('contentView')}
              ignoreMute
              childContainerStyle={[isCompactPosts ? a.pt_2xs : a.pt_sm]}>
              <PostAlerts
                modui={moderation.ui('contentView')}
                size={isCompactPosts ? 'sm' : 'lg'}
                includeMute
                style={[isCompactPosts ? a.pb_2xs : a.pb_sm]}
                additionalCauses={additionalPostAlerts}
              />
              {richText?.text ? (
                <RichText
                  enableTags
                  selectable
                  value={richText}
                  style={[a.flex_1, isCompactPosts ? a.text_md : a.text_lg]}
                  authorHandle={post.author.handle}
                  shouldProxyLinks={true}
                />
              ) : undefined}
              <TranslatedPost
                post={post}
                postTextStyle={[isCompactPosts ? a.text_md : a.text_lg]}
              />
              {post.embed && (
                <View
                  style={[
                    richText?.text ? (isCompactPosts ? a.py_2xs : a.py_xs) : [],
                  ]}>
                  <Embed
                    embed={post.embed}
                    moderation={moderation}
                    viewContext={PostEmbedViewContext.ThreadHighlighted}
                    onOpen={onOpenEmbed}
                  />
                </View>
              )}
            </ContentHider>
            <ExpandedPostDetails
              post={item.value.post}
              isThreadAuthor={isThreadAuthor}
              compactPosts={isCompactPosts}
            />
            {shouldShowThreadExpandedMetric(
              repostsMetricsDisplay,
              post.repostCount,
            ) ||
            shouldShowThreadExpandedMetric(
              likesMetricsDisplay,
              post.likeCount,
            ) ||
            shouldShowThreadExpandedMetric(
              quotesMetricsDisplay,
              post.quoteCount,
            ) ||
            shouldShowThreadExpandedMetric(
              savesMetricsDisplay,
              post.bookmarkCount,
            ) ? (
              // Show this section unless we're *sure* it has no engagement.
              <View
                style={[
                  a.flex_row,
                  a.flex_wrap,
                  a.align_center,
                  {
                    rowGap: a.gap_sm.gap,
                    columnGap: a.gap_lg.gap,
                  },
                  a.border_t,
                  a.border_b,
                  isCompactPosts ? a.mt_sm : a.mt_md,
                  isCompactPosts ? a.py_sm : a.py_md,
                  t.atoms.border_contrast_low,
                ]}>
                {shouldShowThreadExpandedMetric(
                  repostsMetricsDisplay,
                  post.repostCount,
                ) ? (
                  <Link to={repostsHref} label={l`Reposts of this post`}>
                    <ThreadExpandedMetricText
                      testID="repostCount-expanded"
                      display={repostsMetricsDisplay}
                      count={post.repostCount!}
                      one="repost"
                      other="reposts"
                    />
                  </Link>
                ) : null}
                {shouldShowThreadExpandedMetric(
                  quotesMetricsDisplay,
                  post.quoteCount,
                ) && !post.viewer?.embeddingDisabled ? (
                  <Link to={quotesHref} label={l`Quotes of this post`}>
                    <ThreadExpandedMetricText
                      testID="quoteCount-expanded"
                      display={quotesMetricsDisplay}
                      count={post.quoteCount!}
                      one="quote"
                      other="quotes"
                    />
                  </Link>
                ) : null}
                {shouldShowThreadExpandedMetric(
                  likesMetricsDisplay,
                  post.likeCount,
                ) ? (
                  <Link to={likesHref} label={l`Likes on this post`}>
                    <ThreadExpandedMetricText
                      testID="likeCount-expanded"
                      display={likesMetricsDisplay}
                      count={post.likeCount!}
                      one="like"
                      other="likes"
                    />
                  </Link>
                ) : null}
                {shouldShowThreadExpandedMetric(
                  savesMetricsDisplay,
                  post.bookmarkCount,
                ) ? (
                  <ThreadExpandedMetricText
                    testID="bookmarkCount-expanded"
                    display={savesMetricsDisplay}
                    count={post.bookmarkCount!}
                    one="save"
                    other="saves"
                  />
                ) : null}
              </View>
            ) : null}
            <View
              style={[
                isCompactPosts ? a.pt_2xs : a.pt_sm,
                a.pb_2xs,
                !isCompactPosts && {
                  marginLeft: -5,
                },
              ]}>
              <FeedFeedbackProvider value={feedFeedback}>
                <PostControls
                  big={!isCompactPosts}
                  variant={isCompactPosts ? 'compact' : undefined}
                  post={postShadow}
                  record={record}
                  richText={richText}
                  onPressReply={onPressReply}
                  logContext="PostThreadItem"
                  threadgateRecord={threadgateRecord}
                  feedContext={postSource?.post?.feedContext}
                  reqId={postSource?.post?.reqId}
                  viaRepost={viaRepost}
                />
              </FeedFeedbackProvider>
            </View>
            <DebugFieldDisplay subject={post} />
          </View>
        </View>
      </GalleryBleed>
    </>
  )
})

function ExpandedPostDetails({
  post,
  isThreadAuthor,
  compactPosts,
}: {
  post: Extract<ThreadItem, {type: 'threadPost'}>['value']['post']
  isThreadAuthor: boolean
  compactPosts: boolean
}) {
  const t = useTheme()
  const {i18n} = useLingui()
  const showViaClient = useShowViaClient()
  const isRootPost = !('reply' in post.record)
  const via = post.record.via as string | undefined

  return (
    <View
      style={[
        compactPosts ? a.gap_sm : a.gap_md,
        compactPosts ? a.pt_sm : a.pt_md,
        a.align_start,
      ]}>
      <BackdatedPostIndicator post={post} />
      <View style={[a.flex_row, a.align_center, a.flex_wrap, a.gap_sm]}>
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          {niceDate(i18n, post.indexedAt, 'dot separated')}
          {showViaClient && via ? ` · ${truncateVia(via)}` : null}
        </Text>
        {isRootPost && (
          <WhoCanReply post={post} isThreadAuthor={isThreadAuthor} />
        )}
      </View>
    </View>
  )
}

function truncateVia(via: string) {
  return via.length > 24 ? `${via.slice(0, 23)}…` : via
}

function BackdatedPostIndicator({post}: {post: AppBskyFeedDefs.PostView}) {
  const t = useTheme()
  const {t: l, i18n} = useLingui()
  const control = Prompt.usePromptControl()
  const enableSquareButtons = useEnableSquareButtons()

  const indexedAt = new Date(post.indexedAt)
  const createdAt = bsky.dangerousIsType<AppBskyFeedPost.Record>(
    post.record,
    AppBskyFeedPost.isRecord,
  )
    ? new Date(post.record.createdAt)
    : new Date(post.indexedAt)

  // backdated if createdAt is 24 hours or more before indexedAt
  const isBackdated =
    indexedAt.getTime() - createdAt.getTime() > 24 * 60 * 60 * 1000

  if (!isBackdated) return null

  return (
    <>
      <Button
        label={l`Archived post`}
        accessibilityHint={l`Shows information about when this post was created`}
        onPress={e => {
          e.preventDefault()
          e.stopPropagation()
          control.open()
        }}>
        {({hovered, pressed}) => (
          <View
            style={[
              a.flex_row,
              a.align_center,
              enableSquareButtons ? a.rounded_sm : a.rounded_full,
              t.atoms.bg_contrast_25,
              (hovered || pressed) && t.atoms.bg_contrast_50,
              {
                gap: 3,
                paddingHorizontal: 6,
                paddingVertical: 3,
              },
            ]}>
            <CalendarClockIcon fill={t.palette.yellow} size="sm" aria-hidden />
            <Text
              style={[
                a.text_xs,
                a.font_semi_bold,
                a.leading_tight,
                t.atoms.text_contrast_medium,
              ]}>
              <Trans>Archived from {niceDate(i18n, createdAt, 'medium')}</Trans>
            </Text>
          </View>
        )}
      </Button>

      <Prompt.Outer control={control}>
        <Prompt.Content>
          <Prompt.TitleText>
            <Trans>Archived post</Trans>
          </Prompt.TitleText>
          <Prompt.DescriptionText>
            <Trans>
              This post claims to have been created on{' '}
              <RNText style={[a.font_semi_bold]}>
                {niceDate(i18n, createdAt)}
              </RNText>
              , but was first seen by Bluesky on{' '}
              <RNText style={[a.font_semi_bold]}>
                {niceDate(i18n, indexedAt)}
              </RNText>
              .
            </Trans>
          </Prompt.DescriptionText>
          <Prompt.DescriptionText>
            <Trans>
              Bluesky cannot confirm the authenticity of the claimed date.
            </Trans>
          </Prompt.DescriptionText>
        </Prompt.Content>
        <Prompt.Actions>
          <Prompt.Action cta={l`Okay`} onPress={() => {}} />
        </Prompt.Actions>
      </Prompt.Outer>
    </>
  )
}

function ThreadExpandedMetricText({
  testID,
  display,
  count,
  one,
  other,
}: {
  testID: string
  display: CountsMetricsDisplay
  count: number
  one: string
  other: string
}) {
  const t = useTheme()
  const {i18n} = useLingui()
  const labelOnly = shouldShowCountsMetricLabelOnly(display, count)

  if (labelOnly) {
    return (
      <Text testID={testID} style={[a.text_md, t.atoms.text_contrast_medium]}>
        <Plural value={count} one={one} other={other} />
      </Text>
    )
  }

  return (
    <Text testID={testID} style={[a.text_md, t.atoms.text_contrast_medium]}>
      <Trans comment="Metric count display, the <0> tags enclose the number in bold (will never be 0)">
        <Text style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
          {formatCountsMetricNumber(i18n, display, count)}
        </Text>{' '}
        <Plural value={count} one={one} other={other} />
      </Trans>
    </Text>
  )
}

function getThreadAuthor(
  post: AppBskyFeedDefs.PostView,
  record: AppBskyFeedPost.Record,
): string {
  if (!record.reply) {
    return post.author.did
  }
  try {
    return new AtUri(record.reply.root.uri).host
  } catch {
    return ''
  }
}

export function ThreadItemAnchorSkeleton() {
  const enableSquareAvatars = useEnableSquareAvatars()

  return (
    <View style={[a.p_lg, a.gap_md]}>
      <Skele.Row style={[a.align_center, a.gap_md]}>
        <Skele.Circle
          size={42}
          style={enableSquareAvatars && {borderRadius: 8}}
        />

        <Skele.Col>
          <Skele.Text style={[a.text_lg, {width: '20%'}]} />
          <Skele.Text blend style={[a.text_md, {width: '40%'}]} />
        </Skele.Col>
      </Skele.Row>

      <View>
        <Skele.Text style={[a.text_xl, {width: '100%'}]} />
        <Skele.Text style={[a.text_xl, {width: '60%'}]} />
      </View>

      <Skele.Text style={[a.text_sm, {width: '50%'}]} />

      <PostControlsSkeleton big />
    </View>
  )
}
