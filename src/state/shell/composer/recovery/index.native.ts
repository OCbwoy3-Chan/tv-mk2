import {Directory, File, Paths} from 'expo-file-system'
import {nanoid} from 'nanoid/non-secure'

import {logger} from '#/logger'
import {type ComposerOpts} from '#/state/shell/composer'
import {type ComposerState} from '#/view/com/composer/state/composer'
import {account} from '#/storage'
import {decodeRecovery, encodeRecovery} from './codec'

const copiedFiles = new Map<string, Promise<string>>()

function directory(did: string) {
  return new Directory(
    Paths.document,
    'composer-recovery',
    encodeURIComponent(did),
  )
}

export function readRecovery(did: string) {
  try {
    const raw = account.get([did, 'composerRecovery'])
    return raw ? decodeRecovery(raw) : undefined
  } catch (error) {
    logger.error('Failed to restore composer', {safeMessage: error})
    return undefined
  }
}

/** Save text synchronously, then make attachments durable without blocking typing. */
export function saveRecovery(
  did: string,
  opts: ComposerOpts,
  state: ComposerState,
) {
  try {
    const raw = encodeRecovery(opts, state)
    account.set([did, 'composerRecovery'], raw)
    void persistMedia(did, raw).catch(error => {
      logger.error('Failed to cache composer media', {safeMessage: error})
    })
  } catch (error) {
    logger.error('Failed to cache composer', {safeMessage: error})
  }
}

async function persistMedia(did: string, raw: string) {
  const dir = directory(did)
  const copies = new Map<string, Promise<string>>()
  JSON.parse(raw, (key, value) => {
    if (
      (key === 'uri' || key === 'path' || key === 'playlistUri') &&
      typeof value === 'string' &&
      value.startsWith('file://') &&
      !value.startsWith(dir.uri)
    ) {
      const cacheKey = did + ':' + value
      let copy = copiedFiles.get(cacheKey)
      if (!copy) {
        copy = (async () => {
          dir.create({intermediates: true, idempotent: true})
          const source = new File(value)
          const target = new File(dir, nanoid() + source.extension)
          await source.copy(target)
          return target.uri
        })().catch(error => {
          copiedFiles.delete(cacheKey)
          logger.error('Failed to preserve composer attachment', {
            safeMessage: error,
          })
          return value
        })
        copiedFiles.set(cacheKey, copy)
      }
      copies.set(value, copy)
    }
    return value
  })
  if (!copies.size) return
  const paths = new Map(
    await Promise.all(
      [...copies].map(async ([source, copy]) => [source, await copy] as const),
    ),
  )
  // A newer edit or explicit close must win over an older copy finishing.
  if (account.get([did, 'composerRecovery']) !== raw) return
  const durable = JSON.stringify(JSON.parse(raw), (_key, value) =>
    typeof value === 'string' ? (paths.get(value) ?? value) : value,
  )
  account.set([did, 'composerRecovery'], durable)
}

export function clearRecovery(did: string) {
  try {
    account.remove([did, 'composerRecovery'])
    const dir = directory(did)
    if (dir.exists) dir.delete()
    copiedFiles.clear()
  } catch (error) {
    logger.error('Failed to clear composer recovery', {safeMessage: error})
  }
}
