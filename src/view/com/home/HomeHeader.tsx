import {useCallback, useMemo} from 'react'
import {AtUri} from '@atproto/syntax'
import {useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {
  HITSLOP_10,
  TIMELINE_SAVED_FEED,
  TRENDING_DID,
  TRENDING_HANDLE,
} from '#/lib/constants'
import {type NavigationProp} from '#/lib/routes/types'
import {getLocalizedFeedName} from '#/lib/strings/feed-names'
import {useHideFeedsPromoTab} from '#/state/preferences/hide-feeds-promo-tab'
import {type FeedSourceInfo, useFeedSourceInfoQuery} from '#/state/queries/feed'
import {useSession} from '#/state/session'
import {type RenderTabBarFnProps} from '#/view/com/pager/Pager'
import {FeedInfoDialog} from '#/screens/CustomFeed/components/CustomFeedHeader'
import {atoms as a} from '#/alf'
import {ButtonIcon} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon} from '#/components/icons/CircleInfo'
import {Link} from '#/components/Link'
import {TabBar} from '../pager/TabBar'
import {HomeHeaderLayout} from './HomeHeaderLayout'

export function HomeHeader(
  props: RenderTabBarFnProps & {
    testID?: string
    onPressSelected: () => void
    feeds: Pick<FeedSourceInfo, 'displayName' | 'uri'>[]
  },
) {
  const {feeds, onSelect: onSelectProp} = props
  const {hasSession} = useSession()
  const hideFeedsPromoTab = useHideFeedsPromoTab()
  const {t: l, i18n} = useLingui()
  const navigation = useNavigation<NavigationProp>()

  const hasPinnedCustom = useMemo<boolean>(() => {
    if (!hasSession) return false
    return feeds.some(tab => {
      const isFollowing = tab.uri === TIMELINE_SAVED_FEED.value
      return !isFollowing
    })
  }, [feeds, hasSession])

  const items = useMemo(() => {
    const pinnedNames = feeds.map(f => getLocalizedFeedName(f, i18n))
    if (!hasPinnedCustom && !hideFeedsPromoTab) {
      return pinnedNames.concat(l`Feeds ✨`)
    }
    return pinnedNames
  }, [i18n, l, hasPinnedCustom, hideFeedsPromoTab, feeds])

  const onPressFeedsLink = useCallback(() => {
    navigation.navigate('Feeds')
  }, [navigation])

  const onSelect = useCallback(
    (index: number) => {
      if (
        !hasPinnedCustom &&
        !hideFeedsPromoTab &&
        index === items.length - 1
      ) {
        onPressFeedsLink()
      } else if (onSelectProp) {
        onSelectProp(index)
      }
    },
    [
      items.length,
      onPressFeedsLink,
      onSelectProp,
      hasPinnedCustom,
      hideFeedsPromoTab,
    ],
  )

  const selectedFeed = feeds[props.selectedPage]

  const tabs = (
    <TabBar
      key={items.join(',')}
      onPressSelected={props.onPressSelected}
      selectedPage={props.selectedPage}
      onSelect={onSelect}
      testID={props.testID}
      items={items}
      dragProgress={props.dragProgress}
      dragState={props.dragState}
      transparent
    />
  )

  if (selectedFeed && selectedFeed.uri !== TIMELINE_SAVED_FEED.value) {
    return (
      <HomeHeaderWithFeedInfo
        uri={selectedFeed.uri}
        tabBarAnchor={props.tabBarAnchor}>
        {tabs}
      </HomeHeaderWithFeedInfo>
    )
  }

  const openFollowingSettings = () =>
    navigation.navigate('PreferencesFollowingFeed')

  return (
    <HomeHeaderLayout
      tabBarAnchor={props.tabBarAnchor}
      onFeedInfoPress={openFollowingSettings}
      feedInfoButton={
        selectedFeed && (
          <Link
            to={{screen: 'PreferencesFollowingFeed'}}
            hitSlop={HITSLOP_10}
            label={l`Following feed settings`}
            size="small"
            variant="ghost"
            color="secondary"
            shape="square"
            style={[a.justify_center]}>
            <ButtonIcon icon={CircleInfoIcon} size="lg" />
          </Link>
        )
      }>
      {tabs}
    </HomeHeaderLayout>
  )
}

function HomeHeaderWithFeedInfo({
  uri,
  children,
  tabBarAnchor,
}: {
  uri: string
  children: React.ReactNode
  tabBarAnchor: RenderTabBarFnProps['tabBarAnchor']
}) {
  const {t: l} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const control = Dialog.useDialogControl()
  const {data: info} = useFeedSourceInfoQuery({uri})
  const atUri = new AtUri(uri)

  const openInfo = () => {
    if (info?.type === 'feed') {
      control.open()
    } else if (atUri.collection === 'app.bsky.graph.list') {
      navigation.navigate('ProfileList', {name: atUri.host, rkey: atUri.rkey})
    } else {
      navigation.navigate('CustomFeed', {name: atUri.host, rkey: atUri.rkey})
    }
  }

  return (
    <>
      <HomeHeaderLayout
        tabBarAnchor={tabBarAnchor}
        onFeedInfoPress={openInfo}
        feedInfoButton={
          <Link
            testID="homeHeaderFeedInfoBtn"
            to={
              atUri.collection === 'app.bsky.graph.list'
                ? {
                    screen: 'ProfileList',
                    params: {name: atUri.host, rkey: atUri.rkey},
                  }
                : {
                    screen: 'CustomFeed',
                    params: {name: atUri.host, rkey: atUri.rkey},
                  }
            }
            hitSlop={HITSLOP_10}
            label={l`View feed information`}
            size="small"
            variant="ghost"
            color="secondary"
            shape="square"
            onPress={event => {
              event.preventDefault()
              openInfo()
              return false
            }}
            style={[a.justify_center]}>
            <ButtonIcon icon={CircleInfoIcon} size="lg" />
          </Link>
        }>
        {children}
      </HomeHeaderLayout>
      {info?.type === 'feed' && (
        <FeedInfoDialog
          key={info.uri}
          info={info}
          control={control}
          isTrending={
            info.creatorDid.toLowerCase() === TRENDING_DID ||
            info.creatorHandle.toLowerCase() === TRENDING_HANDLE
          }
        />
      )}
    </>
  )
}
