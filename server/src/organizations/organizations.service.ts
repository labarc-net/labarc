import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { AuditService } from '../audit/audit.service'
import { DRIZZLE_CLIENT } from '../database/database.module'
import type { DrizzleClient } from '../database/drizzle/client'
import * as schema from '../database/drizzle/schema'
import type { CreateOrganizationDto } from './dto/create-organization.dto'
import type { UpdateOrganizationDto } from './dto/update-organization.dto'

@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateOrganizationDto, actingUserId: string) {
    const existing = await this.db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.slug, dto.slug))
      .limit(1)

    if (existing.length > 0) {
      throw new ConflictException(`An organization with slug "${dto.slug}" already exists.`)
    }

    const [org] = await this.db.insert(schema.organizations).values(dto).returning()

    await this.audit.log({
      userId: actingUserId,
      organizationId: org.id,
      action: 'organization.create',
      entityType: 'organization',
      entityId: org.id,
    })

    return org
  }

  /** Super admins see every organization; everyone else sees only their memberships. */
  async listForUser(userId: string, isSuperAdmin: boolean) {
    if (isSuperAdmin) {
      return this.db.select().from(schema.organizations)
    }

    return this.db
      .select({
        id: schema.organizations.id,
        name: schema.organizations.name,
        slug: schema.organizations.slug,
        status: schema.organizations.status,
        createdAt: schema.organizations.createdAt,
        updatedAt: schema.organizations.updatedAt,
      })
      .from(schema.organizations)
      .innerJoin(schema.memberships, eq(schema.memberships.organizationId, schema.organizations.id))
      .where(eq(schema.memberships.userId, userId))
  }

  async getById(id: string) {
    const [org] = await this.db.select().from(schema.organizations).where(eq(schema.organizations.id, id)).limit(1)
    if (!org) {
      throw new NotFoundException('Organization not found.')
    }
    return org
  }

  async update(id: string, dto: UpdateOrganizationDto, actingUserId: string) {
    await this.getById(id)

    const [org] = await this.db
      .update(schema.organizations)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.organizations.id, id))
      .returning()

    await this.audit.log({
      userId: actingUserId,
      organizationId: org.id,
      action: 'organization.update',
      entityType: 'organization',
      entityId: org.id,
      metadata: dto,
    })

    return org
  }
}
