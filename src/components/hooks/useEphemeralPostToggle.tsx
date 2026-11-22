import {useState} from 'react'
import {useLingui} from '@lingui/react/macro'

import {type SessionAccount} from '#/state/session'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {useEphemeralAccountError} from './useEphemeralAccountError'
import {useRunWithEphemeralAgent} from './useRunWithEphemeralAgent'

export type EphemeralPostAction = 'like' | 'repost' | 'bookmark'

type PostViewer = {like?: string; repost?: string; bookmarked?: boolean}

function isActive(action: EphemeralPostAction, viewer: PostViewer | undefined) {
  if (action === 'like') return Boolean(viewer?.like)
  if (action === 'repost') return Boolean(viewer?.repost)
  return Boolean(viewer?.bookmarked)
}

/**
 * Like, repost or save a post as another signed-in account, from the account
 * picker. Adding happens straight away; undoing asks first, the way
 * unfollowing does, since the picker gives no hint which state that account
 * is in. Render `prompt` alongside the buttons that call `toggle`.
 */
export function useEphemeralPostToggle({
  uri,
  cid,
  autoLikeOnRepost = false,
}: {
  uri: string
  cid: string
  /** Also like a post when reposting it, if that account hasn't yet. */
  autoLikeOnRepost?: boolean
}) {
  const {t: l} = useLingui()
  const runWithEphemeralAgent = useRunWithEphemeralAgent()
  const showEphemeralError = useEphemeralAccountError()
  const promptControl = Prompt.usePromptControl()
  const [pending, setPending] = useState<{
    action: EphemeralPostAction
    account: SessionAccount
  } | null>(null)

  const undo = async (action: EphemeralPostAction, account: SessionAccount) => {
    try {
      await runWithEphemeralAgent(account, async agent => {
        // Read again: the record may have changed while the prompt was open.
        const res = await agent.getPosts({uris: [uri]})
        const viewer = res.data.posts[0]?.viewer
        if (action === 'like' && viewer?.like) {
          await agent.deleteLike(viewer.like)
        } else if (action === 'repost' && viewer?.repost) {
          await agent.deleteRepost(viewer.repost)
        } else if (action === 'bookmark' && viewer?.bookmarked) {
          await agent.app.bsky.bookmark.deleteBookmark({uri})
        }
      })
      Toast.show(
        action === 'like'
          ? l`Removed like as @${account.handle}`
          : action === 'repost'
            ? l`Removed repost as @${account.handle}`
            : l`Removed save as @${account.handle}`,
      )
    } catch (e) {
      showEphemeralError(e, account, retryAs => undo(action, retryAs))
    }
  }

  const toggle = async (
    action: EphemeralPostAction,
    account: SessionAccount,
  ) => {
    try {
      const added = await runWithEphemeralAgent(account, async agent => {
        const res = await agent.getPosts({uris: [uri]})
        const target = res.data.posts[0]
        if (isActive(action, target?.viewer)) return false
        if (action === 'like') {
          await agent.like(uri, cid)
        } else if (action === 'repost') {
          await agent.repost(uri, cid)
          if (
            autoLikeOnRepost &&
            target &&
            target.author.did !== account.did &&
            !target.viewer?.like
          ) {
            await agent.like(uri, cid)
          }
        } else {
          await agent.app.bsky.bookmark.createBookmark({uri, cid})
        }
        return true
      })
      if (!added) {
        setPending({action, account})
        promptControl.open()
        return
      }
      Toast.show(
        action === 'like'
          ? l`Liked as @${account.handle}`
          : action === 'repost'
            ? l`Reposted as @${account.handle}`
            : l`Saved as @${account.handle}`,
      )
    } catch (e) {
      showEphemeralError(e, account, retryAs => toggle(action, retryAs))
    }
  }

  const handle = pending ? `@${pending.account.handle}` : ''
  const copy =
    pending?.action === 'repost'
      ? {
          title: l`Undo repost as ${handle}?`,
          description: l`${handle} will no longer repost this post.`,
          cta: l`Undo repost`,
        }
      : pending?.action === 'bookmark'
        ? {
            title: l`Remove save as ${handle}?`,
            description: l`This post will be removed from ${handle}'s saved posts.`,
            cta: l`Remove`,
          }
        : {
            title: l`Unlike as ${handle}?`,
            description: l`${handle} will no longer like this post.`,
            cta: l`Unlike`,
          }

  const prompt = (
    <Prompt.Basic
      control={promptControl}
      title={copy.title}
      description={copy.description}
      confirmButtonCta={copy.cta}
      confirmButtonColor="negative"
      onConfirm={() => {
        if (pending) void undo(pending.action, pending.account)
      }}
    />
  )

  return {toggle, prompt}
}
