import { test } from '@japa/runner'
import HasDatabaseNotifications from '../../src/mixins/has_database_notifications.js'
import Notifiable from '../../src/mixins/notifiable.js'
import RoutesNotifications from '../../src/mixins/routes_notifications.js'
import { AppFactory } from '@adonisjs/core/factories/app'
import { NotificationManager } from '../../src/notification_manager.js'

const app = new AppFactory().create(new URL('./', import.meta.url), () => {})

test.group('NotificationsProvider', () => {
  test('Bindings registered correctly', ({ expect }) => {
    expect(app.container.make('notification.manager')).toBeInstanceOf(NotificationManager)
    expect(app.container.make('notification.manager')).toStrictEqual({
      Notifiable: Notifiable,
      HasDatabaseNotifications: HasDatabaseNotifications,
      RoutesNotifications: RoutesNotifications,
    })
  })
})
