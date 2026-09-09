import  {type AtpAgent} from '@atproto/api'
import {xrpc} from '@atproto/lex'

import {pdsAgent} from '#/state/session/agent'
import {listSpaces} from './lexicons'

export async function listUserSpaces(agent: AtpAgent) {
  const directAgent = pdsAgent(agent)

  return xrpc(
    {
      did: directAgent.did,
      fetchHandler: (path, init) =>
        directAgent.sessionManager.fetchHandler(path, init),
    },
    listSpaces,
    {params: {}},
  )
}

export async function isSpacesCompatiblePDS(agent: AtpAgent) {
  try {
    await listUserSpaces(agent)
    return true
  } catch {
    return false
  }
}
