import { ALL_PERMISSION_KEYS, DEFAULT_ROLE_PERMISSIONS, PERMISSION_KEYS } from './permissions.constants'
import { ROLE_KEYS } from './roles.constants'

describe('DEFAULT_ROLE_PERMISSIONS', () => {
  it('defines a permission set for every system role', () => {
    for (const roleKey of Object.values(ROLE_KEYS)) {
      expect(DEFAULT_ROLE_PERMISSIONS[roleKey]).toBeDefined()
    }
  })

  it('gives the org admin every permission', () => {
    expect([...DEFAULT_ROLE_PERMISSIONS[ROLE_KEYS.ORG_ADMIN]].sort()).toEqual([...ALL_PERMISSION_KEYS].sort())
  })

  it('restricts the viewer role to read-only permissions', () => {
    const viewerPermissions = DEFAULT_ROLE_PERMISSIONS[ROLE_KEYS.VIEWER]
    expect(viewerPermissions.every((key) => key.endsWith('.read'))).toBe(true)
    expect(viewerPermissions).not.toContain(PERMISSION_KEYS.EQUIPMENT_MANAGE)
  })
})
