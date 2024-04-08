import { DateTime } from 'luxon'
import { LucidModel, LucidRow } from '@adonisjs/lucid/types/model'
import { HasMany } from '@adonisjs/lucid/types/relations'
import { BaseMail } from '@adonisjs/mail'
import { ConfigProvider } from '@adonisjs/core/types'
import { NormalizeConstructor } from '@adonisjs/core/types/helpers'
import { NotificationManager } from './notification_manager.js'

export type NotificationConfig = {}

export type TrapCallback = (notification: any, notifiable: any) => any

export interface NotificationChannelContract {
  send(notification: any, notifiable: NotifiableModel, ...extras: any[]): Promise<any>
}

export type NotificationManagerChannelFactory = () => NotificationChannelContract

export type NotificationEvents<
  KnownChannels extends Record<string, NotificationManagerChannelFactory>,
> = {
  'notification:sent': EventWithChannel<KnownChannels>
  'notification:queueing': EventWithChannel<KnownChannels>
  'notification:queued': EventWithChannel<KnownChannels> & { metaData?: any }
  'notification:queued:error': {
    error: any
  }
}

type EventWithChannel<KnownChannels extends Record<string, NotificationManagerChannelFactory>> = {
  [Channel in keyof KnownChannels]: {
    notification: Parameters<ReturnType<KnownChannels[Channel]>['send']>[0]
    notifiable: Parameters<ReturnType<KnownChannels[Channel]>['send']>[1]
    channel: Channel
  }
}[keyof KnownChannels]

export type ResponseType<KnownChannels extends Record<string, NotificationManagerChannelFactory>> =
  Awaited<ReturnType<ReturnType<KnownChannels[keyof KnownChannels]>['send']>>

type NotificationContractChannels<
  Channels extends Record<string, NotificationManagerChannelFactory>,
  Model extends NotifiableModel,
> = {
  [Key in keyof Channels as Key extends string ? `to${Capitalize<Key>}` : never]?: (
    notifiable: Model
  ) => Parameters<ReturnType<Channels[Key]>['send']>[0]
}

/**
 * New channels should use declaration merging to extend this interface with
 * a optional toChannel method that returns the needed payload to send a
 * message with the channel.
 */
export interface NotificationContract<Model extends NotifiableModel>
  // @ts-expect-error ignoring since NotificationChannels does not have any keys until set in user land
  extends NotificationContractChannels<NotificationChannels, Model> {
  via(notifiable: Model): NotificationChannelName | Array<NotificationChannelName>
}

export interface DatabaseNotificationModel extends Omit<LucidModel, 'new'> {
  new (): DatabaseNotificationRow
}

export interface DatabaseNotificationRow extends LucidRow {
  id: number
  data: DatabaseChannelData
  notifiableId: any
  markAsRead(): Promise<void>
  markAsUnread(): Promise<void>
  read: boolean
  unread: boolean
  readAt: DateTime | null
  createdAt: DateTime
  updatedAt: DateTime
}

export interface RoutesNotificationsModel extends LucidRow {
  notify(this: this, notification: NotificationContract<this>): Promise<void>
  notifyLater(this: this, notification: NotificationContract<this>): Promise<void>
}

export interface RoutesNotificationsMixin {
  <T extends NormalizeConstructor<LucidModel>>(
    superclass: T
  ): T & {
    new (...args: any[]): LucidRow & RoutesNotificationsModel
  }
}

export interface HasDatabaseNotificationsModel extends LucidRow {
  notifications: HasMany<DatabaseNotificationModel>
  readNotifications(): Promise<DatabaseNotificationRow[]>
  unreadNotifications(): Promise<DatabaseNotificationRow[]>
  markNotificationsAsRead(this: this): Promise<void>
  markNotificationsAsUnread(this: this): Promise<void>
}

export interface HasDatabaseNotificationsMixin {
  <T extends NormalizeConstructor<LucidModel>>(
    superclass: T
  ): T & {
    new (...args: any[]): LucidRow & HasDatabaseNotificationsModel
  }
}

export interface NotifiableModel extends RoutesNotificationsModel {}

export interface NotifiableMixin {
  <T extends NormalizeConstructor<LucidModel>>(
    superclass: T
  ): T & {
    new (...args: any[]): LucidRow & NotifiableModel & HasDatabaseNotificationsModel
  }
}

export interface MailChannelConfig {}

export interface DatabaseChannelConfig {}

export interface DatabaseChannelData extends Record<string, any> {}

export interface DatabaseChannelContract {
  send(notification: DatabaseChannelData, notifiable: HasDatabaseNotificationsModel): Promise<void>
}

export interface MailChannelContract {
  send(
    notification: InstanceType<typeof BaseMail>,
    notifiable: RoutesNotificationsModel,
    deferred?: boolean
  ): Promise<void>
}

export interface NotificationManagerContract<
  KnownChannels extends Record<string, NotificationManagerChannelFactory>,
> {
  send<Model extends NotifiableModel>(
    notifiables: Model | Model[],
    notification: NotificationContract<Model>,
    _deferred?: boolean
  ): Promise<void | ResponseType<KnownChannels>[]>

  sendLater<Model extends NotifiableModel>(
    notifiables: Model | Model[],
    notification: NotificationContract<Model>
  ): Promise<void>

  use<K extends keyof KnownChannels>(channelName: K): ReturnType<KnownChannels[K]>
}

export interface Notifier<KnownChannels extends Record<string, NotificationManagerChannelFactory>> {
  queue<Model extends NotifiableModel>(notification: {
    notifiable: Model
    notification: NotificationContract<Model>
    channel: keyof KnownChannels
  }): Promise<any>
}

/**
 * Using declaration merging, one must extend this interface.
 * --------------------------------------------------------
 * MUST BE SET IN THE USER LAND.
 * --------------------------------------------------------
 */

export interface NotificationChannels {}

export type NotificationChannelName = keyof NotificationChannels

export type InferChannels<
  T extends ConfigProvider<{ channels: Record<string, NotificationManagerChannelFactory> }>,
> = Awaited<ReturnType<T['resolver']>>['channels']

export interface NotificationService
  extends NotificationManager<
    NotificationChannels extends Record<string, NotificationManagerChannelFactory>
      ? NotificationChannels
      : never
  > {}
