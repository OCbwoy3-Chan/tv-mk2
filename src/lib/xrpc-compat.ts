import {type Agent, Client} from '@atproto/lex'

import * as persisted from '#/state/persisted'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'

const grouped = app.bsky.notification.getGroupedNotifications

type Output = app.bsky.notification.getGroupedNotifications.$OutputBody
type Notification = app.bsky.notification.listNotifications.Notification

/** Adapts grouped reads for AppViews that only implement listNotifications. */
export function withXrpcCompat(agent: Agent): Agent {
  return {
    get did() {
      return agent.did
    },
    async fetchHandler(path, init) {
      const url = new URL(path, 'https://compat.invalid')
      if (
        url.pathname !==
          '/xrpc/app.bsky.notification.getGroupedNotifications' ||
        !persisted.get('deltasPreferences')?.euroskyNotifWorkaround
      ) {
        return agent.fetchHandler(path, init)
      }
      const client = new Client(
        {
          get did() {
            return agent.did
          },
          fetchHandler(nextPath, nextInit) {
            const next = new URL(nextPath, url)
            const target =
              path.startsWith('https://') || path.startsWith('http://')
                ? next.href
                : `${next.pathname}${next.search}`
            return agent.fetchHandler(target as typeof path, {
              ...nextInit,
              signal: init.signal,
              headers: init.headers,
            })
          },
        },
        {strictResponseProcessing: false, appLabelers: null},
      )
      const feed = url.searchParams.get('feed') ?? 'all'
      const reasons =
        feed === 'followers'
          ? ['follow']
          : feed === 'conversations'
            ? ['reply', 'quote', 'mention']
            : feed === 'activity'
              ? ['subscribed-post']
              : undefined
      const data = await client.call(app.bsky.notification.listNotifications, {
        limit: Number(url.searchParams.get('limit') ?? 30),
        cursor: url.searchParams.get('cursor') ?? undefined,
        reasons,
      })
      const groups: Output['groups'] = []
      const relatedViews: NonNullable<Output['relatedViews']> = []
      const posts = new Set<app.bsky.feed.defs.PostView['uri']>()
      const generators = new Set<app.bsky.feed.defs.GeneratorView['uri']>()
      const packs = new Set<app.bsky.graph.defs.StarterPackViewBasic['uri']>()
      for (const notification of data.notifications) {
        if (reasons && !reasons.includes(notification.reason)) continue
        if (
          feed === 'people-i-follow' &&
          !notification.author.viewer?.following
        )
          continue
        const kind = toGroupedKind(notification)
        if (!kind) continue
        const group = {
          id: `${notification.reason}:${notification.uri}`,
          isRead: notification.isRead,
          indexedAt: notification.indexedAt,
          count: 1,
          kind,
        }
        const key = groupingKey(kind, feed)
        const existing =
          key === undefined
            ? undefined
            : groups.find(
                previous =>
                  groupingKey(previous.kind, feed) === key &&
                  previous.isRead === group.isRead &&
                  Math.abs(
                    Date.parse(previous.indexedAt) -
                      Date.parse(group.indexedAt),
                  ) <
                    2 * 24 * 60 * 60 * 1000,
              )
        if (existing && 'items' in existing.kind && 'items' in kind) {
          const items: unknown[] = existing.kind.items
          items.push(...kind.items)
          existing.count += 1
        } else {
          groups.push(group)
        }
        relatedViews.push({
          ...notification.author,
          $type: 'app.bsky.actor.defs#profileViewBasic',
        })
        if (notification.starterPack) {
          relatedViews.push({
            ...notification.starterPack,
            $type: 'app.bsky.graph.defs#starterPackViewBasic',
          })
        }
        if ('post' in kind) posts.add(kind.post)
        if ('parent' in kind && kind.parent) posts.add(kind.parent)
        if (bsky.isType(grouped.subscribedPostGroup, kind)) {
          for (const item of kind.items) {
            posts.add(item.post)
            if (item.parent) posts.add(item.parent)
          }
        }
        if (bsky.isType(grouped.generatorLikeGroup, kind))
          generators.add(kind.generator)
        if (bsky.isType(grouped.starterPackJoinedNotification, kind))
          packs.add(kind.starterPack)
      }
      const uris = [...posts]
      for (let i = 0; i < uris.length; i += 25) {
        const result = await client.call(app.bsky.feed.getPosts, {
          uris: uris.slice(i, i + 25),
        })
        relatedViews.push(
          ...result.posts.map(post => ({
            ...post,
            $type: 'app.bsky.feed.defs#postView' as const,
          })),
        )
      }
      if (generators.size) {
        const result = await client.call(app.bsky.feed.getFeedGenerators, {
          feeds: [...generators],
        })
        relatedViews.push(
          ...result.feeds.map(view => ({
            ...view,
            $type: 'app.bsky.feed.defs#generatorView' as const,
          })),
        )
      }
      for (const uri of packs) {
        const {starterPack} = await client.call(app.bsky.graph.getStarterPack, {
          starterPack: uri,
        })
        relatedViews.push({
          ...starterPack,
          $type: 'app.bsky.graph.defs#starterPackViewBasic',
        })
      }
      // shortcut: groups stop at V1 page boundaries; use server grouping when supported.
      return Response.json({
        cursor: data.cursor,
        seenAt: data.seenAt,
        groups,
        relatedViews,
      } satisfies Output)
    },
  }
}

function toGroupedKind(
  n: Notification,
): Output['groups'][number]['kind'] | undefined {
  const actor = n.author.did
  const items = [{actor, starterPack: n.starterPack?.uri}]
  const record = bsky.isType(app.bsky.feed.post, n.record)
    ? n.record
    : undefined
  const parent = record?.reply?.parent.uri
  const action =
    bsky.isType(app.bsky.feed.like, n.record) ||
    bsky.isType(app.bsky.feed.repost, n.record)
      ? n.record
      : undefined
  const subject = action?.subject.uri ?? n.reasonSubject
  switch (n.reason) {
    case 'like':
      if (!subject) return
      return subject.includes('/app.bsky.feed.generator/')
        ? {
            $type:
              'app.bsky.notification.getGroupedNotifications#generatorLikeGroup',
            generator: subject,
            items,
          }
        : {
            $type: 'app.bsky.notification.getGroupedNotifications#likeGroup',
            post: subject,
            items,
          }
    case 'repost':
      if (!subject) return
      return {
        $type: 'app.bsky.notification.getGroupedNotifications#repostGroup',
        post: subject,
        items,
      }
    case 'like-via-repost':
    case 'repost-via-repost': {
      if (!subject || !action?.via) return
      return {
        $type:
          n.reason === 'like-via-repost'
            ? 'app.bsky.notification.getGroupedNotifications#likeViaRepostGroup'
            : 'app.bsky.notification.getGroupedNotifications#repostViaRepostGroup',
        post: subject,
        viaRepost: action.via.uri,
        items,
      }
    }
    case 'follow':
      return n.author.viewer?.following
        ? {
            $type:
              'app.bsky.notification.getGroupedNotifications#followBackNotification',
            actor,
            starterPack: n.starterPack?.uri,
          }
        : {
            $type: 'app.bsky.notification.getGroupedNotifications#followGroup',
            items,
          }
    case 'reply':
      if (!parent) return
      return {
        $type:
          'app.bsky.notification.getGroupedNotifications#replyNotification',
        post: n.uri,
        parent,
      }
    case 'quote':
      return {
        $type:
          'app.bsky.notification.getGroupedNotifications#quoteNotification',
        post: n.uri,
        parent: n.reasonSubject,
      }
    case 'mention':
      return {
        $type:
          'app.bsky.notification.getGroupedNotifications#mentionNotification',
        post: n.uri,
        parent,
      }
    case 'subscribed-post':
      return {
        $type:
          'app.bsky.notification.getGroupedNotifications#subscribedPostGroup',
        items: [{actor, post: action?.subject.uri ?? n.uri, parent}],
      }
    case 'verified':
      return {
        $type:
          'app.bsky.notification.getGroupedNotifications#verifiedNotification',
        actor,
      }
    case 'unverified':
      return {
        $type:
          'app.bsky.notification.getGroupedNotifications#unverifiedNotification',
        actor,
      }
    case 'contact-match':
      return {
        $type:
          'app.bsky.notification.getGroupedNotifications#contactMatchNotification',
        actor,
      }
    case 'starterpack-joined':
      if (!n.reasonSubject) return
      return {
        $type:
          'app.bsky.notification.getGroupedNotifications#starterPackJoinedNotification',
        actor,
        starterPack: n.reasonSubject,
      }
  }
}

/** Keeps unrelated subjects, repost paths and follow feeds in separate groups. */
function groupingKey(
  kind: Output['groups'][number]['kind'],
  feed: string,
): string | undefined {
  if (bsky.isType(grouped.followGroup, kind)) {
    return feed === 'followers'
      ? undefined
      : `${kind.$type}:${kind.items[0]?.starterPack ?? ''}`
  }
  if (bsky.isType(grouped.subscribedPostGroup, kind)) {
    return `${kind.$type}:${kind.items[0]?.actor}`
  }
  if (bsky.isType(grouped.generatorLikeGroup, kind)) {
    return `${kind.$type}:${kind.generator}`
  }
  if (
    bsky.isType(grouped.likeGroup, kind) ||
    bsky.isType(grouped.repostGroup, kind)
  ) {
    return `${kind.$type}:${kind.post}`
  }
  if (
    bsky.isType(grouped.likeViaRepostGroup, kind) ||
    bsky.isType(grouped.repostViaRepostGroup, kind)
  ) {
    return `${kind.$type}:${kind.post}:${kind.viaRepost}`
  }
}
