import {l} from '@atproto/lex'

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
