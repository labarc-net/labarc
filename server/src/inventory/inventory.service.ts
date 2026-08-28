import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, eq, gte, sql } from 'drizzle-orm'
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type'
import { AuditService } from '../audit/audit.service'
import { DRIZZLE_CLIENT } from '../database/database.module'
import type { DrizzleClient } from '../database/drizzle/client'
import * as schema from '../database/drizzle/schema'
import type { CreateInventoryItemDto } from './dto/create-inventory-item.dto'
import type { RecordStockMovementDto } from './dto/record-stock-movement.dto'
import type { UpdateInventoryItemDto } from './dto/update-inventory-item.dto'
import { InventoryRulesService } from './inventory-rules.service'

/** Trailing window used to compute the daily consumption rate. */
const CONSUMPTION_WINDOW_DAYS = 14
/** Number of daily buckets returned as consumptionTrend, zero-filled for no-movement days. */
const TREND_DAYS = 7

@Injectable()
export class InventoryService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly audit: AuditService,
    private readonly rules: InventoryRulesService,
  ) {}

  async list(organizationId: string, departmentId?: string) {
    const conditions = [eq(schema.inventoryItems.organizationId, organizationId)]
    if (departmentId) conditions.push(eq(schema.inventoryItems.departmentId, departmentId))

    const rows = await this.db
      .select()
      .from(schema.inventoryItems)
      .where(and(...conditions))

    const results = []
    for (const row of rows) {
      results.push(await this.buildSummary(row))
    }
    return results
  }

  async getById(organizationId: string, itemId: string) {
    const row = await this.findRecord(organizationId, itemId)
    return this.buildSummary(row)
  }

  async create(organizationId: string, dto: CreateInventoryItemDto, actingUser: AuthenticatedUser) {
    const [department] = await this.db
      .select()
      .from(schema.departments)
      .where(and(eq(schema.departments.id, dto.departmentId), eq(schema.departments.organizationId, organizationId)))
      .limit(1)

    if (!department) {
      throw new NotFoundException('Department not found in this organization.')
    }

    const [item] = await this.db
      .insert(schema.inventoryItems)
      .values({
        organizationId,
        departmentId: dto.departmentId,
        name: dto.name,
        category: dto.category,
        lot: dto.lot,
        unit: dto.unit,
        reorderLevel: dto.reorderLevel,
        leadTimeDays: dto.leadTimeDays,
        expiry: dto.expiry ? new Date(dto.expiry) : null,
        supplier: dto.supplier,
      })
      .returning()

    if (dto.initialStock && dto.initialStock > 0) {
      await this.db.insert(schema.inventoryStockMovements).values({
        inventoryItemId: item.id,
        quantity: dto.initialStock,
        reason: 'received',
        recordedByUserId: actingUser.id,
      })
    }

    await this.audit.log({
      userId: actingUser.id,
      organizationId,
      action: 'inventory.item.create',
      entityType: 'inventory_item',
      entityId: item.id,
    })

    return this.buildSummary(item)
  }

  async update(organizationId: string, itemId: string, dto: UpdateInventoryItemDto, actingUser: AuthenticatedUser) {
    await this.findRecord(organizationId, itemId)

    const patch: Record<string, unknown> = { ...dto, updatedAt: new Date() }
    if (dto.expiry) patch.expiry = new Date(dto.expiry)

    const [updated] = await this.db
      .update(schema.inventoryItems)
      .set(patch)
      .where(eq(schema.inventoryItems.id, itemId))
      .returning()

    await this.audit.log({
      userId: actingUser.id,
      organizationId,
      action: 'inventory.item.update',
      entityType: 'inventory_item',
      entityId: itemId,
      metadata: dto,
    })

    return this.buildSummary(updated)
  }

  async recordMovement(organizationId: string, itemId: string, dto: RecordStockMovementDto, actingUser: AuthenticatedUser) {
    await this.findRecord(organizationId, itemId)

    const [movement] = await this.db
      .insert(schema.inventoryStockMovements)
      .values({
        inventoryItemId: itemId,
        quantity: dto.quantity,
        reason: dto.reason,
        recordedByUserId: actingUser.id,
      })
      .returning()

    await this.audit.log({
      userId: actingUser.id,
      organizationId,
      action: 'inventory.movement.record',
      entityType: 'inventory_item',
      entityId: itemId,
      metadata: { quantity: dto.quantity, reason: dto.reason },
    })

    return movement
  }

  private async findRecord(organizationId: string, itemId: string) {
    const [row] = await this.db
      .select()
      .from(schema.inventoryItems)
      .where(and(eq(schema.inventoryItems.id, itemId), eq(schema.inventoryItems.organizationId, organizationId)))
      .limit(1)

    if (!row) {
      throw new NotFoundException('Inventory item not found.')
    }
    return row
  }

  private async buildSummary(row: typeof schema.inventoryItems.$inferSelect) {
    const [currentStock, dailyConsumption, consumptionTrend] = await Promise.all([
      this.getCurrentStock(row.id),
      this.getDailyConsumptionRate(row.id),
      this.getConsumptionTrend(row.id),
    ])

    const { status, projectedStockoutDays, recommendation } = this.rules.compute({
      currentStock,
      reorderLevel: row.reorderLevel,
      dailyConsumption,
      leadTimeDays: row.leadTimeDays,
      expiry: row.expiry,
      unit: row.unit,
    })

    return {
      id: row.id,
      departmentId: row.departmentId,
      name: row.name,
      category: row.category,
      lot: row.lot,
      stock: currentStock,
      unit: row.unit,
      reorderLevel: row.reorderLevel,
      dailyConsumption,
      leadTimeDays: row.leadTimeDays,
      expiry: row.expiry,
      supplier: row.supplier,
      status,
      projectedStockoutDays,
      consumptionTrend,
      recommendation,
    }
  }

  private async getCurrentStock(itemId: string): Promise<number> {
    const [{ total }] = await this.db
      .select({ total: sql<number | null>`coalesce(sum(${schema.inventoryStockMovements.quantity}), 0)` })
      .from(schema.inventoryStockMovements)
      .where(eq(schema.inventoryStockMovements.inventoryItemId, itemId))

    return total !== null && total !== undefined ? Number(total) : 0
  }

  private async getDailyConsumptionRate(itemId: string): Promise<number> {
    const windowStart = new Date(Date.now() - CONSUMPTION_WINDOW_DAYS * 24 * 60 * 60 * 1000)

    const [{ totalConsumed }] = await this.db
      .select({
        totalConsumed: sql<number | null>`coalesce(sum(case when ${schema.inventoryStockMovements.quantity} < 0 then -${schema.inventoryStockMovements.quantity} else 0 end), 0)`,
      })
      .from(schema.inventoryStockMovements)
      .where(
        and(
          eq(schema.inventoryStockMovements.inventoryItemId, itemId),
          gte(schema.inventoryStockMovements.occurredAt, windowStart),
        ),
      )

    const consumed = totalConsumed !== null && totalConsumed !== undefined ? Number(totalConsumed) : 0
    return Math.round((consumed / CONSUMPTION_WINDOW_DAYS) * 100) / 100
  }

  private async getConsumptionTrend(itemId: string): Promise<number[]> {
    const windowStart = new Date()
    windowStart.setHours(0, 0, 0, 0)
    windowStart.setDate(windowStart.getDate() - (TREND_DAYS - 1))

    const rows = await this.db
      .select({
        day: sql<string>`date_trunc('day', ${schema.inventoryStockMovements.occurredAt})`,
        consumed: sql<number>`coalesce(sum(case when ${schema.inventoryStockMovements.quantity} < 0 then -${schema.inventoryStockMovements.quantity} else 0 end), 0)`,
      })
      .from(schema.inventoryStockMovements)
      .where(
        and(
          eq(schema.inventoryStockMovements.inventoryItemId, itemId),
          gte(schema.inventoryStockMovements.occurredAt, windowStart),
        ),
      )
      .groupBy(sql`date_trunc('day', ${schema.inventoryStockMovements.occurredAt})`)

    const byDay = new Map<string, number>()
    for (const row of rows) {
      byDay.set(new Date(row.day).toISOString().slice(0, 10), Math.round(Number(row.consumed) * 100) / 100)
    }

    const trend: number[] = []
    for (let i = 0; i < TREND_DAYS; i++) {
      const d = new Date(windowStart)
      d.setDate(d.getDate() + i)
      trend.push(byDay.get(d.toISOString().slice(0, 10)) ?? 0)
    }
    return trend
  }
}
