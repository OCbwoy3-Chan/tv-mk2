/** Share observers across rows while retaining distinct prefetch and seen margins. */
export function createRowObserver(options: IntersectionObserverInit) {
  const callbacks = new Map<
    Element,
    (entries: IntersectionObserverEntry[]) => void
  >()
  let observer: IntersectionObserver | undefined
  return (
    node: Element,
    callback: (entries: IntersectionObserverEntry[]) => void,
  ) => {
    observer ??= new IntersectionObserver(entries => {
      for (const entry of entries) callbacks.get(entry.target)?.([entry])
    }, options)
    callbacks.set(node, callback)
    observer.observe(node)
    return () => {
      observer?.unobserve(node)
      callbacks.delete(node)
      if (callbacks.size === 0) {
        observer?.disconnect()
        observer = undefined
      }
    }
  }
}
