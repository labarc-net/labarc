export const ROLE_KEYS = {
  ORG_ADMIN: 'org_admin',
  LAB_MANAGER: 'lab_manager',
  LAB_SCIENTIST: 'lab_scientist',
  TECHNICIAN: 'technician',
  QUALITY_OFFICER: 'quality_officer',
  INVENTORY_MANAGER: 'inventory_manager',
  MAINTENANCE_ENGINEER: 'maintenance_engineer',
  IT_ADMIN: 'it_admin',
  VIEWER: 'viewer',
} as const

export type RoleKey = (typeof ROLE_KEYS)[keyof typeof ROLE_KEYS]

export const ROLE_DEFINITIONS: { key: RoleKey; name: string; description: string }[] = [
  { key: ROLE_KEYS.ORG_ADMIN, name: 'Organization Admin', description: 'Full control over this organization.' },
  {
    key: ROLE_KEYS.LAB_MANAGER,
    name: 'Laboratory Manager',
    description: 'Manages day-to-day laboratory operations.',
  },
  {
    key: ROLE_KEYS.LAB_SCIENTIST,
    name: 'Laboratory Scientist',
    description: 'Runs and reviews laboratory work and QC.',
  },
  { key: ROLE_KEYS.TECHNICIAN, name: 'Technician', description: 'Performs laboratory and equipment tasks.' },
  {
    key: ROLE_KEYS.QUALITY_OFFICER,
    name: 'Quality Officer',
    description: 'Owns QC and incident/CAPA processes.',
  },
  {
    key: ROLE_KEYS.INVENTORY_MANAGER,
    name: 'Inventory Manager',
    description: 'Owns stock, reagents, and reordering.',
  },
  {
    key: ROLE_KEYS.MAINTENANCE_ENGINEER,
    name: 'Maintenance Engineer',
    description: 'Owns equipment maintenance and service.',
  },
  { key: ROLE_KEYS.IT_ADMIN, name: 'IT / Admin', description: 'Manages departments, members, and system settings.' },
  { key: ROLE_KEYS.VIEWER, name: 'Viewer', description: 'Read-only access across the organization.' },
]

/**
 * Platform "Super Admin" is intentionally NOT one of these roles — it's the
 * `users.isSuperAdmin` flag, and it bypasses org membership/permission
 * checks entirely (see common/guards/tenant.guard.ts and permissions.guard.ts).
 */
