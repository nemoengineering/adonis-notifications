import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import { stubsRoot } from '../stubs/main.js'
import StringBuilder from '@poppinss/utils/string_builder'
import string from '@poppinss/utils/string'

export default class MakeNotification extends BaseCommand {
  static commandName = 'make:notification'
  static description = 'Make a new notification class'
  static options: CommandOptions = {
    allowUnknownFlags: true,
  }

  /**
   * The name of the notification file.
   */
  @args.string({ description: 'Name of the notification' })
  declare name: string

  /**
   * Define the model for the notification
   */
  @flags.string({ description: 'The intent model for the notification', default: 'User' })
  declare model: string

  /**
   * Execute command
   */
  async run(): Promise<void> {
    const codemods = await this.createCodemods()

    const entity = this.app.generators.createEntity(this.name)
    const model = this.app.generators.createEntity(this.model)
    await codemods.makeUsingStub(stubsRoot, 'make/notification/main.stub', {
      flags: this.parsed.flags,
      notificationName: notificationName(entity.name),
      notificationFileName: new StringBuilder(notificationName(entity.name))
        .snakeCase()
        .ext('.ts')
        .toString(),
      model: model,
      modelName: this.app.generators.modelName(model.name),
      modelFileName: new StringBuilder(this.app.generators.modelName(model.name))
        .snakeCase()
        .toString(),
    })
  }
}

function notificationName(name: string) {
  return new StringBuilder(name)
    .removeExtension()
    .removeSuffix('notification')
    .removeSuffix('provision')
    .pascalCase()
    .suffix(string.pascalCase('notification'))
    .toString()
}
