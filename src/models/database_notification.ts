import { DateTime } from 'luxon'
import { DatabaseNotificationModel, DatabaseNotificationRow } from '../types.js'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { LucidModel } from '@adonisjs/lucid/types/model'
import StaticImplements from '../helpers/static_implements.js'

export default function createNotificationModel(tableName: string): DatabaseNotificationModel {
  @StaticImplements<DatabaseNotificationModel>()
  class DatabaseNotification extends (BaseModel as LucidModel) implements DatabaseNotificationRow {
    static table = tableName

    @column({ isPrimary: true })
    declare id: number

    @column({
      prepare: (value: Record<string, any>) => JSON.stringify(value),
      consume: (value: string | Record<string, any>) =>
        typeof value === 'string' ? JSON.parse(value) : value,
    })
    declare data: Record<string, any>

    @column()
    declare notifiableId: number

    async markAsRead(this: DatabaseNotificationRow) {
      await this.merge({ readAt: DateTime.now() }).save()
    }

    async markAsUnread(this: DatabaseNotificationRow) {
      await this.merge({ readAt: null }).save()
    }

    get read() {
      return Boolean(this.readAt)
    }

    get unread() {
      return !this.readAt
    }

    @column.dateTime({ autoCreate: false, autoUpdate: false })
    declare readAt: DateTime | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
  }

  return DatabaseNotification
}
