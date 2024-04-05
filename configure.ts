import type Configure from '@adonisjs/core/commands/configure'

import { stubsRoot } from './stubs/main.js'
import string from '@poppinss/utils/string'

/**
 * List of supported transports
 */
const KNOWN_CHANNELS = ['database', 'mail']

export async function configure(command: Configure) {
  /**
   * Read channels from the "--channels" CLI flag
   */
  let selectedChannels: string | string[] | undefined = command.parsedFlags.channels

  /**
   * Display prompts when channels have been selected
   * via the CLI flag
   */
  if (!selectedChannels) {
    selectedChannels = await command.prompt.multiple(
      'Select the notification channels you want to use',
      KNOWN_CHANNELS,
      {
        validate(values) {
          return !values || !values.length ? 'Please select one or more channels' : true
        },
      }
    )
  }

  /**
   * Normalized list of transports
   */
  const channels = typeof selectedChannels === 'string' ? [selectedChannels] : selectedChannels!

  const unknownChannel = channels.find((transport) => !KNOWN_CHANNELS.includes(transport))
  if (unknownChannel) {
    command.exitCode = 1
    command.logger.logError(
      `Invalid channel "${unknownChannel}". Supported transports are: ${string.sentence(
        KNOWN_CHANNELS
      )}`
    )
    return
  }

  const codemods = await command.createCodemods()

  // Publish config file
  await codemods.makeUsingStub(stubsRoot, 'config/notification.stub', {
    channels,
  })

  // Publish migration
  await codemods.makeUsingStub(stubsRoot, 'make/migration/notifications.stub', {
    entity: command.app.generators.createEntity('notifications'),
    migration: {
      folder: 'database/migrations',
      fileName: `${new Date().getTime()}_create_notifications_table.ts`,
    },
  })

  /**
   * Publish provider and command
   */
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@verful/notifications/notification_provider')
    rcFile.addCommand('@verful/notifications/commands')
  })

  await codemods.updateRcFile((t) => t.setDirectory('notifications', 'app/notifications'))
}
