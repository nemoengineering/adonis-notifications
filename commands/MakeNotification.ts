import { join } from 'node:path'
import { BaseCommand, args } from '@adonisjs/core/build/standalone'

export default class MakeNotification extends BaseCommand {
  static commandName = 'make:notification'
  static description = 'Make a new Notification'

  /**
   * The name of the seeder file.
   */
  @args.string({ description: 'Name of the notification class' })
  name: string

  /**
   * This command loads the application
   */
  static settings = {
    loadApp: true,
  }

  /**
   * Execute command
   */
  async run(): Promise<void> {
    const stub = join(__dirname, '..', 'templates', 'notification.txt')

    this.generator
      .addFile(this.name, { pattern: 'pascalcase', form: 'singular' })
      .stub(stub)
      .destinationDir('app/Notifications')
      .useMustache()
      .appRoot(this.application.cliCwd || this.application.appRoot)

    await this.generator.run()
  }
}
