import {getCalendars, getLocales} from 'expo-localization'
import {type I18n} from '@lingui/core'

/** Preserve app date formatting while respecting the system clock preference. */
export function formatDateWithSystemTime(
  i18n: I18n,
  date: number | string | Date,
  options: Intl.DateTimeFormatOptions,
): string {
  const hasTime = options.hour !== undefined || options.timeStyle !== undefined
  if (!hasTime) return i18n.date(date, options)

  const uses24hourClock = getCalendars()[0]?.uses24hourClock
  const timeOptions = {
    ...options,
    ...(uses24hourClock != null ? {hour12: !uses24hourClock} : {}),
  }
  const hasDate =
    options.dateStyle !== undefined ||
    options.year !== undefined ||
    options.month !== undefined ||
    options.day !== undefined ||
    options.weekday !== undefined

  if (hasDate) return i18n.date(date, timeOptions)

  const locales = getLocales().map(locale => locale.languageTag)
  return new Intl.DateTimeFormat(
    locales.length ? locales : undefined,
    timeOptions,
  ).format(new Date(date))
}
