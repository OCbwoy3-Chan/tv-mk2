import {createRowObserver} from './createRowObserver'

test('shares observation, routes entries, and releases the last observer', () => {
  const original = globalThis.IntersectionObserver
  let deliver!: IntersectionObserverCallback
  const observe = jest.fn()
  const unobserve = jest.fn()
  const disconnect = jest.fn()
  const construct = jest.fn(callback => {
    deliver = callback
    return {observe, unobserve, disconnect}
  })
  globalThis.IntersectionObserver =
    construct as unknown as typeof IntersectionObserver
  try {
    const subscribe = createRowObserver({rootMargin: '800px'})
    const first = {} as Element
    const second = {} as Element
    const firstCallback = jest.fn()
    const secondCallback = jest.fn()
    const releaseFirst = subscribe(first, firstCallback)
    const releaseSecond = subscribe(second, secondCallback)
    expect(construct).toHaveBeenCalledTimes(1)
    const entry = {
      target: second,
      isIntersecting: true,
    } as IntersectionObserverEntry
    deliver([entry], {} as IntersectionObserver)
    expect(firstCallback).not.toHaveBeenCalled()
    expect(secondCallback).toHaveBeenCalledWith([entry])
    releaseFirst()
    expect(unobserve).toHaveBeenCalledWith(first)
    expect(disconnect).not.toHaveBeenCalled()
    deliver([{...entry, target: first}], {} as IntersectionObserver)
    expect(firstCallback).not.toHaveBeenCalled()
    releaseSecond()
    expect(disconnect).toHaveBeenCalledTimes(1)
    const releaseNew = subscribe(first, firstCallback)
    expect(construct).toHaveBeenCalledTimes(2)
    releaseNew()
  } finally {
    globalThis.IntersectionObserver = original
  }
})
