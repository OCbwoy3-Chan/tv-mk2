import deepEqual from 'fast-deep-equal'

export function shouldApplyCloudValue({
  local,
  cloud,
  defaultValue,
  baseline,
  hasBaseline,
  preferLocalWithoutBaseline,
}: {
  local: unknown
  cloud: unknown
  defaultValue: unknown
  baseline: unknown
  hasBaseline: boolean
  preferLocalWithoutBaseline: boolean
}): boolean {
  if (deepEqual(local, cloud)) return false

  if (hasBaseline) {
    const localChangedSinceSync = !deepEqual(local, baseline)
    const cloudChangedSinceSync = !deepEqual(cloud, baseline)
    return !localChangedSinceSync && cloudChangedSinceSync
  }

  return !preferLocalWithoutBaseline && deepEqual(local, defaultValue)
}
