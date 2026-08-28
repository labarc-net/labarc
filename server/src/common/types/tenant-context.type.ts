import type { PermissionKey } from '../security/permissions.constants'

/** Attached to `request.tenant` by TenantGuard — see common/guards/tenant.guard.ts. */
export interface TenantContext {
  organizationId: string
  membershipId: string
  roleId: string
  roleKey: string
  departmentId: string | null
  permissions: PermissionKey[]
}
