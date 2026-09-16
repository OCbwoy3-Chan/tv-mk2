import {useEffect, useState} from 'react'

/** Keep a request pending if the last row becomes visible during a fetch. */
export function useChainPagination({
  lastUri,
  hasNextPage,
  isFetching,
  isError,
  fetchNextPage,
}: {
  lastUri?: string
  hasNextPage: boolean
  isFetching: boolean
  isError: boolean
  fetchNextPage: () => Promise<unknown>
}) {
  const [requestedAfter, setRequestedAfter] = useState<string>()

  useEffect(() => {
    if (
      lastUri &&
      requestedAfter === lastUri &&
      hasNextPage &&
      !isFetching &&
      !isError
    ) {
      void fetchNextPage()
    }
  }, [lastUri, requestedAfter, hasNextPage, isFetching, isError, fetchNextPage])

  return {
    onEndReached: () => setRequestedAfter(lastUri),
    onItemNearViewport: (item: {uri: string}) => {
      if (item.uri === lastUri) setRequestedAfter(item.uri)
    },
  }
}
