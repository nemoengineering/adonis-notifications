import { DateTime } from 'luxon'
import { LucidModel, LucidRow } from '@adonisjs/lucid/types/model'
import { HasMany } from '@adonisjs/lucid/types/relations'
import { BaseMail } from '@adonisjs/mail'
import { ConfigProvider } from '@adonisjs/core/types'
import { NormalizeConstructor } from '@adonisjs/core/types/helpers'
import { NotificationManager } from './notification_manager.js'

export type NotificationConfig = {}

export type TrapCallback = (notification: any, notifiable: any) => any

export type QueueMonitorCallback = (
  error?: Error & { notification: MessageType },
  response?: {
    message: MessageType
    response: ResponseType
  }
) => void

export interface NotificationChannelContract {
  send(notification: any, notifiable: NotifiableType, ...extras: any[]): Promise<any>
}

export type NotificationManagerChannelFactory = () => NotificationChannelContract

export type NotificationEvents = {
  'notification:sent': {
    notification: MessageType
    notifiable: NotifiableType
    channel: NotificationChannelName
  }
}

/*type ChannelParams = Parameters<
  ReturnType<NotificationChannels[keyof NotificationChannels]>['send']
>*/

export interface ChannelParams extends Record<string, any> {}

export type MessageType = ChannelParams['type'][0]

export type NotifiableType = ChannelParams['type'][1]

export type ResponseType = Awaited<
  ReturnType<ReturnType<NotificationChannels[keyof NotificationChannels]>['send']>
>

type NotificationContractChannels<
  Channels extends Record<string, NotificationManagerChannelFactory>,
> = {
  [Key in keyof Channels as `to${Capitalize<string & Key>}`]?: (
    notifiable: NotifiableModel
  ) => Parameters<ReturnType<Channels[Key]>['send']>[0]
}

/**
 * New channels should use declaration merging to extend this interface with
 * a optional toChannel method that returns the needed payload to send a
 * message with the channel.
 */
export interface NotificationContract extends NotificationContractChannels<NotificationChannels> {
  via(notifiable: NotifiableModel): NotificationChannelName | Array<NotificationChannelName>
}

export interface DatabaseNotificationModel extends Omit<LucidModel, 'new'> {
  new (): DatabaseNotificationRow
}

export interface DatabaseNotificationRow extends LucidRow {
  id: number
  data: Record<string, any>
  notifiableId: number
  markAsRead(): Promise<void>
  markAsUnread(): Promise<void>
  read: boolean
  unread: boolean
  readAt: DateTime | null
  createdAt: DateTime
  updatedAt: DateTime
}

export interface RoutesNotificationsModel extends LucidRow {
  notify(this: this, notification: NotificationContract): Promise<void>
  notifyLater(this: this, notification: NotificationContract): Promise<void>
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

export interface NotifiableModel extends RoutesNotificationsModel, HasDatabaseNotificationsModel {}

export interface NotifiableMixin {
  <T extends NormalizeConstructor<LucidModel>>(
    superclass: T
  ): T & {
    new (...args: any[]): LucidRow & NotifiableModel
  }
}

export interface MailChannelConfig {}

export interface DatabaseChannelConfig {}

export interface DatabaseChannelContract {
  send(notification: Record<string, any>, notifiable: HasDatabaseNotificationsModel): Promise<void>
}

export interface MailChannelContract {
  send(
    notification: InstanceType<typeof BaseMail>,
    notifiable: RoutesNotificationsModel,
    deferred?: boolean
  ): Promise<void>
}

/**
 * Using declaration merging, one must extend this interface.
 * --------------------------------------------------------
 * MUST BE SET IN THE USER LAND.
 * --------------------------------------------------------
 */
export interface NotificationChannels extends Record<string, NotificationManagerChannelFactory> {}

export type NotificationChannelName = keyof NotificationChannels

export type InferChannels<
  T extends ConfigProvider<{ channels: Record<string, NotificationManagerChannelFactory> }>,
> = Awaited<ReturnType<T['resolver']>>['channels']

export type InferChannelParams<T extends ConfigProvider<{ channels: Record<string, any> }>> = {
  type: Parameters<ReturnType<InferChannels<T>[keyof InferChannels<T>]>['send']>
}

export interface NotificationService
  extends NotificationManager<
    NotificationChannels extends Record<string, NotificationManagerChannelFactory>
      ? NotificationChannels
      : never
  > {}
