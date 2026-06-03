import {useCallback} from 'react'
import {useLingui} from '@lingui/react'

import {
  type CountsMetricsDisplay,
  formatCountsMetricNumber,
} from '#/lib/metrics-display'

/**
 * Formats post stat counts using the user's impressions display preference.
 */
export function useFormatPostStatCount(
  display: CountsMetricsDisplay = 'visible',
) {
  const {i18n} = useLingui()

  return useCallback(
    (postStatCount: number) =>
      formatCountsMetricNumber(i18n, display, postStatCount),
    [display, i18n],
  )
}
