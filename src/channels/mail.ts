import { BaseMail } from '@adonisjs/mail'
import { MailChannelConfig, MailChannelContract, NotifiableModel } from '../types.js'
import mail from '@adonisjs/mail/services/main'

export class MailChannel implements MailChannelContract {
  constructor(_config: MailChannelConfig) {}

  async send(
    message: InstanceType<typeof BaseMail>,
    _notifiable: NotifiableModel,
    deferred: boolean = false
  ) {
    if (deferred) {
      await mail.sendLater(message)
    } else {
      await mail.send(message)
    }
  }
}
