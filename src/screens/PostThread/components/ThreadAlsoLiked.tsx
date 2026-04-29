import {type RefObject, useCallback} from 'react'
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
import * as Button from '#/components/Button'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon,
} from '#/components/icons/Chevron'
import {Text} from '#/components/Typography'

export function ThreadAlsoLiked({
  posts,
  visible,
  collapsed,
  isLoading: _isLoading,
  showLoadingState,
  isFetchingNextPage,
  error,
  onRetry,
  headerRef,
  onToggleCollapsed,
  spacerHeight,
  isTombstoneView,
}: {
  posts: AppBskyFeedDefs.PostView[]
  visible: boolean
  collapsed: boolean
  isLoading: boolean
  showLoadingState: boolean
  isFetchingNextPage: boolean
  error: unknown
  onRetry: () => void
  headerRef: RefObject<View | null>
  onToggleCollapsed: () => void
  spacerHeight: number | undefined
  isTombstoneView: boolean
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const queryClient = useQueryClient()
  const hasSection = visible
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
          <Button.Button
            ref={headerRef}
            label={
              collapsed
                ? l`Expand also liked posts`
                : l`Collapse also liked posts`
            }
            onPress={onToggleCollapsed}
            style={[a.w_full]}>
            {({hovered, pressed}) => (
              <View
                style={[
                  a.w_full,
                  a.flex_row,
                  a.align_center,
                  a.justify_between,
                  a.gap_sm,
                  a.px_lg,
                  a.py_md,
                  (hovered || pressed) && t.atoms.bg_contrast_25,
                ]}>
                <View style={[a.flex_1, a.gap_2xs]}>
                  <Text style={[a.text_xl, a.font_bold]}>
                    <Trans>Also liked</Trans>
                  </Text>
                  <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                    <Trans>Posts liked by people who liked this post</Trans>
                  </Text>
                </View>
                {collapsed ? (
                  <ChevronDownIcon
                    size="sm"
                    style={t.atoms.text_contrast_medium}
                  />
                ) : (
                  <ChevronUpIcon
                    size="sm"
                    style={t.atoms.text_contrast_medium}
                  />
                )}
              </View>
            )}
          </Button.Button>

          {!collapsed && (
            <>
              {posts.map((post, index) => (
                <Post
                  key={post.uri}
                  post={post}
                  hideTopBorder={index === 0}
                  onBeforePress={() => onBeforePress(post)}
                />
              ))}

              {showLoadingState && posts.length === 0 && (
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

              {Boolean(error) && !showLoadingState && !isFetchingNextPage && (
                <View style={[a.px_lg, a.pb_xl, a.gap_md]}>
                  <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                    {cleanError(error)}
                  </Text>
                  <View style={[a.flex_row]}>
                    <Button.Button
                      label={l`Retry loading also liked posts`}
                      onPress={onRetry}
                      variant="solid"
                      color="secondary_inverted"
                      size="small">
                      <Button.ButtonText>
                        <Trans>Retry</Trans>
                      </Button.ButtonText>
                    </Button.Button>
                  </View>
                </View>
              )}
            </>
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
