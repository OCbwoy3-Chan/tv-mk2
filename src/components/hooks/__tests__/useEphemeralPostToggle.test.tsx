import {Pressable, Text} from 'react-native'
import {act, fireEvent, render} from '@testing-library/react-native'

jest.mock('@lingui/react', () => {
  const format = (
    message: {message?: string; values?: Record<string, string>} | string,
  ) =>
    typeof message === 'string'
      ? message
      : (message.message ?? '').replace(/{(\w+)}/g, (_, key: string) =>
          String(message.values?.[key] ?? ''),
        )
  return {useLingui: () => ({_: format, t: format})}
})
const mockPromptOpen = jest.fn()
jest.mock('#/components/Prompt', () => {
  const {Pressable: P, Text: T} = require('react-native')
  return {
    usePromptControl: () => ({open: mockPromptOpen}),
    Basic: ({title, onConfirm}: {title: string; onConfirm: () => void}) => (
      <P
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint=""
        testID="confirm"
        onPress={onConfirm}>
        <T testID="promptTitle">{title}</T>
      </P>
    ),
  }
})
const mockToast = jest.fn()
jest.mock('#/components/Toast', () => ({
  show: (...args: unknown[]) => mockToast(...args),
}))
const mockShowError = jest.fn()
jest.mock('../useEphemeralAccountError', () => ({
  useEphemeralAccountError: () => mockShowError,
}))
type Viewer = {like?: string; repost?: string; bookmarked?: boolean}
let mockViewer: Viewer = {}
const mockAgent = {
  getPosts: jest.fn(() =>
    Promise.resolve({
      data: {posts: [{author: {did: 'did:plc:author'}, viewer: mockViewer}]},
    }),
  ),
  like: jest.fn(),
  deleteLike: jest.fn(),
  repost: jest.fn(),
  deleteRepost: jest.fn(),
  app: {
    bsky: {
      bookmark: {createBookmark: jest.fn(), deleteBookmark: jest.fn()},
    },
  },
}
jest.mock('../useRunWithEphemeralAgent', () => ({
  useRunWithEphemeralAgent:
    () =>
    <T,>(_account: unknown, fn: (agent: typeof mockAgent) => Promise<T>) =>
      fn(mockAgent),
}))

import {type SessionAccount} from '#/state/session'
import {
  type EphemeralPostAction,
  useEphemeralPostToggle,
} from '../useEphemeralPostToggle'

const URI = 'at://did:plc:author/app.bsky.feed.post/1'
const ALT = {
  did: 'did:plc:alt',
  handle: 'alt.test',
} as unknown as SessionAccount

function Harness({autoLikeOnRepost}: {autoLikeOnRepost?: boolean}) {
  const {toggle, prompt} = useEphemeralPostToggle({
    uri: URI,
    cid: 'cid',
    autoLikeOnRepost,
  })
  return (
    <>
      {(['like', 'repost', 'bookmark'] as EphemeralPostAction[]).map(action => (
        <Pressable
          key={action}
          accessibilityRole="button"
          accessibilityLabel={action}
          accessibilityHint=""
          testID={action}
          onPress={() => void toggle(action, ALT)}>
          <Text>{action}</Text>
        </Pressable>
      ))}
      {prompt}
    </>
  )
}

async function press(utils: ReturnType<typeof render>, testID: string) {
  fireEvent.press(utils.getByTestId(testID))
  // Let the toggle's awaited agent calls settle.
  await act(() => Promise.resolve())
}

describe('useEphemeralPostToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockViewer = {}
  })

  it('likes right away when that account has not liked the post', async () => {
    const utils = render(<Harness />)
    await press(utils, 'like')
    expect(mockAgent.like).toHaveBeenCalledWith(URI, 'cid')
    expect(mockPromptOpen).not.toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledWith('Liked as @alt.test')
  })

  it('asks before unliking, and only unlikes on confirm', async () => {
    mockViewer = {like: 'at://like'}
    const utils = render(<Harness />)
    await press(utils, 'like')

    expect(mockPromptOpen).toHaveBeenCalledTimes(1)
    expect(mockAgent.deleteLike).not.toHaveBeenCalled()
    expect(mockAgent.like).not.toHaveBeenCalled()
    expect(utils.getByTestId('promptTitle')).toHaveTextContent(
      'Unlike as @alt.test?',
    )

    await press(utils, 'confirm')
    expect(mockAgent.deleteLike).toHaveBeenCalledWith('at://like')
    expect(mockToast).toHaveBeenCalledWith('Removed like as @alt.test')
  })

  it('asks before undoing a repost', async () => {
    mockViewer = {repost: 'at://repost'}
    const utils = render(<Harness />)
    await press(utils, 'repost')
    expect(utils.getByTestId('promptTitle')).toHaveTextContent(
      'Undo repost as @alt.test?',
    )
    await press(utils, 'confirm')
    expect(mockAgent.deleteRepost).toHaveBeenCalledWith('at://repost')
  })

  it('asks before removing a save', async () => {
    mockViewer = {bookmarked: true}
    const utils = render(<Harness />)
    await press(utils, 'bookmark')
    expect(utils.getByTestId('promptTitle')).toHaveTextContent(
      'Remove save as @alt.test?',
    )
    await press(utils, 'confirm')
    expect(mockAgent.app.bsky.bookmark.deleteBookmark).toHaveBeenCalledWith({
      uri: URI,
    })
  })

  it('also likes when reposting, if asked to', async () => {
    const utils = render(<Harness autoLikeOnRepost />)
    await press(utils, 'repost')
    expect(mockAgent.repost).toHaveBeenCalledWith(URI, 'cid')
    expect(mockAgent.like).toHaveBeenCalledWith(URI, 'cid')
  })

  it('hands failures to the account error handler with a retry', async () => {
    mockAgent.like.mockRejectedValueOnce(new Error('expired'))
    const utils = render(<Harness />)
    await press(utils, 'like')
    expect(mockShowError).toHaveBeenCalledWith(
      expect.any(Error),
      ALT,
      expect.any(Function),
    )
  })
})
