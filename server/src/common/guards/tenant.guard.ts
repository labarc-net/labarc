import { ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import type { Request } from 'express'
import { DRIZZLE_CLIENT } from '../../database/database.module'
import type { DrizzleClient } from '../../database/drizzle/client'
import * as schema from '../../database/drizzle/schema'
import type { PermissionKey } from '../security/permissions.constants'
import type { TenantContext } from '../types/tenant-context.type'

type TenantRequest = Request & {
  user?: { id: string; isSuperAdmin: boolean }
  tenant?: TenantContext
}

/**
 * Resolves the caller's membership + permissions for the organization the
 * request targets, and attaches it to `request.tenant`. This is the single
 * place tenant isolation is enforced — domain modules should always read
 * organizationId off `request.tenant`, never trust a client-supplied value
 * without it having passed through this guard.
 *
 * Organization is resolved from the `:organizationId` route param.
 * Platform super admins bypass membership checks but still get a
 * `request.tenant` for the target org.
 *
 * Must run after JwtAuthGuard (needs `request.user`).
 */
@Injectable()
export class TenantGuard {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantRequest>()

    // Express's route-param typing allows `string | string[]` (repeated
    // params); LabArc never declares a repeated :organizationId param, so
    // this is always a single string in practice — cast it as such. The
    // `if (!organizationId)` guard below only narrows away falsy values
    // (undefined/''), not the `string[]` arm, so without this cast every
    // downstream use as `string` fails to typecheck even after the guard.
    const organizationId = request.params?.organizationId as string | undefined

    if (!organizationId) {
      throw new ForbiddenException('No organization specified for this request.')
    }

    if (!request.user) {
      throw new ForbiddenException('Authentication required.')
    }

    if (request.user.isSuperAdmin) {
      request.tenant = {
        organizationId,
        membershipId: 'super-admin',
        roleId: 'super-admin',
        roleKey: 'super_admin',
        departmentId: null,
        // PermissionsGuard short-circuits on roleKey === 'super_admin', so
        // an explicit permission list isn't needed here.
        permissions: [] as PermissionKey[],
      }
      return true
    }

    const [membership] = await this.db
      .select({
        id: schema.memberships.id,
        roleId: schema.memberships.roleId,
        roleKey: schema.roles.key,
        departmentId: schema.memberships.departmentId,
        status: schema.memberships.status,
      })
      .from(schema.memberships)
      .innerJoin(schema.roles, eq(schema.roles.id, schema.memberships.roleId))
      .where(and(eq(schema.memberships.userId, request.user.id), eq(schema.memberships.organizationId, organizationId)))
      .limit(1)

    if (!membership || membership.status !== 'active') {
      throw new ForbiddenException('You do not have access to this organization.')
    }

    const permissionRows = await this.db
      .select({ key: schema.permissions.key })
      .from(schema.rolePermissions)
      .innerJoin(schema.permissions, eq(schema.permissions.id, schema.rolePermissions.permissionId))
      .where(eq(schema.rolePermissions.roleId, membership.roleId))

    request.tenant = {
      organizationId,
      membershipId: membership.id,
      roleId: membership.roleId,
      roleKey: membership.roleKey,
      departmentId: membership.departmentId,
      permissions: permissionRows.map((p) => p.key) as PermissionKey[],
    }

    return true
  }
}
