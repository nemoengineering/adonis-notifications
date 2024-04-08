import { DateTime } from 'luxon'
import {
  DatabaseNotificationModel,
  HasDatabaseNotificationsMixin,
  HasDatabaseNotificationsModel,
} from '../types.js'
import createNotificationModel from '../models/database_notification.js'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { column, hasMany } from '@adonisjs/lucid/orm'

/**
 * This mixin is used to add the notifications relationship to the model
 */
function HasDatabaseNotifications(notificationsTable: string): HasDatabaseNotificationsMixin {
  const DatabaseNotification = createNotificationModel(notificationsTable)

  return (superclass) => {
    class NotifiableWithDatabase extends superclass implements HasDatabaseNotificationsModel {
      @column({ isPrimary: true })
      id: any

      @hasMany(() => DatabaseNotification, {
        localKey: 'id',
        foreignKey: 'notifiableId',
      })
      declare notifications: HasMany<DatabaseNotificationModel>

      async readNotifications(this: HasDatabaseNotificationsModel) {
        return this.related('notifications')
          .query()
          .whereNotNull('readAt')
          .orderBy('createdAt', 'desc')
      }

      async unreadNotifications(this: HasDatabaseNotificationsModel) {
        return this.related('notifications')
          .query()
          .whereNull('readAt')
          .orderBy('createdAt', 'desc')
      }

      async markNotificationsAsRead(this: HasDatabaseNotificationsModel) {
        await this.related('notifications').query().update({ readAt: DateTime.now().toSQL() })
      }

      async markNotificationsAsUnread(this: HasDatabaseNotificationsModel) {
        await this.related('notifications').query().update({ readAt: null })
      }
    }

    return NotifiableWithDatabase
  }
}

export default HasDatabaseNotifications
