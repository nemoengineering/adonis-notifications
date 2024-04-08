import { test } from '@japa/runner'
import { DatabaseChannel } from '../../src/channels/database.js'
import { MailChannel } from '../../src/channels/mail.js'
import { createDatabase, createTables } from '../helpers.js'
import { NotificationManager } from '../../src/notification_manager.js'
import { AppFactory } from '@adonisjs/core/factories/app'
import { Emitter } from '@adonisjs/core/events'
import { NotificationChannels, NotificationEvents } from '../../src/types.js'
import { LucidModel } from '@adonisjs/lucid/types/model'

const app = new AppFactory().create(new URL('./', import.meta.url), () => {})

test.group('NotificationManager', (group) => {
  group.each.setup(async (t) => {
    const db = await createDatabase(t)
    await createTables(db, t)
  })

  test('Can create a manager', ({ expect }) => {
    // @ts-expect-error
    const emitter = new Emitter<NotificationEvents<NotificationChannels>>(app)

    expect.assertions(1)
    const manager = new NotificationManager(emitter, app.config.get('notification'))
    expect(manager).toBeInstanceOf(NotificationManager)
  })

  /*  test('Can get the default channel', async ({ expect }) => {
    // @ts-expect-error
    const emitter = new Emitter<NotificationEvents<NotificationChannels>>(app)

    expect.assertions(1)
    const manager = new NotificationManager(app, app.config.get('notification'))
    expect(manager.use()).toBeInstanceOf(DatabaseChannel)
  })*/

  test('Can send notifications using the manager', async ({
    expect,
    getNotifiable,
    getNotification,
  }) => {
    // @ts-expect-error
    const emitter = new Emitter<NotificationEvents<NotificationChannels>>(app)

    expect.assertions(1)
    const manager = new NotificationManager(emitter, app.config.get('notification'))
    const notifiable = await getNotifiable()
    // @ts-expect-error
    await manager.send(notifiable, getNotification(['database']))
    await notifiable.load('notifications')
    expect(notifiable.notifications.length).toBe(1)
  })

  test('Can send delayed notifications using the manager', async ({
    expect,
    getNotifiable,
    getNotification,
  }) => {
    // @ts-expect-error
    const emitter = new Emitter<NotificationEvents<NotificationChannels>>(app)

    expect.assertions(1)
    const manager = new NotificationManager(emitter, app.config.get('notification'))
    const notifiable = await getNotifiable()
    // @ts-expect-error
    await manager.sendLater(notifiable, getNotification(['database']))
    await notifiable.load('notifications')
    expect(notifiable.notifications.length).toBe(1)
  })

  test('Can send notifications to many notifiables using the manager', async ({
    expect,
    getNotifiable,
    getNotification,
  }) => {
    // @ts-expect-error
    const emitter = new Emitter<NotificationEvents<NotificationChannels>>(app)

    expect.assertions(1)
    const manager = new NotificationManager(emitter, app.config.get('notification'))
    const notifiables: any[] = []

    for (let i = 0; i < 3; i++) {
      notifiables.push(await getNotifiable())
    }

    // @ts-expect-error
    await manager.send(notifiables, getNotification(['database']))
    const notifications = await (notifiables[0].constructor as LucidModel).$relationsDefinitions
      .get('notifications')!
      .relatedModel()
      .query()

    expect(notifications.length).toBe(3)
  })

  test('Can get MailChannel from manager', async ({ expect }) => {
    // @ts-expect-error
    const emitter = new Emitter<NotificationEvents<NotificationChannels>>(app)

    expect.assertions(1)
    const manager = new NotificationManager(emitter, app.config.get('notification'))
    expect(manager.use('mail')).toBeInstanceOf(MailChannel)
  })

  test('Can get DatabaseChannel from manager', async ({ expect }) => {
    // @ts-expect-error
    const emitter = new Emitter<NotificationEvents<NotificationChannels>>(app)

    expect.assertions(1)
    const manager = new NotificationManager(emitter, app.config.get('notification'))
    expect(manager.use('database')).toBeInstanceOf(DatabaseChannel)
  })

  /*  test('Default queue monitor logs errors', async ({ getNotifiable }) => {
    // @ts-expect-error
    const emitter = new Emitter<NotificationEvents<NotificationChannels>>(app)

    const config = {
      channel: 'error',
      channels: {
        error: {
          driver: 'error',
        },
      },
    }

    const errorChannel = {
      send: async (notification: string) => {
        throw new Error(`Test - ${notification}`)
      },
    }

    const manager = new NotificationManager(emitter, config as any)
    manager.extend('error', () => errorChannel)
    const notifiable = await getNotifiable()
    manager.sendLater(notifiable, {
      via: () => 'error',
      toError: () => 'Error message',
    } as any)
  })

  test('Can set a queue monitor callback', async ({ expect }) => {
    // @ts-expect-error
    const emitter = new Emitter<NotificationEvents<NotificationChannels>>(app)

    expect.assertions(1)
    const manager = new NotificationManager(emitter, app.config.get('notification'))
    const callback = () => {
      console.log('Queue monitor callback')
    }
    manager.monitorQueue(callback)
    expect(manager['queueMonitor']).toBe(callback)
  })

  test('Sending a notification emits a event', async ({
    expect,
    getNotifiable,
    getNotification,
  }) => {
    // @ts-expect-error
    const emitter = new Emitter<NotificationEvents<NotificationChannels>>(app)

    expect.assertions(1)
    const manager = new NotificationManager(emitter, app.config.get('notification'))
    const notifiable = await getNotifiable()
    Event.trap('notification:sent', (data) => {
      expect(data).toEqual({
        notification: { title: 'test' },
        notifiable,
        channel: 'database',
      })
    })
    await manager.send(notifiable, getNotification(['database']))
  })

  test('Sending a delayed notification emits a event', async ({
    expect,
    getNotifiable,
    getNotification,
  }, done) => {
    // @ts-expect-error
    const emitter = new Emitter<NotificationEvents<NotificationChannels>>(app)

    expect.assertions(1)
    const manager = new NotificationManager(emitter, app.config.get('notification'))
    const notifiable = await getNotifiable()
    Event.trap('notification:sent', (data) => {
      expect(data).toEqual({
        notification: { title: 'test' },
        notifiable,
        channel: 'database',
      })
      done()
    })
    await manager.sendLater(notifiable, getNotification(['database']))
  }).waitForDone()*/
})
