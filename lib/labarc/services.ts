/**
 * LabArc data-access layer.
 *
 * These services currently return typed mock data. The UI depends ONLY on
 * these function signatures and the interfaces in `./types`, so the backend
 * team can replace each `mock*Service` with a real API client
 * (e.g. `equipmentApiService`) without changing any UI component.
 */
import * as db from './data'
import { isLabArcApiConfigured, labarcApi } from './api'
import type {
  AlertItem,
  Device,
  EarlyWarning,
  Equipment,
  Incident,
  Integration,
  InventoryItem,
  KnowledgeDoc,
  KpiSnapshot,
  MaintenanceRecord,
  QCPanel,
  StaffMember,
  TatMetric,
  WorkflowStage,
} from './types'

export const equipmentService = {
  list: (): Equipment[] => db.equipment,
  getById: (id: string): Equipment | undefined =>
    db.equipment.find((e) => e.id === id),
}

export const maintenanceService = {
  list: (): MaintenanceRecord[] => db.maintenance,
  forEquipment: (id: string): MaintenanceRecord[] =>
    db.maintenance.filter((m) => m.equipmentId === id),
}

export const incidentService = {
  list: (): Incident[] => db.incidents,
  getById: (id: string): Incident | undefined =>
    db.incidents.find((i) => i.id === id),
  forEquipment: (id: string): Incident[] =>
    db.incidents.filter((i) => i.equipmentId === id),
}

export const inventoryService = {
  list: (): InventoryItem[] => db.inventory,
}

/** Real inventory API access for pages that are ready to opt into backend data. */
export const inventoryApiService = {
  list: async (departmentId?: string): Promise<InventoryItem[]> => {
    if (!isLabArcApiConfigured()) return db.inventory
    return labarcApi.inventory.list(departmentId)
  },
  getById: async (id: string): Promise<InventoryItem | undefined> => {
    if (!isLabArcApiConfigured()) return db.inventory.find((item) => item.id === id)
    return labarcApi.inventory.get(id)
  },
}

export const qcService = {
  list: (): QCPanel[] => db.qcPanels,
}

export const workforceService = {
  list: (): StaffMember[] => db.staff,
}

export const alertService = {
  list: (): AlertItem[] => db.alerts,
  unreadCount: (): number => db.alerts.filter((a) => !a.read).length,
}

export const deviceService = {
  list: (): Device[] => db.devices,
}

export const integrationService = {
  list: (): Integration[] => db.integrations,
}

export const knowledgeService = {
  list: (): KnowledgeDoc[] => db.knowledgeDocs,
}

export const tatService = {
  list: (): TatMetric[] => db.tatMetrics,
}

export const workflowService = {
  stages: (): WorkflowStage[] => db.workflowStages,
}

export const dashboardService = {
  kpis: (): KpiSnapshot => db.kpiSnapshot,
  earlyWarnings: (): EarlyWarning[] => db.earlyWarnings,
  departmentWorkload: () => db.departmentWorkload,
  environmental: () => db.environmental,
}
