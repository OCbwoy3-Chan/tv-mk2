import {type Client} from '@atproto/lex'

import {app} from '#/lexicons'

type Profile = Pick<app.bsky.actor.defs.ProfileView, 'did' | 'viewer'>

/** Reads every page before copying, so source read failures cannot cause partial imports. */
async function readSubscriptions(client: Client) {
  const subscriptions = new Map<Profile['did'], Profile>()
  const cursors = new Set<string>()
  let cursor: string | undefined
  do {
    const page = await client.call(
      app.bsky.notification.listActivitySubscriptions,
      {
        limit: 100,
        cursor,
      },
    )
    for (const profile of page.subscriptions)
      subscriptions.set(profile.did, profile)
    cursor = page.cursor
    if (cursor && cursors.has(cursor))
      throw new Error('Repeated activity subscription cursor')
    if (cursor) cursors.add(cursor)
  } while (cursor)
  return subscriptions
}

/** Replaces app preferences and all activity subscriptions with the source settings. */
export async function importNotificationSettings(
  source: Client,
  destination: Client,
) {
  const {preferences} = await source.call(app.bsky.notification.getPreferences)
  const subscriptions = await readSubscriptions(source)
  const existing = await readSubscriptions(destination)
  const missing = [...subscriptions.values()]
    .filter(profile => !profile.viewer?.activitySubscription)
    .map(profile => profile.did)
  for (let i = 0; i < missing.length; i += 25) {
    const {profiles} = await source.call(app.bsky.actor.getProfiles, {
      actors: missing.slice(i, i + 25),
    })
    for (const profile of profiles) {
      if (profile.viewer?.activitySubscription) {
        subscriptions.set(profile.did, profile)
      }
    }
  }
  const updates = [...subscriptions.values()].map(profile => {
    const subscription = profile.viewer?.activitySubscription
    if (!subscription)
      throw new Error('Source AppView omitted activity subscription settings')
    return {
      subject: profile.did,
      activitySubscription: {
        post: subscription.post,
        reply: subscription.reply,
      },
    }
  })
  for (const did of existing.keys()) {
    if (!subscriptions.has(did)) {
      updates.push({
        subject: did,
        activitySubscription: {post: false, reply: false},
      })
    }
  }
  const copied = []
  for (const update of updates) {
    const current = existing.get(update.subject)?.viewer?.activitySubscription
    if (
      current?.post === update.activitySubscription.post &&
      current?.reply === update.activitySubscription.reply
    )
      continue
    await destination.call(
      app.bsky.notification.putActivitySubscription,
      update,
    )
    copied.push(update)
  }
  const {chat: _chat, $type: _type, ...appPreferences} = preferences
  await destination.call(app.bsky.notification.putPreferencesV2, appPreferences)
  return copied
}
