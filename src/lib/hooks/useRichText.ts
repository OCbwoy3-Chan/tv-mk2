import {useEffect, useState} from 'react'
import {RichText as RichTextAPI} from '@bsky/sdk/richtext'

import {useAppviewClient} from '#/state/session'

export function useRichText(text: string): [RichTextAPI, boolean] {
  /*
   * Facet/mention resolution is an appview job - it resolves handles through
   * the appview, and the public fallback keeps it working when logged out.
   */
  const client = useAppviewClient()
  const [prevText, setPrevText] = useState(text)
  const [rawRT, setRawRT] = useState(() => new RichTextAPI({text}))
  const [resolvedRT, setResolvedRT] = useState<RichTextAPI | null>(null)
  if (text !== prevText) {
    setPrevText(text)
    setRawRT(new RichTextAPI({text}))
    setResolvedRT(null)
    // This will queue an immediate re-render
  }
  useEffect(() => {
    let ignore = false
    async function resolveRTFacets() {
      // new each time
      const resolvedRT = new RichTextAPI({text})
      await resolvedRT.detectFacets(client)
      if (!ignore) {
        setResolvedRT(resolvedRT)
      }
    }
    void resolveRTFacets()
    return () => {
      ignore = true
    }
  }, [text, client])
  const isResolving = resolvedRT === null
  return [resolvedRT ?? rawRT, isResolving]
}
