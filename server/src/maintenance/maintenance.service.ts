import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, desc, eq } from 'drizzle-orm'
import { AuditService } from '../audit/audit.service'
import { DRIZZLE_CLIENT } from '../database/database.module'
import type { DrizzleClient } from '../database/drizzle/client'
import * as schema from '../database/drizzle/schema'
import type { CreateMaintenanceRecordDto } from './dto/create-maintenance-record.dto'
import type { UpdateMaintenanceRecordDto } from './dto/update-maintenance-record.dto'

@Injectable()
export class MaintenanceService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly audit: AuditService,
  ) {}

  async list(organizationId: string, filters: { equipmentId?: string; status?: string }) {
    const conditions = [eq(schema.maintenanceRecords.organizationId, organizationId)]
    if (filters.equipmentId) conditions.push(eq(schema.maintenanceRecords.equipmentId, filters.equipmentId))

    const rows = await this.db
      .select()
      .from(schema.maintenanceRecords)
      .where(and(...conditions))
      .orderBy(desc(schema.maintenanceRecords.scheduledFor))

    const withDisplayStatus = rows.map((row) => ({ ...row, displayStatus: this.displayStatus(row) }))

    if (filters.status) {
      return withDisplayStatus.filter((row) => row.displayStatus === filters.status)
    }
    return withDisplayStatus
  }

  async create(organizationId: string, dto: CreateMaintenanceRecordDto, actingUserId: string) {
    const [equipmentRow] = await this.db
      .select()
      .from(schema.equipment)
      .where(and(eq(schema.equipment.id, dto.equipmentId), eq(schema.equipment.organizationId, organizationId)))
      .limit(1)

    if (!equipmentRow) {
      throw new NotFoundException('Equipment not found in this organization.')
    }

    if (dto.technicianStaffProfileId) {
      await this.assertStaffInOrg(organizationId, dto.technicianStaffProfileId)
    }

    const [record] = await this.db
      .insert(schema.maintenanceRecords)
      .values({
        organizationId,
        equipmentId: dto.equipmentId,
        type: dto.type,
        scheduledFor: new Date(dto.scheduledFor),
        technicianStaffProfileId: dto.technicianStaffProfileId,
        durationHours: dto.durationHours,
        notes: dto.notes,
      })
      .returning()

    await this.audit.log({
      userId: actingUserId,
      organizationId,
      action: 'maintenance.record.create',
      entityType: 'maintenance_record',
      entityId: record.id,
    })

    return { ...record, displayStatus: this.displayStatus(record) }
  }

  async update(organizationId: string, recordId: string, dto: UpdateMaintenanceRecordDto, actingUserId: string) {
    const [existing] = await this.db
      .select()
      .from(schema.maintenanceRecords)
      .where(and(eq(schema.maintenanceRecords.id, recordId), eq(schema.maintenanceRecords.organizationId, organizationId)))
      .limit(1)

    if (!existing) {
      throw new NotFoundException('Maintenance record not found.')
    }

    if (dto.technicianStaffProfileId) {
      await this.assertStaffInOrg(organizationId, dto.technicianStaffProfileId)
    }

    const patch: Record<string, unknown> = { ...dto, updatedAt: new Date() }
    if (dto.scheduledFor) patch.scheduledFor = new Date(dto.scheduledFor)
    if (dto.status === 'completed' && !existing.completedAt) patch.completedAt = new Date()

    const [updated] = await this.db
      .update(schema.maintenanceRecords)
      .set(patch)
      .where(eq(schema.maintenanceRecords.id, recordId))
      .returning()

    await this.audit.log({
      userId: actingUserId,
      organizationId,
      action: 'maintenance.record.update',
      entityType: 'maintenance_record',
      entityId: recordId,
      metadata: dto,
    })

    return { ...updated, displayStatus: this.displayStatus(updated) }
  }

  private async assertStaffInOrg(organizationId: string, staffProfileId: string) {
    const [staff] = await this.db
      .select({ id: schema.staffProfiles.id })
      .from(schema.staffProfiles)
      .innerJoin(schema.memberships, eq(schema.memberships.id, schema.staffProfiles.membershipId))
      .where(and(eq(schema.staffProfiles.id, staffProfileId), eq(schema.memberships.organizationId, organizationId)))
      .limit(1)

    if (!staff) {
      throw new NotFoundException('Technician staff profile not found in this organization.')
    }
  }

  /**
   * 'overdue' is not stored — it's the true underlying 'scheduled' status
   * plus a past-due date, computed at read time so it can never go stale.
   */
  private displayStatus(record: typeof schema.maintenanceRecords.$inferSelect): string {
    if (record.status === 'scheduled' && record.scheduledFor.getTime() < Date.now()) {
      return 'overdue'
    }
    return record.status
  }
}
