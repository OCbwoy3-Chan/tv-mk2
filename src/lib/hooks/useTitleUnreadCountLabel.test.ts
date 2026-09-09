import {renderHook} from '@testing-library/react-native'

import {useBadgePreference} from '#/state/preferences/badge-text'
import {
  useChatsTabBadgeDisplay,
  useNotificationsTabBadgeDisplay,
} from '#/state/preferences/metrics-display-preference'
import {useUnreadMessageCount} from '#/state/queries/messages/list-conversations'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {useAgeAssurance} from '#/ageAssurance'
import {useTitleUnreadCountLabel} from './useTitleUnreadCountLabel'

jest.mock('#/state/preferences/badge-text', () => ({
  useBadgePreference: jest.fn(),
  badgeText: jest.requireActual<
    typeof import('#/state/preferences/badge-text')
  >('#/state/preferences/badge-text').badgeText,
}))
jest.mock('#/state/queries/messages/list-conversations', () => ({
  useUnreadMessageCount: jest.fn(),
}))
jest.mock('#/state/queries/notifications/unread', () => ({
  useUnreadNotifications: jest.fn(),
}))
jest.mock('#/ageAssurance', () => ({useAgeAssurance: jest.fn()}))

jest.mock('#/state/preferences/metrics-display-preference', () => ({
  useChatsTabBadgeDisplay: jest.fn(),
  useNotificationsTabBadgeDisplay: jest.fn(),
}))

const preferences: Record<string, string | undefined> = {}

beforeEach(() => {
  jest.mocked(useChatsTabBadgeDisplay).mockReturnValue('exact')
  jest.mocked(useNotificationsTabBadgeDisplay).mockReturnValue('exact')
  for (const key of Object.keys(preferences)) delete preferences[key]
  jest
    .mocked(useBadgePreference)
    .mockImplementation(key => [preferences[key], jest.fn()])
  jest.mocked(useUnreadNotifications).mockReturnValue('3')
  jest
    .mocked(useUnreadMessageCount)
    .mockReturnValue({count: 2, numUnread: '2', hasNew: false})
  jest
    .mocked(useAgeAssurance)
    .mockReturnValue({flags: {chatDisabled: false}} as ReturnType<
      typeof useAgeAssurance
    >)
})

it('defaults to notification counts independently of navigation badge settings', () => {
  expect(renderHook(useTitleUnreadCountLabel).result.current).toBe('3')
})

it('switches to chats and uses custom text', () => {
  preferences.tabTitleSource = 'chats'
  preferences.chatsBadgeText = '💬'
  jest.mocked(useChatsTabBadgeDisplay).mockReturnValue('text')
  expect(renderHook(useTitleUnreadCountLabel).result.current).toBe('💬')
})

it('shows no title badge when none is selected', () => {
  preferences.tabTitleSource = 'none'
  expect(renderHook(useTitleUnreadCountLabel).result.current).toBeUndefined()
})

it('does not show custom text without unread activity', () => {
  preferences.notificationsBadgeText = '🔔'
  jest.mocked(useUnreadNotifications).mockReturnValue('')
  expect(renderHook(useTitleUnreadCountLabel).result.current).toBeUndefined()
})

it('includes chat requests without an accepted conversation count', () => {
  preferences.tabTitleSource = 'chats'
  jest.mocked(useUnreadMessageCount).mockReturnValue({count: 1, hasNew: true})
  expect(renderHook(useTitleUnreadCountLabel).result.current).toBe('•')
})

it('hides chat activity when chat is disabled', () => {
  preferences.tabTitleSource = 'chats'
  jest
    .mocked(useAgeAssurance)
    .mockReturnValue({flags: {chatDisabled: true}} as ReturnType<
      typeof useAgeAssurance
    >)
  expect(renderHook(useTitleUnreadCountLabel).result.current).toBeUndefined()
})

it('keeps saved custom text inactive in number mode', () => {
  preferences.notificationsBadgeText = '🔔'
  expect(renderHook(useTitleUnreadCountLabel).result.current).toBe('3')
})
