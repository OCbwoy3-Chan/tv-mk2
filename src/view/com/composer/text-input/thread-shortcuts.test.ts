import {getThreadShortcut} from './thread-shortcuts'

const allAvailable = {
  canAddPost: true,
  canMovePostUp: true,
  canMovePostDown: true,
}

describe('getThreadShortcut', () => {
  it.each([
    ['Enter', 'add-post'],
    ['ArrowUp', 'move-post-up'],
    ['ArrowDown', 'move-post-down'],
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
