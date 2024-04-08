import {
  DatabaseChannelConfig,
  MailChannelConfig,
  NotificationConfig,
  NotificationManagerChannelFactory,
} from './types.js'
import { ConfigProvider } from '@adonisjs/core/types'
import { configProvider } from '@adonisjs/core'
import type { DatabaseChannel } from './channels/database.js'
import type { MailChannel } from './channels/mail.js'

export type ResolvedConfig<
  KnownChannels extends Record<string, NotificationManagerChannelFactory>,
> = NotificationConfig & {
  channels: {
    [K in keyof KnownChannels]: KnownChannels[K] extends ConfigProvider<infer A>
      ? A
      : KnownChannels[K]
  }
}

export function defineConfig<
  KnownChannels extends Record<string, NotificationManagerChannelFactory>,
>(
  config: NotificationConfig & {
    channels: { [K in keyof KnownChannels]: ConfigProvider<KnownChannels[K]> | KnownChannels[K] }
  }
): ConfigProvider<ResolvedConfig<KnownChannels>> {
  return configProvider.create(async (app) => {
    const { channels, ...rest } = config
    const channelNames = Object.keys(channels)
    const channelz = {} as Record<string, NotificationManagerChannelFactory>

    for (let channelName of channelNames) {
      const channel = channels[channelName]
      if (typeof channel === 'function') {
        channelz[channelName] = channel
      } else {
        channelz[channelName] = await channel.resolver(app)
      }
    }

    return { channels: channelz, ...rest } as ResolvedConfig<KnownChannels>
  })
}

export const channels: {
  database: (config: DatabaseChannelConfig) => ConfigProvider<() => DatabaseChannel>
  mail: (config: MailChannelConfig) => ConfigProvider<() => MailChannel>
} = {
  database(config) {
    return configProvider.create(async () => {
      const { DatabaseChannel } = await import('./channels/database.js')
      return () => new DatabaseChannel(config)
    })
  },
  mail(config) {
    return configProvider.create(async () => {
      const { MailChannel } = await import('./channels/mail.js')
      return () => new MailChannel(config)
    })
  },
}
