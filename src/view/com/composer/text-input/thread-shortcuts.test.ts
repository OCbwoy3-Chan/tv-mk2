import {
  getEmptyPostBackspaceAction,
  getThreadShortcut,
} from './thread-shortcuts'

const allAvailable = {
  canAddPost: true,
  canMovePostUp: true,
  canMovePostDown: true,
}

describe('getThreadShortcut', () => {
  it.each([
    ['Enter', 'add-post'],
    ['ArrowUp', 'focus-post-up'],
    ['ArrowDown', 'focus-post-down'],
  ] as const)('maps Alt+%s to %s', (code, shortcut) => {
    expect(getThreadShortcut({altKey: true, code}, allAvailable)).toBe(shortcut)
  })

  it('ignores shortcuts whose matching action is unavailable', () => {
    expect(
      getThreadShortcut(
        {altKey: true, code: 'Enter'},
        {...allAvailable, canAddPost: false},
      ),
    ).toBeUndefined()
    expect(
      getThreadShortcut(
        {altKey: true, code: 'ArrowUp'},
        {...allAvailable, canMovePostUp: false},
      ),
    ).toBeUndefined()
  })

  it('ignores matching keys without Alt', () => {
    expect(
      getThreadShortcut({altKey: false, code: 'Enter'}, allAvailable),
    ).toBeUndefined()
  })
})

it.each([
  ['ArrowUp', 'move-post-up'],
  ['ArrowDown', 'move-post-down'],
])('reorders with Alt+Shift+%s', (code, action) => {
  expect(
    getThreadShortcut({altKey: true, shiftKey: true, code}, allAvailable),
  ).toBe(action)
})

it('closes only an empty single-post composer and preserves thread removal guards', () => {
  const single = {
    hasContent: false,
    isFirstPost: true,
    canRemovePost: false,
    canCloseComposer: true,
  }
  expect(getEmptyPostBackspaceAction(single)).toBe('close-composer')
  expect(
    getEmptyPostBackspaceAction({...single, hasContent: true}),
  ).toBeUndefined()
  expect(
    getEmptyPostBackspaceAction({...single, canCloseComposer: false}),
  ).toBeUndefined()
  expect(
    getEmptyPostBackspaceAction({...single, canRemovePost: true}),
  ).toBeUndefined()
  expect(
    getEmptyPostBackspaceAction({
      ...single,
      canRemovePost: true,
      isFirstPost: false,
    }),
  ).toBe('remove-post')
})
