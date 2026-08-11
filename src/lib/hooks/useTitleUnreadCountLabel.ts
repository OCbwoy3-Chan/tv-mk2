import {formatTitleUnreadCountLabel} from '#/lib/metrics-display'
import {useNotificationsTabBadgeDisplay} from '#/state/preferences/metrics-display-preference'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'

export function useTitleUnreadCountLabel(): string | undefined {
  const numUnread = useUnreadNotifications()
  const notificationsTabBadgeDisplay = useNotificationsTabBadgeDisplay()
  return formatTitleUnreadCountLabel(
    notificationsTabBadgeDisplay,
    numUnread,
  )
}
