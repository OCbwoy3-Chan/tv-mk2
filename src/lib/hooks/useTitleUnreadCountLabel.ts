import {badgeText, useBadgePreference} from '#/state/preferences/badge-text'
import {
  useChatsTabBadgeDisplay,
  useNotificationsTabBadgeDisplay,
} from '#/state/preferences/metrics-display-preference'
import {useUnreadMessageCount} from '#/state/queries/messages/list-conversations'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {useAgeAssurance} from '#/ageAssurance'

export function useTitleUnreadCountLabel(): string | undefined {
  const notifications = useUnreadNotifications()
  const chats = useUnreadMessageCount()
  const aa = useAgeAssurance()
  const [source = 'notifications'] = useBadgePreference('tabTitleSource')
  const [notificationsText] = useBadgePreference('notificationsBadgeText')
  const [chatsText] = useBadgePreference('chatsBadgeText')
  const notificationsMode = useNotificationsTabBadgeDisplay()
  const chatsMode = useChatsTabBadgeDisplay()
  if (source === 'none') return undefined
  if (source === 'chats') {
    if (aa.flags.chatDisabled) return undefined
    return badgeText(
      chats.numUnread || (chats.hasNew ? '•' : undefined),
      chatsMode === 'text' ? chatsText : undefined,
    )
  }
  return badgeText(
    notifications,
    notificationsMode === 'text' ? notificationsText : undefined,
  )
}
