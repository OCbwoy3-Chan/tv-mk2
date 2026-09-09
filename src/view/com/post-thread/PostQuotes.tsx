import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {moderatePost, type ModerationDecision} from '@bsky/sdk/moderation'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {usePostViewTracking} from '#/lib/hooks/usePostViewTracking'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {usePostQuotesQuery} from '#/state/queries/post-quotes'
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
import {Post} from '#/view/com/post/Post'
import {atoms as a, useTheme} from '#/alf'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'
import {Text} from '#/components/Typography'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {List} from '../util/List'

function renderItem({
  item,
  index,
}: {
  item: {
    post: app.bsky.feed.defs.PostView
    moderation: ModerationDecision
    record: app.bsky.feed.post.Main
  }
  index: number
}) {
  return <Post post={item.post} hideTopBorder={index === 0} />
}

function keyExtractor(item: {
  post: app.bsky.feed.defs.PostView
  moderation: ModerationDecision
  record: app.bsky.feed.post.Main
}) {
  return item.post.uri
}

function ExtractedQuotedPost({post}: {post: app.bsky.feed.defs.PostView}) {
  const t = useTheme()

  return (
    <View>
      <Post
        post={post}
        hideTopBorder
        style={{backgroundColor: t.palette.primary_25}}
      />
      <View
        style={[
          a.px_lg,
          a.py_sm,
          a.border_t,
          a.border_b,
          t.atoms.border_contrast_low,
        ]}>
        <Text style={[a.text_sm, a.text_center, t.atoms.text_contrast_medium]}>
          <Trans>The quoted post has been extracted from the following</Trans>
        </Text>
      </View>
    </View>
  )
}

export function PostQuotes({
  uri,
  quotedPost,
  isQuotedPostExtracted,
}: {
  uri: string
  quotedPost?: app.bsky.feed.defs.PostView
  isQuotedPostExtracted: boolean
}) {
  const {_} = useLingui()
  const initialNumToRender = useInitialNumToRender()
  const [isPTRing, setIsPTRing] = useState(false)
  const trackPostView = usePostViewTracking('PostQuotes')

  const {
    data: resolvedUri,
    error: resolveError,
    isLoading: isLoadingUri,
  } = useResolveUriQuery(uri)
  const {
    data,
    isLoading: isLoadingQuotes,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = usePostQuotesQuery(resolvedUri?.uri)

  const moderationOpts = useModerationOpts()

  const isError = Boolean(resolveError || error)

  const quotes =
    data?.pages
      .flatMap(page =>
        page.posts.map(post => {
          if (
            !bsky.isType(app.bsky.feed.post, post.record) ||
            !moderationOpts
          ) {
            return null
          }
          const moderation = moderatePost(post, moderationOpts)
          return {post, record: post.record, moderation}
        }),
      )
      .filter(item => item !== null) ?? []

  const onRefresh = useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh quotes', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more quotes', {message: err})
    }
  }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage])

  const renderItem = useCallback(
    ({
      item,
      index,
    }: {
      item: {
        post: app.bsky.feed.defs.PostView
        moderation: ModerationDecision
        record: app.bsky.feed.post.Main
      }
      index: number
    }) => (
      <Post
        post={item.post}
        hideTopBorder={index === 0 && !isQuotedPostExtracted}
        hideQuoteEmbedUri={isQuotedPostExtracted ? quotedPost?.uri : undefined}
      />
    ),
    [isQuotedPostExtracted, quotedPost?.uri],
  )

  if (quotes.length < 1) {
    return (
      <ListMaybePlaceholder
        isLoading={isLoadingUri || isLoadingQuotes}
        isError={isError}
        emptyType="results"
        emptyTitle={_(msg`No quotes yet`)}
        emptyMessage={_(
          msg`Nobody has quoted this yet. Maybe you should be the first!`,
        )}
        errorMessage={cleanError(resolveError || error)}
        sideBorders={false}
      />
    )
  }

  // loaded
  // =
  return (
    <List
      data={quotes}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      refreshing={isPTRing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      onEndReachedThreshold={4}
      onItemSeen={item => trackPostView(item.post)}
      ListHeaderComponent={
        isQuotedPostExtracted && quotedPost ? (
          <ExtractedQuotedPost post={quotedPost} />
        ) : undefined
      }
      ListFooterComponent={
        <ListFooter
          isFetchingNextPage={isFetchingNextPage}
          error={cleanError(error)}
          onRetry={fetchNextPage}
          showEndMessage
          endMessageText={_(msg`That's all, folks!`)}
        />
      }
      desktopFixedHeight
      initialNumToRender={initialNumToRender}
      windowSize={11}
      sideBorders={false}
    />
  )
}
