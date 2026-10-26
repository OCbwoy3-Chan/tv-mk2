describe('web idle callback polyfill', () => {
  const originalRequest = globalThis.requestIdleCallback
  const originalCancel = globalThis.cancelIdleCallback

  beforeEach(() => {
    jest.useFakeTimers()
    Reflect.deleteProperty(globalThis, 'requestIdleCallback')
    Reflect.deleteProperty(globalThis, 'cancelIdleCallback')
  })

  afterEach(() => {
    jest.useRealTimers()
    if (originalRequest) {
      globalThis.requestIdleCallback = originalRequest
    } else {
      Reflect.deleteProperty(globalThis, 'requestIdleCallback')
    }
    if (originalCancel) {
      globalThis.cancelIdleCallback = originalCancel
    } else {
      Reflect.deleteProperty(globalThis, 'cancelIdleCallback')
    }
  })

  function loadPolyfills() {
    jest.isolateModules(() => {
      require('#/platform/polyfills.web')
    })
  }

  it('runs deferred work asynchronously when idle callbacks are missing', () => {
    loadPolyfills()
    const callback = jest.fn<void, [IdleDeadline]>()

    requestIdleCallback(callback)
    expect(callback).not.toHaveBeenCalled()
    jest.runOnlyPendingTimers()

    expect(callback).toHaveBeenCalledTimes(1)
    const deadline: IdleDeadline = callback.mock.calls[0][0]
    expect(deadline.didTimeout).toBe(false)
    expect(deadline.timeRemaining()).toBe(50)
    jest.advanceTimersByTime(60)
    expect(deadline.timeRemaining()).toBe(0)
  })

  it('cancels deferred work', () => {
    loadPolyfills()
    const callback = jest.fn()

    const handle = requestIdleCallback(callback)
    cancelIdleCallback(handle)
    jest.runOnlyPendingTimers()

    expect(callback).not.toHaveBeenCalled()
  })

  it('preserves browser implementations', () => {
    const request = jest.fn()
    const cancel = jest.fn()
    globalThis.requestIdleCallback = request
    globalThis.cancelIdleCallback = cancel

    loadPolyfills()

    expect(globalThis.requestIdleCallback).toBe(request)
    expect(globalThis.cancelIdleCallback).toBe(cancel)
  })
})
