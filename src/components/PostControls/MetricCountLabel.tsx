import {type ReactNode} from 'react'

import {
  type CountsMetricsDisplay,
  shouldShowCountsMetricLabelOnly,
  shouldShowCountsMetricNumber,
  shouldShowCountsMetricRow,
} from '#/lib/metrics-display'
import {PostControlButtonText} from '#/components/PostControls/PostControlButton'
import {useFormatPostStatCount} from '#/components/PostControls/util'

export function MetricCountLabel({
  display,
  count,
  testID,
  labelOnly,
}: {
  display: CountsMetricsDisplay
  count: number
  testID?: string
  labelOnly: ReactNode
}) {
  const formatPostStatCount = useFormatPostStatCount(display)

  if (!shouldShowCountsMetricRow(display)) {
    return null
  }
  if (shouldShowCountsMetricLabelOnly(display, count)) {
    return (
      <PostControlButtonText testID={testID}>{labelOnly}</PostControlButtonText>
    )
  }
  if (shouldShowCountsMetricNumber(display, count) && count > 0) {
    return (
      <PostControlButtonText testID={testID}>
        {formatPostStatCount(count)}
      </PostControlButtonText>
    )
  }
  return null
}
