import RoutesNotifications from './routes_notifications.js'
import { NotifiableMixin } from '../types.js'
import { compose } from '@poppinss/utils'
import HasDatabaseNotifications from './has_database_notifications.js'

/**
 * This trait is used to add the ability to notify a model using any channel
 */
function Notifiable(tableName: string): NotifiableMixin {
  return (superclass) => {
    return class extends compose(
      superclass,
      RoutesNotifications,
      HasDatabaseNotifications(tableName)
    ) {}
  }
}

export default Notifiable
