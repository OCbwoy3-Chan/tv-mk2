import {guessLanguageAsync} from '@bsky.app/expo-guess-language'

self.onmessage = async (event: MessageEvent<{id: number; text: string}>) => {
  const {id, text} = event.data
  try {
    const results = await guessLanguageAsync(text)
    self.postMessage({id, results})
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
