import { assert } from '@japa/assert'
import { snapshot } from '@japa/snapshot'
import { fileSystem } from '@japa/file-system'
import { expectTypeOf } from '@japa/expect-type'
import { configure, processCLIArgs, run } from '@japa/runner'
import { expect } from '@japa/expect'
import { TestContext } from '@japa/runner/core'
import {
  HasDatabaseNotificationsModel,
  NotifiableModel,
  NotificationChannels,
  NotificationContract,
} from '../src/types.js'
import { BaseMail } from '@adonisjs/mail'

processCLIArgs(process.argv.splice(2))
configure({
  suites: [
    /* {
      name: 'unit',
      files: ['tests/unit/!**!/!*.spec.ts'],
    },*/
  ],
  plugins: [assert(), fileSystem(), expectTypeOf(), snapshot(), expect()],
})

TestContext.macro('getNotifiable', async (tableName = 'notifications', persisted = true) => {
  const { notifiableFactory } = await import('../tests/helpers.js')
  return notifiableFactory(tableName, persisted)
})

TestContext.macro(
  'getNotification',
  (
    //@ts-expect-error
    channels = ['database'],
    toDatabase = {
      title: 'test',
    }
  ): NotificationContract<NotifiableModel> => ({
    via() {
      return channels
    },
    //@ts-expect-error
    toDatabase() {
      return toDatabase
    },
  })
)

declare module '@japa/runner/core' {
  interface TestContext {
    getNotifiable(
      tableName?: string,
      persisted?: boolean
    ): Promise<NotifiableModel & HasDatabaseNotificationsModel & { id: number }>

    getNotification(
      channels?: (keyof NotificationChannels)[],
      toDatabase?: Record<string, any>,
      toMail?: InstanceType<typeof BaseMail>
    ): NotificationContract<NotifiableModel>
  }
}

run()
