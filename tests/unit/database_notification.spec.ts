import { test } from '@japa/runner'
import { createDatabase, createTables } from '../helpers.js'
import createNotificationModel from '../../src/models/database_notification.js'

test.group('DatabaseNotification', async (group) => {
  group.each.setup(async (t) => {
    const db = await createDatabase(t)
    await createTables(db, t)
  })

  test('Model created succesfully', async ({ expect }) => {
    const Model = createNotificationModel('test')
    expect(Model).toBeDefined()
    expect(Model.table).toBe('test')
  })

  test('DatabaseNotification.markAsRead', async ({ expect, getNotifiable }) => {
    const user = await getNotifiable()
    const Model = createNotificationModel('notifications')

    const notification = await Model.create({
      notifiableId: user.id,
      data: {},
    })

    expect(notification.read).toBe(false)
    await notification.markAsRead()
    expect(notification.read).toBe(true)
  })

  test('DatabaseNotification.markAsUnread', async ({ expect, getNotifiable }) => {
    /* const db = await createDatabase()
    await createTables(db)*/

    const user = await getNotifiable()
    const Model = createNotificationModel('notifications')

    const notification = await Model.create({
      notifiableId: user.id,
      data: {},
    })

    await notification.markAsRead()
    expect(notification.unread).toBe(false)
    await notification.markAsUnread()
    expect(notification.unread).toBe(true)
  })
})
