import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import { AuditService } from '../audit/audit.service'
import { DRIZZLE_CLIENT } from '../database/database.module'
import type { DrizzleClient } from '../database/drizzle/client'
import * as schema from '../database/drizzle/schema'
import type { CreateDepartmentDto } from './dto/create-department.dto'
import type { UpdateDepartmentDto } from './dto/update-department.dto'

@Injectable()
export class DepartmentsService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly audit: AuditService,
  ) {}

  async list(organizationId: string) {
    return this.db.select().from(schema.departments).where(eq(schema.departments.organizationId, organizationId))
  }

  async create(organizationId: string, dto: CreateDepartmentDto, actingUserId: string) {
    const existing = await this.db
      .select()
      .from(schema.departments)
      .where(and(eq(schema.departments.organizationId, organizationId), eq(schema.departments.name, dto.name)))
      .limit(1)

    if (existing.length > 0) {
      throw new ConflictException(`A department named "${dto.name}" already exists in this organization.`)
    }

    const [department] = await this.db.insert(schema.departments).values({ organizationId, name: dto.name }).returning()

    await this.audit.log({
      userId: actingUserId,
      organizationId,
      action: 'department.create',
      entityType: 'department',
      entityId: department.id,
    })

    return department
  }

  async update(organizationId: string, departmentId: string, dto: UpdateDepartmentDto, actingUserId: string) {
    const [existing] = await this.db
      .select()
      .from(schema.departments)
      .where(and(eq(schema.departments.id, departmentId), eq(schema.departments.organizationId, organizationId)))
      .limit(1)

    if (!existing) {
      throw new NotFoundException('Department not found.')
    }

    const [department] = await this.db
      .update(schema.departments)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.departments.id, departmentId))
      .returning()

    await this.audit.log({
      userId: actingUserId,
      organizationId,
      action: 'department.update',
      entityType: 'department',
      entityId: departmentId,
      metadata: dto,
    })

    return department
  }
}
