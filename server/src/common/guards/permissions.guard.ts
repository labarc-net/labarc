import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator'
import type { PermissionKey } from '../security/permissions.constants'
import type { TenantContext } from '../types/tenant-context.type'

/**
 * Checks `request.tenant.permissions` (set by TenantGuard) against the
 * permissions declared with `@RequirePermissions(...)` on the route.
 * Must run after TenantGuard. Super admins always pass.
 */
@Injectable()
export class PermissionsGuard {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PermissionKey[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!required || required.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest<Request & { tenant?: TenantContext }>()
    const tenant = request.tenant

    if (!tenant) {
      throw new ForbiddenException('Tenant context is missing — apply TenantGuard before PermissionsGuard.')
    }

    if (tenant.roleKey === 'super_admin') {
      return true
    }

    const hasAll = required.every((permission) => tenant.permissions.includes(permission))
    if (!hasAll) {
      throw new ForbiddenException(`Missing required permission(s): ${required.join(', ')}`)
    }

    return true
  }
}
