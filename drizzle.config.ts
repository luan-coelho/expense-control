import { defineConfig } from 'drizzle-kit'
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string(),
})

const env = envSchema.parse(process.env)

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/**/*.ts',
  out: './drizzle',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
})
