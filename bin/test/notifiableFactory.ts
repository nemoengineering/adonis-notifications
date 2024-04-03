import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { compose } from '@poppinss/utils/build/helpers'
import { Notifiable } from '@ioc:Verful/Notification/Mixins'
import { NotifiableModel } from '@ioc:Verful/Notification'

export default async function notifiableFactory(
  tableName = 'notifications',
  persisted = true
): Promise<NotifiableModel> {
  class User extends compose(BaseModel, Notifiable(tableName)) {
    @column({ isPrimary: true })
    id: number
  }

  return persisted ? User.create({}) : new User()
}
