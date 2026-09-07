import {
  type ReauthenticationOptions,
  type SessionAccount,
  type SessionApiContext,
} from './types'

export type LoginInput = Parameters<SessionApiContext['login']>[0]
export type EphemeralLoginRequest = {
  account: SessionAccount
  submit: (input: LoginInput) => Promise<void>
  cancel: () => void
  options?: ReauthenticationOptions
}
let current: EphemeralLoginRequest | undefined
const listeners = new Set<() => void>()
export const readEphemeralLogin = () => current
export const subscribeEphemeralLogin = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
const notify = () => listeners.forEach(listener => listener())

export function openEphemeralLogin(
  account: SessionAccount,
  authenticate: (
    input: LoginInput,
    signal: AbortSignal,
  ) => Promise<SessionAccount>,
  options?: ReauthenticationOptions,
): Promise<SessionAccount> {
  current?.cancel()
  return new Promise((resolve, reject) => {
    const controller = new AbortController()
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      controller.abort()
      current = undefined
      notify()
    }
    current = {
      account,
      options,
      async submit(input) {
        if (settled) throw new Error('Authentication cancelled')
        const result = await authenticate(input, controller.signal)
        if (settled) throw new Error('Authentication cancelled')
        finish()
        resolve(result)
      },
      cancel() {
        if (settled) return
        finish()
        reject(new Error('Authentication cancelled'))
      },
    }
    notify()
  })
}
