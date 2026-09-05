import {composerReducer, createComposerState} from './composer'

jest.mock('#/state/gallery', () => ({
  createInitialImages: jest.fn(),
}))
jest.mock('#/logger', () => ({
  logger: {
    warn: jest.fn(),
  },
}))
jest.mock('#/state/queries/postgate/util', () => ({
  createPostgateRecord: jest.fn(() => ({})),
}))
jest.mock('#/state/queries/threadgate', () => ({
  threadgateRecordToAllowUISetting: jest.fn(() => []),
}))

function createState() {
  return createComposerState({
    initText: undefined,
    initMention: undefined,
    initImageUris: undefined,
    initQuoteUri: undefined,
    initInteractionSettings: undefined,
  })
}

describe('composerReducer', () => {
  describe('add_post', () => {
    it('selects the appended post and requests focus', () => {
      const state = createState()

      const nextState = composerReducer(state, {type: 'add_post'})

      expect(nextState.thread.posts).toHaveLength(2)
      expect(nextState.activePostIndex).toBe(1)
      expect(nextState.mutableNeedsFocusActive).toBe(true)
    })

    it('selects a post inserted in the middle of a thread', () => {
      let state = createState()
      state = composerReducer(state, {type: 'add_post'})
      state = composerReducer(state, {type: 'add_post'})

      const lastPostId = state.thread.posts[2].id
      state = composerReducer(state, {
        type: 'focus_post',
        postId: state.thread.posts[0].id,
      })

      const nextState = composerReducer(state, {type: 'add_post'})

      expect(nextState.thread.posts).toHaveLength(4)
      expect(nextState.activePostIndex).toBe(1)
      expect(nextState.thread.posts[2].id).not.toBe(lastPostId)
      expect(nextState.thread.posts[3].id).toBe(lastPostId)
      expect(nextState.mutableNeedsFocusActive).toBe(true)
    })
  })
})

it('focuses adjacent posts without moving or dirtying the thread', () => {
  let state = composerReducer(createState(), {type: 'add_post'})
  state = {...state, isDirty: false}
  const focused = composerReducer(state, {
    type: 'focus_adjacent_post',
    direction: 'up',
  })
  expect(focused.activePostIndex).toBe(0)
  expect(focused.thread).toBe(state.thread)
  expect(focused.isDirty).toBe(false)
  expect(focused.mutableNeedsFocusActive).toBe(true)
  expect(
    composerReducer(focused, {type: 'focus_adjacent_post', direction: 'up'}),
  ).toBe(focused)
})
