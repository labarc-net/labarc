import type { Severity, StatusLevel } from '@/lib/status'

export type Department =
  | 'Chemistry'
  | 'Hematology'
  | 'Microbiology'
  | 'Immunology'
  | 'Molecular'
  | 'Sample Processing'

export type EquipmentStatus = 'operational' | 'watch' | 'at-risk' | 'critical' | 'offline'

export interface TelemetryPoint {
  t: string
  value: number
}

export interface TelemetrySeries {
  key: string
  label: string
  unit: string
  /** delta vs baseline, e.g. +12 (%) */
  drift: number
  status: StatusLevel
  points: TelemetryPoint[]
}

export interface Equipment {
  id: string
  name: string
  model: string
  manufacturer: string
  serialNumber: string
  department: Department
  location: string
  status: EquipmentStatus
  healthScore: number
  utilization: number
  failureRisk: Severity
  installedOn: string
  warrantyUntil: string
  serviceProvider: string
  nextMaintenance: string
  lastMaintenance: string
  downtimeHoursMonth: number
  errorCodes: { code: string; count: number; lastSeen: string }[]
  telemetry: TelemetrySeries[]
  aiInsight: AiInsight
}

export interface AiInsight {
  summary: string
  signals: { label: string; delta: string; level: StatusLevel }[]
  recommendation: string
  confidence: number
  source: string
}

export interface MaintenanceRecord {
  id: string
  equipmentId: string
  equipmentName: string
  type: 'Preventive' | 'Corrective' | 'Calibration' | 'Inspection'
  scheduledFor: string
  status: 'scheduled' | 'overdue' | 'completed' | 'in-progress'
  technician: string
  durationHours?: number
  notes: string
}

export interface Incident {
  id: string
  ref: string
  title: string
  type: string
  department: Department
  equipmentId?: string
  equipmentName?: string
  severity: Severity
  status: 'open' | 'investigating' | 'capa' | 'resolved' | 'closed'
  reporter: string
  owner: string
  reportedAt: string
  dueDate: string
  description: string
  immediateAction: string
  rootCauses: string[]
  correctiveAction: string
  preventiveAction: string
  timeline: { at: string; actor: string; event: string }[]
  aiSimilar: { ref: string; title: string; similarity: number; cause: string }[]
}

export interface InventoryItem {
  id: string
  name: string
  category: 'Reagent' | 'Control' | 'Calibrator' | 'Consumable' | 'Spare Part' | 'PPE'
  department: Department
  lot: string
  stock: number
  unit: string
  reorderLevel: number
  dailyConsumption: number
  leadTimeDays: number
  expiry: string
  supplier: string
  status: 'ok' | 'reorder' | 'low' | 'expiring' | 'stockout-risk'
  projectedStockoutDays: number
  consumptionTrend: number[]
}

export interface QCPanel {
  id: string
  analyte: string
  level: string
  department: Department
  instrument: string
  mean: number
  sd: number
  cv: number
  target: number
  unit: string
  status: StatusLevel
  trend: 'stable' | 'drifting-up' | 'drifting-down'
  risk: Severity
  westgardFlags: string[]
  points: { n: number; value: number }[]
  recommendation: string
}

export interface StaffMember {
  id: string
  name: string
  role: string
  department: Department
  shift: 'Day' | 'Evening' | 'Night'
  capacity: number
  assignedTasks: number
  pendingTasks: number
  overdueTasks: number
  status: StatusLevel
  competencies: string[]
  available: boolean
}

export interface AlertItem {
  id: string
  category:
    | 'equipment'
    | 'qc'
    | 'inventory'
    | 'tat'
    | 'incident'
    | 'maintenance'
    | 'environmental'
    | 'power'
  severity: Severity
  title: string
  detail: string
  entity: string
  at: string
  read: boolean
  acknowledged: boolean
}

export interface Device {
  id: string
  name: string
  sensorType: string
  connectedTo: string
  reading: string
  status: StatusLevel
  lastSeen: string
  battery: number
  connectivity: 'MQTT' | 'REST' | 'Modbus' | 'Gateway'
}

export interface Integration {
  id: string
  name: string
  kind: 'LIS' | 'LIMS' | 'EMR' | 'HL7' | 'FHIR' | 'ASTM' | 'REST' | 'Webhook' | 'MQTT' | 'Instrument'
  vendor: string
  status: 'connected' | 'disconnected' | 'attention'
  lastSync: string
  messages24h: number
  direction: 'inbound' | 'outbound' | 'bidirectional'
}

export interface EarlyWarning {
  id: string
  severity: Severity
  entity: string
  category: AlertItem['category']
  message: string
  detail: string
  eta: string
  confidence: number
  href?: string
}

export interface TatMetric {
  department: Department
  currentMinutes: number
  targetMinutes: number
  queue: number
  capacityPct: number
  predictedBreachMinutes: number | null
  recommendation: string
  history: { t: string; tat: number; predicted?: number }[]
}

export interface WorkflowStage {
  key: string
  label: string
  count: number
  avgWaitMinutes: number
  status: StatusLevel
}

export interface KnowledgeDoc {
  id: string
  title: string
  type: 'SOP' | 'Manual' | 'Policy' | 'Troubleshooting' | 'Training' | 'Incident Report'
  department: Department | 'Quality' | 'All'
  version: string
  updatedAt: string
  status: 'approved' | 'draft' | 'under-review'
  author: string
}

export interface KpiSnapshot {
  workload: { value: number; delta: number }
  pending: { value: number; delta: number }
  avgTatMinutes: { value: number; delta: number }
  equipmentAvailability: { value: number; delta: number }
  activeIncidents: { value: number; delta: number }
  qcPassRate: { value: number; delta: number }
}
