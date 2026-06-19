import {
  AppBskyActorProfile,
  type AtpAgent,
  ComAtprotoRepoPutRecord,
  type Un$Typed,
} from '@atproto/api'
import {retry} from '@atproto/common-web'

type ProfileUpdateFn = (
  existing?: AppBskyActorProfile.Record,
) =>
  | Un$Typed<AppBskyActorProfile.Record>
  | Promise<Un$Typed<AppBskyActorProfile.Record>>

function readExistingProfile(
  value: unknown,
  allowInvalid: boolean,
): AppBskyActorProfile.Record | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }
  const record = {$type: 'app.bsky.actor.profile', ...value}
  const validation = AppBskyActorProfile.validateRecord(record)
  if (validation.success) {
    return validation.value
  }
  return allowInvalid ? (record as AppBskyActorProfile.Record) : undefined
}

function profileRecordNeedsValidationSkip(
  record: Un$Typed<AppBskyActorProfile.Record>,
): boolean {
  return record.avatar?.mimeType === 'image/webp'
}

/**
 * Upsert the actor profile record. Skips lexicon validation when the profile
 * contains a webp avatar, which the lexicon does not accept but Witchsky
 * uploads for smaller file sizes.
 */
export async function upsertActorProfile(
  agent: AtpAgent,
  updateFn: ProfileUpdateFn,
): Promise<void> {
  const collection = 'app.bsky.actor.profile'

  const upsert = async () => {
    const repo = agent.assertDid
    const existing = await agent.com.atproto.repo
      .getRecord({repo, collection, rkey: 'self'})
      .catch(_ => undefined)

    // Read existing without validation first — webp avatars fail lexicon checks.
    const existingRecord = existing
      ? readExistingProfile(existing.data.value, true)
      : undefined

    const updated = await updateFn(existingRecord)
    const record = {$type: collection, ...updated}
    const validate = !profileRecordNeedsValidationSkip(updated)

    if (validate) {
      const validation = AppBskyActorProfile.validateRecord(record)
      if (!validation.success) {
        throw validation.error
      }
      await agent.com.atproto.repo.putRecord({
        repo,
        collection,
        rkey: 'self',
        record: validation.value,
        swapRecord: existing?.data.cid || null,
      })
    } else {
      await agent.com.atproto.repo.putRecord({
        repo,
        collection,
        rkey: 'self',
        record,
        swapRecord: existing?.data.cid || null,
        validate: false,
      })
    }
  }

  return retry(upsert, {
    maxRetries: 5,
    retryable: e => e instanceof ComAtprotoRepoPutRecord.InvalidSwapError,
  })
}
