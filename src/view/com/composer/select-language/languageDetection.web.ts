import {type LanguageResult} from '@bsky.app/expo-guess-language'

type WorkerResponse =
  {id: number; results: LanguageResult[]} | {id: number; error: string}

type PendingRequest = {
  resolve: (results: LanguageResult[]) => void
  reject: (error: Error) => void
}

let nextRequestId = 0
let languageWorker: Worker | undefined
const pendingRequests = new Map<number, PendingRequest>()

function getLanguageWorker(): Worker {
  if (languageWorker) {
    return languageWorker
  }

  languageWorker = new Worker(
    new URL('./languageDetection.worker.ts', import.meta.url),
    {type: 'module'},
  )
  languageWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const request = pendingRequests.get(event.data.id)
    if (!request) {
      return
    }
    pendingRequests.delete(event.data.id)

    if ('error' in event.data) {
      request.reject(new Error(event.data.error))
    } else {
      request.resolve(event.data.results)
    }
  }
  languageWorker.onerror = event => {
    const error = new Error(event.message || 'Language detection worker failed')
    for (const request of pendingRequests.values()) {
      request.reject(error)
    }
    pendingRequests.clear()
    languageWorker?.terminate()
    languageWorker = undefined
  }

  return languageWorker
}

/**
 * Runs web language inference away from the UI thread. The web implementation
 * of expo-guess-language uses lande synchronously even though its public API
 * returns a Promise, so calling it on the main thread can delay composer input
 * on slower devices.
 */
export function guessLanguageAsync(text: string): Promise<LanguageResult[]> {
  const id = ++nextRequestId
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, {resolve, reject})
    try {
      getLanguageWorker().postMessage({id, text})
    } catch (error) {
      pendingRequests.delete(id)
      reject(error instanceof Error ? error : new Error(String(error)))
    }
  })
}

export {type LanguageResult}
