import { DateTime } from 'luxon'
import { DatabaseNotificationModel, HasDatabaseNotificationsMixin, HasDatabaseNotificationsModel } from "../types.js";
import createNotificationModel from "../models/DatabaseNotification.js";
import type { HasMany } from "@adonisjs/lucid/types/relations";
import { column, hasMany } from "@adonisjs/lucid/orm";


/**
 * This mixin is used to add the notifications relationship to the model
 */
function HasDatabaseNotifications(notificationsTable: string): HasDatabaseNotificationsMixin {
  const DatabaseNotification = createNotificationModel(notificationsTable)

  return (superclass) => {
     class EntityWithNotification extends superclass implements HasDatabaseNotificationsModel {
      @column({ isPrimary: true })
      public id: any

      @hasMany(() => DatabaseNotification, {
        localKey: 'id',
        foreignKey: 'notifiableId',
      })
      declare notifications: HasMany<DatabaseNotificationModel>

      public async readNotifications(this: HasDatabaseNotificationsModel) {
        return this.related('notifications')
          .query()
          .whereNotNull('readAt')
          .orderBy('createdAt', 'desc')
      }

      public async unreadNotifications(this: HasDatabaseNotificationsModel) {
        return this.related('notifications')
          .query()
          .whereNull('readAt')
          .orderBy('createdAt', 'desc')
      }

      public async markNotificationsAsRead(this: HasDatabaseNotificationsModel) {
        await this.related('notifications').query().update({ readAt: DateTime.now().toSQL() })
      }

      public async markNotificationsAsUnread(this: HasDatabaseNotificationsModel) {
        await this.related('notifications').query().update({ readAt: null })
      }
    }

    return EntityWithNotification
  }
}

export default HasDatabaseNotifications
