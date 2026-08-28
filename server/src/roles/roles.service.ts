import { Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DRIZZLE_CLIENT } from '../database/database.module'
import type { DrizzleClient } from '../database/drizzle/client'
import * as schema from '../database/drizzle/schema'

@Injectable()
export class RolesService {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

  async listRolesWithPermissions() {
    const roles = await this.db.select().from(schema.roles)
    const rolePermissionRows = await this.db
      .select({
        roleId: schema.rolePermissions.roleId,
        permissionKey: schema.permissions.key,
      })
      .from(schema.rolePermissions)
      .innerJoin(schema.permissions, eq(schema.permissions.id, schema.rolePermissions.permissionId))

    return roles.map((role) => ({
      ...role,
      permissions: rolePermissionRows.filter((rp) => rp.roleId === role.id).map((rp) => rp.permissionKey),
    }))
  }
}
