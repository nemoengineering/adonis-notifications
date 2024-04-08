import { test } from '@japa/runner'
import { createDatabase, createTables } from '../../helpers.js'
import { DatabaseChannel } from '../../../src/channels/database.js'

test.group('DatabaseChannel', (group) => {
  group.each.setup(async (t) => {
    const db = await createDatabase(t)
    await createTables(db, t)
  })

  test('DatabaseChannel.send', async ({ getNotifiable, expect }) => {
    expect.assertions(1)

    const config = {
      driver: 'database' as const,
    }

    const channel = new DatabaseChannel(config)

    const notifiable = await getNotifiable()

    await channel.send(
      {
        title: 'DatabaseChannel.send',
      },
      notifiable
    )
    await notifiable.load('notifications')

    expect(notifiable.notifications.length).toBe(1)
  })
})
