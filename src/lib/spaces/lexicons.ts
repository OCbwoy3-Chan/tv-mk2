import {l} from '@atproto/lex'
import  {type LexValue, type Validator} from '@atproto/lex-schema'

const spaceView = l.object({
  uri: l.string(),
})

export const listSpaces = l.query(
  'com.atproto.space.listSpaces',
  l.params({
    type: l.optional(l.string()),
    did: l.optional(l.string()),
    limit: l.optional(l.integer({minimum: 1, maximum: 100})),
    cursor: l.optional(l.string()),
  }),
  l.jsonPayload({
    cursor: l.optional(l.string()),
    spaces: l.array(spaceView),
  }),
)

export const putPrivateRecord = l.procedure(
  'com.atproto.space.putRecord',
  l.params({}),
  l.jsonPayload({
    space: l.string(),
    repo: l.string(),
    collection: l.string(),
    rkey: l.string(),
    record: l.unknown() as Validator<
      LexValue | undefined,
      LexValue | undefined
    >,
  }),
  l.jsonPayload({
    uri: l.string(),
    cid: l.string(),
  }),
)

export const createPrivateRecord = l.procedure(
  'com.atproto.space.createRecord',
  l.params({}),
  l.jsonPayload({
    space: l.string(),
    repo: l.string(),
    collection: l.string(),
    rkey: l.optional(l.string()),
    record: l.unknown() as Validator<
      LexValue | undefined,
      LexValue | undefined
    >,
  }),
  l.jsonPayload({uri: l.string(), cid: l.string()}),
)

export const getDelegationToken = l.query(
  'com.atproto.space.getDelegationToken',
  l.params({space: l.string()}),
  l.jsonPayload({token: l.string()}),
)

export const getLatestCommit = l.query(
  'com.atproto.space.getLatestCommit',
  l.params({space: l.string(), repo: l.string()}),
  l.jsonPayload({
    commit: l.object({
      rev: l.string(),
      hash: l.bytes(),
    }),
  }),
)
