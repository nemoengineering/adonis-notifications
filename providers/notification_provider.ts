import type { ApplicationService } from '@adonisjs/core/types'
import { NotificationEvents, NotificationService } from "../src/types.js";
import { configProvider } from "@adonisjs/core";
import { RuntimeException } from "@poppinss/utils";
import { NotificationManager } from "../src/notification_manager.js";

/**
 * Extended types
 */
declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'notification.manager': NotificationService
  }
  export interface EventsList extends NotificationEvents {}
}


export default class NotificationProvider {
  constructor(protected app: ApplicationService) {}

  public register() {
    this.app.container.singleton('notification.manager', async (resolver) => {
      const emitter = await resolver.make("emitter")
      const notificationConfigProvider = await this.app.config.get("notification")
      const config = await configProvider.resolve<any>(this.app, notificationConfigProvider)

      if (!config) {
        throw new RuntimeException(
          'Invalid "config/notification.ts" file. Make sure you are using the "defineConfig" method'
        )
      }

      return new NotificationManager(emitter, config)
    })

/*    this.app.container.singleton('notification.mixins', async () => {
      return {
        Notifiable: require('../src/mixins/notifiable').default,
        RoutesNotifications: require('../src/mixins/routesNotifications').default,
        HasDatabaseNotifications: require('../src/mixins/has_database_notifications').default,
      }
    })*/
  }
}
