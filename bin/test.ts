import { assert } from '@japa/assert'
import { snapshot } from '@japa/snapshot'
import { fileSystem } from '@japa/file-system'
import { expectTypeOf } from '@japa/expect-type'
import { configure, processCLIArgs, run } from '@japa/runner'
import { Expect, expect } from '@japa/expect'
import { TestContext } from '@japa/runner/core'
import { NotifiableModel } from '../src/types.js'
import { NotificationChannelsList, NotificationContract } from '@ioc:Verful/Notification'
import { BaseMailer } from '@ioc:Adonis/Addons/Mail'

processCLIArgs(process.argv.splice(2))
configure({
  suites: [
    {
      name: 'unit',
      files: ['tests/unit/**/*.spec.ts'],
    },
  ],
  plugins: [assert(), fileSystem(), expectTypeOf(), snapshot(), expect()],
})

TestContext.macro('getNotifiable', async (tableName = 'notifications', persisted = true) => {
  const { default: notifiableFactory } = await import('./test/notifiable_factory.js')
  return notifiableFactory(tableName, persisted)
})

//TestContext.getter('app', () => require('@ioc:Adonis/Core/Application'))

TestContext.macro(
  'getNotification',
  (
    channels = ['database'],
    toDatabase = {
      title: 'test',
    }
  ): NotificationContract => ({
    via() {
      return channels
    },
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
    ): Promise<NotifiableModel & { id: number }>

    getNotification(
      channels?: (keyof NotificationChannelsList)[],
      toDatabase?: Record<string, any>,
      toMail?: InstanceType<typeof BaseMailer>
    ): NotificationContract
  }
}

run()
