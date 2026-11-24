/**
 * Resolve once the next frame has painted, e.g. so a menu that triggered a
 * heavy synchronous render can visibly close first. Hidden documents never
 * paint, so a timeout bounds the wait.
 */
export function afterNextPaint(timeoutMs = 100) {
  return new Promise<void>(resolve => {
    const fallback = setTimeout(resolve, timeoutMs)
    requestAnimationFrame(() =>
      setTimeout(() => {
        clearTimeout(fallback)
        resolve()
      }, 0),
    )
  })
}
