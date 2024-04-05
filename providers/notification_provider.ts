import type { ApplicationService } from '@adonisjs/core/types'
import {
  NotificationChannels,
  NotificationEvents,
  NotificationManagerChannelFactory,
  NotificationService,
} from '../src/types.js'
import { configProvider } from '@adonisjs/core'
import { RuntimeException } from '@poppinss/utils'
import { NotificationManager } from '../src/notification_manager.js'

/**
 * Extended types
 */
declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'notification.manager': NotificationService
  }
  export interface EventsList
    extends NotificationEvents<
      NotificationChannels extends Record<string, NotificationManagerChannelFactory>
        ? NotificationChannels
        : {}
    > {}
}

export default class NotificationProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('notification.manager', async (resolver) => {
      const emitter = await resolver.make('emitter')
      const notificationConfigProvider = await this.app.config.get('notification')
      const config = await configProvider.resolve<any>(this.app, notificationConfigProvider)

      if (!config) {
        throw new RuntimeException(
          'Invalid "config/notification.ts" file. Make sure you are using the "defineConfig" method'
        )
      }

      return new NotificationManager(emitter, config) as NotificationService
    })
  }
}
