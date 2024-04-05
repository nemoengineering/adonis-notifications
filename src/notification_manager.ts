import { EmitterLike } from '@adonisjs/core/types/events'
import {
  NotifiableModel,
  NotificationChannelContract,
  NotificationConfig,
  NotificationContract,
  NotificationEvents,
  NotificationManagerChannelFactory,
  NotificationManagerContract,
  Notifier,
  ResponseType,
  TrapCallback,
} from './types.js'
import debug from './debug.js'
import string from '@poppinss/utils/string'
import { MemoryQueueNotifier } from './notifiers/memory_queue.js'
import { RuntimeException } from '@poppinss/utils'
import FakeChannel from './channels/fake.js'

export class NotificationManager<
  KnownChannels extends Record<string, NotificationManagerChannelFactory>,
> implements NotificationManagerContract<KnownChannels>
{
  readonly #emitter: EmitterLike<NotificationEvents<KnownChannels>>

  #channelCache: Partial<Record<keyof KnownChannels, NotificationChannelContract>> = {}

  #notifier: Notifier<KnownChannels>

  #fakeChannel?: FakeChannel

  constructor(
    emitter: EmitterLike<NotificationEvents<KnownChannels>>,
    public config: NotificationConfig & {
      channels: KnownChannels
    }
  ) {
    debug('creating notification manager %O', config)
    this.#emitter = emitter
    this.#notifier = new MemoryQueueNotifier(this, this.#emitter)
  }

  async send<Model extends NotifiableModel>(
    notifiables: Model | Model[],
    notification: NotificationContract<Model>
  ) {
    await this.#sendNotification(notifiables, notification)
  }

  /**
   * Send a notification asynchronously using a queue
   */
  async sendLater<Model extends NotifiableModel>(
    notifiables: Model | Model[],
    notification: NotificationContract<Model>
  ) {
    await this.#sendNotification(notifiables, notification, true)
  }

  async #sendNotification<Model extends NotifiableModel>(
    notifiables: Model | Model[],
    notification: NotificationContract<Model>,
    deferred?: boolean
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

      if (deferred) {
        await this.#queueNotification(notifiable, message, channel)
        continue
      }

      const response = await this.use(channel).send(message, notifiable)
      responses.push(response)
      this.#emitter.emit('notification:sent', { notification: message, notifiable, channel })
    }

    return responses
  }

  async #queueNotification<Model extends NotifiableModel>(
    notifiable: Model,
    notification: NotificationContract<Model>,
    channel: keyof KnownChannels
  ) {
    this.#emitter.emit('notification:queueing', { notifiable, notification, channel })

    debug('queueing notification')
    const metaData = await this.#notifier.queue({ notifiable, notification, channel })

    this.#emitter.emit('notification:queued', { notifiable, notification, channel, metaData })
  }

  use<K extends keyof KnownChannels>(channelName: K): ReturnType<KnownChannels[K]> {
    if (!this.config.channels[channelName]) {
      throw new RuntimeException(
        `Unknown channel "${String(channelName)}". Make sure it is configured inside the config file`
      )
    }

    if (this.#fakeChannel) {
      return this.#fakeChannel as unknown as ReturnType<KnownChannels[K]>
    }

    const cachedChannel = this.#channelCache[channelName]
    if (cachedChannel) {
      debug('using channel from cache. name: %s', cachedChannel)
      return cachedChannel as ReturnType<KnownChannels[K]>
    }

    const channelFactory = this.config.channels[channelName]

    debug('creating channel transport. name: "%s"', channelName)
    const channel = channelFactory() as ReturnType<KnownChannels[K]>

    this.#channelCache[channelName] = channel

    return channel
  }

  /**
   * Turn on fake mode. After this all calls to "notification.use" will
   * return an instance of the fake channel
   */
  fake(callback: TrapCallback): FakeChannel {
    this.restore()
    debug('creating fake channel')
    this.#fakeChannel = new FakeChannel(callback)
    return this.#fakeChannel
  }

  /**
   * Turn off fake mode and restore normal behavior
   */
  restore() {
    if (!this.#fakeChannel) return

    this.#fakeChannel = undefined
    debug('restoring channel fake')
  }
}
