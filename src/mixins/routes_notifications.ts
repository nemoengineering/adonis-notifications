import { NotificationContract, RoutesNotificationsMixin } from '../types.js'
import app from '@adonisjs/core/services/app'

/**
 * This mixin is used to add the ability to notify a model using any channel, except database
 */
const RoutesNotifications: RoutesNotificationsMixin = (superclass) => {
  class NotifiableWithNotification extends superclass {
    async notify(notification: NotificationContract<this>) {
      const Notification = await app.container.make('notification.manager')
      await Notification.send(this, notification)
    }

    async notifyLater(notification: NotificationContract<this>) {
      const Notification = await app.container.make('notification.manager')
      await Notification.sendLater(this, notification)
    }
  }

  return NotifiableWithNotification
}

export default RoutesNotifications
