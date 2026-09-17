import {type ComposerState} from '#/view/com/composer/state/composer'
import {account} from '#/storage'
import {clearRecovery, saveRecovery} from './index.native'

const mockCopies: Array<() => void> = []
const mockStore = new Map<string, string>()
jest.mock('#/storage', () => ({
  account: {
    get: jest.fn(([did]) => mockStore.get(did)),
    set: jest.fn(([did], raw) => mockStore.set(did, raw)),
    remove: jest.fn(([did]) => mockStore.delete(did)),
  },
}))
jest.mock('#/logger', () => ({logger: {error: jest.fn()}}))
jest.mock('./codec', () => ({
  encodeRecovery: (_opts: unknown, state: unknown) => JSON.stringify(state),
}))
jest.mock('expo-file-system', () => ({
  Paths: {document: 'file:///documents'},
  Directory: class {
    uri: string
    exists = true
    constructor(...parts: string[]) {
      this.uri = parts.join('/') + '/'
    }
    create() {}
    delete() {}
  },
  File: class {
    uri: string
    extension = '.jpg'
    constructor(dir: string | {uri: string}, name?: string) {
      this.uri = typeof dir === 'string' ? dir : dir.uri + name
    }
    copy() {
      return new Promise<void>(resolve => mockCopies.push(resolve))
    }
  },
}))

function snapshot(text: string): ComposerState {
  return {
    text,
    source: {path: 'file:///temporary/photo.jpg'},
  } as unknown as ComposerState
}

async function finishCopies() {
  mockCopies.splice(0).forEach(resolve => resolve())
  // Flush the copy, Promise.all, and persistence continuations.
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

beforeEach(() => {
  clearRecovery('alice')
  mockStore.clear()
})

it('writes immediately and preserves the newest edit after copying attachments', async () => {
  saveRecovery('alice', {}, snapshot('first'))
  expect(mockStore.get('alice')).toContain('first')
  saveRecovery('alice', {}, snapshot('latest'))
  await finishCopies()
  const saved = JSON.parse(mockStore.get('alice')!) as {
    text: string
    source: {path: string}
  }
  expect(saved.text).toBe('latest')
  expect(saved.source.path).toMatch(
    /^file:\/\/\/documents\/composer-recovery\/alice\//,
  )
})

it('does not resurrect an explicitly closed composer when a copy completes', async () => {
  saveRecovery('alice', {}, snapshot('discard me'))
  clearRecovery('alice')
  await finishCopies()
  expect(account.get(['alice', 'composerRecovery'])).toBeUndefined()
})

it('keeps recovery isolated to the session account', async () => {
  saveRecovery('alice', {}, snapshot('private'))
  await finishCopies()
  expect(account.get(['bob', 'composerRecovery'])).toBeUndefined()
})
