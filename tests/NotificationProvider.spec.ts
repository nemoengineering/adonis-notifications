import { test } from '@japa/runner'
import NotificationsManager from '../src/notification.ts.bak'
import HasDatabaseNotifications from '../src/mixins/has_database_notifications'
import Notifiable from '../src/mixins/notifiable'
import RoutesNotifications from '../src/mixins/routes_notifications'

test.group('NotificationsProvider', () => {
  test('Bindings registered correctly', ({ expect, app }) => {
    expect(app.container.resolveBinding('Verful/Notification')).toBeInstanceOf(NotificationsManager)
    expect(app.container.resolveBinding('Verful/Notification/Mixins')).toStrictEqual({
      Notifiable: Notifiable,
      HasDatabaseNotifications: HasDatabaseNotifications,
      RoutesNotifications: RoutesNotifications,
    })
  })
})
