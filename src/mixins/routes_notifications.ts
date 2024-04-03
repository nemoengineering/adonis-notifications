import { NotificationContract, RoutesNotificationsMixin } from '../types.js'
import app from '@adonisjs/core/services/app'

/**
 * This mixin is used to add the hability to notify a model using any channel, except database
 */
const RoutesNotifications: RoutesNotificationsMixin = (superclass) => {
  return class extends superclass {
    async notify(notification: NotificationContract) {
      const Notification = await app.container.make('notification.manager')
      // @ts-expect-error
      await Notification.send(this, notification)
    }

    async notifyLater(notification: NotificationContract) {
      const Notification = await app.container.make('notification.manager')
      // @ts-expect-error
      await Notification.sendLater(this, notification)
    }
  }
}

export default RoutesNotifications
