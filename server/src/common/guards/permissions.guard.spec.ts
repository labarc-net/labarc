import { ForbiddenException } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import { PERMISSION_KEYS } from '../security/permissions.constants'
import { PermissionsGuard } from './permissions.guard'

function buildContext(tenant: unknown, required: string[] | undefined) {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(required) } as unknown as Reflector
  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ tenant }),
    }),
  } as any // eslint-disable-line @typescript-eslint/no-explicit-any
  return { reflector, context }
}

describe('PermissionsGuard', () => {
  it('allows the request when no permissions are required', () => {
    const { reflector, context } = buildContext(undefined, undefined)
    const guard = new PermissionsGuard(reflector)
    expect(guard.canActivate(context)).toBe(true)
  })

  it('allows a super admin regardless of required permissions', () => {
    const { reflector, context } = buildContext({ roleKey: 'super_admin', permissions: [] }, [
      PERMISSION_KEYS.EQUIPMENT_MANAGE,
    ])
    const guard = new PermissionsGuard(reflector)
    expect(guard.canActivate(context)).toBe(true)
  })

  it('allows a member who has the required permission', () => {
    const { reflector, context } = buildContext(
      { roleKey: 'technician', permissions: [PERMISSION_KEYS.EQUIPMENT_READ] },
      [PERMISSION_KEYS.EQUIPMENT_READ],
    )
    const guard = new PermissionsGuard(reflector)
    expect(guard.canActivate(context)).toBe(true)
  })

  it('denies a role that lacks the required permission', () => {
    const { reflector, context } = buildContext(
      { roleKey: 'viewer', permissions: [PERMISSION_KEYS.EQUIPMENT_READ] },
      [PERMISSION_KEYS.EQUIPMENT_MANAGE],
    )
    const guard = new PermissionsGuard(reflector)
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
  })

  it('denies when tenant context is missing entirely (e.g. cross-org access)', () => {
    const { reflector, context } = buildContext(undefined, [PERMISSION_KEYS.EQUIPMENT_READ])
    const guard = new PermissionsGuard(reflector)
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
  })
})
