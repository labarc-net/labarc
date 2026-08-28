import { Inject, Injectable, Logger } from '@nestjs/common'
import { DRIZZLE_CLIENT } from '../database/database.module'
import type { DrizzleClient } from '../database/drizzle/client'
import * as schema from '../database/drizzle/schema'

export interface AuditLogInput {
  action: string
  userId?: string
  organizationId?: string
  entityType?: string
  entityId?: string
  // `unknown` rather than `Record<string, unknown>`: every call site passes
  // a DTO class instance directly (`metadata: dto`), and class/interface
  // types without an index signature aren't structurally assignable to
  // `Record<string, unknown>`. It's stored as-is into a `jsonb` column with
  // no `.$type<>()` applied, so `unknown` is the correct type here too.
  metadata?: unknown
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name)

  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

  /** Never throws — an audit-log failure must not break the calling request. */
  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.db.insert(schema.auditEvents).values({
        action: input.action,
        userId: input.userId,
        organizationId: input.organizationId,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata ?? null,
      })
    } catch (error) {
      this.logger.error(`Failed to write audit event "${input.action}"`, error as Error)
    }
  }
}
