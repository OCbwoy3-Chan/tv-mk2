import {useEffect, useRef} from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'
import {hashKey, type QueryKey, useQueryClient} from '@tanstack/react-query'

import {useBottomBarOffset} from '#/lib/hooks/useBottomBarOffset'
import {pageNumber} from '#/state/queries/cursor-pagination'
import {type ListRef} from '#/view/com/util/List'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

export type PaginationQuery = {
  data?: {pageParams: unknown[]}
  paginationQueryKey: QueryKey
  hasNextPage: boolean
  hasPreviousPage: boolean
  isFetching: boolean
  isPlaceholderData?: boolean
  isFetchPreviousPageError: boolean
  isFetchNextPageError: boolean
  fetchNextPage: () => Promise<unknown>
  fetchPreviousPage: () => Promise<unknown>
  refetch: () => Promise<unknown>
}

export function Controls({
  query,
  top = false,
}: {
  query: PaginationQuery
  top?: boolean
}) {
  const {t: l} = useLingui()
  const bottomBarOffset = useBottomBarOffset()
  const page = pageNumber(query.data?.pageParams[0])
  if ((top && page === 1) || (!query.hasNextPage && !query.hasPreviousPage))
    return null
  return (
    <View style={!top && {paddingBottom: bottomBarOffset}}>
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.justify_center,
          a.gap_sm,
          a.p_md,
        ]}>
        {query.hasPreviousPage && (
          <Button
            testID={`paginationPrevious${top ? 'Top' : 'Bottom'}`}
            label={l`Previous page`}
            color="secondary"
            size="small"
            disabled={query.isFetching || query.isPlaceholderData}
            onPress={() => query.fetchPreviousPage()}>
            <ButtonText>{l`Previous page`}</ButtonText>
          </Button>
        )}
        <Text accessibilityLiveRegion="polite">{l`Page ${page}`}</Text>
        {query.hasNextPage && (
          <Button
            testID={`paginationNext${top ? 'Top' : 'Bottom'}`}
            label={l`Next page`}
            color="secondary"
            size="small"
            disabled={query.isFetching || query.isPlaceholderData}
            onPress={() => query.fetchNextPage()}>
            <ButtonText>{l`Next page`}</ButtonText>
          </Button>
        )}
      </View>
      {(query.isFetchPreviousPageError || query.isFetchNextPageError) && (
        <Text
          style={[a.text_center, a.px_md, a.pb_md]}
          accessibilityLiveRegion="polite">
          {l`Could not load that page. Please try again.`}
        </Text>
      )}
    </View>
  )
}

/** Remount page contents to release list-local state and restore scroll position. */
export function usePaginatedList(query: PaginationQuery, enabled: boolean) {
  const client = useQueryClient()
  const ref: ListRef = useRef(null)
  const page = pageNumber(query.data?.pageParams[0])
  const identity = enabled
    ? `${hashKey(query.paginationQueryKey)}:${page}`
    : 'infinite'
  useEffect(() => {
    if (enabled) ref.current?.scrollToOffset({offset: 0, animated: false})
  }, [enabled, identity])
  return {
    ref,
    key: identity,
    header: enabled ? <Controls query={query} top /> : undefined,
    footer: enabled && query.data ? <Controls query={query} /> : undefined,
    async refresh() {
      if (enabled && page > 1) {
        await client.resetQueries({
          queryKey: query.paginationQueryKey,
          exact: true,
        })
      } else {
        await query.refetch()
      }
    },
  }
}
