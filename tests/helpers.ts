import { Emitter } from '@adonisjs/core/events'
import { AppFactory } from '@adonisjs/core/factories/app'
import { LoggerFactory } from '@adonisjs/core/factories/logger'
import { Database } from '@adonisjs/lucid/database'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { configDotenv } from 'dotenv'
import { Test } from '@japa/runner/core'
import {
  DatabaseNotificationRow,
  HasDatabaseNotificationsModel,
  NotifiableModel,
} from '../src/types.js'
import { compose } from '@poppinss/utils'
import Notifiable from '../src/mixins/notifiable.js'

configDotenv()

/**
 * Creates an instance of the database class for making queries
 */
export async function createDatabase(test: Test) {
  await mkdir(test.context.fs.basePath)

  const app = new AppFactory().create(test.context.fs.baseUrl, () => {})
  const logger = new LoggerFactory().create()
  const emitter = new Emitter(app)
  const db = new Database(
    {
      connection: process.env.DB || 'sqlite',
      connections: {
        sqlite: {
          client: 'sqlite3',
          connection: {
            filename: join(test.context.fs.basePath, 'db.sqlite3'),
          },
        },
        pg: {
          client: 'pg',
          connection: {
            host: process.env.PG_HOST as string,
            port: Number(process.env.PG_PORT),
            database: process.env.PG_DATABASE as string,
            user: process.env.PG_USER as string,
            password: process.env.PG_PASSWORD as string,
          },
        },
        mssql: {
          client: 'mssql',
          connection: {
            server: process.env.MSSQL_HOST as string,
            port: Number(process.env.MSSQL_PORT! as string),
            user: process.env.MSSQL_USER as string,
            password: process.env.MSSQL_PASSWORD as string,
            database: 'master',
            options: {
              enableArithAbort: true,
            },
          },
        },
        mysql: {
          client: 'mysql2',
          connection: {
            host: process.env.MYSQL_HOST as string,
            port: Number(process.env.MYSQL_PORT),
            database: process.env.MYSQL_DATABASE as string,
            user: process.env.MYSQL_USER as string,
            password: process.env.MYSQL_PASSWORD as string,
          },
        },
      },
    },
    logger,
    emitter
  )

  test.cleanup(() => db.manager.closeAll())
  BaseModel.useAdapter(db.modelAdapter())
  return db
}

/**
 * Creates needed database tables
 */
export async function createTables(db: Database, test: Test) {
  test.cleanup(async () => {
    await db.connection().schema.dropTable('notifications')
    await db.connection().schema.dropTable('users')
  })

  await db.connection().schema.createTable('users', (table) => {
    table.increments('id').primary()
  })

  await db.connection().schema.createTable('notifications', (table) => {
    table.increments('id').primary()
    table.integer('notifiable_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
    table.json('data').notNullable()
    table.timestamp('read_at', { useTz: true })
    table.timestamp('created_at', { useTz: true })
    table.timestamp('updated_at', { useTz: true })
  })
}

export async function notifiableFactory(
  tableName = 'notifications',
  persisted = true
): Promise<NotifiableModel & HasDatabaseNotificationsModel & { id: number }> {
  class User extends compose(BaseModel, Notifiable(tableName)) {
    @column({ isPrimary: true })
    declare id: number
  }

  return persisted ? User.create({}) : new User()
}

export async function createNotification(
  model: HasDatabaseNotificationsModel,
  overrides?: Partial<DatabaseNotificationRow>
) {
  return model.related('notifications').create({
    data: { title: 'test' },
    ...overrides,
  })
}
