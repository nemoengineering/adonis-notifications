import { DatabaseChannelConfig, DatabaseChannelContract, NotifiableModel } from '../types.js'

export class DatabaseChannel implements DatabaseChannelContract {
  constructor(_config: DatabaseChannelConfig) {}

  async send(data: Record<string, any>, to: NotifiableModel) {
    await to.related('notifications').create({
      data,
    })
  }
}
