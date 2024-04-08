import app from '@adonisjs/core/services/app'
import { NotificationService } from '../src/types.js'

let notification: NotificationService

await app.booted(async () => {
  notification = await app.container.make('notification.manager')
})

export { notification as default }
