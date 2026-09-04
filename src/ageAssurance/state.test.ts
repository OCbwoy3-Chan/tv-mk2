import {computeAgeAssuranceState} from '#/ageAssurance/state'
import {AgeAssuranceAccess, AgeAssuranceStatus} from '#/ageAssurance/types'

jest.mock('#/ageAssurance/data', () => ({}))
jest.mock('#/ageAssurance/logger', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
  },
}))
jest.mock('#/state/session', () => ({}))

const geolocation = {
  countryCode: undefined,
  regionCode: undefined,
}

describe('computeAgeAssuranceState', () => {
  it('keeps full access while required account data is pending', () => {
    expect(
      computeAgeAssuranceState({
        hasSession: true,
        geolocation,
        config: {regions: []},
        otherRequiredDataStatus: 'pending',
      }),
    ).toMatchObject({
      status: AgeAssuranceStatus.Unknown,
      access: AgeAssuranceAccess.Full,
    })
  })

  it('keeps full access when required account data fails', () => {
    expect(
      computeAgeAssuranceState({
        hasSession: true,
        geolocation,
        config: {regions: []},
        otherRequiredDataStatus: 'error',
      }),
    ).toMatchObject({
      status: AgeAssuranceStatus.Unknown,
      access: AgeAssuranceAccess.Full,
    })
  })

  it('keeps full access after a successful response without a birthdate', () => {
    expect(
      computeAgeAssuranceState({
        hasSession: true,
        geolocation,
        config: {regions: []},
        metadata: {birthdate: undefined},
        otherRequiredDataStatus: 'success',
      }),
    ).toMatchObject({
      status: AgeAssuranceStatus.Unknown,
      access: AgeAssuranceAccess.Full,
    })
  })

  it('keeps full access despite terminal server state', () => {
    expect(
      computeAgeAssuranceState({
        hasSession: true,
        geolocation: {countryCode: 'AA', regionCode: undefined},
        config: {
          regions: [
            {
              countryCode: 'AA',
              minAccessAge: 13,
              rules: [],
            },
          ],
        },
        state: {status: 'blocked', access: 'none'},
        otherRequiredDataStatus: 'error',
      }),
    ).toMatchObject({
      status: AgeAssuranceStatus.Unknown,
      access: AgeAssuranceAccess.Full,
    })
  })
})
