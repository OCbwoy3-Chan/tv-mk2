import {openEphemeralLogin, readEphemeralLogin} from '../ephemeral-login'
import {type SessionAccount} from '../types'

const account: SessionAccount = {
  did: 'did:plc:alternate', handle: 'alternate.test', service: 'https://pds.test',
}

it('waits for the login form to submit before resolving the pending action', async () => {
  const authenticate = jest.fn().mockResolvedValue(account)
  const pending = openEphemeralLogin(account, authenticate)
  expect(authenticate).not.toHaveBeenCalled()
  expect(readEphemeralLogin()?.account).toBe(account)
  await readEphemeralLogin()!.submit({service: account.service, identifier: account.handle, password: 'test'})
  await expect(pending).resolves.toBe(account)
  expect(readEphemeralLogin()).toBeUndefined()
})

it('keeps the form open on invalid credentials and allows another attempt', async () => {
  const authenticate = jest.fn().mockRejectedValueOnce(new Error('Invalid password')).mockResolvedValueOnce(account)
  const pending = openEphemeralLogin(account, authenticate)
  const request = readEphemeralLogin()!
  const input = {service: account.service, identifier: account.handle, password: 'test'}
  await expect(request.submit(input)).rejects.toThrow('Invalid password')
  expect(readEphemeralLogin()).toBe(request)
  await request.submit(input)
  await expect(pending).resolves.toBe(account)
})

it('cancellation aborts authentication and prevents the pending action resuming', async () => {
  let finish!: (account: SessionAccount) => void
  let signal!: AbortSignal
  const pending = openEphemeralLogin(account, (_input, currentSignal) => {
    signal = currentSignal
    return new Promise(resolve => {finish = resolve})
  })
  const request = readEphemeralLogin()!
  const submission = request.submit({service: account.service, identifier: account.handle, password: 'test'})
  request.cancel()
  await expect(pending).rejects.toThrow('cancelled')
  expect(signal.aborted).toBe(true)
  finish(account)
  await expect(submission).rejects.toThrow('cancelled')
  expect(readEphemeralLogin()).toBeUndefined()
})
