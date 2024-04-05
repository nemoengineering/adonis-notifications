import { test } from '@japa/runner'
import Notifiable from '../../../src/mixins/notifiable.js'
import { BaseModel } from '@adonisjs/lucid/orm'

const Mixin = Notifiable('notifications')

test.group('NotifiableMixin', () => {
  test('Mixin gets applied succesfuly', ({ expect }) => {
    class Model extends Mixin(BaseModel) {}

    expect(Model.$relationsDefinitions.get('notifications')!.relationName).toBe('notifications')
    expect(Model.prototype.markNotificationsAsRead).toEqual(expect.any(Function))
    expect(Model.prototype.markNotificationsAsUnread).toEqual(expect.any(Function))
    expect(Model.prototype.unreadNotifications).toEqual(expect.any(Function))
    expect(Model.prototype.readNotifications).toEqual(expect.any(Function))
    expect(Model.prototype.notify).toEqual(expect.any(Function))
    expect(Model.prototype.notifyLater).toEqual(expect.any(Function))
  })
})
