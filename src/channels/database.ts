import { DatabaseChannelConfig, DatabaseChannelContract, NotifiableModel } from "../types.js";

export class DatabaseChannel implements DatabaseChannelContract {
  constructor(_config: DatabaseChannelConfig) {}

  public async send(data: Record<string, any>, to: NotifiableModel) {
    await to.related('notifications').create({
      data,
    })
  }
}

