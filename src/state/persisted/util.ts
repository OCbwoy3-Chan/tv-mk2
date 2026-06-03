import {parse} from 'bcp-47'

import {dedupArray} from '#/lib/functions'
import {logger} from '#/logger'
import {defaults, type Schema} from '#/state/persisted/schema'

function isMergeableObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Recursively fill missing keys from `defaultObj` (see {@link defaults}). */
function hydrateRecord<T extends Record<string, unknown>>(
  defaultObj: T,
  dataObj: T,
): T {
  const out = {...defaultObj}
  for (const key of Object.keys(defaultObj) as (keyof T)[]) {
    const value = dataObj[key]
    if (value === undefined) {
      continue
    }
    const defaultValue = defaultObj[key]
    if (isMergeableObject(defaultValue) && isMergeableObject(value)) {
      out[key] = hydrateRecord(defaultValue, value)
    } else {
      out[key] = value
    }
  }
  return out
}

/**
 * Fill missing keys from {@link defaults} so existing installs pick up new
 * settings without resetting storage.
 */
export function hydrateWithDefaults(data: Schema): Schema {
  return hydrateRecord(defaults, data)
}

export function normalizeData(data: Schema) {
  const next = hydrateWithDefaults(data)

  /**
   * Normalize language prefs to ensure that these values only contain 2-letter
   * country codes without region.
   */
  try {
    const langPrefs = {...next.languagePrefs}
    langPrefs.primaryLanguage = normalizeLanguageTagToTwoLetterCode(
      langPrefs.primaryLanguage,
    )
    langPrefs.contentLanguages = dedupArray(
      langPrefs.contentLanguages.map(lang =>
        normalizeLanguageTagToTwoLetterCode(lang),
      ),
    )
    langPrefs.postLanguage = langPrefs.postLanguage
      .split(',')
      .map(lang => normalizeLanguageTagToTwoLetterCode(lang))
      .filter(Boolean)
      .join(',')
    langPrefs.postLanguageHistory = dedupArray(
      langPrefs.postLanguageHistory.map(postLanguage => {
        return postLanguage
          .split(',')
          .map(lang => normalizeLanguageTagToTwoLetterCode(lang))
          .filter(Boolean)
          .join(',')
      }),
    )
    next.languagePrefs = langPrefs
  } catch (e: any) {
    logger.error(`persisted state: failed to normalize language prefs`, {
      safeMessage: e.message,
    })
  }

  return next
}

export function normalizeLanguageTagToTwoLetterCode(lang: string) {
  const result = parse(lang).language
  return result ?? lang
}
