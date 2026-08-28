import { Inject, Injectable, Logger } from '@nestjs/common'
import { sql } from 'drizzle-orm'
import { DRIZZLE_CLIENT } from './database.constants'
import type { DrizzleClient } from './drizzle/client'

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name)

  constructor(@Inject(DRIZZLE_CLIENT) public readonly db: DrizzleClient) {}

  /** Used by the /api/health endpoint — cheap connectivity check. */
  async pingDatabase(): Promise<boolean> {
    try {
      await this.db.execute(sql`select 1`)
      return true
    } catch (error) {
      this.logger.error('Database ping failed', error as Error)
      return false
    }
  }
}
