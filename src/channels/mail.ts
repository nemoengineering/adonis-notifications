import { BaseMail } from "@adonisjs/mail";
import { MailChannelConfig, MailChannelContract, NotifiableModel } from "../types.js";

class MailChannel implements MailChannelContract {
  constructor(_config: MailChannelConfig) {}

  public async send(
    message: InstanceType<typeof BaseMail>,
    _notifiable: NotifiableModel,
    deferred: boolean = false
  ) {
    if (deferred) {
      await message.sendLater()
    } else {
      await message.send()
    }
  }
}

export default MailChannel
