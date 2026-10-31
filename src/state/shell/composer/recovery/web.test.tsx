import {toDatetimeString} from '@atproto/syntax'
import {RichText} from '@bsky/sdk/richtext'
import {act, render} from '@testing-library/react-native'

import {
  Provider,
  useComposerControls,
  useComposerState,
  useOpenComposer,
} from '#/state/shell/composer'
import {type ComposerState} from '#/view/com/composer/state/composer'
import {clearRecovery, readRecovery, saveRecovery} from './index.web'

let mockCurrentDid: string | undefined = 'alice'
const mockRemoveQueries = jest.fn()

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (message: unknown) => message}),
}))
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({removeQueries: mockRemoveQueries}),
}))
jest.mock('#/state/session', () => ({
  useSession: () => ({
    currentAccount: mockCurrentDid ? {did: mockCurrentDid} : undefined,
    accounts: [{did: 'alice'}, {did: 'bob'}],
  }),
}))
jest.mock('#/state/gallery', () => ({
  purgeTemporaryImageFiles: jest.fn(),
}))
jest.mock('#/state/queries/resolve-link', () => ({
  precacheResolveLinkQuery: jest.fn(),
  RQKEY_GIF_ROOT: 'gif',
  RQKEY_LINK_ROOT: 'link',
}))
jest.mock('#/state/shell/composer/recovery', () =>
  jest.requireActual('./index.web'),
)
jest.mock('#/components/Toast', () => ({show: jest.fn()}))

function composition(text: string): ComposerState {
  return {
    activePostIndex: 0,
    mutableNeedsFocusActive: false,
    isDirty: true,
    loadedMediaMap: new Map([['photo', 'blob:photo']]),
    originalLocalRefs: new Set(['photo']),
    thread: {
      postgate: {
        $type: 'app.bsky.feed.postgate',
        post: 'at://did:plc:alice/app.bsky.feed.post/test',
        createdAt: toDatetimeString(new Date()),
      },
      threadgate: [],
      posts: [
        {
          id: 'post',
          richtext: new RichText({text}),
          shortenedGraphemeLength: text.length,
          labels: [],
          tags: ['tag'],
          embed: {quote: undefined, media: undefined, link: undefined},
        },
      ],
    },
  }
}

afterEach(() => {
  clearRecovery('alice')
  mockCurrentDid = 'alice'
  jest.clearAllMocks()
})

it('retains the latest composition and its browser media references', () => {
  saveRecovery('alice', {activeAccountDid: 'alice'}, composition('first'))
  const state = composition('latest')
  saveRecovery('alice', {activeAccountDid: 'bob', onPost: jest.fn()}, state)

  const recovery = readRecovery('alice')!
  expect(recovery.opts).toEqual({activeAccountDid: 'bob'})
  expect(recovery.state.thread).toBe(state.thread)
  expect(recovery.state.thread.posts[0].richtext.text).toBe('latest')
  expect(recovery.state.thread.posts[0].richtext).toBeInstanceOf(RichText)
  expect(recovery.state.loadedMediaMap?.get('photo')).toBe('blob:photo')
  expect(recovery.state.originalLocalRefs?.has('photo')).toBe(true)
  expect(recovery.state.mutableNeedsFocusActive).toBe(true)
  expect(state.mutableNeedsFocusActive).toBe(false)
})

it('restores the tab composer through a signed-out transition into another account', () => {
  let composer: ReturnType<typeof useComposerState>
  let openComposer: ReturnType<typeof useOpenComposer>['openComposer']
  let closeComposer: ReturnType<typeof useComposerControls>['closeComposer']

  function Observer() {
    composer = useComposerState()
    ;({openComposer} = useOpenComposer())
    ;({closeComposer} = useComposerControls())
    return null
  }

  function Shell({did}: {did: string | undefined}) {
    return (
      <Provider key={did}>
        <Observer />
      </Provider>
    )
  }

  const screen = render(<Shell did={mockCurrentDid} />)
  act(() => openComposer({activeAccountDid: 'alice'}))
  const state = composition('unfinished thread')
  saveRecovery('alice', composer!, state)

  mockCurrentDid = undefined
  screen.rerender(<Shell did={mockCurrentDid} />)
  expect(composer).toBeUndefined()

  mockCurrentDid = 'bob'
  screen.rerender(<Shell did={mockCurrentDid} />)
  expect(composer?.activeAccountDid).toBe('alice')
  expect(composer?.recoveredState?.thread).toBe(state.thread)
  expect(composer?.recoveredState?.mutableNeedsFocusActive).toBe(true)

  act(() => {
    closeComposer()
  })
  mockCurrentDid = undefined
  screen.rerender(<Shell did={mockCurrentDid} />)
  mockCurrentDid = 'alice'
  screen.rerender(<Shell did={mockCurrentDid} />)
  expect(composer).toBeUndefined()
})
