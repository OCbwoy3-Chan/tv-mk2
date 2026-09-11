import {useState} from 'react'
import {type ListRenderItemInfo} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {usePostViewTracking} from '#/lib/hooks/usePostViewTracking'
import {shareUrl} from '#/lib/sharing'
import {cleanError} from '#/lib/strings/errors'
import {useBlackskyTopicQuery} from '#/state/queries/blacksky-topic'
import {Post} from '#/view/com/post/Post'
import {List} from '#/view/com/util/List'
import {Button, ButtonIcon} from '#/components/Button'
import {ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as Share} from '#/components/icons/ArrowOutOfBox'
import * as Layout from '#/components/Layout'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'
import {type app} from '#/lexicons'

const renderItem = ({
  item,
}: ListRenderItemInfo<app.bsky.feed.defs.PostView>) => {
  return <Post post={item} />
}

const keyExtractor = (item: app.bsky.feed.defs.PostView, index: number) => {
  return `${item.uri}-${index}`
}

export function BlackskyTopic({topicId}: {topicId: string}) {
  const {t: l} = useLingui()
  const initialNumToRender = useInitialNumToRender()
  const trackPostView = usePostViewTracking('Topic')
  const [isPTR, setIsPTR] = useState(false)
  const {
    data,
    isFetched,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useBlackskyTopicQuery(topicId)
  const posts = data?.pages.flatMap(page => page.posts) ?? []
  const onRefresh = async () => {
    setIsPTR(true)
    try {
      await refetch()
    } finally {
      setIsPTR(false)
    }
  }
  const onEndReached = () => {
    if (!isFetchingNextPage && hasNextPage && !error) void fetchNextPage()
  }
  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            {data?.pages[0]?.topic.name || l`Topic`}
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot>
          <Button
            label={l`Share`}
            size="small"
            color="primary"
            onPress={() =>
              void shareUrl(`https://blacksky.community/topic/${topicId}`)
            }>
            <ButtonIcon icon={Share} />
          </Button>
        </Layout.Header.Slot>
      </Layout.Header.Outer>
      {posts.length < 1 ? (
        <ListMaybePlaceholder
          isLoading={isLoading || !isFetched}
          isError={isError}
          onRetry={refetch}
          emptyType="results"
          emptyMessage={l`We couldn't find any results for that topic.`}
        />
      ) : (
        <List
          data={posts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          refreshing={isPTR}
          onRefresh={() => void onRefresh()}
          onEndReached={onEndReached}
          onEndReachedThreshold={4}
          onItemSeen={trackPostView}
          desktopFixedHeight
          ListFooterComponent={
            <ListFooter
              isFetchingNextPage={isFetchingNextPage}
              error={cleanError(error)}
              onRetry={fetchNextPage}
            />
          }
          initialNumToRender={initialNumToRender}
          windowSize={11}
        />
      )}
    </Layout.Screen>
  )
}
