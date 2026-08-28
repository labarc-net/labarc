import { SetMetadata } from '@nestjs/common'
import type { PermissionKey } from '../security/permissions.constants'

export const PERMISSIONS_KEY = 'requiredPermissions'

/** Declares the permission(s) PermissionsGuard should require for this route. */
export const RequirePermissions = (...permissions: PermissionKey[]) => SetMetadata(PERMISSIONS_KEY, permissions)
