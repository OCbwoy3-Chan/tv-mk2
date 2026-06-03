import {type I18n} from '@lingui/core'
import {z} from 'zod'

const countsMetricsDisplayValues = [
  'hidden',
  'lite',
  'visible',
  'exact',
] as const

export const countsMetricsDisplaySchema = z.preprocess(
  val => (val === 'accessible' ? 'lite' : val),
  z.enum(countsMetricsDisplayValues),
)
export type CountsMetricsDisplay = z.infer<typeof countsMetricsDisplaySchema>

const followedByMetricsDisplayValues = [
  'hidden',
  'lite',
  'visible',
  'names',
] as const

export const followedByMetricsDisplaySchema = z.preprocess(
  val => (val === 'accessible' ? 'lite' : val),
  z.enum(followedByMetricsDisplayValues),
)
export type FollowedByMetricsDisplay = z.infer<
  typeof followedByMetricsDisplaySchema
>

export function migrateCountsMetricsDisplay(
  display: CountsMetricsDisplay | undefined,
  legacyDisabled: boolean | undefined,
): CountsMetricsDisplay {
  if (display !== undefined) {
    return display
  }
  if (legacyDisabled === true) {
    return 'hidden'
  }
  if (legacyDisabled === false) {
    return 'visible'
  }
  return 'visible'
}

export function migrateFollowedByMetricsDisplay(
  display: FollowedByMetricsDisplay | undefined,
  legacyDisabled: boolean | undefined,
): FollowedByMetricsDisplay {
  if (display !== undefined) {
    return display
  }
  if (legacyDisabled === true) {
    return 'hidden'
  }
  return 'names'
}

export function isCountsMetricHidden(mode: CountsMetricsDisplay): boolean {
  return mode === 'hidden'
}

/** Whether a metric row or control may appear at all. */
export function shouldShowCountsMetricRow(mode: CountsMetricsDisplay): boolean {
  return mode !== 'hidden'
}

/** Whether to show numeric count text (visible = compact, exact = full number). */
export function shouldShowCountsMetricNumber(
  mode: CountsMetricsDisplay,
  _count: number,
): boolean {
  if (mode === 'hidden' || mode === 'lite') {
    return false
  }
  return mode === 'visible' || mode === 'exact'
}

/** Show label text without the numeric count (lite mode). */
export function shouldShowCountsMetricLabelOnly(
  mode: CountsMetricsDisplay,
  count: number,
): boolean {
  return mode === 'lite' && count > 0
}

/** Profile header metrics: hide lite rows when count is zero. */
export function shouldShowProfileCountsMetric(
  mode: CountsMetricsDisplay,
  count: number,
): boolean {
  if (mode === 'hidden') {
    return false
  }
  if (mode === 'lite') {
    return count > 0
  }
  return true
}

/** Expanded thread engagement row when count is non-zero. */
export function shouldShowThreadExpandedMetric(
  mode: CountsMetricsDisplay,
  count: number | null | undefined,
): boolean {
  if (count == null || count === 0) {
    return false
  }
  return shouldShowProfileCountsMetric(mode, count)
}

export function formatCountsMetricNumber(
  i18n: I18n,
  mode: CountsMetricsDisplay,
  count: number,
): string {
  if (mode === 'exact') {
    return i18n.number(count)
  }
  const isOver10k = count >= 10_000
  return i18n.number(count, {
    notation: 'compact',
    maximumFractionDigits: isOver10k ? 0 : 1,
    roundingMode: 'trunc',
  })
}

export function isFollowedByMetricHidden(
  mode: FollowedByMetricsDisplay,
): boolean {
  return mode === 'hidden'
}

export function shouldShowFollowedByText(
  mode: FollowedByMetricsDisplay,
): boolean {
  return mode === 'names'
}

export function shouldShowFollowedByOverflowCount(
  mode: FollowedByMetricsDisplay,
  serverCount: number,
  shownCount: number,
): boolean {
  return mode === 'visible' && serverCount > shownCount
}

export function shouldShowFollowedByOverflowPlus(
  mode: FollowedByMetricsDisplay,
  serverCount: number,
  shownCount: number,
): boolean {
  return mode === 'lite' && serverCount > shownCount
}
