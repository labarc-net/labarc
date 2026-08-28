import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export type DrizzleClient = ReturnType<typeof createDrizzleClient>

export function createDrizzleClient(connectionString: string) {
  const queryClient = postgres(connectionString, { max: 10 })
  return drizzle(queryClient, { schema })
}
