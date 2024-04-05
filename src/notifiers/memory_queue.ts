import {
  NotifiableModel,
  NotificationContract,
  NotificationEvents,
  NotificationManagerChannelFactory,
  NotificationManagerContract,
  Notifier,
  ResponseType,
} from '../types.js'
import { EmitterLike } from '@adonisjs/core/types/events'
import fastq, { done, queue } from 'fastq'
import debug from '../debug.js'

type Task<KnownChannels extends Record<string, NotificationManagerChannelFactory>> = {
  notifiable: NotifiableModel
  notification: NotificationContract<NotifiableModel>
  channel: keyof KnownChannels
}
function sendNotification<
  Model extends NotifiableModel,
  KnownChannels extends Record<string, NotificationManagerChannelFactory>,
>(
  this: MemoryQueueNotifier<KnownChannels>,
  task: {
    notifiable: Model
    notification: NotificationContract<Model>
    channel: keyof KnownChannels
  },
  cb: done
) {
  this.notificationManager
    .use(task.channel)
    .send(task.notification, task.notifiable)
    .then((result) => cb(null, result))
    .catch((error) => cb(error))
}

export class MemoryQueueNotifier<
  KnownChannels extends Record<string, NotificationManagerChannelFactory>,
> implements Notifier<KnownChannels>
{
  #emitter: EmitterLike<NotificationEvents<KnownChannels>>

  #queue: queue<Task<KnownChannels>> = fastq(this, sendNotification, 10)

  constructor(
    public notificationManager: NotificationManagerContract<KnownChannels>,
    emitter: EmitterLike<NotificationEvents<KnownChannels>>
  ) {
    this.#emitter = emitter
  }

  async queue<Model extends NotifiableModel>(notification: {
    notifiable: Model
    notification: NotificationContract<Model>
    channel: keyof KnownChannels
  }) {
    debug('pushing notification to in-memory queue')

    this.#queue.push(notification, this.#jobCompletedCallback)
  }

  #jobCompletedCallback?: (error: Error | null, result: ResponseType<KnownChannels>) => void = (
    error
  ) => {
    if (error) {
      this.#emitter.emit('notification:queued:error', {
        error,
      })
    }
  }
}
