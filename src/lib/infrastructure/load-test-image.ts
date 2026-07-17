import {Image} from 'react-native'

export function loadTestImage(url: string, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason ?? new Error('Aborted'))
      return
    }

    const onAbort = () => {
      reject(signal.reason ?? new Error('Aborted'))
    }

    signal.addEventListener('abort', onAbort, {once: true})
    Image.prefetch(url)
      .then(() => {
        signal.removeEventListener('abort', onAbort)
        resolve()
      })
      .catch(err => {
        signal.removeEventListener('abort', onAbort)
        reject(err)
      })
  })
}
