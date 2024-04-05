import { NotifiableModel } from '../../src/types.js'
import { compose } from '@poppinss/utils'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import Notifiable from '../../src/mixins/notifiable.js'

export default async function notifiable_factory(
  tableName = 'notifications',
  persisted = true
): Promise<NotifiableModel & { id: number }> {
  class User extends compose(BaseModel, Notifiable(tableName)) {
    @column({ isPrimary: true })
    declare id: number
  }

  return persisted ? User.create({}) : new User()
}
