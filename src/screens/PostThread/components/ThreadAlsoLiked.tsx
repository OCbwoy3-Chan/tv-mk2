import {useCallback} from 'react'
import {View} from 'react-native'
import {type AppBskyFeedDefs} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {cleanError} from '#/lib/strings/errors'
import {unstableCacheProfileView} from '#/state/queries/profile'
import {
  buildPostSourceKey,
  setUnstablePostSource,
} from '#/state/unstable-post-source'
import {Post} from '#/view/com/post/Post'
import {PostLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

export function ThreadAlsoLiked({
  posts,
  enabled,
  isLoading,
  isFetchingNextPage,
  error,
  onRetry,
  spacerHeight,
  isTombstoneView,
}: {
  posts: AppBskyFeedDefs.PostView[]
  enabled: boolean
  isLoading: boolean
  isFetchingNextPage: boolean
  error: unknown
  onRetry: () => void
  spacerHeight: number | undefined
  isTombstoneView: boolean
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const queryClient = useQueryClient()
  const hasSection =
    enabled && (posts.length > 0 || isLoading || Boolean(error))
  const onBeforePress = useCallback(
    (post: AppBskyFeedDefs.PostView) => {
      unstableCacheProfileView(queryClient, post.author)
      setUnstablePostSource(buildPostSourceKey(post.uri, post.author.handle), {
        post: {post},
      })
    },
    [queryClient],
  )

  return (
    <View>
      {hasSection && (
        <View style={[a.border_t, t.atoms.border_contrast_low]}>
          <View style={[a.px_lg, a.pt_xl, a.pb_md, a.gap_2xs]}>
            <Text style={[a.text_xl, a.font_bold]}>
              <Trans>Also liked</Trans>
            </Text>
            <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
              <Trans>Posts liked by people who liked this post</Trans>
            </Text>
          </View>

          {posts.map((post, index) => (
            <Post
              key={post.uri}
              post={post}
              hideTopBorder={index === 0}
              onBeforePress={() => onBeforePress(post)}
            />
          ))}

          {isLoading && posts.length === 0 && (
            <>
              <PostLoadingPlaceholder
                style={[a.border_t, t.atoms.border_contrast_low]}
              />
              <PostLoadingPlaceholder
                style={[a.border_t, t.atoms.border_contrast_low]}
              />
            </>
          )}

          {isFetchingNextPage && (
            <PostLoadingPlaceholder
              style={[a.border_t, t.atoms.border_contrast_low]}
            />
          )}

          {Boolean(error) && !isLoading && !isFetchingNextPage && (
            <View style={[a.px_lg, a.pb_xl, a.gap_md]}>
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                {cleanError(error)}
              </Text>
              <View style={[a.flex_row]}>
                <Button
                  label={l`Retry loading also liked posts`}
                  onPress={onRetry}
                  variant="solid"
                  color="secondary_inverted"
                  size="small">
                  <ButtonText>
                    <Trans>Retry</Trans>
                  </ButtonText>
                </Button>
              </View>
            </View>
          )}
        </View>
      )}

      <View
        style={[
          a.w_full,
          !hasSection &&
            !isTombstoneView && [a.border_t, t.atoms.border_contrast_low],
          {height: spacerHeight ?? 180},
        ]}
      />
    </View>
  )
}
