import { NotifiableModel, NotificationChannelContract, TrapCallback } from '../types.js'

class FakeChannel implements NotificationChannelContract {
  constructor(private listener: TrapCallback) {}

  async send(data: Record<string, any>, to: NotifiableModel) {
    await this.listener(data, to)
  }
}

export default FakeChannel
