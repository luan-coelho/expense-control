import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { z } from 'zod'
import * as schema from './schema'

const envSchema = z.object({
  DATABASE_URL: z.string(),
})

const env = envSchema.parse(process.env)

const pool = new Pool({
  connectionString: env.DATABASE_URL,
})

const db = drizzle(pool, { schema })

export { db, schema }
