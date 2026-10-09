import {useEffect, useState} from 'react'
import {RichText as RichTextAPI} from '@bsky/sdk/richtext'

import {useAppviewClient} from '#/state/session'

export function useRichText(text: string): [RichTextAPI, boolean] {
  const [prevText, setPrevText] = useState(text)
  const [rawRT, setRawRT] = useState(() => createRawRichText(text))
  const [resolvedRT, setResolvedRT] = useState<RichTextAPI | null>(null)
  /*
   * Facet/mention resolution is an appview job - it resolves handles via
   * `com.atproto.identity.resolveHandle` through the appview. The public
   * fallback keeps mentions working on logged-out surfaces.
   */
  const client = useAppviewClient()
  const [prevClient, setPrevClient] = useState(client)
  if (text !== prevText || client !== prevClient) {
    setPrevClient(client)
    setPrevText(text)
    setRawRT(createRawRichText(text))
    setResolvedRT(null)
    // This will queue an immediate re-render
  }
  useEffect(() => {
    let ignore = false
    async function resolveRTFacets() {
      /* Keep the visible facets immutable while mentions resolve. */
      const resolvedRT = createRawRichText(text)
      try {
        await resolvedRT.detectFacets(client)
      } catch {
        /* A failed lookup must not leave consumers waiting indefinitely. */
        resolvedRT.detectFacetsWithoutResolution()
      }
      if (!ignore) {
        setResolvedRT(resolvedRT)
      }
    }
    void resolveRTFacets()
    return () => {
      ignore = true
    }
  }, [text, client])
  const isResolving =
    resolvedRT === null &&
    Array.from(rawRT.segments()).some(segment => !!segment.mention)
  return [resolvedRT ?? rawRT, isResolving]
}

/** Detect links and tags immediately so mention lookups do not change layout. */
function createRawRichText(text: string) {
  const rt = new RichTextAPI({text})
  rt.detectFacetsWithoutResolution()
  return rt
}
