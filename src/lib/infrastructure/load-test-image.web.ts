export function loadTestImage(url: string, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason ?? new Error('Aborted'))
      return
    }

    const img = new Image()
    const onAbort = () => {
      img.src = ''
      reject(signal.reason ?? new Error('Aborted'))
    }

    signal.addEventListener('abort', onAbort, {once: true})
    img.onload = () => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }
    img.onerror = () => {
      signal.removeEventListener('abort', onAbort)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}
