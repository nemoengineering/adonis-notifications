import { EmitterLike } from '@adonisjs/core/types/events'
import {
  NotifiableModel,
  NotificationChannelContract,
  NotificationConfig,
  NotificationContract,
  NotificationEvents,
  NotificationManagerChannelFactory,
  ResponseType,
} from './types.js'
import debug from './debug.js'
import string from '@poppinss/utils/string'

export class NotificationManager<
  KnownChannels extends Record<string, NotificationManagerChannelFactory>,
> {
  #emitter: EmitterLike<NotificationEvents<KnownChannels>>

  #fakeChannel?: NotificationChannelContract

  constructor(
    emitter: EmitterLike<NotificationEvents<KnownChannels>>,
    public config: NotificationConfig & {
      channels: KnownChannels
    }
  ) {
    debug('creating notification manager %O', config)
    this.#emitter = emitter
  }

  async send<Model extends NotifiableModel>(
    notifiables: Model | Model[],
    notification: NotificationContract<Model>,
    _deferred?: boolean
  ): Promise<void | ResponseType<KnownChannels>[]> {
    notifiables = Array.isArray(notifiables) ? notifiables : [notifiables]

    const notifications = notifiables
      .map((notifiable) => {
        const channels = [notification.via(notifiable)].flat()
        return channels.map((channel) => {
          const method = `to${string.capitalCase(channel)}` as `to${Capitalize<typeof channel>}`

          if (!notification[method]) {
            throw new Error(`Method ${method} not found on ${notification.constructor.name}`)
          }

          // @ts-expect-error ignoring since NotificationChannels does not have any keys until set in user land
          const message = notification[method](notifiable)
          return { channel, message, notifiable }
        })
      })
      .flat()

    const responses: ResponseType<KnownChannels>[] = []

    for (const { channel, message, notifiable } of notifications) {
      if (this.#fakeChannel) {
        await this.#fakeChannel.send(message, notifiable)
        continue
      }

      /*if (deferred) {
        this.queue.push({ channel, message, notifiable }, this.queueMonitor as any)
        continue
      }*/

      const response = await this.use(channel).send(message, notifiable)
      responses.push(response)
      this.#emitter.emit('notification:sent', { notification: message, notifiable, channel })
    }

    return responses
  }

  async sendLater<Model extends NotifiableModel>(
    notifiables: Model | Model[],
    notification: NotificationContract<Model>
  ) {
    this.send(notifiables, notification, true)
  }

  use<K extends keyof KnownChannels>(channelName: K): ReturnType<KnownChannels[K]> {
    return this.config.channels[channelName]() as ReturnType<KnownChannels[K]>
  }
}
