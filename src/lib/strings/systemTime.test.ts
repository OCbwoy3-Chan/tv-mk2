import {getCalendars, getLocales} from 'expo-localization'
import {setupI18n} from '@lingui/core'

import {formatDateWithSystemTime} from './systemTime'
import {formatJoinDate} from './time'

jest.mock('expo-localization', () => ({
  getCalendars: jest.fn(),
  getLocales: jest.fn(),
}))

const i18n = setupI18n({locale: 'en-US', messages: {'en-US': {}}})
const date = new Date('2026-09-08T17:05:00Z')

beforeEach(() => {
  jest
    .mocked(getCalendars)
    .mockReturnValue([{uses24hourClock: true}] as unknown as ReturnType<
      typeof getCalendars
    >)
  jest
    .mocked(getLocales)
    .mockReturnValue([{languageTag: 'en-GB'}] as unknown as ReturnType<
      typeof getLocales
    >)
})

it('keeps the old date formatting even when the device locale differs', () => {
  const options = {dateStyle: 'short', timeZone: 'UTC'} as const
  expect(formatDateWithSystemTime(i18n, date, options)).toBe(
    i18n.date(date, options),
  )
  expect(formatJoinDate(date)).toBe('Sep 2026')
})

it('keeps date order while applying the system clock to combined timestamps', () => {
  const options = {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'UTC',
  } as const
  expect(formatDateWithSystemTime(i18n, date, options)).toBe(
    i18n.date(date, {...options, hour12: false}),
  )
})

it('uses the system clock for time-only displays', () => {
  const options = {timeStyle: 'short', timeZone: 'UTC'} as const
  expect(formatDateWithSystemTime(i18n, date, options)).toBe('17:05')
  jest
    .mocked(getCalendars)
    .mockReturnValue([{uses24hourClock: false}] as unknown as ReturnType<
      typeof getCalendars
    >)
  expect(formatDateWithSystemTime(i18n, date, options)).toMatch(/5:05\s*pm/i)
})
