import {useSharedValue} from 'react-native-reanimated'
import {fireEvent, render} from '@testing-library/react-native'

import {TIMELINE_SAVED_FEED} from '#/lib/constants'
import {HomeHeader} from '#/view/com/home/HomeHeader'

const mockNavigate = jest.fn()
const mockOpen = jest.fn()
const mockSelect = jest.fn()
let mockInfo:
  {type: string; creatorDid: string; creatorHandle: string} | undefined

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: mockNavigate}),
}))
jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (message: {message: string}) => message.message}),
}))
jest.mock('#/lib/strings/feed-names', () => ({
  getLocalizedFeedName: (feed: {displayName: string}) => feed.displayName,
}))
jest.mock('#/state/session', () => ({useSession: () => ({hasSession: true})}))
jest.mock('#/state/preferences/hide-feeds-promo-tab', () => ({
  useHideFeedsPromoTab: () => false,
}))
jest.mock('#/state/queries/feed', () => ({
  useFeedSourceInfoQuery: () => ({data: mockInfo}),
}))
jest.mock('#/alf', () => ({atoms: {}}))
jest.mock('#/components/Button', () => ({ButtonIcon: () => null}))
jest.mock('#/components/icons/CircleInfo', () => ({
  CircleInfo_Stroke2_Corner0_Rounded: () => null,
}))
jest.mock('#/components/Link', () => ({Link: () => null}))
jest.mock('#/components/Dialog', () => ({
  useDialogControl: () => ({open: mockOpen}),
}))
jest.mock('#/screens/CustomFeed/components/CustomFeedHeader', () => ({
  FeedInfoDialog: () => null,
}))
jest.mock('../HomeHeaderLayout', () => {
  const {Pressable} = require('react-native')
  return {
    HomeHeaderLayout: ({
      onFeedInfoPress,
      children,
    }: {
      onFeedInfoPress?: () => void
      children: React.ReactNode
    }) => (
      <Pressable
        accessibilityRole="button"
        testID="info"
        onPress={onFeedInfoPress}>
        {children}
      </Pressable>
    ),
  }
})
jest.mock('../../pager/TabBar', () => {
  const {Pressable} = require('react-native')
  return {
    TabBar: ({onSelect}: {onSelect: (index: number) => void}) => (
      <Pressable
        accessibilityRole="button"
        testID="tab"
        onPress={() => onSelect(1)}
      />
    ),
  }
})

function TestHeader({uri}: {uri: string}) {
  const dragProgress = useSharedValue(0)
  const dragState = useSharedValue<'idle' | 'dragging' | 'settling'>('idle')
  return (
    <HomeHeader
      feeds={[{uri, displayName: 'Feed'}]}
      selectedPage={0}
      dragProgress={dragProgress}
      dragState={dragState}
      onSelect={mockSelect}
      onPressSelected={jest.fn()}
      tabBarAnchor={null}
    />
  )
}

function header(uri: string) {
  return render(<TestHeader uri={uri} />)
}

beforeEach(() => {
  jest.clearAllMocks()
  mockInfo = undefined
})

test('Following information opens its settings and the promo tab opens Feeds', () => {
  const screen = header(TIMELINE_SAVED_FEED.value)
  fireEvent.press(screen.getByTestId('info'))
  expect(mockNavigate).toHaveBeenCalledWith('PreferencesFollowingFeed')
  fireEvent.press(screen.getByTestId('tab'))
  expect(mockNavigate).toHaveBeenLastCalledWith('Feeds')
})

test('loaded custom feeds open their information dialog and tabs select pages', () => {
  mockInfo = {
    type: 'feed',
    creatorDid: 'did:plc:test',
    creatorHandle: 'test.example',
  }
  const screen = header('at://did:plc:test/app.bsky.feed.generator/feed')
  fireEvent.press(screen.getByTestId('info'))
  expect(mockOpen).toHaveBeenCalledTimes(1)
  fireEvent.press(screen.getByTestId('tab'))
  expect(mockSelect).toHaveBeenCalledWith(1)
})

test.each([
  ['app.bsky.graph.list', 'ProfileList'],
  ['app.bsky.feed.generator', 'CustomFeed'],
])('unloaded %s information opens %s', (collection, route) => {
  const screen = header(`at://did:plc:test/${collection}/feed`)
  fireEvent.press(screen.getByTestId('info'))
  expect(mockNavigate).toHaveBeenCalledWith(route, {
    name: 'did:plc:test',
    rkey: 'feed',
  })
})
