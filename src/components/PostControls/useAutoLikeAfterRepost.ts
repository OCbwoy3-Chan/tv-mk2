import {type Shadow} from '#/state/cache/types'
import {useAutoLikeOnRepost} from '#/state/preferences/auto-like-on-repost'
import {useGetPost, type usePostLikeMutationQueue} from '#/state/queries/post'
import {useSession} from '#/state/session'
import {
  ProgressGuideAction,
  useProgressGuideControls,
} from '#/state/shell/progress-guide'
import * as userActionHistory from '#/state/userActionHistory'
import {useFeedItemFeedback} from '#/features/feedFeedback'
import {type app} from '#/lexicons'

/** Apply the same auto-like preference to repost buttons and compact menus. */
export function useAutoLikeAfterRepost({
  post,
  queueLike,
  onLike,
}: {
  post: Shadow<app.bsky.feed.defs.PostView>
  queueLike: ReturnType<typeof usePostLikeMutationQueue>[0]
  onLike?: () => void
}) {
  const enabled = useAutoLikeOnRepost()
  const {currentAccount} = useSession()
  const getPost = useGetPost()
  const feedItem = useFeedItemFeedback()
  const {captureAction} = useProgressGuideControls()

  return async () => {
    if (
      !enabled ||
      post.author.did === currentAccount?.did ||
      post.viewer?.like
    )
      return
    if (userActionHistory.getActionHistory().likes.includes(post.uri)) return
    let latestPost
    try {
      latestPost = await getPost({uri: post.uri})
    } catch {
      return
    }
    if (latestPost.viewer?.like) return
    onLike?.()
    feedItem.send('app.bsky.feed.defs#interactionLike')
    captureAction(ProgressGuideAction.Like)
    await queueLike()
  }
}
