import {Trans, useLingui} from '@lingui/react/macro'
import {useInfiniteQuery} from '@tanstack/react-query'

import {useSetTitle} from '#/lib/hooks/useSetTitle'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {STALE} from '#/state/queries'
import {useGetPost} from '#/state/queries/post'
import {createQueryKey, getEmbeddedPost} from '#/state/queries/util'
import {Post} from '#/view/com/post/Post'
import {List} from '#/view/com/util/List'
import {useChainPagination} from '#/screens/Post/QuoteChain/useChainPagination'
import * as Layout from '#/components/Layout'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'
import {type app} from '#/lexicons'

const useQuoteChainQueryKey = 'quote-chain'

function useQuoteChainQuery(uri: string) {
  const getPost = useGetPost()
  return useInfiniteQuery({
    queryKey: createQueryKey(useQuoteChainQueryKey, {uri}),
    initialPageParam: uri,
    queryFn: ({pageParam}) => getPost({uri: pageParam}),
    staleTime: STALE.MINUTES.ONE,
    getNextPageParam: (post, posts) => {
      const next = getEmbeddedPost(post.embed)?.uri
      // Stop at unavailable quotes and protect against circular references.
      return next && !posts.some(item => item.uri === next) ? next : undefined
    },
  })
}

export function PostQuoteChainScreen({
  route,
}: NativeStackScreenProps<CommonNavigatorParams, 'PostQuoteChain'>) {
  const {t: l} = useLingui()
  useSetTitle(l`Quote chain`)
  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)
  const query = useQuoteChainQuery(uri)
  const posts = query.data?.pages ?? []

  const pagination = useChainPagination({
    lastUri: posts.at(-1)?.uri,
    hasNextPage: query.hasNextPage,
    isFetching: query.isFetching,
    isError: query.isError,
    fetchNextPage: query.fetchNextPage,
  })

  return (
    <Layout.Screen testID="quoteChainScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Quote chain</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      {posts.length === 0 ? (
        <ListMaybePlaceholder
          isLoading={query.isPending}
          isError={query.isError}
          errorMessage={cleanError(query.error)}
          onRetry={query.refetch}
          sideBorders={false}
        />
      ) : (
        <List
          data={posts}
          keyExtractor={(post: app.bsky.feed.defs.PostView) => post.uri}
          renderItem={({item, index}) => (
            <Post
              post={item}
              hideTopBorder={index === 0}
              hideQuoteEmbedUri={posts[index + 1]?.uri}
            />
          )}
          onEndReached={pagination.onEndReached}
          onItemNearViewport={pagination.onItemNearViewport}
          onEndReachedThreshold={2}
          ListFooterComponent={
            <ListFooter
              isFetchingNextPage={query.isFetchingNextPage}
              hasNextPage={query.hasNextPage}
              error={cleanError(query.error)}
              onRetry={query.fetchNextPage}
              showEndMessage
              endMessageText={l`End of quote chain`}
            />
          }
          desktopFixedHeight
          sideBorders={false}
        />
      )}
    </Layout.Screen>
  )
}
