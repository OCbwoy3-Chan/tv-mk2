import {shouldApplyCloudValue} from './merge'

describe('settings sync conflict resolution', () => {
  const resolve = (
    local: unknown,
    cloud: unknown,
    baseline: unknown,
    hasBaseline = true,
    preferLocalWithoutBaseline = false,
  ) =>
    shouldApplyCloudValue({
      local,
      cloud,
      defaultValue: false,
      baseline,
      hasBaseline,
      preferLocalWithoutBaseline,
    })

  it('pulls a cloud-only change', () => {
    expect(resolve(false, true, false)).toBe(true)
  })

  it('keeps a local-only change back to the default', () => {
    expect(resolve(false, true, true)).toBe(false)
  })

  it('keeps the local value when both sides changed', () => {
    expect(resolve('local', 'cloud', 'old')).toBe(false)
  })

  it('fills defaults from cloud on a new device without a baseline', () => {
    expect(resolve(false, true, undefined, false)).toBe(true)
  })

  it('keeps local values while upgrading a previously synced device', () => {
    expect(resolve(false, true, undefined, false, true)).toBe(false)
  })
})
