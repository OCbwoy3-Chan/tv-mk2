import {beforeEach, describe, expect, it, jest} from '@jest/globals'

import {Convo} from '#/state/messages/convo/agent'
import {ConvoStatus} from '#/state/messages/convo/types'
import {chat} from '#/lexicons'

const ME = 'did:plc:me'
const THEM = 'did:plc:them'

function convoView({chatDisabled = false}: {chatDisabled?: boolean} = {}) {
  return {
    id: 'convo1',
    rev: '1',
    members: [
      {did: ME, handle: 'me.test', chatDisabled},
      {did: THEM, handle: 'them.test'},
    ],
    muted: false,
    unreadCount: 0,
    kind: {$type: 'chat.bsky.convo.defs#directConvo'},
  } as unknown as chat.bsky.convo.defs.ConvoView
}

type Call = (method: unknown, params: unknown) => Promise<unknown>

let getConvo: jest.Mock<() => Promise<unknown>>
let getMessages: jest.Mock<() => Promise<unknown>>

type Handler = (event: {type: string}) => void
let firehose: Handler | undefined

function makeConvo(placeholder?: chat.bsky.convo.defs.ConvoView) {
  const call = jest.fn<Call>(method => {
    if (method === chat.bsky.convo.getConvo) return getConvo()
    if (method === chat.bsky.convo.getMessages) return getMessages()
    if (method === chat.bsky.convo.getConvoMembers) {
      return Promise.resolve({members: []})
    }
    return new Promise(() => {})
  })
  const convo = new Convo({
    convoId: 'convo1',
    chatClient: {assertDid: ME, call} as never,
    events: {
      on: (handler: Handler) => {
        firehose = handler
        return () => {}
      },
      requestPollInterval: () => () => {},
    } as never,
    placeholderData: placeholder ? {convo: placeholder} : undefined,
  })
  const unsubscribe = convo.subscribe(() => {})
  return {convo, unsubscribe, call}
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0))
const offline = () => Promise.reject(new TypeError('Failed to fetch'))

beforeEach(() => {
  firehose = undefined
  getConvo = jest.fn(() => new Promise(() => {}))
  getMessages = jest.fn(() => new Promise(() => {}))
})

describe('rendering from a cached convo view', () => {
  it('is ready immediately and loads history without waiting on getConvo', () => {
    const {convo, unsubscribe} = makeConvo(convoView())

    expect(convo.getSnapshot().status).toBe(ConvoStatus.Ready)
    expect(getMessages).toHaveBeenCalled()
    unsubscribe()
  })

  it('waits for the server without a cached view', () => {
    const {convo, unsubscribe} = makeConvo()

    expect(convo.getSnapshot().status).toBe(ConvoStatus.Initializing)
    expect(getMessages).not.toHaveBeenCalled()
    unsubscribe()
  })

  it('does not trust a cached disabled status', () => {
    const {convo, unsubscribe} = makeConvo(convoView({chatDisabled: true}))

    expect(convo.getSnapshot().status).toBe(ConvoStatus.Initializing)
    unsubscribe()
  })

  it('moves to disabled when the server says so', async () => {
    getConvo = jest.fn(() =>
      Promise.resolve({convo: convoView({chatDisabled: true})}),
    )
    const {convo, unsubscribe} = makeConvo(convoView())
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(convo.getSnapshot().status).toBe(ConvoStatus.Disabled)
    unsubscribe()
  })

  it('keeps rendering the cached view through a network error', async () => {
    getConvo = jest.fn(() => Promise.reject(new TypeError('Failed to fetch')))
    const {convo, unsubscribe} = makeConvo(convoView())
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(convo.getSnapshot().status).toBe(ConvoStatus.Ready)
    unsubscribe()
  })

  it('retries verification when the firehose reconnects', async () => {
    getConvo = jest.fn(offline)
    const {convo, unsubscribe} = makeConvo(convoView())
    await flush()
    expect(convo.getSnapshot().status).toBe(ConvoStatus.Ready)

    getConvo = jest.fn(() =>
      Promise.resolve({convo: convoView({chatDisabled: true})}),
    )
    firehose?.({type: 'connect'})
    await flush()

    expect(getConvo).toHaveBeenCalled()
    expect(convo.getSnapshot().status).toBe(ConvoStatus.Disabled)
    unsubscribe()
  })

  it('does not error when backgrounded before verification fails offline', async () => {
    let fail!: (e: unknown) => void
    getConvo = jest.fn(() => new Promise((_, reject) => (fail = reject)))
    const {convo, unsubscribe} = makeConvo(convoView())
    convo.background()
    fail(new TypeError('Failed to fetch'))
    await flush()

    expect(convo.getSnapshot().status).toBe(ConvoStatus.Backgrounded)
    unsubscribe()
  })

  it('keeps a local edit made while verification is in flight', async () => {
    let respond!: (value: unknown) => void
    getConvo = jest.fn(() => new Promise(resolve => (respond = resolve)))
    const {convo, unsubscribe} = makeConvo(convoView())
    // An optimistic edit, as accepting or muting the convo makes.
    ;(convo as unknown as {updateConvo: (c: object) => void}).updateConvo({
      muted: true,
    })
    // The server answers with its state from before the edit landed.
    respond({convo: convoView()})
    await flush()

    expect(convo.convo?.view.muted).toBe(true)
    expect(convo.getSnapshot().status).toBe(ConvoStatus.Ready)
    unsubscribe()
  })
})
