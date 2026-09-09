import {Client} from '@atproto/lex'
import {api} from '@bsky/sdk'
import {beforeEach, describe, expect, it, jest} from '@jest/globals'

import * as ignoredLabelers from '#/state/preferences/ignored-app-labelers'

jest.mock('#/storage', () => ({
  account: {
    get: jest.fn(),
    set: jest.fn(),
  },
  device: {
    get: jest.fn(),
  },
}))

import {account} from '#/storage'
import {
  BR_LABELER,
  configureAdditionalModerationAuthorities,
  configureGlobalAppLabelers,
  EU_LABELER,
} from '../additional-moderation-authorities'
import {configureModerationForAccount} from '../moderation'
import {makeAccount} from './mock-fetch'

describe('configureModerationForAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    configureGlobalAppLabelers([])
  })

  it('applies cached account labelers to appview and chat', () => {
    const appviewClient = {setLabelers: jest.fn()} as unknown as Client
    const chatClient = {setLabelers: jest.fn()} as unknown as Client
    jest
      .mocked(account.get)
      .mockReturnValue(['did:plc:account-labeler', api.moderation.did])

    void configureModerationForAccount(
      {appviewClient, chatClient},
      makeAccount({handle: 'alice.example.com'}),
    )

    expect(appviewClient.setLabelers).toHaveBeenCalledWith([
      'did:plc:account-labeler',
    ])
    expect(chatClient.setLabelers).toHaveBeenCalledWith([
      'did:plc:account-labeler',
    ])
  })
})

it('removes automatically installed regional authorities', () => {
  configureGlobalAppLabelers([api.moderation.did, BR_LABELER, EU_LABELER])
  configureAdditionalModerationAuthorities()
  expect(Client.appLabelers).toEqual([api.moderation.did])
})

it('does not reinstall an unsubscribed primary app labeler during session setup', () => {
  const ignored = jest
    .spyOn(ignoredLabelers, 'getIgnoredAppLabelers')
    .mockReturnValue([api.moderation.did])
  try {
    void configureModerationForAccount(
      {
        appviewClient: {setLabelers: jest.fn()} as unknown as Client,
        chatClient: {setLabelers: jest.fn()} as unknown as Client,
      },
      makeAccount({handle: 'alice.example.com'}),
    )
    expect(Client.appLabelers).not.toContain(api.moderation.did)
  } finally {
    ignored.mockRestore()
    configureGlobalAppLabelers([])
  }
})
