import {
  DatabaseChannelConfig,
  DatabaseChannelContract,
  DatabaseChannelData,
  HasDatabaseNotificationsModel,
  NotifiableModel,
} from '../types.js'

export class DatabaseChannel implements DatabaseChannelContract {
  constructor(_config: DatabaseChannelConfig) {}

  async send(data: DatabaseChannelData, to: HasDatabaseNotificationsModel & NotifiableModel) {
    await to.related('notifications').create({
      data,
    })
  }
}
