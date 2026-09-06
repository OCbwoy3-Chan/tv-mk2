import {createContext, useContext} from 'react'

import {type EphemeralLoginRequest} from '#/state/session/ephemeral-login'

export const EphemeralLoginContext = createContext<
  (EphemeralLoginRequest & {authorize: (identifier: string) => Promise<void>}) | undefined
>(undefined)
export const useEphemeralLogin = () => useContext(EphemeralLoginContext)
